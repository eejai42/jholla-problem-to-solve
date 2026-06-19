// App.jsx — THE HARNESS IS THE HOME SCREEN.
//
// This renders the witnessed inference harness (GET /api/harness): every
// category of inference (DAG levels / gates) -> the specific tests under it,
// red/green, with the expert-verifiable witness on each. Mostly red today;
// turns green as the model's API surface is wired.
//
// Second tab: the PAYOFF — a doctor-style diagnosis writeup per patient
// (GET /api/diagnosis/:id), derived live from vw_*. Works today.
import React, { useEffect, useState } from 'react';

const C = {
  pass: '#0a7d28',
  fail: '#c0282d',
  not_surfaced: '#b06a00',
  bgPass: '#eaf7ed',
  bgFail: '#fdeaea',
  bgNot: '#fdf4e3',
  border: '#dcdcdc',
  ink: '#222',
  sub: '#666',
};

const STATUS_LABEL = { pass: '✓ green', fail: '✗ FAIL', not_surfaced: '○ not surfaced (501)' };

function useFetch(path, deps = []) {
  const [s, setS] = useState({ loading: true, data: null, error: null });
  useEffect(() => {
    let alive = true;
    setS({ loading: true, data: null, error: null });
    fetch(path)
      .then(async (r) => {
        const ct = r.headers.get('content-type') || '';
        const body = ct.includes('json') ? await r.json() : await r.text();
        if (alive) setS({ loading: false, data: body, error: r.ok ? null : `HTTP ${r.status}` });
      })
      .catch((e) => alive && setS({ loading: false, data: null, error: String(e) }));
    return () => {
      alive = false;
    };
  }, deps); // eslint-disable-line
  return s;
}

function HealthPill() {
  const { data } = useFetch('/api/health');
  if (data?.ok) return <span style={{ color: C.pass }}>· API up</span>;
  return <span style={{ color: C.fail }}>· API unreachable</span>;
}

