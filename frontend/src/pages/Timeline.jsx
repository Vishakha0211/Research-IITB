import { useReport } from '../context/ReportContext';
import { PageIntro, KPI, fmt } from '../components/ui';

export default function Timeline() {
  const { report } = useReport();
  if (!report) return null;

  const years = report.key_research_topics_yearly || [];
  const funded = report.top_funded_research_topics_yearly || [];
  const authorPts = report.changes_in_publication_author_counts?.data_points || [];
  const stats = report.general_statistics || [];

  const authorByYear = {};
  authorPts.forEach((d) => {
    if (Number.isInteger(d.year)) authorByYear[d.year] = d;
  });

  const yearCards = years.map((y) => {
    const f = funded.find((x) => x.year === y.year);
    const a = authorByYear[y.year];
    return {
      year: y.year,
      topics: [...(y.topics || [])].sort((x, z) => z.size - x.size).slice(0, 6),
      funded: [...(f?.topics || [])].sort((x, z) => z.value - x.value).slice(0, 5),
      authorMix: a,
      summary: y.summary
    };
  });

  return (
    <>
      <PageIntro
        title="Seven years of research."
        accent="One timeline."
        eyebrow={`Timeline · ${report.meta?.report_date_range || '2020 - 2026'}`}
      >
        The story of IIT Bombay's research output year by year - the ideas that defined each year, the
        topics that attracted funding, and how the shape of authorship evolved along the way.
      </PageIntro>

      <div className="kpi-grid">
        {stats.slice(0, 6).map((s) => (
          <KPI key={s.metric} value={typeof s.value === 'number' ? fmt(s.value) : s.value} label={s.metric} />
        ))}
      </div>

      <div className="timeline">
        {yearCards.map((y, i) => (
          <div className={`timeline-node ${i % 2 ? 'right' : 'left'}`} key={y.year}>
            <div className="timeline-year">{y.year}</div>
            <div className="timeline-card">
              <div className="timeline-block">
                <div className="timeline-label">Ideas of the year</div>
                <div className="chips">
                  {y.topics.map((t) => (
                    <span key={t.topic} className="chip" title={`weight ${t.size}`}>
                      {t.topic}
                    </span>
                  ))}
                </div>
              </div>

              {y.funded.length > 0 && (
                <div className="timeline-block">
                  <div className="timeline-label">Where the funding went</div>
                  <div className="chips">
                    {y.funded.map((t) => (
                      <span key={t.topic} className="chip funding">
                        {t.topic} ({t.value})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {y.authorMix && (
                <div className="timeline-block">
                  <div className="timeline-label">Who wrote the papers</div>
                  <div className="timeline-mix">
                    <span>Single author {Math.round(y.authorMix.single_author * 100)}%</span>
                    <span>2-5 authors {Math.round(y.authorMix['2_5_authors'] * 100)}%</span>
                    <span>6+ authors {Math.round(y.authorMix['6_plus_authors'] * 100)}%</span>
                  </div>
                </div>
              )}

              {y.summary && <p className="timeline-summary">{y.summary}</p>}
            </div>
          </div>
        ))}

        <div className="timeline-node left">
          <div className="timeline-year">Now</div>
          <div className="timeline-card">
            <div className="timeline-label">Where IITB stands</div>
            <div className="chips">
              {stats.map((s) => (
                <span key={s.metric} className="chip">
                  {s.metric}: {typeof s.value === 'number' ? fmt(s.value) : s.value}
                </span>
              ))}
            </div>
            <p className="timeline-summary">{report.meta?.report_date_range} of research at a glance - see the Dashboard for the full picture or the Topics page for each year in detail.</p>
            {(report.recommendations || []).slice(0, 2).map((r, i) => (
              <p className="timeline-summary" key={i}>
                <strong>Next:</strong> {r}
              </p>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
