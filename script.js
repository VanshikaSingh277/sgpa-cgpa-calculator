// Depends on data.js (UNIVERSITIES, BRANCHES, getUniversity, getSyllabus)

const KEY = "sgpa-calc-v3";
const SEM_COUNT = 8;
let state = load() || freshState();

// sems: { "1": { fromSyllabus, subjects: [...] }, "3": {...} } — only semesters the student opened
function freshState() {
  return { uni: null, branch: null, sem: 1, mode: "detailed", scale: [], pct: { mul: 10, sub: 0 }, sems: {}, quick: [{ sgpa: "", credits: "" }] };
}
function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

const $ = id => document.getElementById(id);
const esc = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const gradeOf = g => state.scale.find(s => s.g === g);
const blankSubject = () => ({ name: "", credits: "", grade: "" });
const syllabusFor = no => getSyllabus(state.uni, state.branch, no);

// Build a semester from the syllabus if we have it, otherwise blank rows.
// Grades start empty, so a subject only counts once the student picks a grade.
function newSem(no) {
  const syl = syllabusFor(no);
  if (syl) return { fromSyllabus: true, subjects: syl.map(([name, credits]) => ({ name, credits, grade: "" })) };
  return { fromSyllabus: false, subjects: [blankSubject(), blankSubject(), blankSubject()] };
}
function currentSem() {
  if (!state.sems[state.sem]) state.sems[state.sem] = newSem(state.sem);
  return state.sems[state.sem];
}

// ---------- Setup screens ----------
function renderUniGrid() {
  $("uniGrid").innerHTML = UNIVERSITIES.map(u => `
    <button class="uni-card ${u.id === state.uni ? "selected" : ""}" data-uni="${u.id}">
      <strong>${esc(u.short)}</strong>
      <span>${esc(u.name)}</span>
      <small>${esc(u.region)}</small>
    </button>`).join("");
}

function renderBranchGrid(uniId) {
  const u = getUniversity(uniId);
  const withData = Object.keys(u.syllabus || {}).filter(k => k !== "common");
  const hasCommon = !!(u.syllabus && u.syllabus.common);
  $("branchHint").textContent = hasCommon || withData.length
    ? `${u.short}: subjects are pre-filled where available${withData.length ? ` (1st year for all branches, more semesters for ${withData.join(", ")})` : ""}. You can edit or add anything.`
    : `${u.short}: no syllabus data yet — you'll enter subjects and credits yourself. The grade scale is pre-set.`;
  $("branchGrid").innerHTML = Object.entries(BRANCHES).map(([k, label]) =>
    `<button class="chip ${pending.branch === k && pending.uni === uniId ? "selected" : ""}" data-branch="${k}">${esc(label)}</button>`).join("")
    + `<button class="chip" data-branch="OTHER">Other</button>`;
}

function renderSemGrid() {
  const u = getUniversity(pending.uni);
  $("semHint").textContent = `${u.short}${pending.branch !== "OTHER" ? " · " + pending.branch : ""} — 📘 means subjects are pre-filled from the syllabus.`;
  let html = "";
  for (let n = 1; n <= SEM_COUNT; n++) {
    const has = !!getSyllabus(pending.uni, pending.branch, n);
    html += `<button class="sem-card" data-pick="${n}">
      <strong>Semester ${n}</strong>
      <small>${has ? "📘 Syllabus available" : "✏️ Enter subjects"}</small>
    </button>`;
  }
  $("semGrid").innerHTML = html;
}

function showSetup(step) {
  $("setup").hidden = false;
  $("calculator").hidden = true;
  $("stepUni").hidden = step !== "uni";
  $("stepBranch").hidden = step !== "branch";
  $("stepSem").hidden = step !== "sem";
  $("tagline").textContent = "Pick your university, branch and semester to load your subjects.";
}

// Choices made during setup, applied once a semester is picked.
let pending = { uni: null, branch: null };

function finishSetup(semNo) {
  const u = getUniversity(pending.uni);
  const changed = state.uni !== pending.uni || state.branch !== pending.branch;
  if (changed) {
    const hasData = Object.values(state.sems).some(sem => sem.subjects.some(s => s.grade)) || state.quick.some(q => q.sgpa);
    if (state.uni && hasData && !confirm("Switching university or branch will clear your current grades. Continue?")) {
      showCalculator();
      return;
    }
    state.uni = pending.uni;
    state.branch = pending.branch;
    state.scale = u.scale.map(s => ({ ...s }));
    state.pct = { ...u.pct };
    state.sems = {};
    state.quick = [{ sgpa: "", credits: "" }];
  }
  state.sem = semNo;
  state.mode = "detailed";
  save();
  showCalculator();
}

