// App.jsx — Case-intake admin UI (React).
//
// Today the inference surface is RED: /api/cohort and every prediction
// endpoint return 501 (see server/index.js). This component is written so the
// SAME code goes GREEN the moment Loop 1 wires /api/cohort to read
// vw_individual_predictions — it already knows how to render the cohort list
// and degrades to an honest "not wired yet" banner while the endpoint is 501.
import React, { useEffect, useState } from 'react';

const banner = {
  color: '#a00',
  fontWeight: 600,
};

function useApi(path) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  useEffect(() => {
    let alive = true;
    fetch(path)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!alive) return;
        if (r.status === 501) {
          setState({ status: 'not_implemented', data: body, error: null });
        } else if (!r.ok) {
          setState({ status: 'error', data: null, error: body.error || `HTTP ${r.status}` });
        } else {
          setState({ status: 'ok', data: body, error: null });
        }
      })
      .catch((err) => {
        if (alive) setState({ status: 'error', data: null, error: String(err) });
      });
    return () => {
      alive = false;
    };
  }, [path]);
  return state;
}

function HealthPill() {
  const health = useApi('/api/health');
  if (health.status === 'loading') return <span>· checking API…</span>;
  if (health.status === 'ok' && health.data?.ok)
    return <span style={{ color: '#080' }}>· API up</span>;
  return <span style={{ color: '#a00' }}>· API unreachable</span>;
}

function CohortPanel() {
  const cohort = useApi('/api/cohort');

  if (cohort.status === 'loading') return <p>Loading cohort…</p>;

  if (cohort.status === 'not_implemented') {
    return (
      <div>
        <p>
          Prediction panel not wired yet. The witnessed inference harness
          (<code>tests/harness/</code>) is RED until Loop 1+ surfaces the cohort
          and full prediction panel from <code>vw_individual_predictions</code>.
        </p>
        <p style={{ color: '#777' }}>
          <code>GET /api/cohort</code> → 501 ({cohort.data?.node || 'cohort:keystone-list'},
          planned {cohort.data?.plannedLoop || 'Loop 1'})
        </p>
      </div>
    );
  }

  if (cohort.status === 'error') return <p style={{ color: '#a00' }}>Cohort unavailable: {cohort.error}</p>;

  const rows = Array.isArray(cohort.data) ? cohort.data : cohort.data?.rows || [];
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Individual</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Prediction</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Clinically actionable</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.prediction_id || r.id}>
            <td>{r.individual_name || r.individual_id}</td>
            <td>{r.prediction_id || r.id}</td>
            <td>{r.is_clinically_actionable ? '✅ yes' : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 820, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>
        Causal Autoimmune Architecture — Case Intake <small style={{ fontSize: '0.5em', fontWeight: 400 }}><HealthPill /></small>
      </h1>
      <p style={banner}>
        Demonstration of inference structure, not validated clinical decision support.
      </p>
      <CohortPanel />
    </main>
  );
}
