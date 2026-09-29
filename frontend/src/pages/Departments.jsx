import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useReport } from '../context/ReportContext';
import { Section, Card, PageIntro, KPI, DataTable, fmt } from '../components/ui';

const norm = (s) =>
  String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const dkey = (s) => norm(s).replace(/department of|dept\.?|department/g, '').replace(/[^a-z0-9]/g, '');

const ALIAS = {
  electricalengineering: ['ee', 'electricalengg', 'electrical'],
  mechanicalengineering: ['me', 'mechanicalengg', 'mechanical'],
  civilengineering: ['ce', 'civil'],
  chemicalengineering: ['chemical'],
  aerospaceengineering: ['ae', 'aerospace'],
  computerscienceandengineering: ['cse', 'computerscience'],
  earthsciences: ['es', 'earthscience'],
  climatestudies: ['cl', 'climate'],
  physics: ['ph'],
  biosciencesbioengineering: ['biosciences'],
  metallurgicalengineeringmaterialsscience: ['mems', 'metallurgy', 'metallurgymaterials'],
  humanitiesandsocialsciences: ['hss'],
  'energyscienceengineering': ['ese']
};

const aliasFull = (x) => Object.keys(ALIAS).find((f) => f === x || ALIAS[f].includes(x)) || x;

const hasAlias = (k, ik) => aliasFull(k) === aliasFull(ik);

const splitTopics = (p) =>
  String(p.Topic || '')
    .split(/[,;|]/)
    .map((t) => t.trim())
    .filter(Boolean);

const matchBy = (name, list, keyOf) => {
  const k = dkey(name);
  if (!k) return null;
  let best = null;
  for (const item of list) {
    const ik = dkey(keyOf(item));
    if (!ik) continue;
    if (ik === k || hasAlias(k, ik)) return item;
    if (!best && ik.length >= 4 && k.length >= 4 && (ik.includes(k) || k.includes(ik))) best = item;
  }
  return best;
};

const matchDept = (name, list = []) => matchBy(name, list, (i) => i.department || i.name || '');

const matchDbDept = (name, list = []) => matchBy(name, list, (i) => i);

/* ---------------------------------------------------------- Index page */

