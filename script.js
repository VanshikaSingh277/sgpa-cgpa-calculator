// Depends on data.js (UNIVERSITIES, BRANCHES, getUniversity, getSyllabus)

const KEY = "sgpa-calc-v2";
let state = load() || freshState();

function freshState() {
  return { uni: null, branch: null, mode: "detailed", scale: [], pct: { mul: 10, sub: 0 }, sems: [], quick: [{ sgpa: "", credits: "" }] };
}
function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

const $ = id => document.getElementById(id);
const esc = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const points = g => (state.scale.find(s => s.g === g) || { p: 0 }).p;
const topGrade = () => (state.scale[0] || { g: "" }).g;
const blankSubject = () => ({ name: "", credits: "", grade: topGrade() });

// Build a semester: from the syllabus if we have it, otherwise blank rows.
function newSem(no) {
  const syl = getSyllabus(state.uni, state.branch, no);
  if (syl) return { fromSyllabus: true, subjects: syl.map(([name, credits]) => ({ name, credits, grade: topGrade() })) };
  return { fromSyllabus: false, subjects: [blankSubject(), blankSubject(), blankSubject()] };
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
    ? `${u.short}: subjects are pre-filled where available${withData.length ? ` (full data for ${withData.join(", ")}, 1st year for all branches)` : ""}. You can edit or add anything.`
    : `${u.short}: no syllabus data yet — you'll enter subjects and credits yourself. The grade scale is pre-set.`;
  $("branchGrid").innerHTML = Object.entries(BRANCHES).map(([k, label]) =>
    `<button class="chip" data-branch="${k}" data-for="${uniId}">${esc(label)}</button>`).join("")
    + `<button class="chip" data-branch="OTHER" data-for="${uniId}">Other</button>`;
}

function showSetup(step) {
  $("setup").hidden = false;
  $("calculator").hidden = true;
  $("stepUni").hidden = step !== "uni";
  $("stepBranch").hidden = step !== "branch";
  $("tagline").textContent = "Pick your university to load your subjects and grading scale.";
}

function chooseUniversity(uniId, branch) {
  const u = getUniversity(uniId);
  const changed = state.uni !== uniId || state.branch !== branch;
  if (changed) {
    const hasData = state.sems.some(sem => sem.subjects.some(s => s.credits)) || state.quick.some(q => q.sgpa);
    if (state.uni && hasData && !confirm("Switching university will clear your current semesters. Continue?")) {
      showCalculator();
      return;
    }
    state.uni = uniId;
    state.branch = branch;
    state.scale = u.scale.map(s => ({ ...s }));
    state.pct = { ...u.pct };
    state.sems = [newSem(1)];
    state.quick = [{ sgpa: "", credits: "" }];
  }
  save();
  showCalculator();
}

function showCalculator() {
  const u = getUniversity(state.uni);
  $("setup").hidden = true;
  $("calculator").hidden = false;
  $("uniName").textContent = u.short;
  $("uniMeta").textContent = ` · ${u.name}${state.branch && state.branch !== "OTHER" ? " · " + state.branch : ""}`;
  $("tagline").textContent = "Pick grades for each subject to get SGPA, CGPA and percentage instantly.";
  renderScale(); renderSems(); renderQuick(); setMode(state.mode);
}

// ---------- Calculations ----------
function semTotals(sem) {
  let c = 0, gp = 0;
  sem.subjects.forEach(s => {
    const cr = parseFloat(s.credits);
    if (cr > 0) { c += cr; gp += cr * points(s.grade); }
  });
  return { c, gp, sgpa: c ? gp / c : 0 };
}

function showResult(cgpa, credits) {
  const { mul, sub } = state.pct;
  const pct = cgpa > 0 ? Math.min(100, Math.max(0, cgpa * mul - sub)) : 0;
  $("cgpa").textContent = cgpa.toFixed(2);
  $("percent").textContent = pct.toFixed(2) + "%";
  $("credits").textContent = credits;
  $("formula").textContent = `Percentage = CGPA × ${mul}${sub ? ` − ${sub}` : ""} (${getUniversity(state.uni).short})`;
}

