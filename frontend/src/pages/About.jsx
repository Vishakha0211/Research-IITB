import { PageIntro } from '../components/ui';

const HEADS = [
  { name: 'Rakshana Sundaram', role: 'Head', img: '/team/Rakshana.jpg' },
  { name: 'Shrestha Khatri', role: 'Head', img: '/team/Shrestha.jpg' }
];

const MEMBERS = [
  { name: 'Aryan Chauhan', role: 'Data Analyst', img: '/team/Aryan.jpg' },
  { name: 'Ayush Deshmukh', role: 'Data Analyst', img: '/team/Ayush.jpg' },
  { name: 'Vedant Iyengar', role: 'Data Analyst', img: '/team/Vedant.jpg' },
  { name: 'Harsh Prajapat', role: 'Data Analyst', img: '/team/Harsh.jpg' },
  { name: 'Ummehani Chakkiwala', role: 'Data Analyst', img: '/team/Ummehani.jpg', top: true },
  { name: 'Vishakha Arekar', role: 'Data Analyst', img: '/team/Vishakha.jpg' },
  { name: 'Zubair Al-Mamoon', role: 'Data Analyst', img: '/team/Zubair.jpg' }
];

function MemberCard({ m }) {
  return (
    <div className="member-card">
      <div className="member-photo">
        <img src={m.img} alt={m.name} style={m.top ? { objectPosition: 'top' } : undefined} />
      </div>
      <div className="member-name">{m.name}</div>
      <div className="member-role">{m.role}</div>
    </div>
  );
}

export default function About() {
  return (
    <div>
      <PageIntro title="About the" accent="DAV Team" eyebrow="Who we are">
        We are the <strong>Data Analytics and Visualization (DAV) Team</strong>, a part of the
        Undergraduate Academic Council (UGAC) at IIT Bombay. Since its inception in 2018, the DAV
        Team is an interdisciplinary group dedicated to help students make better academic
        decisions. We build tools, dashboards, and reports that make information about courses,
        grading trends, semester planning, and other academic opportunities easier to understand
        and use. We also work with academic and institute bodies to analyse institutional data and
        develop solutions that benefit the student community. At the same time, the team offers
        students the opportunity to work on real-world data science projects, learn practical
        skills, and create resources that make a meaningful difference to campus life.
      </PageIntro>

      <div className="team-category">
        <div className="team-label">Team Heads</div>
        <div className="members-grid">
          {HEADS.map((m) => (
            <MemberCard key={m.name} m={m} />
          ))}
        </div>
      </div>

      <div className="team-category">
        <div className="team-label">Team Members</div>
        <div className="members-grid">
          {MEMBERS.map((m) => (
            <MemberCard key={m.name} m={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
