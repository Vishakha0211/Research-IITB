import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useReport } from './context/ReportContext';
import Dashboard from './pages/Dashboard';
import Impact from './pages/Impact';
import Excellence from './pages/Excellence';
import Publications from './pages/Publications';
import Topics from './pages/Topics';
import Collaborations from './pages/Collaborations';
import Funding from './pages/Funding';
import Professors from './pages/Professors';
import Admin from './pages/Admin';

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/impact', label: 'Research Impact' },
  { to: '/excellence', label: 'Rankings' },
  { to: '/publications', label: 'Publications' },
  { to: '/topics', label: 'Topics' },
  { to: '/collaborations', label: 'Collaborations' },
  { to: '/funding', label: 'Funding' },
  { to: '/professors', label: 'Professors' }
];

const stat = (report, metric) => {
  const s = report?.general_statistics?.find((x) => x.metric === metric)?.value;
  return typeof s === 'number' ? s.toLocaleString('en-US') : s;
};

export default function App() {
  const { report, loading, error, reload } = useReport();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="boot">
        <div className="spinner" />
        <p>Loading research report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="boot">
        <p className="error-text">Failed to load report data: {error}</p>
        <button className="btn" onClick={reload}>Retry</button>
      </div>
    );
  }

  return (
    <div className="layout">
      <div className="topstrip">
        <span>
          <strong>IIT Bombay</strong>
          <span className="dot">●</span>
          {report?.meta?.report_date_range} of research data
          <span className="dot">●</span>
          QS World Rank <strong>#{stat(report, 'QS World Ranking')}</strong>
        </span>
        <span className="topstrip-stats">
          Publications <strong>{stat(report, 'Publications')}</strong>
          <span className="dot">·</span>
          Citations <strong>{stat(report, 'Citations')}</strong>
          <span className="dot">·</span>
          Patents <strong>{stat(report, 'Patents')}</strong>
        </span>
      </div>

      <header className="site-header">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">IITB</span>
          <span>
            RESEARCH <b>@ IITB</b>
          </span>
        </Link>

        <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Menu">
          ☰
        </button>

        <nav className={`site-nav ${open ? 'open' : ''}`}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-team">
          <span className="header-team-name">DAV Team</span>
          <img className="header-logo" src="/header-logo.png" alt="DAV" />
        </div>

        <Link to="/admin" className="btn header-cta">
          Update Data
        </Link>
      </header>

      <main className="content" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/excellence" element={<Excellence />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/collaborations" element={<Collaborations />} />
          <Route path="/funding" element={<Funding />} />
          <Route path="/professors" element={<Professors />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <span>
          <strong>RESEARCH @ IITB</strong> — dynamic research impact portal
        </span>
        <span>All charts read live from backend data · updatable via the Update Data page</span>
      </footer>
    </div>
  );
}
