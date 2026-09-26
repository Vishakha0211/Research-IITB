import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ReportContext = createContext(null);

const TOKEN_KEY = 'iitb-admin-token';

export function getAdminToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

function authHeaders() {
  const t = getAdminToken();
  return t ? { 'x-admin-token': t } : {};
}

export async function verifyAdminToken() {
  try {
    const res = await fetch('/api/auth/verify', { method: 'POST', headers: authHeaders() });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.error || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export function ReportProvider({ children }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/report');
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Replace an entire top-level section
  const updateSection = useCallback(async (section, value) => {
    const res = await fetch(`/api/report/${encodeURIComponent(section)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(value)
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Update failed (${res.status})`);
    }
    setReport((prev) => ({ ...prev, [section]: value }));
    return true;
  }, []);

  // Merge fields into a section
  const patchSection = useCallback(async (section, partial) => {
    const res = await fetch(`/api/report/${encodeURIComponent(section)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(partial)
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Update failed (${res.status})`);
    }
    setReport((prev) => ({
      ...prev,
      [section]: Array.isArray(partial)
        ? partial
        : typeof prev[section] === 'object' && prev[section] !== null && !Array.isArray(prev[section])
        ? { ...prev[section], ...partial }
        : partial
    }));
    return true;
  }, []);

  return (
    <ReportContext.Provider
      value={{ report, loading, error, reload: load, updateSection, patchSection }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReport must be used inside ReportProvider');
  return ctx;
}
