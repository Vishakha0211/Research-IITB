import { useState, useMemo } from 'react';
import { useReport, getAdminToken, setAdminToken, verifyAdminToken } from '../context/ReportContext';
import { Section, PageIntro, Card } from '../components/ui';

function AdminRow({ sectionKey, value, onSave }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [status, setStatus] = useState(null); // {type:'ok'|'err', msg}
  const [saving, setSaving] = useState(false);

  const sync = () => setText(JSON.stringify(value, null, 2));

  const save = async () => {
    setStatus(null);
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setStatus({ type: 'err', msg: `Invalid JSON: ${e.message}` });
      return;
    }
    setSaving(true);
    try {
      await onSave(sectionKey, parsed);
      setStatus({ type: 'ok', msg: 'Saved. Charts using this section are now updated.' });
    } catch (e) {
      setStatus({ type: 'err', msg: `Update failed: ${e.message}` });
    } finally {
      setSaving(false);
    }
  };

  const rows = Array.isArray(value) ? `${value.length} items` : typeof value === 'object' && value ? `${Object.keys(value).length} fields` : String(value);

  return (
    <div className="admin-section">
      <div className="admin-head" onClick={() => { setOpen(!open); if (!open) sync(); }}>
        <h3>{sectionKey}</h3>
        <span style={{ fontSize: 12.5, color: '#5a6478' }}>
          {rows} · {open ? '▾ close' : '▸ edit'}
        </span>
      </div>
      {open && (
        <div className="admin-body" onClick={(e) => e.stopPropagation()}>
          <textarea
            spellCheck={false}
            value={text}
            onChange={(e) => { setText(e.target.value); setStatus(null); }}
          />
          <div className="admin-actions">
            <button className="btn" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button className="btn secondary" onClick={() => { sync(); setStatus(null); }}>
              Revert
            </button>
            {status && (
              <span className={`toast ${status.type}`}>{status.msg}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { report, updateSection, reload } = useReport();
  const [filter, setFilter] = useState('');
  const [globalMsg, setGlobalMsg] = useState(null);
  const [tokenInput, setTokenInput] = useState(getAdminToken);
  const [tokenStatus, setTokenStatus] = useState(null); // {type, msg}

  const keys = useMemo(() => {
    if (!report) return [];
    const all = Object.keys(report);
    const term = filter.trim().toLowerCase();
    return term ? all.filter((k) => k.toLowerCase().includes(term)) : all;
  }, [report, filter]);

  const download = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveToken = async () => {
    const value = tokenInput.trim();
    setAdminToken(value);
    if (!value) {
      setTokenStatus({ type: 'err', msg: 'No token entered — saving will fail.' });
      return;
    }
    setTokenStatus({ type: 'ok', msg: 'Checking…' });
    const r = await verifyAdminToken();
    setTokenStatus(
      r.ok
        ? { type: 'ok', msg: 'Token saved and verified ✓' }
        : { type: 'err', msg: r.error }
    );
  };

  if (!report) return null;

  return (
    <>
      <PageIntro title="Update report data." accent="No code required." eyebrow="Portal · Data management">
        Every chart and table on this portal reads live from the backend data file. Edit any section below as JSON — invalid JSON or failed saves are reported explicitly. After saving, affected pages re-render with the new data.
      </PageIntro>

      <Section
        title="Admin access"
        note="Reading data is public; saving requires the admin token (shown in the server console or backend/.admin-token)."
      >
        <Card>
          <div className="token-bar">
            <input
              type="password"
              className="txt-input"
              style={{ flex: '1 1 260px' }}
              placeholder="Admin token…"
              value={tokenInput}
              onChange={(e) => { setTokenInput(e.target.value); setTokenStatus(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') saveToken(); }}
            />
            <button className="btn" onClick={saveToken}>Save &amp; verify</button>
            <button
              className="btn secondary"
              onClick={() => { setTokenInput(''); setAdminToken(''); setTokenStatus({ type: 'ok', msg: 'Token cleared.' }); }}
            >
              Clear
            </button>
            {tokenStatus && <span className={`toast ${tokenStatus.type}`}>{tokenStatus.msg}</span>}
          </div>
        </Card>
      </Section>

      <Section
        title="Report sections"
        note={`${keys.length} sections available. Click a section to expand and edit its JSON.`}
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              className="txt-input"
              placeholder="Filter sections…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button className="btn secondary" onClick={download}>Download JSON</button>
            <button className="btn secondary" onClick={async () => { await reload(); setGlobalMsg({ type: 'ok', msg: 'Reloaded from server.' }); }}>
              Reload from server
            </button>
          </div>
        }
      >
        {globalMsg && <div className={`toast ${globalMsg.type}`} style={{ marginBottom: 12 }}>{globalMsg.msg}</div>}
        {keys.map((k) => (
          <AdminRow key={k + JSON.stringify(report[k])?.slice(0, 40)} sectionKey={k} value={report[k]} onSave={updateSection} />
        ))}
      </Section>
    </>
  );
}
