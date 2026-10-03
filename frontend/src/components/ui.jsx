import { useEffect, useMemo, useRef, useState } from 'react';

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Splits "1,142" / "2nd" / "134th" / "909,949" / "12.4%" into the number and
// whatever surrounds it, so the value can be counted up in place.
function splitNumber(value) {
  if (typeof value === 'number') {
    return {
      num: value,
      decimals: Number.isInteger(value) ? 0 : 1,
      grouped: Math.abs(value) >= 1000,
      pre: '',
      post: ''
    };
  }
  const text = String(value ?? '');
  const m = text.match(/^(.*?)(-?[\d][\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const digits = m[2].replace(/,/g, '');
  const num = Number(digits);
  if (!Number.isFinite(num)) return null;
  const dot = digits.indexOf('.');
  return {
    num,
    decimals: dot === -1 ? 0 : digits.length - dot - 1,
    grouped: m[2].includes(','),
    pre: m[1],
    post: m[3]
  };
}

function formatCount(n, parts) {
  const out = parts.decimals
    ? n.toFixed(parts.decimals)
    : parts.grouped
      ? Math.round(n).toLocaleString('en-US')
      : String(Math.round(n));
  return parts.pre + out + parts.post;
}

export function AnimatedValue({ value, duration = 1400 }) {
  const ref = useRef(null);
  const parts = useMemo(() => splitNumber(value), [value]);
  const finalText = parts ? formatCount(parts.num, parts) : String(value ?? '');
  const [text, setText] = useState(() =>
    parts && !reducedMotion() ? formatCount(0, parts) : finalText
  );

  useEffect(() => {
    if (!parts || reducedMotion()) {
      setText(finalText);
      return undefined;
    }
    const el = ref.current;
    let raf = 0;
    let timer = 0;
    const start = () => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setText(formatCount(parts.num * eased, parts));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (!el || typeof IntersectionObserver === 'undefined') {
      start();
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          clearTimeout(timer);
          start();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    // safety net so a value that never intersects still lands on the real number
    timer = setTimeout(() => {
      io.disconnect();
      start();
    }, 600);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [parts, finalText, duration]);

  return (
    <span ref={ref} className="animated-value" data-count={finalText} aria-label={finalText}>
      {text}
    </span>
  );
}

export function PageIntro({ title, accent, eyebrow = 'IIT Bombay · Seven years of research', eyebrowClass = '', children }) {
  return (
    <div className="page-intro">
      <div className={`eyebrow ${eyebrowClass}`}>{eyebrow}</div>
      <h2>
        {title} {accent && <span className="accent">{accent}</span>}
      </h2>
      <p>{children}</p>
    </div>
  );
}

export function Section({ title, note, actions, children }) {
  return (
    <section className="section">
      <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2>{title}</h2>
          {note && <p>{note}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Card({ title, note, children }) {
  return (
    <div className="card">
      {title && <div className="card-title">{title}</div>}
      {note && <div className="card-note">{note}</div>}
      {children}
    </div>
  );
}

export function Findings({ items, tone = 'accent' }) {
  if (!items || items.length === 0) return null;
  const tones = { accent: '', gold: 'gold', navy: 'navy' };
  return (
    <ul className="findings">
      {items.map((f, i) => (
        <li key={i} className={tones[tone] || ''}>
          {typeof f === 'string' ? f : f.text || JSON.stringify(f)}
        </li>
      ))}
    </ul>
  );
}

export function Callout({ children }) {
  return <div className="callout">{children}</div>;
}

export function KPI({ value, label }) {
  return (
    <div className="kpi">
      <div className="value"><AnimatedValue value={value} /></div>
      <div className="label">{label}</div>
    </div>
  );
}

export function Chips({ items }) {
  return (
    <div className="chips">
      {items.map((c, i) => (
        <span className="chip" key={i}>{c}</span>
      ))}
    </div>
  );
}

export function DataDetails({ title = 'View underlying data', rows, headers }) {
  const [open, setOpen] = useState(false);
  if (!rows || rows.length === 0) return null;
  const cols = headers || Object.keys(rows[0]);
  return (
    <div className="data-details">
      <button type="button" className="btn chip" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? '▴ Hide data table' : '▾ View data table'}
      </button>
      {open && (
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="data">
            <thead>
              <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {cols.map((c) => <td key={c}>{typeof r[c] === 'number' ? r[c].toLocaleString('en-US') : r[c]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function DataTable({ headers, rows, renderCell }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {headers.map((h) => (
                <td key={h}>{renderCell ? renderCell(h, r, i) : r[h] ?? r[h.toLowerCase()] ?? ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const fmt = (n) =>
  typeof n === 'number' ? n.toLocaleString('en-US') : n;
