export const norm = (s) =>
  String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const tokenize = (s) => norm(s).split(/[^a-z0-9+#]+/).filter(Boolean);

export const stem = (w) =>
  w.replace(/(ies)$/, 'y')
    .replace(/(ing|ed|es|s)$/, '')
    .replace(/([a-z])\1$/, '$1');

export const WEIGHTED = [
  ['Name', 10],
  ['Topic', 7],
  ['Research_Interest', 5],
  ['Department', 4],
  ['Designation', 3]
];

export function lev(a, b, max) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

export function buildFields(p) {
  const fields = [];
  const push = (text, w) => text && fields.push({ text, w, tokens: tokenize(text) });
  for (const [h, w] of WEIGHTED) push(norm(p[h]), w);
  const weighted = new Set(WEIGHTED.map(([h]) => h));
  for (const [k, v] of Object.entries(p)) {
    if (k === 'Profile_URL' || weighted.has(k) || v == null) continue;
    push(norm(v), 1);
  }
  return fields;
}

export function fieldTokenScore(qt, f) {
  if (f.text.includes(qt)) return 1;
  if (qt.length > 3) {
    const variants = qt.endsWith('s')
      ? [qt.slice(0, -1)]
      : [`${qt}s`, `${qt}es`, `${qt}ing`, `${qt.slice(0, -1)}ed`];
    for (const v of variants) if (f.text.includes(v)) return 0.9;
  }
  const qs = stem(qt);
  const maxD = qt.length >= 5 ? 2 : qt.length >= 3 ? 1 : 0;
  for (const t of f.tokens) {
    if (qs && stem(t) === qs) return 0.85;
    if (maxD > 0 && Math.abs(t.length - qt.length) <= maxD) {
      const d = lev(qt, t, maxD);
      if (d <= maxD) return d === 1 ? 0.7 : 0.55;
    }
  }
  return 0;
}

// Score entries ({p, fields} or {p, fields, text}) against query tokens.
// Returns entries that match EVERY token, sorted best-first.
export function scoreEntries(entries, qTokens) {
  if (!qTokens || qTokens.length === 0) return entries.map((e) => ({ e, total: 0 }));
  const scored = [];
  for (const e of entries) {
    let total = 0;
    let ok = true;
    for (const qt of qTokens) {
      let best = 0;
      for (const f of e.fields) {
        const s = fieldTokenScore(qt, f);
        if (s > 0) {
          const v = s * f.w;
          if (v > best) best = v;
        }
      }
      if (best === 0) {
        ok = false;
        break;
      }
      total += best;
    }
    if (ok) scored.push({ e, total });
  }
  scored.sort((a, b) => b.total - a.total);
  return scored;
}

// Build lightweight fields for arbitrary text (labels, titles).
export const textField = (text, w = 5) => ({ text: norm(text), w, tokens: tokenize(text) });

// Match a short label against a query (for pages/departments).
export function labelScore(query, label) {
  const qTokens = tokenize(query);
  const f = textField(label, 1);
  let total = 0;
  for (const qt of qTokens) {
    const s = fieldTokenScore(qt, f);
    if (s <= 0) return 0;
    total += s;
  }
  return total;
}
