// ---------- Grade scale (AKTU, editable) ----------
const DEFAULT_SCALE = [
  { g: "A+", marks: "90–100", p: 10 },
  { g: "A",  marks: "80–89",  p: 9 },
  { g: "B+", marks: "70–79",  p: 8 },
  { g: "B",  marks: "65–69",  p: 7 },
  { g: "C+", marks: "60–64",  p: 6 },
  { g: "C",  marks: "50–59",  p: 5 },
  { g: "D",  marks: "40–49",  p: 4 },
  { g: "E",  marks: "Grace",  p: 3 },
  { g: "F",  marks: "< 40",   p: 0 },
];

const KEY = "aktu-calc-v1";
let state = load() || {
  mode: "detailed",
  scale: DEFAULT_SCALE,
  sems: [newSem()],
  quick: [{ sgpa: "", credits: "" }],
};

function newSem() {
  return { subjects: [{ name: "", credits: "", grade: "A+" }, { name: "", credits: "", grade: "A+" }, { name: "", credits: "", grade: "A+" }] };
}
function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
const points = g => (state.scale.find(s => s.g === g) || { p: 0 }).p;
const $ = id => document.getElementById(id);

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
  const pct = cgpa > 0 ? Math.max(0, cgpa * 10 - 7.5) : 0;
  $("cgpa").textContent = cgpa.toFixed(2);
  $("percent").textContent = pct.toFixed(2) + "%";
  $("credits").textContent = credits;
}

function recalc() {
  if (state.mode === "detailed") {
    let C = 0, GP = 0;
    state.sems.forEach((sem, i) => {
      const t = semTotals(sem);
      C += t.c; GP += t.gp;
      const el = document.querySelector(`[data-sgpa="${i}"]`);
      if (el) el.textContent = "SGPA: " + t.sgpa.toFixed(2);
    });
    showResult(C ? GP / C : 0, C);
  } else {
    let C = 0, GP = 0;
    state.quick.forEach(q => {
      const s = parseFloat(q.sgpa), c = parseFloat(q.credits);
      if (s >= 0 && c > 0) { C += c; GP += s * c; }
    });
    showResult(C ? GP / C : 0, C);
  }
  save();
}

// ---------- Rendering ----------
function gradeOptions(sel) {
  return state.scale.map(s => `<option ${s.g === sel ? "selected" : ""}>${s.g}</option>`).join("");
}

function renderSems() {
  $("semesters").innerHTML = state.sems.map((sem, i) => `
    <div class="sem">
      <div class="sem-head">
        <h3>Semester ${i + 1}</h3>
        <span class="sgpa" data-sgpa="${i}">SGPA: 0.00</span>
      </div>
      ${sem.subjects.map((s, j) => `
        <div class="subj">
          <input placeholder="Subject" value="${String(s.name).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}" data-i="${i}" data-j="${j}" data-f="name">
          <input type="number" min="0" step="0.5" placeholder="Credits" value="${s.credits}" data-i="${i}" data-j="${j}" data-f="credits">
          <select data-i="${i}" data-j="${j}" data-f="grade">${gradeOptions(s.grade)}</select>
          <button class="icon" title="Remove" data-del="${i}-${j}">✕</button>
        </div>`).join("")}
      <div class="row-btns">
        <button class="btn small" data-addsub="${i}">+ Subject</button>
        ${state.sems.length > 1 ? `<button class="btn small ghost" data-delsem="${i}">Remove semester</button>` : ""}
      </div>
    </div>`).join("");
  recalc();
}

function renderQuick() {
  $("quickRows").innerHTML = state.quick.map((q, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><input type="number" min="0" max="10" step="0.01" value="${q.sgpa}" data-q="${i}" data-f="sgpa"></td>
      <td><input type="number" min="0" step="0.5" value="${q.credits}" data-q="${i}" data-f="credits"></td>
      <td><button class="icon" data-delq="${i}">✕</button></td>
    </tr>`).join("");
  recalc();
}

function renderScale() {
  $("scaleRows").innerHTML = state.scale.map((s, i) => `
    <tr><td>${s.g}</td><td>${s.marks}</td>
    <td><input type="number" min="0" max="10" value="${s.p}" data-scale="${i}"></td></tr>`).join("");
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
  if (d.i !== undefined) { state.sems[d.i].subjects[d.j][d.f] = e.target.value; recalc(); }
  else if (d.q !== undefined) { state.quick[d.q][d.f] = e.target.value; recalc(); }
  else if (d.scale !== undefined) { state.scale[d.scale].p = parseFloat(e.target.value) || 0; recalc(); }
});

document.addEventListener("click", e => {
  const d = e.target.dataset;
  if (d.mode) setMode(d.mode);
  else if (d.addsub !== undefined) { state.sems[d.addsub].subjects.push({ name: "", credits: "", grade: "A+" }); renderSems(); }
  else if (d.del) { const [i, j] = d.del.split("-"); state.sems[i].subjects.splice(j, 1); renderSems(); }
  else if (d.delsem !== undefined) { state.sems.splice(d.delsem, 1); renderSems(); }
  else if (d.delq !== undefined) { state.quick.splice(d.delq, 1); renderQuick(); }
});

$("addSem").onclick = () => { state.sems.push(newSem()); renderSems(); };
$("addQuick").onclick = () => { state.quick.push({ sgpa: "", credits: "" }); renderQuick(); };
$("reset").onclick = () => {
  if (confirm("Clear all semesters?")) { state.sems = [newSem()]; state.quick = [{ sgpa: "", credits: "" }]; renderSems(); renderQuick(); }
};

renderScale(); renderSems(); renderQuick(); setMode(state.mode);
