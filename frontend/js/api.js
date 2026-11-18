// Every call to the backend lives here.
(function () {
  const { API_BASE_URL, REQUEST_TIMEOUT_MS } = window.APP_CONFIG;
  const cache = new Map(); // same request in one page visit → one fetch

  class ApiError extends Error {
    constructor(message, { status = 0, offline = false } = {}) {
      super(message);
      this.status = status;
      this.offline = offline;
    }
  }

  async function get(path) {
    if (cache.has(path)) return cache.get(path);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const promise = (async () => {
      let res;
      try {
        res = await fetch(API_BASE_URL + path, { signal: controller.signal, headers: { Accept: "application/json" } });
      } catch (err) {
        throw new ApiError(
          err.name === "AbortError"
            ? "The server took too long to respond. It may be starting up — please retry in a few seconds."
            : "Can't reach the server. Check your internet connection, or the backend may be down.",
          { offline: true }
        );
      } finally {
        clearTimeout(timer);
      }

      let body = null;
      try { body = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok) {
        const msg = (body && body.error) || `Request failed (HTTP ${res.status}).`;
        throw new ApiError(msg, { status: res.status });
      }
      return body;
    })();

    cache.set(path, promise);
    promise.catch(() => cache.delete(path)); // let failed requests be retried
    return promise;
  }

  const enc = encodeURIComponent;
  const branchPath = (u, c, b) => `/universities/${enc(u)}/courses/${enc(c)}/branches/${enc(b)}`;

  window.Api = {
    ApiError,
    health: () => get("/health"),
    universities: () => get("/universities"),
    grading: uni => get(`/universities/${enc(uni)}/grading`),
    courses: uni => get(`/universities/${enc(uni)}/courses`),
    branches: (uni, course) => get(`/universities/${enc(uni)}/courses/${enc(course)}/branches`),
    schemes: (uni, course, branch) => get(`${branchPath(uni, course, branch)}/schemes`),
    semesters: (uni, course, branch, scheme) => get(`${branchPath(uni, course, branch)}/schemes/${enc(scheme)}/semesters`),
    subjects: (uni, course, branch, scheme, sem) =>
      get(`${branchPath(uni, course, branch)}/schemes/${enc(scheme)}/semesters/${enc(sem)}/subjects`),
  };
})();
