import { useState } from 'react';
import { useReport } from '../context/ReportContext';
import { Section, Card, Callout, PageIntro } from '../components/ui';
import { WordCloud, RadarChart } from '../components/charts';

export default function Topics() {
  const { report } = useReport();
  const keyTopics = report?.key_research_topics_yearly || [];
  const fundedTopics = report?.top_funded_research_topics_yearly || [];
  const [keyYear, setKeyYear] = useState(0);
  const [fundedYear, setFundedYear] = useState(0);

  if (!report) return null;

  const ky = keyTopics[Math.min(keyYear, keyTopics.length - 1)];
  const fy = fundedTopics[Math.min(fundedYear, fundedTopics.length - 1)];

  return (
    <>
      <PageIntro title="Key research topics." accent="2020 - 2024." eyebrow="Trends · Five-year evolution">
        The evolving landscape of research themes across five years - from foundational science through the pandemic response to the AI boom - plus the topics that attracted the most research funding each year.
      </PageIntro>

      <Section
        title="Key Research Topics by Year"
        note="Bubble/word-cloud view: larger terms appeared more prominently in that year's research output."
      >
        <div className="tabs">
          {keyTopics.map((t, i) => (
            <button
              key={t.year}
              className={`tab ${i === keyYear ? 'active' : ''}`}
              onClick={() => setKeyYear(i)}
            >
              {t.year}
            </button>
          ))}
        </div>
        <Card title={ky?.title} note={`Page ${ky?.page}`}>
          <WordCloud topics={ky?.topics || []} valueKey="size" />
          {ky?.summary && (
            <Callout><strong>{ky.year} summary:</strong> {ky.summary}</Callout>
          )}
        </Card>
      </Section>

      <Section
        title="Top Funded Research Topics by Year"
        note="Radar view of the research themes that received the most funding in each year."
      >
        <div className="tabs">
          {fundedTopics.map((t, i) => (
            <button
              key={t.year}
              className={`tab ${i === fundedYear ? 'active' : ''}`}
              onClick={() => setFundedYear(i)}
            >
              {t.year}
            </button>
          ))}
        </div>
        <div className="grid-2">
          <Card title={fy?.title} note={`Page ${fy?.page}`}>
            <RadarChart
              labels={fy?.topics?.map((t) => t.topic) || []}
              data={fy?.topics?.map((t) => t.value) || []}
              label="Funding priority"
            />
          </Card>
          <Card title="Funded topics - ranked list">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr><th>#</th><th>Topic</th><th>Value</th></tr>
                </thead>
                <tbody>
                  {[...(fy?.topics || [])]
                    .sort((a, b) => b.value - a.value)
                    .map((t, i) => (
                      <tr key={t.topic}>
                        <td>{i + 1}</td>
                        <td style={{ textTransform: 'capitalize' }}>{t.topic}</td>
                        <td><strong>{t.value}</strong></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {fy?.summary && (
              <Callout><strong>{fy.year} summary:</strong> {fy.summary}</Callout>
            )}
          </Card>
        </div>
      </Section>
    </>
  );
}
