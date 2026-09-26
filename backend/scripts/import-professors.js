const fs = require('fs');
const path = require('path');

const CSV_PATH = process.argv[2] || 'E:\\Downloads\\Professors Database.csv';
const REPORT = path.join(__dirname, '..', 'data', 'report.json');

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== '')) rows.push(row);
  }
  return rows;
}

const text = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCSV(text);
const header = rows[0].map((h) => h.trim());
const expected = ['Name', 'Designation', 'Expert_ID', 'Topic', 'Research_Interest', 'Department', 'Scopus Id'];
// Data rows carry a leading index column that the header omits
const hasIndexCol = rows[1] && rows[1].length === header.length + 1;
const cols = hasIndexCol ? ['__idx', ...header] : header;

const professors = [];
let bad = 0;
for (const r of rows.slice(1)) {
  if (r.length !== cols.length) bad++;
  const rec = {};
  cols.forEach((c, i) => { rec[c] = (r[i] || '').trim(); });
  delete rec.__idx;

  // Fix rows where Department and Research_Interest are swapped/shifted
  if (!rec.Department && /^(Department|Centre|Center|School|Shailesh|Environmental|Industrial|Climate|Central|Social)/i.test(rec.Research_Interest)) {
    const tmp = rec.Research_Interest;
    rec.Research_Interest = rec.Topic && !/Engineering|Science|Chemistry|Mathematics|Physics/i.test(rec.Topic) ? rec.Topic : '';
    rec.Department = tmp;
  }
  if (rec.Expert_ID) rec.Expert_ID = Number(rec.Expert_ID) || rec.Expert_ID;
  professors.push(rec);
}

const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const section = report.professor_research_interest_database || {};
section.title = section.title || 'IITB Professor Research Database';
section.description = section.description || 'To find professors with particular research interest use Professors Database';
section.how_to_use = section.how_to_use || [
  'Use the search box to filter by topic, professor name, department or any keyword.',
  "Copy the professor's name and search it on the IRINS IIT Bombay website to explore their publications."
];
section.website = section.website || 'iitb.irins.org';
section.context = section.context || 'IITB Professor Research Database (CSV import)';
section.headers = expected;
section.professors = professors;
section.source = 'Professors Database.csv';
report.professor_research_interest_database = section;

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
const depts = new Set(professors.map((p) => p.Department).filter(Boolean));
console.log(`Imported ${professors.length} professors (${depts.size} departments). Rows with unexpected column count: ${bad}`);
