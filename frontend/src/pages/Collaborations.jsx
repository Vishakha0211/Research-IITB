import { useReport } from '../context/ReportContext';
import { Section, Card, Findings, Callout, PageIntro } from '../components/ui';
import { BarChart, PieChart, Treemap } from '../components/charts';

export default function Collaborations() {
  const { report } = useReport();
  if (!report) return null;

  const breakdown = report.iit_bombay_collaborations_breakdown || {};
  const domestic = report.iit_bombay_domestic_network || {};
  const globalP = report.iit_bombay_global_reach_university_partners || {};
  const countries = report.global_reach_countries_collaborating || {};

  return (
    <>
      <PageIntro title="Collaboration network." accent="Domestic & global." eyebrow="Partners · Institutions & countries">
        IIT Bombay's research partnerships - the domestic vs international split, the ten key national institutions, top global university partners, and the worldwide reach by country.
      </PageIntro>

      <Section title={breakdown.title} note={breakdown.context}>
        <div className="grid-2">
          <Card title="Collaboration split">
            <PieChart
              labels={breakdown.data_points?.map((d) => d.collaboration_type) || []}
              data={breakdown.data_points?.map((d) => d.percentage) || []}
              colors={['#0d86a6', '#17222e', '#f5b301']}
            />
          </Card>
          <Card title="Overview">
            <Callout>{breakdown.overall_statement}</Callout>
            <Findings
              items={(breakdown.data_points || []).map(
                (d) => `${d.collaboration_type}: ${d.percentage}%`
              )}
              tone="navy"
            />
          </Card>
        </div>
      </Section>

      <Section title={domestic.title} note={domestic.context}>
        <Card title="Domestic collaborators by number of joint publications">
          <BarChart
            horizontal
            height={380}
            labels={domestic.data_points?.map((d) => d.institution) || []}
            data={domestic.data_points?.map((d) => d.collaborations) || []}
            label="Collaborations"
            colors="#0d86a6"
          />
          <Callout><strong>Key finding:</strong> {domestic.key_finding}</Callout>
        </Card>
      </Section>

      <Section title={globalP.title} note={globalP.context}>
        <Card title="International university partners by number of joint publications">
          <BarChart
            horizontal
            height={420}
            labels={globalP.data_points?.map((d) => d.university) || []}
            data={globalP.data_points?.map((d) => d.collaborations) || []}
            label="Collaborations"
            colors="#17222e"
          />
          <Callout><strong>Key finding:</strong> {globalP.key_finding}</Callout>
        </Card>
      </Section>

      <Section title={countries.title} note={countries.context}>
        <div className="grid-2">
          <Card title="Collaboration share by country (treemap)">
            <Treemap
              data={countries.data_points || []}
              labelKey="country"
              valueKey="proportion"
            />
          </Card>
          <Card title="Key finding">
            <Callout>{countries.key_finding}</Callout>
            <Findings
              items={(countries.data_points || [])
                .slice()
                .sort((a, b) => b.proportion - a.proportion)
                .map((d) => `${d.country}: ${Math.round(d.proportion * 100)}%`)}
              tone="gold"
            />
          </Card>
        </div>
      </Section>
    </>
  );
}
