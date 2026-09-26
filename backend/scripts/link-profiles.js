const fs = require('fs');
const path = require('path');

const CSV_PATH = process.argv[2] || 'E:\\Research IITB\\iitb_all_faculty_identifiers.csv';
const REPORT = path.join(__dirname, '..', 'data', 'report.json');

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== '')) rows.push(row);
  }
  return rows;
}

const normName = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(dr|prof|professor|mr|ms|mrs|shri|smt)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const digits = (s) => String(s || '').replace(/\D/g, '');

const text = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCSV(text);
const header = rows[0].map((h) => h.trim());
const col = (name) => header.indexOf(name);

const byExpertId = new Map();
const byScopus = new Map();
const byName = new Map();
for (const r of rows.slice(1)) {
  const rec = {};
  header.forEach((h, i) => { rec[h] = (r[i] || '').trim(); });
  if (!rec.Profile_URL) continue;
  const id = rec.Profile_URL.split('/').filter(Boolean).pop();
  if (id && !byExpertId.has(id)) byExpertId.set(id, rec);
  const sc = digits(rec.Scopus_ID);
  if (sc && !byScopus.has(sc)) byScopus.set(sc, rec);
  const key = normName(rec.Name);
  if (!key) continue;
  if (!byName.has(key)) byName.set(key, []);
  byName.get(key).push(rec);
}

const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const db = report.professor_research_interest_database;
if (!db || !Array.isArray(db.professors)) throw new Error('professor section not found');

let mId = 0, mSc = 0, mName = 0, none = 0;
for (const p of db.professors) {
  let match = null;
  const id = String(p.Expert_ID || '').trim();
  if (id && byExpertId.has(id)) match = byExpertId.get(id);
  if (!match) {
    const sc = digits(p['Scopus Id']);
    if (sc && byScopus.has(sc)) match = byScopus.get(sc);
  }
  if (!match) {
    const cands = byName.get(normName(p.Name)) || [];
    if (cands.length === 1) match = cands[0];
  }
  if (match) {
    p.Profile_URL = match.Profile_URL;
    if (match.ORCID && !p.ORCID) p.ORCID = match.ORCID;
    const src = id && byExpertId.get(id) === match ? 'expert_id' : digits(p['Scopus Id']) && byScopus.get(digits(p['Scopus Id'])) === match ? 'scopus' : 'name';
    if (src === 'expert_id') mId++;
    else if (src === 'scopus') mSc++;
    else mName++;
  } else {
    delete p.Profile_URL;
    delete p.ORCID;
    none++;
  }
}

const tip = "Click a professor's name to open their Vidwan profile (where available).";
db.how_to_use = db.how_to_use || [];
if (!db.how_to_use.some((x) => x.includes('Vidwan profile'))) db.how_to_use.push(tip);

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(
  `Linked ${mId + mSc + mName}/${db.professors.length} profiles ` +
    `(expert_id: ${mId}, scopus: ${mSc}, name: ${mName}); unmatched: ${none}`
);
