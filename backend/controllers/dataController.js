// Reads the JSON files in ../data and turns them into API responses.
// All file access goes through readJson()/listDir(), so moving to MongoDB or
// Firebase later only means replacing those two functions — routes and
// response shapes stay the same.

const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, "..", "data");
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS ?? 300000);

// ---------- Errors ----------
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}
const notFound = msg => new ApiError(404, msg);

// ---------- Param validation (blocks path traversal) ----------
// Only lowercase letters, digits and dashes reach the file system; "..", "/",
// "\\", "%2e" etc. are rejected before any path is built.
const PATTERNS = {
  uni: /^[a-z0-9][a-z0-9-]{0,39}$/,
  course: /^[a-z0-9][a-z0-9-]{0,39}$/,
  branch: /^[a-z0-9][a-z0-9-]{0,39}$/,
  scheme: /^[a-z0-9][a-z0-9-]{0,19}$/,
  sem: /^[1-9][0-9]?$/,
};

function validateParam(name) {
  return (req, res, next, value) => {
    const v = String(value).toLowerCase();
    if (!PATTERNS[name].test(v)) return next(new ApiError(400, `Invalid ${name}: "${value}"`));
    req.params[name] = v;
    next();
  };
}

// Builds a path inside DATA_DIR and refuses anything that escapes it.
function safePath(...segments) {
  const p = path.resolve(DATA_DIR, ...segments);
  if (p !== DATA_DIR && !p.startsWith(DATA_DIR + path.sep)) throw new ApiError(400, "Invalid path");
  return p;
}

// ---------- Cached file access ----------
const cache = new Map(); // key → { value, at }

function fromCache(key) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (CACHE_TTL_MS > 0 && Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

async function readJson(...segments) {
  const file = safePath(...segments);
  const cached = fromCache(file);
  if (cached !== undefined) return cached;
  let value;
  try {
    value = JSON.parse(await fs.readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") value = null;
    else if (err instanceof SyntaxError) throw new ApiError(500, `Data file is not valid JSON: ${path.relative(DATA_DIR, file)}`);
    else throw err;
  }
  cache.set(file, { value, at: Date.now() });
  return value;
}

async function listDir(...segments) {
  const dir = safePath(...segments);
  const key = "dir:" + dir;
  const cached = fromCache(key);
  if (cached !== undefined) return cached;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") entries = [];
    else throw err;
  }
  const value = entries.map(e => ({ name: e.name, isDir: e.isDirectory() }));
  cache.set(key, { value, at: Date.now() });
  return value;
}

// ---------- Lookups that 404 when something is missing ----------
async function findUniversity(uni) {
  const list = (await readJson("universities.json")) || [];
  const u = list.find(x => x.id === uni);
  if (!u) throw notFound(`University "${uni}" not found`);
  return u;
}

async function findCourse(uni, course) {
  await findUniversity(uni);
  const list = (await readJson(uni, "courses.json")) || [];
  const c = list.find(x => x.id === course);
  if (!c) throw notFound(`Course "${course}" not found for university "${uni}"`);
  return c;
}

async function findBranch(uni, course, branch) {
  await findCourse(uni, course);
  const list = (await readJson(uni, course, "branches.json")) || [];
  const b = list.find(x => x.id === branch);
  if (!b) throw notFound(`Branch "${branch}" not found for ${uni}/${course}`);
  return b;
}

// Schemes = folders under the branch; schemes.json (optional) adds display names.
async function listSchemes(uni, course, branch) {
  await findBranch(uni, course, branch);
  const dirs = (await listDir(uni, course, branch)).filter(e => e.isDir && PATTERNS.scheme.test(e.name)).map(e => e.name);
  const meta = (await readJson(uni, course, branch, "schemes.json")) || [];
  return dirs
    .sort()
    .reverse()
    .map(id => {
      const m = meta.find(x => x.id === id) || {};
      return { id, name: m.name || `Batch ${id}`, ...(m.note ? { note: m.note } : {}) };
    });
}

async function findScheme(uni, course, branch, scheme) {
  const schemes = await listSchemes(uni, course, branch);
  const s = schemes.find(x => x.id === scheme);
  if (!s) throw notFound(`Scheme "${scheme}" not found for ${uni}/${course}/${branch}`);
  return s;
}

async function listSemesterNumbers(uni, course, branch, scheme) {
  await findScheme(uni, course, branch, scheme);
  return (await listDir(uni, course, branch, scheme))
    .map(e => /^sem([1-9][0-9]?)\.json$/.exec(e.name))
    .filter(Boolean)
    .map(m => Number(m[1]))
    .sort((a, b) => a - b);
}

// ---------- Handlers ----------
const wrap = fn => (req, res, next) => fn(req, res).catch(next);

const health = (req, res) => {
  res.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()), cacheEntries: cache.size, time: new Date().toISOString() });
};

const getUniversities = wrap(async (req, res) => {
  const list = (await readJson("universities.json")) || [];
  // customSubjects: true → no fixed syllabus; the frontend lets students type subjects and credits.
  res.json(list.map(({ id, name, shortName, customSubjects }) => ({ id, name, shortName, ...(customSubjects ? { customSubjects: true } : {}) })));
});

const getGrading = wrap(async (req, res) => {
  const { uni } = req.params;
  await findUniversity(uni);
  const grading = await readJson(uni, "grading.json");
  if (!grading) throw notFound(`Grading data not available for "${uni}"`);
  res.json(grading);
});

const getCourses = wrap(async (req, res) => {
  const { uni } = req.params;
  await findUniversity(uni);
  const list = (await readJson(uni, "courses.json")) || [];
  res.json(list.map(({ id, name }) => ({ id, name })));
});

const getBranches = wrap(async (req, res) => {
  const { uni, course } = req.params;
  await findCourse(uni, course);
  const list = (await readJson(uni, course, "branches.json")) || [];
  res.json(list.map(({ id, name }) => ({ id, name })));
});

const getSchemes = wrap(async (req, res) => {
  const { uni, course, branch } = req.params;
  res.json(await listSchemes(uni, course, branch));
});

const getSemesters = wrap(async (req, res) => {
  const { uni, course, branch, scheme } = req.params;
  res.json(await listSemesterNumbers(uni, course, branch, scheme));
});

const getSubjects = wrap(async (req, res) => {
  const { uni, course, branch, scheme, sem } = req.params;
  await findScheme(uni, course, branch, scheme);
  const data = await readJson(uni, course, branch, scheme, `sem${Number(sem)}.json`);
  if (!data) throw notFound(`Semester ${sem} not found for ${uni}/${course}/${branch}/${scheme}`);

  const subjects = (data.subjects || []).map(s => ({
    code: s.code,
    name: s.name,
    type: s.type,
    credits: Number(s.credits) || 0,
  }));
  res.json({
    university: uni,
    course,
    branch,
    scheme,
    semester: Number(sem),
    verified: data.verified === true,
    source: data.source || null,
    lastUpdated: data.lastUpdated || null,
    ...(data.note ? { note: data.note } : {}),
    totalCredits: subjects.reduce((sum, s) => sum + s.credits, 0),
    subjects,
  });
});

module.exports = {
  validateParam,
  health,
  getUniversities,
  getGrading,
  getCourses,
  getBranches,
  getSchemes,
  getSemesters,
  getSubjects,
};
