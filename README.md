# SGPA & CGPA Calculator

A full-stack SGPA / CGPA / percentage calculator. Students pick **University → Course → Branch → Scheme (batch) → Semester**, and the subjects and credits load from the backend. They only choose grades. No login or sign-up.

```
sgpa-repo/
├── backend/    Node.js + Express REST API, data stored as JSON files
├── frontend/   Plain HTML, CSS and JavaScript (no frameworks)
└── old/        The previous single-page version (kept for reference)
```

---

## Run locally

You need **Node.js 18+**.

**1. Start the backend (port 5000)**

```bash
cd backend
npm install
npm run dev          # auto-restarts on changes (nodemon)
# or: npm start
```

Check it works: open http://localhost:5000/api/health

Optional: copy `backend/.env.example` to `backend/.env` to change the port, allowed origins or cache time.

**2. Open the frontend (port 5500)**

- In VS Code, install the **Live Server** extension.
- Right-click `frontend/index.html` → **Open with Live Server**.
- It opens at `http://127.0.0.1:5500/...`. The frontend automatically calls `http://localhost:5000/api` when it runs on localhost (see `frontend/js/config.js`).

> Opening the HTML file by double-clicking (`file://`) also uses the local API, but Live Server is recommended.

---

## API

Base URL: `http://localhost:5000/api`. Every response is JSON. Errors look like `{ "error": "message" }` with status `400` (invalid parameter) or `404` (not found).

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/health` | `{ status, uptimeSeconds, cacheEntries, time }` |
| GET | `/universities` | `[{ id, name, shortName, customSubjects? }]` (`customSubjects: true` = students type their own subjects) |
| GET | `/universities/:uni/grading` | grade table + percentage formula (see below) |
| GET | `/universities/:uni/courses` | `[{ id, name }]` |
| GET | `/universities/:uni/courses/:course/branches` | `[{ id, name }]` |
| GET | `/universities/:uni/courses/:course/branches/:branch/schemes` | `[{ id, name, note? }]` |
| GET | `…/branches/:branch/schemes/:scheme/semesters` | `[1, 2, …, 8]` |
| GET | `…/branches/:branch/schemes/:scheme/semesters/:sem/subjects` | semester subjects (see below) |

Example:

```bash
curl http://localhost:5000/api/universities/aktu/courses/btech/branches/cse/schemes/2023/semesters/3/subjects
```

```json
{
  "university": "aktu", "course": "btech", "branch": "cse", "scheme": "2023", "semester": 3,
  "verified": true,
  "source": "aktu_btech_cse_2nd_year_2023-24_v3.pdf (https://fms.aktu.ac.in/...)",
  "lastUpdated": "2026-11-18",
  "totalCredits": 25,
  "subjects": [
    { "code": "BCS301", "name": "Data Structure", "type": "theory", "credits": 4 },
    { "code": "BCS351", "name": "Data Structure Lab", "type": "lab", "credits": 1 }
  ]
}
```

`type` is one of `theory`, `lab`, `project` or `audit`. Audit and 0-credit subjects are shown but left out of the SGPA.

Grading response (`/universities/aktu/grading`):

```json
{
  "verified": false,
  "grades": [{ "grade": "A+", "marks": "90–100", "points": 10, "remark": "Outstanding" }],
  "percentage": { "formula": "(CGPA × 10) − 7.5", "multiply": 10, "subtract": 7.5 }
}
```

**Security and caching**
- Every URL parameter must match `[a-z0-9-]`. Semesters must be `1`–`99`.
- File paths are resolved and checked to stay inside `backend/data`, so `../` tricks are rejected with a `400`.
- File reads are cached in memory for `CACHE_TTL_MS` (default 5 minutes). After editing JSON files, restart the server or wait for the cache to expire.

---

## Calculations

- **SGPA** = Σ(credits × grade points) ÷ Σ(credits), counting only credit-bearing subjects that have a grade picked.
- **CGPA** = Σ over all semesters (credits × grade points) ÷ Σ all credits. It is credit-weighted, not an average of SGPAs.
- **Percentage** = the university's formula from `grading.json`. For AKTU: (CGPA × 10) − 7.5.
- **F** counts as 0 points, but its credits still count.
- Displayed values are rounded to 2 decimals.

---

## Data files

```
backend/data/
├── universities.json
├── source-pdfs/                       ← official PDFs the data was taken from
└── aktu/
    ├── grading.json
    ├── courses.json
    └── btech/
        ├── branches.json
        └── cse/
            ├── schemes.json           ← display names for batch folders (optional)
            └── 2023/sem1.json … sem8.json
