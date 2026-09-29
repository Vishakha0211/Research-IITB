export default function YearFilter({ years, from, to, onChange, label = 'Year range' }) {
  if (!years || years.length < 2) return null;
  const setF = (v) => onChange({ from: Math.min(v, to), to });
  const setT = (v) => onChange({ from, to: Math.max(v, from) });
  return (
    <div className="year-filter" role="group" aria-label={label}>
      <span className="year-filter-label">{label}</span>
      <select className="select" value={from} onChange={(e) => setF(Number(e.target.value))} aria-label="From year">
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <span className="year-filter-sep">to</span>
      <select className="select" value={to} onChange={(e) => setT(Number(e.target.value))} aria-label="To year">
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      {(from !== years[0] || to !== years[years.length - 1]) && (
        <button
          type="button"
          className="btn chip"
          onClick={() => onChange({ from: years[0], to: years[years.length - 1] })}
        >
          Reset
        </button>
      )}
    </div>
  );
}
