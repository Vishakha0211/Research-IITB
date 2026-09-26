import { useReport } from '../context/ReportContext';
import { Section, Card, Findings, Callout, PageIntro } from '../components/ui';
import { BarChart, PieChart } from '../components/charts';

export default function Funding() {
  const { report } = useReport();
  if (!report) return null;

  const byDept = report.funded_research_by_department || {};
  const agencies = report.top_funding_agencies || {};
  const insights = agencies.key_insights || {};

  return (
    <>
      <PageIntro title="Research funding." accent="Where the money goes." eyebrow="Grants · Agencies · Departments">
        How funded research is distributed across departments, which agencies fund the most work, and where the strategic funding gaps lie.
      </PageIntro>

      <Section title={byDept.title} note={byDept.context}>
        <div className="grid-2">
          <Card title="Share of funded research by department">
            <PieChart
              doughnut={false}
              labels={byDept.data_points?.map((d) => d.department) || []}
              data={byDept.data_points?.map((d) => d.percentage) || []}
            />
          </Card>
          <Card title="Key findings">
            <Findings
              items={
                byDept.key_findings
                  ? [
                      `Top funded: ${byDept.key_findings.top_funded}`,
                      `Mid tier: ${byDept.key_findings.mid_tier}`,
                      `Lowest funded: ${byDept.key_findings.lowest_funded}`
                    ]
                  : []
              }
              tone="gold"
            />
          </Card>
        </div>
      </Section>

      <Section title={agencies.title} note={agencies.context}>
        <div className="grid-2">
          <Card title="Funding counts by agency">
            <BarChart
              horizontal
              height={400}
              labels={agencies.data_points?.map((d) => d.agency) || []}
              data={agencies.data_points?.map((d) => d.count) || []}
              label="Projects funded"
              colors="#0d86a6"
            />
          </Card>
          <Card title="Key insights">
            <Findings
              items={[
                insights.dominance_of_dst,
                insights.dst_impact,
                insights.next_tier,
                insights.csir_role,
                insights.ugc_dbt_role,
                insights.overall
              ].filter(Boolean)}
              tone="navy"
            />
            <Callout>
              Visit the <strong>Key Research Topics</strong> page for yearly top funded topics (radar charts), or use <strong>Update Data</strong> to refresh these figures.
            </Callout>
          </Card>
        </div>
      </Section>
    </>
  );
}
