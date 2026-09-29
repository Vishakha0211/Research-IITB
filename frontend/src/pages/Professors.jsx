import { useState, useMemo, useEffect } from 'react';
import { useReport } from '../context/ReportContext';
import { Section, Card, Callout, PageIntro, fmt } from '../components/ui';

const PAGE_SIZE = 25;
const STAR_KEY = 'iitb-starred-professors';

const norm = (s) =>
  String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const tokenize = (s) => norm(s).split(/[^a-z0-9+#]+/).filter(Boolean);

const stem = (w) =>
  w.replace(/(ies)$/, 'y')
    .replace(/(ing|ed|es|s)$/, '')
    .replace(/([a-z])\1$/, '$1');

const WEIGHTED = [
  ['Name', 10],
  ['Topic', 7],
  ['Research_Interest', 5],
  ['Department', 4],
  ['Designation', 3]
];

function lev(a, b, max) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function buildFields(p) {
  const fields = [];
  const push = (text, w) => text && fields.push({ text, w, tokens: tokenize(text) });
  for (const [h, w] of WEIGHTED) push(norm(p[h]), w);
  const weighted = new Set(WEIGHTED.map(([h]) => h));
  for (const [k, v] of Object.entries(p)) {
    if (k === 'Profile_URL' || weighted.has(k) || v == null) continue;
    push(norm(v), 1);
  }
  return fields;
}

function fieldTokenScore(qt, f) {
  if (f.text.includes(qt)) return 1;
  if (qt.length > 3) {
    const variants = qt.endsWith('s')
      ? [qt.slice(0, -1)]
      : [`${qt}s`, `${qt}es`, `${qt}ing`, `${qt.slice(0, -1)}ed`];
    for (const v of variants) if (f.text.includes(v)) return 0.9;
  }
  const qs = stem(qt);
  const maxD = qt.length >= 5 ? 2 : qt.length >= 3 ? 1 : 0;
  for (const t of f.tokens) {
    if (qs && stem(t) === qs) return 0.85;
    if (maxD > 0 && Math.abs(t.length - qt.length) <= maxD) {
      const d = lev(qt, t, maxD);
      if (d <= maxD) return d === 1 ? 0.7 : 0.55;
    }
  }
  return 0;
}

function loadStars() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STAR_KEY) || '[]').map(String));
  } catch {
    return new Set();
  }
}

