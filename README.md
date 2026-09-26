# RESEARCH @ IITB — Dynamic Research Portal

A full web portal rendering the entire "RESEARCH @ IITB" report with interactive charts.
All charts and tables read live from a backend data file, so any figure can be updated later
without touching code.

## Run

```bash
npm install-all     # install backend + frontend deps (once)
npm run build       # build the frontend into frontend/dist
npm start           # start API + portal on http://localhost:5000
```

Development (hot reload frontend on :3000, API on :5000):

```bash
npm run dev:backend
npm run dev:frontend
```

## Pages

| Route | Content |
|---|---|
| `/` | Executive overview, KPIs, publication mix, collaboration donut, recommendations |
| `/impact` | Department citations vs Crossref, faculty size vs citations, access models, open-access citation advantage, institute citations |
| `/excellence` | Volume vs voice (bar+line), H-index vs QS, department-wise H-index across 6 institutes, QS/NIRF table |
| `/publications` | Publication mix, publications & patents by institute, academic-rank pie, authorship distribution, author-count trends, Lorenz curve + concentration pie |
| `/topics` | Yearly key research topics (word cloud, 2020–2024) and top funded topics (radar) with year tabs |
| `/collaborations` | Collaboration split donut, domestic network, global partners, country treemap |
| `/funding` | Funded research by department (pie), top funding agencies (bars) |
| `/professors` | Searchable professor research database (links to iitb.irins.org) |
| `/admin` | **Update Data** — edit any report section as JSON with explicit success/error feedback |

## Updating data

All **write** endpoints require an admin token (`GET` stays public). The token is read from,
in order: the `ADMIN_TOKEN` environment variable → `backend/.env` (`ADMIN_TOKEN=...`) →
`backend/.admin-token` (auto-generated on first run; printed in the server console).

- **UI:** open `/admin`, paste the token into **Admin access** (Save & verify), then expand a
  section, edit its JSON, Save. Invalid JSON, failed saves, or a missing/wrong token all show an
  explicit error toast; successful saves re-render all affected charts. The token is kept in
  browser localStorage.
- **API** (send `x-admin-token: <token>` or `Authorization: Bearer <token>` on writes):
  - `GET /api/report` — full report JSON (public)
  - `GET /api/report/:section` — one top-level section (public)
  - `PUT /api/report/:section` — replace a section
  - `PATCH /api/report/:section` — merge fields into a section
  - `POST /api/report` — replace the whole report
  - `POST /api/report/reset` — restore `report.backup.json`
  - `POST /api/auth/verify` — check a token without changing data (401 if wrong)

Data lives in `backend/data/report.json` (single source of truth).

## Stack

- **Frontend:** React 18 + Vite + Chart.js (react-chartjs-2) + React Router
- **Backend:** Node.js + Express, JSON file storage
