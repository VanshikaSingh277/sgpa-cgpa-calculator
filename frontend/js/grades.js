// Grade Table page: pick a university → show its grade scale and percentage formula.
(function () {
  const { storage, escapeHtml: esc, loadingHtml, showError } = window.App;
  const KEY = "sgpa-grades-uni";
  const sel = document.getElementById("gradesUni");
  const out = document.getElementById("gradesOut");

  async function loadUniversities() {
    out.innerHTML = loadingHtml("Loading universities…");
    try {
      const list = await Api.universities();
      const saved = storage.get(KEY);
      sel.innerHTML = `<option value="">Select university</option>` +
        list.map(u => `<option value="${esc(u.id)}"${u.id === saved ? " selected" : ""}>${esc(u.shortName)} — ${esc(u.name)}</option>`).join("");
      sel.disabled = false;
      out.innerHTML = "";
      if (sel.value) showGrading(sel.value);
      else if (list.length === 1) { sel.value = list[0].id; showGrading(list[0].id); }
    } catch (err) {
      showError(out, err, loadUniversities);
    }
  }

  async function showGrading(uni) {
    out.innerHTML = loadingHtml("Loading grade table…");
    try {
      const g = await Api.grading(uni);
      const warn = g.verified ? "" :
        `<div class="banner warn" role="note">⚠️ <span><strong>Not yet verified.</strong> ${esc(g.note || "Confirm these values against the official ordinance.")}</span></div>`;
      out.innerHTML = `
        ${warn}
        <div class="table-wrap">
          <table>
            <caption class="sr-only">Grade scale</caption>
            <thead><tr><th scope="col">Grade</th><th scope="col">Marks</th><th scope="col" class="num">Grade points</th><th scope="col">Remark</th></tr></thead>
            <tbody>${g.grades.map(r => `
              <tr><td><strong>${esc(r.grade)}</strong></td><td>${esc(r.marks)}</td><td class="num">${esc(r.points)}</td><td class="muted">${esc(r.remark || "")}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
        <h3 style="margin-top:18px">Percentage formula</h3>
        <p class="formula">Percentage = ${esc(g.percentage.formula)}</p>
        <p class="small muted">Source: ${esc(g.source || "unknown")}${g.lastUpdated ? ` · updated ${esc(g.lastUpdated)}` : ""}</p>`;
    } catch (err) {
      showError(out, err, () => showGrading(uni));
    }
  }

  sel.addEventListener("change", () => {
    storage.set(KEY, sel.value);
    if (sel.value) showGrading(sel.value);
    else out.innerHTML = "";
  });

  loadUniversities();
})();