export default function Professors() {
  const { report } = useReport();
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('All');
  const [desig, setDesig] = useState('All');
  const [starOnly, setStarOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [starred, setStarred] = useState(loadStars);
  const db = report?.professor_research_interest_database;
  const all = useMemo(() => db?.professors || [], [db]);
  const entries = useMemo(() => all.map((p) => ({ p, fields: buildFields(p) })), [all]);

  useEffect(() => {
    try {
      localStorage.setItem(STAR_KEY, JSON.stringify([...starred]));
    } catch {
      /* storage unavailable - stars stay for this session */
    }
  }, [starred]);

  const keyOf = (p) => String(p.Expert_ID || p.Name || '');

  const toggleStar = (p) => {
    const k = keyOf(p);
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const departments = useMemo(
    () => ['All', ...Array.from(new Set(all.map((p) => p.Department).filter(Boolean))).sort()],
    [all]
  );
  const designations = useMemo(
    () => ['All', ...Array.from(new Set(all.map((p) => p.Designation).filter(Boolean))).sort()],
    [all]
  );

  const professors = useMemo(() => {
    const base = entries.filter((e) => {
      const p = e.p;
      if (starOnly && !starred.has(keyOf(p))) return false;
      if (dept !== 'All' && p.Department !== dept) return false;
      if (desig !== 'All' && p.Designation !== desig) return false;
      return true;
    });
    const qTokens = tokenize(q);
    if (qTokens.length === 0) return base.map((e) => e.p);
    const scored = [];
    for (const e of base) {
      let total = 0;
      let ok = true;
      for (const qt of qTokens) {
        let best = 0;
        for (const f of e.fields) {
          const s = fieldTokenScore(qt, f);
          if (s > 0) {
            const v = s * f.w;
            if (v > best) best = v;
          }
        }
        if (best === 0) {
          ok = false;
          break;
        }
        total += best;
      }
      if (ok) scored.push({ p: e.p, total });
    }
    scored.sort((a, b) => b.total - a.total);
    return scored.map((x) => x.p);
  }, [entries, q, dept, desig, starOnly, starred]);

  useEffect(() => setPage(1), [q, dept, desig, starOnly]);

  if (!report) return null;

  const headers = db?.headers || ['Name', 'Designation', 'Topic', 'Research_Interest', 'Department'];
  const totalPages = Math.max(1, Math.ceil(professors.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = professors.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const from = professors.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const to = Math.min(current * PAGE_SIZE, professors.length);

  return (
    <>
      <PageIntro title="Professor research database." accent="Find expertise fast." eyebrow="Directory · IRINS · iitb.irins.org">
        {db?.description} - {fmt(all.length)} professors, {departments.length - 1} departments. Search by
        topic, name or keyword, filter by department/designation, star ★ professors you want to shortlist,
        and click a linked name to open their Vidwan profile. For the complete list, visit{' '}
        <a href={`https://${db?.website || 'iitb.irins.org'}`} target="_blank" rel="noreferrer">
          {db?.website || 'iitb.irins.org'}
        </a>
        .
      </PageIntro>

      <Section title="How to use this database">
        <Card>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, color: '#33405c', fontSize: 14 }}>
            {(db?.how_to_use || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </Card>
      </Section>

      <Section
        title="Search Professors"
        note={`${fmt(all.length)} records loaded - combine search with the filters below.`}
      >
        <div className="search-bar">
          <input
            type="search"
            placeholder="Search topic, professor, department… (e.g. chemistry, climate, Kishore)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="select" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All departments' : d}
              </option>
            ))}
          </select>
          <select className="select" value={desig} onChange={(e) => setDesig(e.target.value)} aria-label="Designation">
            {designations.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All designations' : d}
              </option>
            ))}
          </select>
        </div>
        <div className="result-count">
          <span>
            Showing {fmt(from)}-{fmt(to)} of {fmt(professors.length)} professors
            {professors.length !== all.length && ` (filtered from ${fmt(all.length)})`}
            {q.trim() && professors.length > 1 && ' · ranked by relevance'}
          </span>
          <button
            type="button"
            className={`btn chip${starOnly ? ' active' : ''}`}
            onClick={() => setStarOnly((v) => !v)}
            aria-pressed={starOnly}
            title="Show only starred professors"
          >
            ★ Starred{starred.size ? ` (${starred.size})` : ''}
          </button>
        </div>
        <Card>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="star-col" aria-label="Star" />
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => {
                  const k = keyOf(p);
                  const isStarred = starred.has(k);
                  return (
                    <tr key={`${k}-${(current - 1) * PAGE_SIZE + i}`}>
                      <td className="star-cell">
                        <button
                          type="button"
                          className={`star-btn${isStarred ? ' on' : ''}`}
                          onClick={() => toggleStar(p)}
                          aria-pressed={isStarred}
                          aria-label={isStarred ? `Remove ${p.Name} from starred` : `Star ${p.Name}`}
                          title={isStarred ? 'Remove star' : 'Star this professor'}
                        >
                          ★
                        </button>
                      </td>
                      {headers.map((h) => (
                        <td key={h} style={h === 'Research_Interest' ? { minWidth: 260 } : undefined}>
                          {h === 'Name' ? (
                            p.Profile_URL ? (
                              <a className="prof-link" href={p.Profile_URL} target="_blank" rel="noreferrer" title="Open Vidwan profile">
                                <strong>{p[h]}</strong>
                              </a>
                            ) : (
                              <strong>{p[h]}</strong>
                            )
                          ) : (
                            p[h] ?? ''
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {professors.length === 0 && (
                  <tr>
                    <td
                      colSpan={headers.length + 1}
                      style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}
                    >
                      {starOnly && starred.size === 0
                        ? 'No starred professors yet - tap the ★ on any row to bookmark it.'
                        : <>No professors match “{q}”{dept !== 'All' ? ` in ${dept}` : ''}</>}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        {totalPages > 1 && (
          <div className="pager">
            <button type="button" className="btn ghost" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              ← Previous
            </button>
            <span className="pager-info">
              Page {current} of {totalPages}
            </span>
            <button
              type="button"
              className="btn ghost"
              disabled={current >= totalPages}
              onClick={() => setPage(current + 1)}
            >
              Next →
            </button>
          </div>
        )}
        <Callout>
          Tip: click a linked name to open that professor's Vidwan profile, and star ★ professors to build a
          shortlist - it is saved in this browser and the <strong>Starred</strong> button shows only your
          picks. For others, copy the name and search it on{' '}
          <a href={`https://${db?.website || 'iitb.irins.org'}`} target="_blank" rel="noreferrer">
            {db?.website || 'iitb.irins.org'}
          </a>
          .
        </Callout>
      </Section>
    </>
  );
}