function recalc() {
  let C = 0, GP = 0;
  if (state.mode === "detailed") {
    state.sems.forEach((sem, i) => {
      const t = semTotals(sem);
      C += t.c; GP += t.gp;
      const el = document.querySelector(`[data-sgpa="${i}"]`);
      if (el) el.textContent = "SGPA: " + t.sgpa.toFixed(2);
      const cr = document.querySelector(`[data-semcr="${i}"]`);
      if (cr) cr.textContent = t.c + " credits";
    });
  } else {
    state.quick.forEach(q => {
      const s = parseFloat(q.sgpa), c = parseFloat(q.credits);
      if (s >= 0 && c > 0) { C += c; GP += s * c; }
    });
  }
  showResult(C ? GP / C : 0, C);
  save();
}

// ---------- Rendering ----------
function gradeOptions(sel) {
  return state.scale.map(s => `<option value="${esc(s.g)}" ${s.g === sel ? "selected" : ""}>${esc(s.g)} (${s.p})</option>`).join("");
}

function renderSems() {
  const last = state.sems.length - 1;
  $("semesters").innerHTML = state.sems.map((sem, i) => {
    const hasSyl = !!getSyllabus(state.uni, state.branch, i + 1);
    return `
    <div class="sem">
      <div class="sem-head">
        <div>
          <h3>Semester ${i + 1}</h3>
          <small class="hint">${sem.fromSyllabus ? "📘 Subjects loaded from syllabus" : "✏️ Enter your subjects"} · <span data-semcr="${i}"></span></small>
        </div>
        <span class="sgpa" data-sgpa="${i}">SGPA: 0.00</span>
      </div>
      <div class="subj subj-head"><span>Subject</span><span>Credits</span><span>Grade</span><span></span></div>
      ${sem.subjects.map((s, j) => `
        <div class="subj">
          <input placeholder="Subject" value="${esc(s.name)}" data-i="${i}" data-j="${j}" data-f="name">
          <input type="number" min="0" step="0.5" placeholder="Credits" value="${esc(s.credits)}" data-i="${i}" data-j="${j}" data-f="credits">
          <select data-i="${i}" data-j="${j}" data-f="grade">${gradeOptions(s.grade)}</select>
          <button class="icon" title="Remove" data-del="${i}-${j}">✕</button>
        </div>`).join("")}
      <div class="row-btns">
        <button class="btn small" data-addsub="${i}">+ Subject</button>
        ${hasSyl && !sem.fromSyllabus ? `<button class="btn small ghost" data-loadsyl="${i}">Load syllabus</button>` : ""}
        ${i === last && state.sems.length > 1 ? `<button class="btn small ghost" data-delsem="${i}">Remove semester</button>` : ""}
      </div>
    </div>`;
  }).join("");
  recalc();
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
  if (d.i !== undefined) {
    state.sems[d.i].subjects[d.j][d.f] = e.target.value;
    recalc();
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
  if (d.uni) { renderBranchGrid(d.uni); showSetup("branch"); }
  else if (d.branch) chooseUniversity(d.for, d.branch);
  else if (d.mode) setMode(d.mode);
  else if (d.addsub !== undefined) { state.sems[d.addsub].subjects.push(blankSubject()); renderSems(); }
  else if (d.loadsyl !== undefined) {
    const i = +d.loadsyl;
    const hasInput = state.sems[i].subjects.some(s => s.name || s.credits);
    if (!hasInput || confirm(`Replace Semester ${i + 1} subjects with the syllabus?`)) { state.sems[i] = newSem(i + 1); renderSems(); }
  }
  else if (d.del) { const [i, j] = d.del.split("-"); state.sems[i].subjects.splice(j, 1); renderSems(); }
  else if (d.delsem !== undefined) { state.sems.splice(d.delsem, 1); renderSems(); }
  else if (d.delq !== undefined) { state.quick.splice(d.delq, 1); renderQuick(); }
});

$("addSem").onclick = () => { state.sems.push(newSem(state.sems.length + 1)); renderSems(); };
$("addQuick").onclick = () => { state.quick.push({ sgpa: "", credits: "" }); renderQuick(); };
$("reset").onclick = () => {
  if (confirm("Clear all semesters?")) { state.sems = [newSem(1)]; state.quick = [{ sgpa: "", credits: "" }]; renderSems(); renderQuick(); }
};
$("changeUni").onclick = () => { renderUniGrid(); showSetup("uni"); };
$("backToUni").onclick = () => showSetup("uni");

// ---------- Start ----------
renderUniGrid();
if (state.uni && getUniversity(state.uni)) showCalculator();
else showSetup("uni");