```

Every semester file has `verified`, `source` and `lastUpdated`.

### Where the AKTU B.Tech CSE (batch 2023) data comes from

All 8 semesters were taken from AKTU's official PDFs (saved in `backend/data/source-pdfs/`). Each semester's credits add up to the total printed in the PDF.

| Semesters | PDF | Effective from |
|---|---|---|
| 1, 2 | `aktu_btech_1st_year_scheme_2022-23.pdf` (common to all branches except AG & BT) | 2022-23 |
| 3, 4 | `aktu_btech_cse_2nd_year_2023-24_v3.pdf` | 2023-24 |
| 5, 6 | `aktu_btech_cse_3rd_year_2024-25.pdf` | 2024-25 |
| 7, 8 | `aktu_btech_cse_4th_year_2025-26.pdf` | 2025-26 |

**What this data assumes**
- AKTU's syllabus pages for 2024-25, 2025-26 and 2026-27 don't list a newer CSE scheme for the 2nd, 3rd or 4th year. So the batch admitted in 2023 is assumed to follow these PDFs. (The 2026-27 "CSE Stream" PDF is only for the new first year.)
- **Either/or subjects:** where AKTU lets a student take one of two subjects (Physics or Chemistry group, Maths-IV or Science Elective, Python or Cyber Security), both are shown in one row. The two options always carry the same credits.
- **Electives:** departmental and open electives are shown as one row per elective slot, listing the choices.

### RTU B.Tech CSE (`rtu/btech/cse/2018/`)

Semesters 1–8 were taken from RTU's CSE scheme for students admitted from 2018-19. The copy used is published by SKIT Jaipur, an RTU-affiliated college, because rtu.ac.in blocks automated downloads. It is saved as `source-pdfs/rtu_btech_cse_scheme_2018-onwards_skit.pdf`. Each semester's credits add up to the PDF's total (20.5, 20.5, 24.5, 23.5, 23, 23.5, 15, 15.5).

### Autonomous / Other

Autonomous colleges set their own syllabus, so this option has no subject files. In `universities.json` it has `"customSubjects": true`. The API passes this on, and the frontend then hides Course/Branch and lets students type subjects, credits and grades. It uses the generic UGC 10-point scale in `autonomous/grading.json`.

### ⚠️ Unverified files — please check

| File | Why |
|---|---|
| `backend/data/aktu/grading.json` | Grade points and the percentage formula come from the project spec. They have **not** been checked against the AKTU ordinance. |
| `backend/data/rtu/grading.json` | The grade points match RTU calculators in common use, but no official RTU ordinance was found. The percentage formula (CGPA × 10) is also unconfirmed. |
| `backend/data/rtu/btech/cse/2018/sem1.json` … `sem8.json` | Taken from a college-hosted copy (not rtu.ac.in) of the scheme for students admitted from 2018-19. RTU may have revised it for later batches. |
| `backend/data/autonomous/grading.json` | Generic UGC scale; each autonomous college has its own rules. |

Once you've checked a file against the official document, set `"verified": true` in it. The yellow warning in the app then disappears.

---

## Add a university, course, branch or batch

1. Add the university to `backend/data/universities.json`:
   `{ "id": "rtu", "name": "Rajasthan Technical University", "shortName": "RTU" }`
   Ids must be lowercase letters, digits and dashes.
2. Create `backend/data/rtu/grading.json` (same shape as AKTU's) and `backend/data/rtu/courses.json`.
3. For each course create `backend/data/rtu/<course>/branches.json`.
4. For each branch and batch create `backend/data/rtu/<course>/<branch>/<batch>/sem1.json`, `sem2.json` and so on:

```json
{
  "university": "rtu", "course": "btech", "branch": "cse", "scheme": "2023", "semester": 1,
  "verified": false,
  "source": "name-of-pdf.pdf (https://official-url)",
  "lastUpdated": "2026-11-18",
  "subjects": [
    { "code": "1FY2-01", "name": "Engineering Mathematics-I", "type": "theory", "credits": 4 }
  ]
}
```

5. Optionally add `<branch>/schemes.json` (`[{ "id": "2023", "name": "Batch 2023", "note": "..." }]`) for nicer batch names.
6. Put the source PDF in `backend/data/source-pdfs/`. Only set `"verified": true` once every subject has been checked against it.

The frontend needs no changes. New entries show up in the dropdowns automatically.

**Moving to a database later:** all file access goes through `readJson()` and `listDir()` in `backend/controllers/dataController.js`. Replace those two functions with MongoDB or Firebase queries and the API stays the same.

---

## Deploy

**Backend → Render (free web service)**
1. Push the repo to GitHub. On Render: **New → Web Service** → pick the repo.
2. **Root directory:** `backend` · **Build command:** `npm install` · **Start command:** `npm start`
3. Environment variables:
   - `NODE_ENV=production`
   - `ALLOWED_ORIGIN=https://<your-site>.netlify.app` (use commas for several)
   - `PORT` is set by Render automatically.
4. Free instances sleep when idle, so the first request can take around 30–50 seconds. The frontend waits 15 seconds and then shows a Retry button.

**Frontend → Netlify**
1. In `frontend/js/config.js`, set `PRODUCTION_API_URL` to `https://<your-render-service>.onrender.com/api`.
2. On Netlify: **Add new site → Import from Git** → pick the repo.
3. **Base / publish directory:** `frontend`. Leave the build command empty.

---

## Tech

- **Backend:** Node.js, Express 4, cors, dotenv, nodemon (dev)
- **Frontend:** HTML, CSS and vanilla JavaScript; jsPDF 2.5.1 (from cdnjs) for PDF export
- **Storage:** the student's selections and grades are kept in their own browser (localStorage). Nothing is sent to the server.