function showCalculator() {
  const u = getUniversity(state.uni);
  $("setup").hidden = true;
  $("calculator").hidden = false;
  $("uniName").textContent = u.short;
  $("uniMeta").textContent = ` · ${u.name}${state.branch && state.branch !== "OTHER" ? " · " + state.branch : ""}`;
  $("tagline").textContent = "Pick a grade for each subject to get your SGPA, CGPA and percentage.";
  renderScale(); renderSems(); renderQuick(); setMode(state.mode);
}

// ---------- Calculations ----------
function semTotals(sem) {
  let c = 0, gp = 0;
  sem.subjects.forEach(s => {
    const cr = parseFloat(s.credits), g = gradeOf(s.grade);
    if (cr > 0 && g) { c += cr; gp += cr * g.p; }
  });
  return { c, gp, sgpa: c ? gp / c : 0 };
}

function showResult(cgpa, credits) {
  const { mul, sub } = state.pct;
  const pct = cgpa > 0 ? Math.min(100, Math.max(0, cgpa * mul - sub)) : 0;
  $("cgpa").textContent = cgpa.toFixed(2);
  $("percent").textContent = pct.toFixed(2) + "%";
  $("credits").textContent = credits;
  $("formula").textContent = `Percentage = CGPA × ${mul}${sub ? ` − ${sub}` : ""} (${getUniversity(state.uni).short}) · CGPA uses every semester with grades entered`;
}

function recalc() {
  let C = 0, GP = 0;
  if (state.mode === "detailed") {
    for (const [no, sem] of Object.entries(state.sems)) {
      const t = semTotals(sem);
      C += t.c; GP += t.gp;
      const tab = document.querySelector(`[data-tabsgpa="${no}"]`);
      if (tab) tab.textContent = t.c ? t.sgpa.toFixed(2) : "";
    }
    const t = semTotals(currentSem());
    $("sgpa").textContent = t.sgpa.toFixed(2);
    $("sgpaLabel").textContent = `Semester ${state.sem} SGPA`;
    const cr = document.querySelector("[data-semcr]");
    if (cr) cr.textContent = `${t.c} graded credits`;
  } else {
    state.quick.forEach(q => {
      const s = parseFloat(q.sgpa), c = parseFloat(q.credits);
      if (s >= 0 && c > 0) { C += c; GP += s * c; }
    });
  }
  $("sgpaStat").hidden = state.mode !== "detailed";
  showResult(C ? GP / C : 0, C);
  save();
}

// ---------- Rendering ----------
function gradeOptions(sel) {
  return `<option value="" ${sel ? "" : "selected"}>— Grade —</option>`
    + state.scale.map(s => `<option value="${esc(s.g)}" ${s.g === sel ? "selected" : ""}>${esc(s.g)} (${s.p})</option>`).join("");
}

function renderSemTabs() {
  let html = "";
  for (let n = 1; n <= SEM_COUNT; n++) {
    html += `<button class="sem-tab ${n === state.sem ? "active" : ""}" data-sem="${n}">
      Sem ${n}<small data-tabsgpa="${n}"></small></button>`;
  }
  $("semTabs").innerHTML = html;
}

function renderSems() {
  const sem = currentSem();
  const n = state.sem;
  const hasSyl = !!syllabusFor(n);
  renderSemTabs();
  $("semesters").innerHTML = `
    <div class="sem">
      <div class="sem-head">
        <div>
          <h3>Semester ${n}</h3>
          <small class="hint">${sem.fromSyllabus ? "📘 Subjects loaded from syllabus" : "✏️ No syllabus data — enter your subjects"} · <span data-semcr></span></small>
        </div>
        <span class="sgpa" data-sgpa>SGPA: <span id="cardSgpa"></span></span>
      </div>
      <div class="subj subj-head"><span>Subject</span><span>Credits</span><span>Grade</span><span></span></div>
      ${sem.subjects.map((s, j) => `
        <div class="subj">
          <input placeholder="Subject" value="${esc(s.name)}" data-j="${j}" data-f="name">
          <input type="number" min="0" step="0.5" placeholder="Credits" value="${esc(s.credits)}" data-j="${j}" data-f="credits">
          <select data-j="${j}" data-f="grade">${gradeOptions(s.grade)}</select>
          <button class="icon" title="Remove" data-del="${j}">✕</button>
        </div>`).join("")}
      <div class="row-btns">
        <button class="btn small" data-addsub>+ Subject</button>
        ${hasSyl ? `<button class="btn small ghost" data-loadsyl>Reload syllabus</button>` : ""}
        <button class="btn small ghost" data-clearsem>Clear grades</button>
      </div>
    </div>`;
  recalc();
  $("cardSgpa").textContent = semTotals(sem).sgpa.toFixed(2);
}