function SummaryBar({ summary }) {
  if (!summary) return null;
  const { total, pass, fail, not_surfaced } = summary;
  const pct = total ? Math.round((pass / total) * 100) : 0;
  return (
    <div style={{ margin: '0.5rem 0 1.25rem' }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>
        {pass}/{total} green <span style={{ color: C.sub, fontWeight: 400 }}>({pct}%)</span>
      </div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}`, marginTop: 6 }}>
        <div style={{ width: `${(pass / total) * 100}%`, background: C.pass }} title={`${pass} green`} />
        <div style={{ width: `${(fail / total) * 100}%`, background: C.fail }} title={`${fail} failing`} />
        <div style={{ width: `${(not_surfaced / total) * 100}%`, background: C.not_surfaced }} title={`${not_surfaced} not surfaced`} />
      </div>
      <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
        <span style={{ color: C.pass }}>■ green {pass}</span> &nbsp;
        <span style={{ color: C.fail }}>■ failing {fail}</span> &nbsp;
        <span style={{ color: C.not_surfaced }}>■ not surfaced {not_surfaced}</span>
      </div>
    </div>
  );
}

function CheckRow({ c }) {
  const color = C[c.status];
  const bg = c.status === 'pass' ? C.bgPass : c.status === 'fail' ? C.bgFail : C.bgNot;
  return (
    <div style={{ borderLeft: `3px solid ${color}`, background: bg, padding: '6px 10px', margin: '4px 0', borderRadius: 4 }}>
      <div style={{ fontWeight: 600, color: C.ink }}>
        <span style={{ color, fontFamily: 'monospace' }}>{STATUS_LABEL[c.status]}</span> &nbsp;{c.label}
      </div>
      <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>
        <em>witness:</em> {c.witness}
      </div>
      {c.detail ? (
        <div style={{ fontSize: 12, color: c.status === 'fail' ? C.fail : C.sub, marginTop: 2, fontFamily: 'monospace' }}>{c.detail}</div>
      ) : null}
    </div>
  );
}

function Category({ cat, open, onToggle }) {
  const allGreen = cat.pass === cat.total;
  return (
    <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
      <header
        onClick={onToggle}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fafafa', userSelect: 'none' }}
      >
        <span style={{ fontWeight: 700 }}>
          {open ? '▾' : '▸'} {cat.category}
        </span>
        <span style={{ fontFamily: 'monospace', color: allGreen ? C.pass : cat.pass > 0 ? C.not_surfaced : C.fail }}>
          {cat.pass}/{cat.total}
        </span>
      </header>
      {open ? <div style={{ padding: '4px 12px 10px' }}>{cat.items.map((c, i) => <CheckRow key={i} c={c} />)}</div> : null}
    </section>
  );
}

function HarnessView() {
  const { loading, data, error } = useFetch('/api/harness');
  const [open, setOpen] = useState({});
  if (loading) return <p>Running the witnessed inference harness…</p>;
  if (error) return <p style={{ color: C.fail }}>Harness unavailable: {error}</p>;
  const cats = data?.categories || [];
  return (
    <div>
      <SummaryBar summary={data?.summary} />
      <p style={{ color: C.sub, fontSize: 13 }}>
        Each test asserts one node of the IsClinicallyActionable DAG by hitting the app's own API. Red/“not surfaced” = the
        endpoint isn’t wired yet. As the model is built out, these turn green.
      </p>
      {cats.map((cat) => (
        <Category key={cat.category} cat={cat} open={!!open[cat.category]} onToggle={() => setOpen((o) => ({ ...o, [cat.category]: !o[cat.category] }))} />
      ))}
    </div>
  );
}

function DiagnosisView() {
  const { data: patients } = useFetch('/api/patients');
  const [sel, setSel] = useState(null);
  const list = Array.isArray(patients) ? patients : [];
  useEffect(() => {
    if (!sel && list.length) setSel(list[0].individual_prediction_id);
  }, [list, sel]);
  const { loading, data: md, error } = useFetch(sel ? `/api/diagnosis/${sel}` : '/api/health', [sel]);
  return (
    <div>
      <p style={{ color: C.sub, fontSize: 13 }}>
        The payoff: a doctor-style writeup derived from raw facts alone. The conclusion is computed, never entered.
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {list.map((p) => (
          <button
            key={p.individual_prediction_id}
            onClick={() => setSel(p.individual_prediction_id)}
            style={{
              padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${sel === p.individual_prediction_id ? C.ink : C.border}`,
              background: sel === p.individual_prediction_id ? '#222' : '#fff',
              color: sel === p.individual_prediction_id ? '#fff' : C.ink,
            }}
            title={`${p.individual_ancestry_label}${p.is_ancestry_holdout ? ', holdout' : ''}`}
          >
            {p.individual}
          </button>
        ))}
      </div>
      {sel ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <a href={`/api/diagnosis/${sel}`} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>open raw markdown ↗</a>
        </div>
      ) : null}
      {loading ? <p>Deriving diagnosis…</p> : error ? <p style={{ color: C.fail }}>{error}</p> : (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fbfbfb', border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.5 }}>
          {typeof md === 'string' ? md : JSON.stringify(md, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('harness');
  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '8px 14px', cursor: 'pointer', border: 'none', borderBottom: tab === id ? '3px solid #222' : '3px solid transparent',
        background: 'none', fontWeight: tab === id ? 700 : 400, fontSize: 15,
      }}
    >
      {label}
    </button>
  );
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '1.5rem auto', padding: '0 1rem', color: C.ink }}>
      <h1 style={{ marginBottom: 2 }}>
        Causal Autoimmune Architecture <small style={{ fontSize: '0.5em', fontWeight: 400, color: C.sub }}><HealthPill /></small>
      </h1>
      <p style={{ color: C.fail, fontWeight: 600, marginTop: 0 }}>
        Demonstration of inference structure, not validated clinical decision support.
      </p>
      <div style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
        {tabBtn('harness', 'Witnessed Inference Harness')}
        {tabBtn('diagnosis', 'Patient Diagnosis')}
      </div>
      {tab === 'harness' ? <HarnessView /> : <DiagnosisView />}
    </main>
  );
}
