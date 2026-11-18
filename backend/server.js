require("dotenv").config();

const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const IS_PROD = process.env.NODE_ENV === "production";

// ---------- CORS ----------
// Production: only the origins listed in ALLOWED_ORIGIN.
// Development: any origin (Live Server may use localhost or 127.0.0.1).
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!IS_PROD || !origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false); // no CORS headers → browser blocks it
    },
    methods: ["GET"],
  })
);

app.disable("x-powered-by");
app.use(express.json());

// ---------- Routes ----------
app.get("/", (req, res) => {
  res.json({ name: "SGPA/CGPA Calculator API", docs: "See README.md", health: "/api/health" });
});
app.use("/api", apiRoutes);

// ---------- 404 + error handlers ----------
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.expose ? err.message : "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}/api (${IS_PROD ? "production" : "development"})`);
  if (IS_PROD) console.log(`CORS allowed origins: ${allowedOrigins.join(", ") || "(none set!)"}`);
});
