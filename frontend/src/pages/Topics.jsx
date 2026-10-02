import { useState } from 'react';
import { useReport } from '../context/ReportContext';
import { Section, Card, Callout, PageIntro } from '../components/ui';
import { WordCloud, RadarChart } from '../components/charts';
import YearFilter from '../components/YearFilter';

export default function Topics() {
  const { report } = useReport();
  const keyTopics = report?.key_research_topics_yearly || [];
  const fundedTopics = report?.top_funded_research_topics_yearly || [];
  const [keyYear, setKeyYear] = useState(0);
  const [fundedYear, setFundedYear] = useState(0);
  const [range, setRange] = useState({ from: null, to: null });

  if (!report) return null;

  const allYears = [...new Set([...keyTopics, ...fundedTopics].map((t) => t.year))].sort((a, b) => a - b);
  const from = range.from ?? allYears[0];
  const to = range.to ?? allYears[allYears.length - 1];
  const keyList = keyTopics.filter((t) => t.year >= from && t.year <= to);
  const fundedList = fundedTopics.filter((t) => t.year >= from && t.year <= to);

  const kyIdx = Math.min(keyYear, keyList.length - 1);
  const fyIdx = Math.min(fundedYear, fundedList.length - 1);
  const ky = keyList[kyIdx];
  const fy = fundedList[fyIdx];

  return (
    <>
      <PageIntro title="Key research topics." accent="2020 - 2026." eyebrow="Trends · Year-by-year evolution">
        The evolving landscape of research themes across seven years - from foundational science through the pandemic response to the AI boom - plus the topics that attracted the most research funding each year.
      </PageIntro>

      <div style={{ marginBottom: 4 }}>
        <YearFilter years={allYears} from={from} to={to} onChange={setRange} label="Topics" />
      </div>

      <Section
        title="Key Research Topics by Year"
        note="Bubble/word-cloud view: larger terms appeared more prominently in that year's research output."
      >
        <div className="tabs">
          {keyList.map((t, i) => (
            <button
              key={t.year}
              className={`tab ${i === kyIdx ? 'active' : ''}`}
              onClick={() => setKeyYear(i)}
            >
              {t.year}
            </button>
          ))}
        </div>
        {!ky && (
          <Card title="No years in range">
            <Callout>No key-topic data for {from}-{to}. Widen the year range above.</Callout>
          </Card>
        )}
        {ky && (
          <Card title={ky.title}>
            <WordCloud topics={ky.topics || []} valueKey="size" />
            {ky.summary && (
              <Callout><strong>{ky.year} summary:</strong> {ky.summary}</Callout>
            )}
          </Card>
        )}
      </Section>

      <Section
        title="Top Funded Research Topics by Year"
        note="Radar view of the research themes that received the most funding in each year."
      >
        <div className="tabs">
          {fundedList.map((t, i) => (
            <button
              key={t.year}
              className={`tab ${i === fyIdx ? 'active' : ''}`}
              onClick={() => setFundedYear(i)}
            >
              {t.year}
            </button>
          ))}
        </div>
        {!fy && (
          <Card title="No years in range">
            <Callout>No funded-topic data for {from}-{to}. Widen the year range above.</Callout>
          </Card>
        )}
        {fy && (
        <div className="grid-2">
          <Card title={fy.title}>
            <RadarChart
              labels={fy.topics?.map((t) => t.topic) || []}
              data={fy.topics?.map((t) => t.value) || []}
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
                  {[...(fy.topics || [])]
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
            {fy.summary && (
              <Callout><strong>{fy.year} summary:</strong> {fy.summary}</Callout>
            )}
          </Card>
        </div>
        )}
      </Section>
    </>
  );
}
