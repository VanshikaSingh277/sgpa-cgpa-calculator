// Step-by-step calculator: University → Course → Branch → Semester → grades.
// The scheme (batch) is not asked for: the newest one the API lists for the branch is used.
// Universities with customSubjects (Autonomous / Other) skip course & branch: students type subjects.
(function () {
  const { storage, escapeHtml: esc, loadingHtml, showError } = window.App;
  const STATE_KEY = "sgpa-calculator-state-v1";
  const $ = id => document.getElementById(id);

  // ---------- State ----------
  // semesters: [{ sem: number|null, grades: string[] }] — grades[i] belongs to subjects[i].
  // Custom mode adds  subjects: [{ name, credits, grade }]  typed by the student.
  const emptyState = () => ({ uni: "", course: "", branch: "", scheme: "", semesters: [] });
  let state = loadState();
  let grading = null;            // grading API response for state.uni
  let availableSems = [];        // semester numbers for the chosen scheme
  const subjectsBySem = {};      // sem → subjects API response
  const labels = {};             // select id → label of chosen option (for the PDF)
  let universities = [];         // universities API response
  const CUSTOM_SEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const isCustom = () => !!(universities.find(u => u.id === state.uni) || {}).customSubjects;
  const blankSubjects = n => Array.from({ length: n }, () => ({ name: "", credits: "", grade: "" }));

  function loadState() {
    try {
      const s = JSON.parse(storage.get(STATE_KEY));
      if (s && typeof s === "object" && Array.isArray(s.semesters)) return { ...emptyState(), ...s };
    } catch { /* corrupt or blocked */ }
    return emptyState();
  }
  const saveState = () => storage.set(STATE_KEY, JSON.stringify(state));

  // ---------- Calculations ----------
  const pointsFor = g => {
    const row = grading && grading.grades.find(x => x.grade === g);
    return row ? Number(row.points) : null;
  };

  // Only credit-bearing subjects with a grade picked are counted. F = 0 points, credits still count.
  function semesterResult(entry) {
    const out = { credits: 0, points: 0, sgpa: 0, graded: 0, gradable: 0, totalCredits: 0 };
    // [{ credits, grade, audit }] from either the syllabus or the student's own rows.
    let rows;
    if (entry.subjects) {
      rows = entry.subjects.map(s => ({ credits: parseFloat(s.credits), grade: s.grade, audit: false }));
    } else {
      const data = subjectsBySem[entry.sem];
      if (!data) return out;
      rows = data.subjects.map((s, i) => ({ credits: s.credits, grade: entry.grades[i], audit: s.type === "audit" }));
    }
    rows.forEach(r => {
      if (!(r.credits > 0) || r.audit) return;
      out.gradable++;
      out.totalCredits += r.credits;
      const p = pointsFor(r.grade);
      if (p === null) return;
      out.graded++;
      out.credits += r.credits;
      out.points += r.credits * p;
    });
    out.sgpa = out.credits ? out.points / out.credits : 0;
    return out;
  }

  function overall() {
    let credits = 0, points = 0;
    state.semesters.forEach(e => {
      if (!e.sem) return;
      const r = semesterResult(e);
      credits += r.credits;
      points += r.points;
    });
    const cgpa = credits ? points / credits : 0;
    const f = (grading && grading.percentage) || { multiply: 10, subtract: 0 };
    const pct = cgpa > 0 ? Math.min(100, Math.max(0, cgpa * f.multiply - f.subtract)) : 0;
    return { credits, cgpa, pct };
  }
  const fmt = n => (Math.round(n * 100) / 100).toFixed(2);

  // ---------- Select helpers ----------
  function fillSelect(sel, items, placeholder, selected) {
    sel.innerHTML = `<option value="">${esc(placeholder)}</option>` +
      items.map(it => `<option value="${esc(it.value)}"${it.value === selected ? " selected" : ""}>${esc(it.label)}</option>`).join("");
    sel.disabled = items.length === 0;
    labels[sel.id] = sel.value ? sel.options[sel.selectedIndex].text : "";
  }
  function lockSelect(sel, text) {
    sel.innerHTML = `<option value="">${esc(text)}</option>`;
    sel.disabled = true;
    labels[sel.id] = "";
  }

  // Runs an API step with a spinner in #setupStatus and a Retry button on failure.
  async function step(text, fn) {
    const status = $("setupStatus");
    status.innerHTML = loadingHtml(text);
    try {
      await fn();
      status.innerHTML = "";
      return true;
    } catch (err) {
      // Retry walks the whole chain again from the saved state, so later steps continue too.
      showError(status, err, () => restore());
      return false;
    }
  }

  // ---------- Steps 1–4 ----------
  async function loadUniversities() {
    return step("Loading universities…", async () => {
      const list = await Api.universities();
      universities = list;
      fillSelect($("uniSelect"), list.map(u => ({ value: u.id, label: u.customSubjects ? u.name : `${u.shortName} — ${u.name}` })), "Select university", state.uni);
    });
  }

  // If a dropdown has exactly one option and nothing is chosen yet, choose it for the student.
  function autoPick(sel, key, items) {
    if (!state[key] && items.length === 1) {
      state[key] = items[0].value;
      sel.value = items[0].value;
      labels[sel.id] = sel.options[sel.selectedIndex].text;
      saveState();
    }
    return !!state[key];
  }

  // Each loader continues to the next step once its value is known (chosen, saved or auto-picked).
  async function loadCourses() {
    let items = [];
    const ok = await step("Loading courses and grading…", async () => {
      const [courses, g] = await Promise.all([Api.courses(state.uni), Api.grading(state.uni)]);
      grading = g;
      items = courses.map(c => ({ value: c.id, label: c.name }));
      fillSelect($("courseSelect"), items, "Select course", state.course);
    });
    if (ok && autoPick($("courseSelect"), "course", items)) await loadBranches();
  }

  async function loadBranches() {
    let items = [];
    const ok = await step("Loading branches…", async () => {
      const list = await Api.branches(state.uni, state.course);
      items = list.map(b => ({ value: b.id, label: b.name }));
      fillSelect($("branchSelect"), items, "Select branch", state.branch);
    });
    if (ok && autoPick($("branchSelect"), "branch", items) && (await loadSchemes())) await startSemesters();
  }

  // Picks the scheme automatically (API lists newest first) and shows which syllabus is used.
  async function loadSchemes() {
    return step("Loading syllabus…", async () => {
      const list = await Api.schemes(state.uni, state.course, state.branch);
      if (list.length === 0) throw new Error("No syllabus has been added for this branch yet.");
      const chosen = list.find(s => s.id === state.scheme) || list[0];
      if (chosen.id !== state.scheme) state.semesters = []; // saved grades belong to another syllabus
      state.scheme = chosen.id;
      saveState();
      $("schemeNote").hidden = !chosen.note;
      $("schemeNote").textContent = chosen.note ? `Syllabus used: ${chosen.note}` : "";
    });
  }

  // Course & Branch aren't needed for Autonomous / Other.
  function showCourseFields(show) {
    $("courseSelect").closest(".field").hidden = !show;
    $("branchSelect").closest(".field").hidden = !show;
  }

  async function loadCustom() {
    showCourseFields(false);
    const ok = await step("Loading grading…", async () => { grading = await Api.grading(state.uni); });
    if (!ok) return;
    availableSems = CUSTOM_SEMS;
    state.semesters = state.semesters.filter(e => e.subjects || !e.sem);
    if (state.semesters.length === 0) state.semesters.push({ sem: 1, grades: [], subjects: blankSubjects(5) });
    $("schemeNote").hidden = false;
    $("schemeNote").textContent = "Autonomous / other college: type each subject and its credits from your syllabus or marksheet, then pick the grade.";
    saveState();
    renderSemesters();
  }

  async function loadSemesters() {
    return step("Loading semesters…", async () => {
      availableSems = await Api.semesters(state.uni, state.course, state.branch, state.scheme);
    });
  }

  // Clears everything after `level` (1 = university, 2 = course, 3 = branch).
  function clearAfter(level) {
    if (level < 2) { state.course = ""; grading = level < 1 ? null : grading; lockSelect($("courseSelect"), "Select university first"); }
    if (level < 3) { state.branch = ""; lockSelect($("branchSelect"), "Select course first"); }
    state.scheme = "";
    $("schemeNote").hidden = true;
    state.semesters = [];
    availableSems = [];
    renderSemesters();
  }

  const semHasInput = e => (e.subjects ? e.subjects.some(x => x.grade || x.name || x.credits) : e.grades.some(Boolean));
  function hasGrades() {
    return state.semesters.some(semHasInput);
  }

  function confirmLoseGrades() {
    return !hasGrades() || window.confirm("Changing this will clear the semesters and grades you entered. Continue?");
  }

  function bindSetup() {
    const selects = [
      { el: $("uniSelect"), key: "uni", level: 1, next: () => (isCustom() ? loadCustom() : (showCourseFields(true), loadCourses())) },
      { el: $("courseSelect"), key: "course", level: 2, next: loadBranches },
      { el: $("branchSelect"), key: "branch", level: 3, next: async () => { if (await loadSchemes()) await startSemesters(); } },
    ];
    selects.forEach(({ el, key, level, next }) => {
      el.addEventListener("change", async () => {
        if (!confirmLoseGrades()) { el.value = state[key]; return; }
        state[key] = el.value;
        labels[el.id] = el.value ? el.options[el.selectedIndex].text : "";
        if (level === 1) grading = null;
        clearAfter(level);
        saveState();
        if (el.value) await next();
      });
    });
  }

  async function startSemesters() {
    if (!(await loadSemesters())) return;
    // Drop saved semesters that no longer exist in this scheme.
    state.semesters = state.semesters.filter(e => !e.sem || availableSems.includes(e.sem));
    if (state.semesters.length === 0) state.semesters.push({ sem: availableSems[0] || null, grades: [] });
    saveState();
    renderSemesters();
  }

  // ---------- Semester cards ----------
  const usedSems = except => state.semesters.filter((e, i) => i !== except && e.sem).map(e => e.sem);

  function renderSemesters() {
    const list = $("semList");
    list.innerHTML = "";
    state.semesters.forEach((entry, idx) => list.append(semesterCard(entry, idx)));
    const canAdd = (state.scheme || isCustom()) && state.semesters.length > 0 && state.semesters.every(e => e.sem) &&
      availableSems.some(n => !usedSems(-1).includes(n));
    $("addSemRow").hidden = !canAdd;
    renderSummary();
  }

  function semesterCard(entry, idx) {
    const card = document.createElement("section");
    card.className = "card sem-card";
    card.setAttribute("aria-label", entry.sem ? `Semester ${entry.sem}` : "New semester");

    if (!entry.sem) {
      const options = availableSems.filter(n => !usedSems(idx).includes(n));
      card.innerHTML = `
        <div class="card-head"><h3>${idx === 0 ? "Choose your semester" : "Add another semester"}</h3>
          ${state.semesters.length > 1 ? '<button type="button" class="btn danger sm" data-remove>Remove</button>' : ""}</div>
        <div class="field" style="max-width:320px">
          <label for="semPick${idx}"><span class="step-num">4</span>Semester</label>
          <select id="semPick${idx}">
            <option value="">Select semester</option>
            ${options.map(n => `<option value="${n}">Semester ${n}</option>`).join("")}
          </select>
        </div>`;
      card.querySelector("select").addEventListener("change", e => {
        const n = Number(e.target.value);
        if (!n) return;
        entry.sem = n;
        entry.grades = [];
        if (isCustom()) entry.subjects = blankSubjects(5);
        saveState();
        renderSemesters();
      });
    } else {
      card.innerHTML = `
        <div class="card-head">
          <div class="field sem-switch">
            <label for="semSwitch${idx}"><span class="step-num">4</span>Semester</label>
            <select id="semSwitch${idx}">
              ${availableSems.filter(n => n === entry.sem || !usedSems(idx).includes(n))
                .map(n => `<option value="${n}"${n === entry.sem ? " selected" : ""}>Semester ${n}</option>`).join("")}
            </select>
          </div>
          <div class="btn-row" style="align-items:center">
            <span class="sgpa-pill" data-sgpa>SGPA 0.00</span>
            <button type="button" class="btn danger sm" data-remove aria-label="Remove semester ${entry.sem}">Remove</button>
          </div>
        </div>
        <div data-body>${loadingHtml(`Loading semester ${entry.sem} subjects…`)}</div>`;
      card.querySelector(".sem-switch select").addEventListener("change", e => {
        const n = Number(e.target.value);
        if (entry.subjects) { entry.sem = n; saveState(); renderSemesters(); return; } // typed rows stay
        if (entry.grades.some(Boolean) && !window.confirm(`Switch to Semester ${n}? Grades entered for Semester ${entry.sem} will be cleared.`)) {
          e.target.value = entry.sem;
          return;
        }
        entry.sem = n;
        entry.grades = [];
        saveState();
        renderSemesters();
      });
      if (entry.subjects) renderCustomInto(card, entry);
      else loadSubjectsInto(card, entry);
    }

    const rm = card.querySelector("[data-remove]");
    if (rm) rm.addEventListener("click", () => {
      if (semHasInput(entry) && !window.confirm(`Remove Semester ${entry.sem} and its grades?`)) return;
      state.semesters.splice(idx, 1);
      if (state.semesters.length === 0) state.semesters.push({ sem: null, grades: [] });
      saveState();
      renderSemesters();
    });
    return card;
  }

  async function loadSubjectsInto(card, entry) {
    const body = card.querySelector("[data-body]");
    try {
      if (!subjectsBySem[entry.sem]) {
        subjectsBySem[entry.sem] = await Api.subjects(state.uni, state.course, state.branch, state.scheme, entry.sem);
      }
      body.innerHTML = subjectsTable(subjectsBySem[entry.sem], entry);
      body.querySelectorAll("select[data-i]").forEach(sel => {
        sel.addEventListener("change", () => {
          entry.grades[Number(sel.dataset.i)] = sel.value;
          saveState();
          updateSemStats(card, entry);
          renderSummary();
        });
      });
      updateSemStats(card, entry);
      renderSummary();
    } catch (err) {
      showError(body, err, () => {
        body.innerHTML = loadingHtml(`Loading semester ${entry.sem} subjects…`);
        loadSubjectsInto(card, entry);
      });
    }
  }

  // Autonomous / Other: editable rows (subject name, credits, grade).
  function renderCustomInto(card, entry) {
    const body = card.querySelector("[data-body]");
    body.innerHTML = `
      <p class="small muted" style="margin-top:0">Type each subject and its credits from your college syllabus or marksheet. Subjects with 0 or no credits aren't counted.</p>
      <div class="table-wrap">
        <table class="subjects custom">
          <thead><tr><th scope="col">Subject</th><th scope="col" class="num">Credits</th><th scope="col">Grade</th><th scope="col"><span class="sr-only">Remove</span></th></tr></thead>
          <tbody>${entry.subjects.map((x, i) => `
            <tr>
              <td><input type="text" data-f="name" data-i="${i}" value="${esc(x.name)}" placeholder="Subject ${i + 1}" aria-label="Subject ${i + 1} name" maxlength="120"></td>
              <td data-label="Credits" class="num"><input type="number" class="credit-input" inputmode="decimal" min="0" max="30" step="0.5" data-f="credits" data-i="${i}" value="${esc(x.credits)}" aria-label="Credits for subject ${i + 1}"></td>
              <td class="grade-cell"><select class="grade-select" data-f="grade" data-i="${i}" aria-label="Grade for subject ${i + 1}">${gradeOptions(x.grade)}</select></td>
              <td><button type="button" class="btn danger sm" data-del="${i}" aria-label="Remove subject ${i + 1}">✕</button></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost sm" data-addsub>+ Add subject</button></div>
      <p class="progress" data-progress></p>`;

    body.querySelectorAll("[data-f]").forEach(el => {
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
        entry.subjects[Number(el.dataset.i)][el.dataset.f] = el.value;
        saveState();
        updateSemStats(card, entry);
        renderSummary();
      });
    });
    body.querySelectorAll("[data-del]").forEach(btn => btn.addEventListener("click", () => {
      entry.subjects.splice(Number(btn.dataset.del), 1);
      if (entry.subjects.length === 0) entry.subjects = blankSubjects(1);
      saveState();
      renderCustomInto(card, entry);
      renderSummary();
    }));
    body.querySelector("[data-addsub]").addEventListener("click", () => {
      entry.subjects.push(...blankSubjects(1));
      saveState();
      renderCustomInto(card, entry);
      const names = body.querySelectorAll("input[data-f=name]");
      names[names.length - 1].focus();
    });
    updateSemStats(card, entry);
  }

  function gradeOptions(selected) {
    return `<option value="">— Grade —</option>` + grading.grades
      .map(g => `<option value="${esc(g.grade)}"${g.grade === selected ? " selected" : ""}>${esc(g.grade)} (${g.points})</option>`)
      .join("");
  }

  function subjectsTable(data, entry) {
    const warn = data.verified ? "" : `
      <div class="banner warn" role="note">⚠️ <span><strong>Unverified syllabus.</strong>
      ${esc(data.note || `These subjects have not been checked against the official ${data.university.toUpperCase()} syllabus.`)}
      Your SGPA may differ from your marksheet.</span></div>`;
    const rows = data.subjects.map((s, i) => {
      const audit = s.type === "audit" || !(s.credits > 0);
      const gradeLabel = `Grade for ${s.name}`;
      return `
        <tr class="${audit ? "audit" : ""}">
          <td data-label="Code" class="code">${esc(s.code)}</td>
          <td>${esc(s.name)}</td>
          <td data-label="Type"><span class="tag ${esc(s.type)}">${esc(s.type)}</span></td>
          <td data-label="Credits" class="num">${s.credits}</td>
          <td class="grade-cell">${audit
            ? '<span class="small muted">Not counted in SGPA</span>'
            : `<select class="grade-select" data-i="${i}" aria-label="${esc(gradeLabel)}">${gradeOptions(entry.grades[i])}</select>`}</td>
        </tr>`;
    }).join("");
    return `${warn}
      <div class="table-wrap">
        <table class="subjects">
          <thead><tr><th scope="col">Code</th><th scope="col">Subject</th><th scope="col">Type</th><th scope="col" class="num">Credits</th><th scope="col">Grade</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="progress" data-progress></p>
      <p class="small muted">Source: ${esc(data.source || "unknown")}${data.lastUpdated ? ` · updated ${esc(data.lastUpdated)}` : ""}</p>`;
  }

  function updateSemStats(card, entry) {
    const r = semesterResult(entry);
    card.querySelector("[data-sgpa]").textContent = `SGPA ${fmt(r.sgpa)}`;
    const p = card.querySelector("[data-progress]");
    if (p) p.textContent = `${r.graded} of ${r.gradable} subjects graded · ${r.credits} of ${r.totalCredits} credits counted`;
  }

  $("addSemBtn").addEventListener("click", () => {
    state.semesters.push({ sem: null, grades: [] });
    saveState();
    renderSemesters();
    const last = $("semList").lastElementChild;
    if (last) {
      const s = last.querySelector("select");
      if (s) s.focus();
      if (last.scrollIntoView) last.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  // ---------- Summary ----------
  function renderSummary() {
    const chosen = state.semesters.filter(e => e.sem).sort((a, b) => a.sem - b.sem);
    $("summaryCard").hidden = chosen.length === 0 || !grading;
    if ($("summaryCard").hidden) return;

    $("summaryRows").innerHTML = chosen.map(e => {
      const r = semesterResult(e);
      const loaded = !!(e.subjects || subjectsBySem[e.sem]);
      const status = !loaded ? "Loading…" : r.graded === 0 ? "No grades yet" : r.graded < r.gradable ? `${r.graded}/${r.gradable} graded` : "Complete";
      return `<tr><td>Semester ${e.sem}</td><td class="num">${r.credits}</td><td class="num">${fmt(r.sgpa)}</td><td>${status}</td></tr>`;
    }).join("");

    const o = overall();
    $("cgpaOut").textContent = fmt(o.cgpa);
    $("pctOut").textContent = `${fmt(o.pct)}%`;
    $("creditsOut").textContent = o.credits;
    $("formulaOut").textContent = `Percentage = ${grading.percentage.formula}` +
      (grading.verified ? "" : " · grading not yet verified against the official ordinance");
  }

  // ---------- PDF ----------
  $("pdfBtn").addEventListener("click", () => {
    const status = $("pdfStatus");
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showError(status, new Error("The PDF library didn't load (are you offline?). Reload the page and try again."));
      return;
    }
    status.innerHTML = "";
    const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    const o = overall();
    const chosen = state.semesters.filter(e => e.sem).sort((a, b) => a.sem - b.sem);
    let y = 20;
    const line = (text, size = 11, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.splitTextToSize(text, 180).forEach(t => { if (y > 280) { doc.addPage(); y = 20; } doc.text(t, 15, y); y += size * 0.5; });
      y += 1.5;
    };

    line("SGPA / CGPA Result", 18, true);
    y += 2;
    line(`University: ${labels.uniSelect || state.uni}`);
    if (!isCustom()) {
      line(`Course: ${labels.courseSelect || state.course}`);
      line(`Branch: ${labels.branchSelect || state.branch}`);
    }
    line(`Generated: ${new Date().toLocaleString()}`, 9);
    y += 4;

    line("Semester-wise SGPA", 13, true);
    chosen.forEach(e => {
      const r = semesterResult(e);
      const note = r.graded < r.gradable ? `  (${r.graded}/${r.gradable} subjects graded)` : "";
      line(`Semester ${e.sem}:   SGPA ${fmt(r.sgpa)}   ·   ${r.credits} credits${note}`);
    });
    y += 4;
    line(`CGPA: ${fmt(o.cgpa)}`, 14, true);
    line(`Percentage: ${fmt(o.pct)}%`, 14, true);
    line(`Total credits: ${o.credits}`);
    line(`Percentage formula: ${grading.percentage.formula.replace("×", "x").replace("−", "-")}`, 9);
    y += 6;
    line("These results are estimates. Always confirm with the official university result.", 9);

    const name = `${[state.uni, state.branch].filter(Boolean).join("-")}-result.pdf`.toLowerCase();
    doc.save(name);
  });

  // ---------- Reset ----------
  $("resetBtn").addEventListener("click", () => {
    if (!window.confirm("Clear all selections and grades?")) return;
    storage.remove(STATE_KEY);
    state = emptyState();
    grading = null;
    availableSems = [];
    $("uniSelect").value = "";
    labels.uniSelect = "";
    showCourseFields(true);
    clearAfter(0);
    renderSemesters();
  });

  // ---------- Start: restore saved selections in order ----------
  async function restore() {
    if (!(await loadUniversities())) return;
    if (!state.uni) return;
    if (!$("uniSelect").value) { state = emptyState(); saveState(); return; } // saved uni no longer exists
    if (isCustom()) await loadCustom();
    else await loadCourses(); // continues to branches → semesters on its own
  }
  bindSetup();
  restore();
})();
