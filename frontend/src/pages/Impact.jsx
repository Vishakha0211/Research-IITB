import { useReport } from '../context/ReportContext';
import { Section, Card, Findings, Callout, fmt, PageIntro } from '../components/ui';
import { GroupedBarChart, BarChart, ComboChart } from '../components/charts';

export default function Impact() {
  const { report } = useReport();
  if (!report) return null;

  const impact = report.research_impact_across_departments || {};
  const faculty = report.faculty_size_citation_averages || {};
  const access = report.access_models_scholarly_publishing || {};
  const oa = report.open_access_citation_advantage || {};
  const instCites = report.research_impact_across_top_indian_institutes || {};

  return (
    <>
      <PageIntro title="Research impact." accent="Citations, access, reach." eyebrow="Research impact · Citations & open access">
        Citation analysis across IIT Bombay departments, open-access advantage, and how the institute compares with other top Indian institutions.
      </PageIntro>

      <Section title="Research Impact Across Departments" note={impact.context}>
        <Card title={impact.title || 'Total citations vs Crossref citations by department'}>
          <GroupedBarChart
            horizontal
            height={520}
            labels={impact.data_points?.map((d) => d.department) || []}
            datasets={[
              { label: 'Citations', data: impact.data_points?.map((d) => d.citations) || [], color: '#0d86a6' },
              { label: 'Crossref Citations', data: impact.data_points?.map((d) => d.crossref_citations) || [], color: '#0d86a6' }
            ]}
          />
        </Card>
      </Section>

      <Section
        title="Faculty Size & Citation Averages"
        note={`${faculty.context || ''} - ${faculty.correlation_description || ''}`}
      >
        <div className="grid-2">
          <Card title="Average citations per faculty by department">
            <ComboChart
              labels={faculty.data_points?.map((d) => d.department) || []}
              barData={faculty.data_points?.map((d) => d.average_citations_per_faculty) || []}
              lineData={faculty.data_points?.map((d) => d.number_of_faculty_x100 * 100) || []}
              barLabel="Avg citations / faculty"
              lineLabel="Faculty count (×100)"
            />
          </Card>
          <Card title="Key findings">
            <Findings
              items={[
                `Highest research impact: ${faculty.highest_research_impact_department || '-'}`,
                ...(faculty.largest_departments || []).map((d) => `Largest department: ${d.name} (${d.faculty_count} faculty)`),
                faculty.correlation_description
              ]}
            />
            <Callout>
              <strong>Correlation coefficient:</strong> {faculty.correlation_coefficient}
            </Callout>
          </Card>
        </div>
      </Section>

      <Section title="Access Models in Scholarly Publishing" note={access.context}>
        <div className="grid-2">
          <Card title="Publication access breakdown">
            <BarChart
              labels={access.data_points?.map((d) => d.access_type) || []}
              data={access.data_points?.map((d) => d.count) || []}
              label="Count"
              colors={['#17222e', '#0d86a6', '#4aa3b8', '#f5b301']}
            />
          </Card>
          <Card title={oa.title}>
            <BarChart
              labels={oa.data_points?.map((d) => d.access_type) || []}
              data={oa.data_points?.map((d) => d.average_citations) || []}
              label="Average citations"
              colors={['#0d86a6', '#94a3b8']}
            />
            <Findings
              items={[
                oa.key_finding,
                `${fmt(oa.total_articles_analyzed)} articles analyzed - ${fmt(oa.open_access_articles)} open access vs ${fmt(oa.not_open_access_articles)} non-open-access.`
              ]}
              tone="gold"
            />
          </Card>
        </div>
      </Section>

      <Section title="Research Impact Across Top Indian Institutes" note={instCites.context}>
        <Card title={instCites.title}>
          <BarChart
            labels={instCites.data_points?.map((d) => d.institution) || []}
            data={instCites.data_points?.map((d) => d.citations) || []}
            label="Citations"
            colors={(instCites.data_points || []).map((d) =>
              d.institution === 'IIT Bombay' ? '#0d86a6' : '#17222e'
            )}
          />
          <Callout>{instCites.key_finding}</Callout>
        </Card>
      </Section>
    </>
  );
}