export function DepartmentList() {
  const { report } = useReport();
  const all = report?.professor_research_interest_database?.professors || [];

  const groups = useMemo(() => {
    const m = new Map();
    for (const p of all) {
      const d = (p.Department || '').trim();
      if (!d || d.length > 80) continue;
      if (!m.has(d)) m.set(d, []);
      m.get(d).push(p);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [all]);

  if (!report) return null;

  return (
    <>
      <PageIntro title="Departments." accent="Every corner of IIT Bombay." eyebrow="Profiles · Faculty · Impact">
        {groups.length} departments represented in the professor database. Open a department to see its
        faculty, research topics, citation impact, publication volume and funding share - or jump straight
        to its full professor list.
      </PageIntro>

      <Section title="All departments" note={`Sorted by faculty count - ${fmt(all.length)} professors in total.`}>
        <div className="dept-grid">
          {groups.map(([name, people]) => {
            const topics = {};
            people.forEach((p) => splitTopics(p).forEach((t) => (topics[t] = (topics[t] || 0) + 1)));
            const top = Object.entries(topics)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([t]) => t);
            return (
              <Link key={name} to={`/department/${encodeURIComponent(name)}`} className="dept-card">
                <div className="dept-card-name">{name}</div>
                <div className="dept-card-count">
                  {people.length} faculty
                </div>
                {top.length > 0 && <div className="dept-card-topics">{top.join(' · ')}</div>}
              </Link>
            );
          })}
        </div>
      </Section>
    </>
  );
}

/* ---------------------------------------------------------- Detail page */

export function DepartmentDetail() {
  const { report } = useReport();
  const { name } = useParams();
  const dept = decodeURIComponent(name || '');
  const all = report?.professor_research_interest_database?.professors || [];

  const dbDepts = useMemo(
    () => [...new Set(all.map((p) => (p.Department || '').trim()).filter(Boolean))],
    [all]
  );
  // Resolve short/chart names like "Civil" or "CE" to the canonical DB value
  // ("Department of Civil Engineering") so faculty filtering never misses.
  const canonical = matchDbDept(dept, dbDepts) || dept;
  const canonicalKey = dkey(canonical);
  const people = useMemo(
    () => (canonicalKey ? all.filter((p) => dkey(p.Department) === canonicalKey) : []),
    [all, canonicalKey]
  );

  if (!report) return null;

  const impact = matchDept(canonical, report.research_impact_across_departments?.data_points || []);
  const faculty = matchDept(canonical, report.faculty_size_citation_averages?.data_points || []);
  const volume = matchDept(canonical, report.research_excellence_volume_voice?.data_points || []);
  const hvsq = matchDept(canonical, report.h_index_vs_qs_rankings?.data_points || []);
  const funding = matchDept(canonical, report.funded_research_by_department?.data_points || []);
  const hcmp = matchDept(canonical, report.h_index_comparison_department_wise?.data_points || []);

  const topics = {};
  people.forEach((p) => splitTopics(p).forEach((t) => (topics[t] = (topics[t] || 0) + 1)));
  const topTopics = Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 12);

  const kpis = [
    people.length > 0 && { label: 'Faculty in database', value: fmt(people.length) },
    impact && { label: 'Total citations', value: fmt(impact.citations) },
    volume && { label: 'Publications', value: fmt(volume.publications) },
    (volume?.h_index || hvsq?.h_index) && { label: 'h-index', value: fmt(volume?.h_index || hvsq?.h_index) },
    funding && { label: 'Funding share', value: `${funding.percentage}%` }
  ].filter(Boolean);

  const statRows = [
    impact && { Measure: 'Citations (vs Crossref)', Value: `${fmt(impact.citations)} citations (Crossref: ${fmt(impact.crossref_citations)})`, Source: 'Research impact' },
    faculty && { Measure: 'Average citations per faculty', Value: fmt(faculty.average_citations_per_faculty), Source: 'Faculty averages' },
    volume && { Measure: 'Publications / h-index', Value: `${fmt(volume.publications)} / ${fmt(volume.h_index)}`, Source: 'Volume vs voice' },
    hvsq && { Measure: 'QS rank / h-index', Value: `${fmt(hvsq.qs_ranking)} / ${fmt(hvsq.h_index)}`, Source: 'H-index vs QS' },
    funding && { Measure: 'Share of funded research', Value: `${funding.percentage}%`, Source: 'Funding' },
    hcmp && { Measure: `h-index vs peers (IITB ${hcmp['IIT Bombay']}, IITD ${hcmp['IIT Delhi']}, IISc ${hcmp['IISc']})`, Value: String(hcmp['IIT Bombay']), Source: 'H-index comparison' }
  ].filter(Boolean);

  return (
    <>
      <PageIntro
        title={dept}
        accent="department profile"
        eyebrow={`Departments · ${people.length} faculty in database`}
      >
        Faculty and research topics from the professor database, combined with this department's citation
        impact, publication volume and funding figures wherever they appear in the report.
      </PageIntro>

      {kpis.length > 0 && (
        <div className="kpi-grid">
          {kpis.map((k) => (
            <KPI key={k.label} value={k.value} label={k.label} />
          ))}
        </div>
      )}

      {statRows.length > 0 && (
        <Section title="Department statistics" note="Matched across the report's department-wise datasets.">
          <Card>
            <DataTable headers={['Measure', 'Value', 'Source']} rows={statRows} />
          </Card>
        </Section>
      )}

      <Section
        title="Faculty"
        note={`${people.length} professor${people.length === 1 ? '' : 's'} listed - ${topTopics.length ? `top topics: ${topTopics.slice(0, 5).map(([t]) => t).join(', ')}` : 'no topic tags'}.`}
      >
        <Card>
          {people.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
              No faculty records for this department in the database.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Topic</th>
                    <th>Research interest</th>
                  </tr>
                </thead>
                <tbody>
                  {people.slice(0, 15).map((p) => (
                    <tr key={p.Expert_ID || p.Name}>
                      <td>
                        {p.Profile_URL ? (
                          <a className="prof-link" href={p.Profile_URL} target="_blank" rel="noreferrer">
                            <strong>{p.Name}</strong>
                          </a>
                        ) : (
                          <strong>{p.Name}</strong>
                        )}
                      </td>
                      <td>{p.Designation}</td>
                      <td>{p.Topic}</td>
                      <td style={{ maxWidth: 340 }}>{p.Research_Interest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {people.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <Link className="btn" to={`/professors?dept=${encodeURIComponent(canonical)}`}>
                View all {people.length} professors →
              </Link>
            </div>
          )}
        </Card>
      </Section>

      <Section title="Research topics" note="Topic tags across this department's faculty (frequency ranked).">
        <Card>
          {topTopics.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)', margin: 0 }}>No topic tags available.</p>
          ) : (
            <div className="chips">
              {topTopics.map(([t, n]) => (
                <span key={t} className="chip" title={`${n} professor${n > 1 ? 's' : ''}`}>
                  {t} ({n})
                </span>
              ))}
            </div>
          )}
        </Card>
      </Section>
    </>
  );
}