function renderQuick() {
  $("quickRows").innerHTML = state.quick.map((q, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><input type="number" min="0" max="10" step="0.01" value="${esc(q.sgpa)}" data-q="${i}" data-f="sgpa"></td>
      <td><input type="number" min="0" step="0.5" value="${esc(q.credits)}" data-q="${i}" data-f="credits"></td>
      <td><button class="icon" data-delq="${i}">✕</button></td>
    </tr>`).join("");
  recalc();
}

function renderScale() {
  $("scaleRows").innerHTML = state.scale.map((s, i) => `
    <tr><td>${esc(s.g)}</td><td>${esc(s.marks)}</td>
    <td><input type="number" min="0" max="10" step="0.5" value="${s.p}" data-scale="${i}"></td></tr>`).join("");
  $("pctMul").value = state.pct.mul;
  $("pctSub").value = state.pct.sub;
}

function setMode(m) {
  state.mode = m;
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.mode === m));
  $("detailed").hidden = m !== "detailed";
  $("quick").hidden = m !== "quick";
  recalc();
}

// ---------- Events ----------
document.addEventListener("input", e => {
  const d = e.target.dataset;
  if (d.j !== undefined) {
    currentSem().subjects[d.j][d.f] = e.target.value;
    recalc();
    $("cardSgpa").textContent = semTotals(currentSem()).sgpa.toFixed(2);
  } else if (d.q !== undefined) { state.quick[d.q][d.f] = e.target.value; recalc(); }
  else if (d.scale !== undefined) {
    state.scale[d.scale].p = parseFloat(e.target.value) || 0;
    renderSems(); // refresh point labels in dropdowns
  } else if (e.target.id === "pctMul" || e.target.id === "pctSub") {
    state.pct = { mul: parseFloat($("pctMul").value) || 0, sub: parseFloat($("pctSub").value) || 0 };
    recalc();
  }
});

document.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const d = btn.dataset;
  if (d.uni) { pending = { uni: d.uni, branch: null }; renderBranchGrid(d.uni); showSetup("branch"); }
  else if (d.branch) { pending.branch = d.branch; renderSemGrid(); showSetup("sem"); }
  else if (d.pick) finishSetup(+d.pick);
  else if (d.sem) { state.sem = +d.sem; renderSems(); }
  else if (d.mode) setMode(d.mode);
  else if (d.addsub !== undefined) { currentSem().subjects.push(blankSubject()); renderSems(); }
  else if (d.loadsyl !== undefined) {
    if (confirm(`Replace Semester ${state.sem} subjects with the syllabus? Grades in this semester will be cleared.`)) {
      state.sems[state.sem] = newSem(state.sem); renderSems();
    }
  }
  else if (d.clearsem !== undefined) { currentSem().subjects.forEach(s => s.grade = ""); renderSems(); }
  else if (d.del !== undefined) { currentSem().subjects.splice(+d.del, 1); renderSems(); }
  else if (d.delq !== undefined) { state.quick.splice(d.delq, 1); renderQuick(); }
});

$("addQuick").onclick = () => { state.quick.push({ sgpa: "", credits: "" }); renderQuick(); };
$("reset").onclick = () => {
  if (confirm("Clear all semesters?")) { state.sems = {}; state.quick = [{ sgpa: "", credits: "" }]; renderSems(); renderQuick(); }
};
$("changeUni").onclick = () => { pending = { uni: state.uni, branch: state.branch }; renderUniGrid(); showSetup("uni"); };
$("backToUni").onclick = () => { renderUniGrid(); showSetup("uni"); };
$("backToBranch").onclick = () => { renderBranchGrid(pending.uni); showSetup("branch"); };

// ---------- Start ----------
renderUniGrid();
if (state.uni && getUniversity(state.uni)) showCalculator();
else showSetup("uni");
