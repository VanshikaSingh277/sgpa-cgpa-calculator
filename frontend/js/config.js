// API location. Local development uses the Express server on port 5000;
// anything else (Netlify etc.) uses PRODUCTION_API_URL — change it after deploying the backend.
(function () {
  const PRODUCTION_API_URL = "https://YOUR-BACKEND-NAME.onrender.com/api";
  const LOCAL_API_URL = "http://localhost:5000/api";

  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "" || host.startsWith("192.168.");

  window.APP_CONFIG = Object.freeze({
    API_BASE_URL: isLocal ? LOCAL_API_URL : PRODUCTION_API_URL,
    REQUEST_TIMEOUT_MS: 15000, // Render free tier can take a while to wake up
  });
})();
