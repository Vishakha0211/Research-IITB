import { useReport } from '../context/ReportContext';
import { Section, Card, Findings, Callout, DataTable, PageIntro } from '../components/ui';
import { ComboChart, MultiLineChart } from '../components/charts';

export default function Excellence() {
  const { report } = useReport();
  if (!report) return null;

  const volume = report.research_excellence_volume_voice || {};
  const hvsq = report.h_index_vs_qs_rankings || {};
  const table = report.qs_vs_nirf_rankings || {};
  const hcmp = report.h_index_comparison_department_wise || {};

  const tableHeaders = table.headers || ['Institution', 'QS World Ranking (2025)', 'NIRF Ranking (Overall, 2025)'];

  return (
    <>
      <PageIntro title="Rankings & excellence." accent="Volume vs voice." eyebrow="Benchmarks · QS · NIRF · H-index">
        Volume versus voice across departments, H-index vs QS rankings, QS/NIRF institute comparisons, and a department-wise H-index benchmark against peer institutes.
      </PageIntro>

      <Section title="What Defines Research Excellence: Volume or Voice?" note={volume.context}>
        <div className="grid-2">
          <Card title="Publications (bars) vs h-index (line) by department">
            <ComboChart
              labels={volume.data_points?.map((d) => d.department) || []}
              barData={volume.data_points?.map((d) => d.publications) || []}
              lineData={volume.data_points?.map((d) => d.h_index) || []}
              barLabel="Publications"
              lineLabel="h-index"
            />
          </Card>
          <Card title="Key findings">
            <Findings
              items={[
                `Loudest voice: ${volume.loudest_voice_department}`,
                `Highest volume: ${volume.highest_volume_department}`,
                ...(volume.y_axis_labels ? [`Y-axes: ${volume.y_axis_labels.join(' / ')}`] : [])
              ]}
              tone="gold"
            />
            <Callout>{volume.context}</Callout>
          </Card>
        </div>
      </Section>

      <Section title={hvsq.title || 'H-Index vs QS Rankings'} note={hvsq.context}>
        <div className="grid-2">
          <Card title="QS ranking (bars) vs h-index (line) by department">
            <ComboChart
              labels={hvsq.data_points?.map((d) => d.department) || []}
              barData={hvsq.data_points?.map((d) => d.qs_ranking) || []}
              lineData={hvsq.data_points?.map((d) => d.h_index) || []}
              barLabel="QS Ranking"
              lineLabel="h-index"
              barColor="#17222e"
              lineColor="#0d86a6"
            />
          </Card>
          <Card title="Analysis">
            <Findings
              items={[
                `Top performer: ${hvsq.top_performer}`,
                `Correlation coefficient: ${hvsq.correlation_coefficient} (negative — lower QS rank number associates with higher h-index)`,
                ...(hvsq.outliers || []).map((o) => `Outlier: ${o}`),
                ...(hvsq.other_strong_performers || []).map((p) => `Strong performer: ${p}`)
              ]}
            />
          </Card>
        </div>
      </Section>

      <Section title="H-Index Comparison — Department Wise" note={hcmp.context}>
        <Card title={hcmp.title}>
          <MultiLineChart
            height={460}
            labels={hcmp.data_points?.map((d) => d.department) || []}
            datasets={(hcmp.institutions || []).map((inst) => ({
              label: inst,
              data: hcmp.data_points?.map((d) => d[inst]) || []
            }))}
          />
          <Findings items={hcmp.key_findings} tone="navy" />
        </Card>
      </Section>

      <Section title={table.context || 'QS vs. NIRF Rankings'}>
        <Card>
          <DataTable
            headers={tableHeaders}
            rows={table.data || []}
            renderCell={(h, row, i) => {
              if (h === tableHeaders[0]) return <strong>{row[h]}</strong>;
              if (h.includes('QS')) return <span className="rank-badge gold">{row[h]}</span>;
              return <span className="rank-badge">{row[h]}</span>;
            }}
          />
        </Card>
      </Section>
    </>
  );
}
