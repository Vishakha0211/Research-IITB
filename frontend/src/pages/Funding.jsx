import { useNavigate } from 'react-router-dom';
import { useReport } from '../context/ReportContext';
import { Section, Card, Findings, Callout, PageIntro, DataDetails } from '../components/ui';
import { BarChart, PieChart } from '../components/charts';

export default function Funding() {
  const { report } = useReport();
  const navigate = useNavigate();
  if (!report) return null;

  const byDept = report.funded_research_by_department || {};
  const agencies = report.top_funding_agencies || {};
  const insights = agencies.key_insights || {};
  const byType = report.funding_agency_type_breakdown || {};
  const typeInsights = byType.key_insights || {};
  const internal = byType.internal_funding || {};
  const goDept = (label) => navigate(`/department/${encodeURIComponent(label)}`);

  return (
    <>
      <PageIntro title="Research funding." accent="Where the money goes." eyebrow="Grants · Agencies · Departments">
        How funded research is distributed across departments, which agencies fund the most work, what each type of
        funding agency contributed in FY 2024-25, and how the Institute's own internal R&D fund is allocated.
      </PageIntro>

      <Section title={byDept.title} note={`${byDept.context} - click a slice to open that department's page.`}>
        <div className="grid-2">
          <Card title="Share of funded research by department">
            <PieChart
              doughnut={false}
              labels={byDept.data_points?.map((d) => d.department) || []}
              data={byDept.data_points?.map((d) => d.percentage) || []}
              onPick={goDept}
            />
            <DataDetails
              headers={['Department', 'Share (%)']}
              rows={(byDept.data_points || []).map((d) => ({ Department: d.department, 'Share (%)': d.percentage }))}
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
            <DataDetails
              headers={['Agency', 'Projects funded']}
              rows={(agencies.data_points || []).map((d) => ({ Agency: d.agency, 'Projects funded': d.count }))}
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

      <Section title={byType.title} note={byType.context}>
        <div className="grid-2">
          <Card title="Share of R&D receipts by type of agency">
            <BarChart
              height={340}
              labels={byType.data_points?.map((d) => d.agency_type) || []}
              data={byType.data_points?.map((d) => d.share_pct) || []}
              label="Share (%)"
              colors="#0d86a6"
            />
            <DataDetails
              headers={['Agency type', 'Share (%)', 'Amount (Rs crore)']}
              rows={(byType.data_points || []).map((d) => ({
                'Agency type': d.agency_type,
                'Share (%)': d.share_pct,
                'Amount (Rs crore)': d.amount_cr
              }))}
            />
          </Card>
          <Card title="Key insights">
            <Findings items={Object.values(typeInsights)} tone="gold" />
            <div className="card-note" style={{ marginTop: 12 }}>
              External grants received for R&D in FY 2024-25 (Rs crore)
            </div>
            <DataDetails
              headers={['Component', 'Rs crore']}
              rows={(byType.receipts_breakdown || []).map((d) => ({
                Component: d.item,
                'Rs crore': d.amount_cr
              }))}
            />
          </Card>
        </div>
      </Section>

      <Section title="Where the money comes from" note={byType.source}>
        <div className="grid-2">
          <Card title="Largest sponsored projects initiated in FY 2024-25">
            <DataDetails
              headers={['Project', 'Funding agency', 'Rs crore', 'Years']}
              rows={(byType.major_sponsored_projects_fy2024_25 || []).map((p) => ({
                Project: p.project,
                'Funding agency': p.agency,
                'Rs crore': p.amount_cr,
                Years: p.duration_years
              }))}
            />
          </Card>
          <Card title="Major DST awards at IIT Bombay">
            <DataDetails
              headers={['Project', 'Rs crore', 'Source']}
              rows={(byType.dst_awards || []).map((p) => ({
                Project: p.project,
                'Rs crore': p.amount_cr,
                Source: p.source
              }))}
            />
            <Callout>
              <strong>How the amounts are derived:</strong> the rupee value against each agency type applies the
              percentage published in Figure 1 of the Annual Report to the Rs {byType.receipts_base_cr} crore received
              from sponsored and consultancy projects.
            </Callout>
          </Card>
        </div>
      </Section>

      <Section
        title={internal.title}
        note={`The Institute released Rs ${internal.total_cr} crore from its own funds for R&D in FY 2024-25, of which Rs ${internal.seed_grant_cr} crore was seed and augmented seed grant for new faculty (Annual Report 2024-25, Figure 2).`}
      >
        <div className="grid-2">
          <Card title="Internal R&D funds by purpose">
            <PieChart
              doughnut
              labels={internal.data_points?.map((d) => d.purpose) || []}
              data={internal.data_points?.map((d) => d.share_pct) || []}
            />
            <DataDetails
              headers={['Purpose', 'Share (%)']}
              rows={(internal.data_points || []).map((d) => ({
                Purpose: d.purpose,
                'Share (%)': d.share_pct
              }))}
            />
          </Card>
          <Card title="Inside the 11% Other slice">
            <PieChart
              doughnut
              labels={internal.other_breakdown?.map((d) => d.purpose) || []}
              data={internal.other_breakdown?.map((d) => d.share_pct) || []}
            />
            <DataDetails
              headers={['Purpose', 'Share (%)']}
              rows={(internal.other_breakdown || []).map((d) => ({
                Purpose: d.purpose,
                'Share (%)': d.share_pct
              }))}
            />
            <Callout>
              RDF is the Researcher Development Fund, FRD the faculty research development grant and TAP SG the TAP
              seed grant. The four entries above account for the full 11% Other slice of the main chart.
            </Callout>
          </Card>
        </div>
      </Section>
    </>
  );
}
