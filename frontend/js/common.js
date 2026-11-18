// Shared on every page: navbar, mobile menu, theme toggle, footer, small helpers.
(function () {
  const THEME_KEY = "sgpa-theme";

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch { /* storage blocked */ } },
    remove(key) { try { localStorage.removeItem(key); } catch { /* storage blocked */ } },
  };

  // ---------- Theme ----------
  function preferredTheme() {
    const saved = storage.get(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    const btn = document.getElementById("themeToggle");
    if (btn) {
      btn.textContent = t === "dark" ? "☀️" : "🌙";
      btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }
  applyTheme(preferredTheme()); // run early to avoid a flash

  // ---------- Navbar & footer ----------
  const LINKS = [
    { href: "index.html", label: "Home" },
    { href: "calculator.html", label: "Calculator" },
    { href: "grades.html", label: "Grade Table" },
    { href: "about.html", label: "About" },
  ];

  function renderChrome() {
    const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const nav = document.createElement("nav");
    nav.className = "nav";
    nav.setAttribute("aria-label", "Main");
    nav.innerHTML = `
      <div class="nav-inner">
        <a class="brand" href="index.html"><img src="assets/logo.svg" alt="" width="30" height="30"><span>SGPA Calculator</span></a>
        <ul class="nav-links" id="navLinks">
          ${LINKS.map(l => `<li><a href="${l.href}"${l.href === page ? ' aria-current="page"' : ""}>${l.label}</a></li>`).join("")}
        </ul>
        <button class="icon-btn" id="themeToggle" type="button"></button>
        <button class="icon-btn menu-btn" id="menuToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks">☰</button>
      </div>`;
    document.body.prepend(nav);

    const footer = document.createElement("footer");
    footer.className = "footer";
    footer.textContent = "Made by Vanshika · Results are estimates, confirm with the official university result";
    document.body.append(footer);

    applyTheme(document.documentElement.getAttribute("data-theme"));
    document.getElementById("themeToggle").addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      storage.set(THEME_KEY, next);
      applyTheme(next);
    });

    const menuBtn = document.getElementById("menuToggle");
    const links = document.getElementById("navLinks");
    menuBtn.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menuBtn.textContent = open ? "✕" : "☰";
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderChrome);
  else renderChrome();

  // ---------- Helpers shared by page scripts ----------
  const escapeHtml = v =>
    String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function loadingHtml(text) {
    return `<div class="loading" role="status"><span class="spinner" aria-hidden="true"></span>${escapeHtml(text)}</div>`;
  }

  // Renders an error banner with a Retry button into `el`.
  function showError(el, err, onRetry) {
    el.innerHTML = `<div class="banner error" role="alert"><span>⚠️ ${escapeHtml(err && err.message ? err.message : String(err))}</span>
      ${onRetry ? '<button type="button" class="btn sm">Retry</button>' : ""}</div>`;
    if (onRetry) el.querySelector("button").addEventListener("click", onRetry);
  }

  window.App = { storage, escapeHtml, loadingHtml, showError };
})();
