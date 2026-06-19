// pages.jsx — the content panes for the admin shell.
//   HarnessView      the witnessed inference harness (red/green tree)
//   DiagnosisView    the doctor-style per-patient writeup (the payoff)
//   CaseWalk         the MARQUEE: each case walked up the DAG to its diagnosis
//   StateMachineView the diagnosis-lifecycle viewer (states, edges, walks)
//   RoutingEditor    the role-based navigation editor (RoutingAndNavigation)
//   LeopoldEditor    the Leopold-loop editor + regenerate-plan
import React, { useEffect, useState } from 'react';
import { C, useFetch, send, Markdown } from './ui.jsx';

const STATUS_LABEL = { pass: '✓ green', fail: '✗ FAIL', not_surfaced: '○ not surfaced (501)' };

// ===========================================================================
//  HARNESS
// ===========================================================================
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
        <div style={{ width: `${(pass / total) * 100}%`, background: C.pass }} />
        <div style={{ width: `${(fail / total) * 100}%`, background: C.fail }} />
        <div style={{ width: `${(not_surfaced / total) * 100}%`, background: C.not_surfaced }} />
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
      <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}><em>witness:</em> {c.witness}</div>
      {c.detail ? <div style={{ fontSize: 12, color: c.status === 'fail' ? C.fail : C.sub, marginTop: 2, fontFamily: 'monospace' }}>{c.detail}</div> : null}
    </div>
  );
}

function Category({ cat, open, onToggle }) {
  const allGreen = cat.pass === cat.total;
  return (
    <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
      <header onClick={onToggle} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fafafa', userSelect: 'none' }}>
        <span style={{ fontWeight: 700 }}>{open ? '▾' : '▸'} {cat.category}</span>
        <span style={{ fontFamily: 'monospace', color: allGreen ? C.pass : cat.pass > 0 ? C.not_surfaced : C.fail }}>{cat.pass}/{cat.total}</span>
      </header>
      {open ? <div style={{ padding: '4px 12px 10px' }}>{cat.items.map((c, i) => <CheckRow key={i} c={c} />)}</div> : null}
    </section>
  );
}

export function HarnessView() {
  const { loading, data, error } = useFetch('/api/harness');
  const [open, setOpen] = useState({});
  if (loading) return <p>Running the witnessed inference harness…</p>;
  if (error) return <p style={{ color: C.fail }}>Harness unavailable: {error}</p>;
  const cats = data?.categories || [];
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Witnessed Inference Harness</h2>
      <SummaryBar summary={data?.summary} />
      <p style={{ color: C.sub, fontSize: 13 }}>
        Each test asserts one node of the IsClinicallyActionable DAG by hitting the app's own API. As the model is built out, these turn green.
      </p>
      {cats.map((cat) => (
        <Category key={cat.category} cat={cat} open={!!open[cat.category]} onToggle={() => setOpen((o) => ({ ...o, [cat.category]: !o[cat.category] }))} />
      ))}
    </div>
  );
}

// ===========================================================================
//  DIAGNOSIS
// ===========================================================================
export function DiagnosisView() {
  const { data: patients } = useFetch('/api/patients');
  const [sel, setSel] = useState(null);
  const list = Array.isArray(patients) ? patients : [];
  useEffect(() => { if (!sel && list.length) setSel(list[0].individual_prediction_id); }, [list, sel]);
  const { loading, data: md, error } = useFetch(sel ? `/api/diagnosis/${sel}` : '/api/health', [sel]);
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Patient Diagnosis</h2>
      <p style={{ color: C.sub, fontSize: 13 }}>The payoff: a doctor-style writeup derived from raw facts alone. The conclusion is computed, never entered.</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {list.map((p) => (
          <button key={p.individual_prediction_id} onClick={() => setSel(p.individual_prediction_id)}
            style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${sel === p.individual_prediction_id ? C.ink : C.border}`, background: sel === p.individual_prediction_id ? '#222' : '#fff', color: sel === p.individual_prediction_id ? '#fff' : C.ink }}
            title={`${p.individual_ancestry_label}${p.is_ancestry_holdout ? ', holdout' : ''}`}>
            {p.individual}
          </button>
        ))}
      </div>
      {sel ? <div style={{ marginBottom: 8 }}><a href={`/api/diagnosis/${sel}`} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>open raw markdown ↗</a></div> : null}
      {loading ? <p>Deriving diagnosis…</p> : error ? <p style={{ color: C.fail }}>{error}</p> : (
        <div style={{ background: '#fbfbfb', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 20px 16px' }}>
          {typeof md === 'string' ? <Markdown source={md} /> : <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(md, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
//  CASE WALK — the marquee "upside-down reasoning" presentation.
//  Walk each case's facts up the DAG, level by level, anchored on the
//  lifecycle state machine, until the diagnosis reveals itself.
// ===========================================================================
const LEVELS = [
  { state: 'Intake', title: 'Intake — raw facts', endpoint: (p) => `/api/individuals/${p.individual}`,
    fields: [['ancestry_label', 'Ancestry'], ['age_years', 'Age'], ['is_ancestry_absent_from_training', 'Holdout ancestry'], ['has_cryptic_relatedness_flag', 'Cryptic relatedness']],
    blurb: 'The clinician transcribes the presenting facts. Nothing is inferred yet.' },
  { state: 'EvidenceAssessed', title: 'Evidence assessed', endpoint: (p) => `/api/variants/${p.variant}`,
    fields: [['allele_frequency', 'Allele freq'], ['is_rare_variant', 'Rare variant'], ['has_allele_specific_expression', 'ASE'], ['is_causal_candidate', 'Causal candidate']],
    blurb: 'The variant is a candidate; per-evidence ZStats qualify the signal.' },
  { state: 'MechanismConfirmed', title: 'Mechanism confirmed?', endpoint: (p) => `/api/mechanisms/${p.mechanism}`,
    fields: [['count_qualified_evidence', 'Qualified evidence'], ['replicates_across_cohorts', 'Replicates'], ['survives_negative_controls', 'Survives controls'], ['is_spurious_derived', 'Spurious'], ['is_causal_architecture_node', 'Confirmed node']],
    blurb: 'Aggregations decide whether this mechanism is a real causal-architecture node or spurious.' },
  { state: 'CalibrationChecked', title: 'Calibration checked', endpoint: (p) => `/api/predictions/${p.prediction}`,
    fields: [['count_well_calibrated_bins', 'Well-calibrated bins'], ['calibrated_uncertainty', 'Calibrated uncertainty'], ['is_high_confidence_prediction', 'High confidence']],
    blurb: 'Reliability-bin coverage gates whether the prediction is trustworthy.' },
  { state: 'TransportChecked', title: 'Ancestry transport checked', endpoint: (p) => `/api/predictions/${p.prediction}`,
    fields: [['individual_cross_ancestry_node_count', 'Cross-ancestry nodes'], ['is_transportable_to_absent_ancestry', 'Transportable'], ['is_ancestry_transport_safe', 'Transport safe']],
    blurb: 'For held-out ancestries, the effect must be measured across ancestries — not assumed.' },
];

function GateChip({ label, value }) {
  const truthy = value === true || value === 'true';
  const falsy = value === false || value === 'false';
  const col = truthy ? C.pass : falsy ? C.fail : C.sub;
  const bg = truthy ? C.bgPass : falsy ? C.bgFail : '#f4f4f4';
  const show = typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(3)) : String(value);
  return (
    <span style={{ display: 'inline-block', margin: '3px 6px 3px 0', padding: '3px 9px', borderRadius: 12, background: bg, color: col, border: `1px solid ${C.border}`, fontSize: 12.5 }}>
      {label}: <strong>{show}</strong>
    </span>
  );
}

function WalkStep({ level, patient, reached, isDeciding }) {
  const { data } = useFetch(level.endpoint(patient), [patient.prediction, patient.individual]);
  const row = data && !data.error ? data : {};
  const dim = !reached;
  return (
    <div style={{ position: 'relative', paddingLeft: 26, marginBottom: 14, opacity: dim ? 0.4 : 1 }}>
      <div style={{ position: 'absolute', left: 0, top: 2, width: 14, height: 14, borderRadius: 7, background: reached ? (isDeciding ? C.accent : C.pass) : '#ccc', border: '2px solid #fff', boxShadow: `0 0 0 1px ${C.border}` }} />
      {/* connector line */}
      <div style={{ position: 'absolute', left: 6, top: 16, bottom: -14, width: 2, background: C.border }} />
      <div style={{ fontWeight: 700, fontSize: 14 }}>
        {level.title} <span style={{ color: C.sub, fontWeight: 400, fontFamily: 'monospace', fontSize: 12 }}>· {level.state}</span>
        {isDeciding ? <span style={{ marginLeft: 8, color: C.accent, fontSize: 12, fontWeight: 700 }}>◀ deciding step</span> : null}
      </div>
      <div style={{ fontSize: 12.5, color: C.sub, margin: '2px 0 4px' }}>{level.blurb}</div>
      <div>{level.fields.map(([k, lbl]) => <GateChip key={k} label={lbl} value={row[k]} />)}</div>
    </div>
  );
}

export function CaseWalk() {
  const { data: patients } = useFetch('/api/patients');
  const list = Array.isArray(patients) ? patients : [];
  const [predId, setPredId] = useState(null);
  useEffect(() => { if (!predId && list.length) setPredId(list[0].individual_prediction_id); }, [list, predId]);
  const { data: lc } = useFetch(predId ? `/api/predictions/${predId}/lifecycle` : '/api/health', [predId]);
  const patient = list.find((p) => p.individual_prediction_id === predId);
  // enrich with the oracle ids the walk endpoints need (mechanism / variant / individual).
  const { data: pred } = useFetch(predId ? `/api/predictions/${predId}` : '/api/health', [predId]);
  // the payoff writeup, rendered inline (not a link to the raw endpoint).
  const { data: dx, loading: dxLoading, error: dxError } = useFetch(predId ? `/api/diagnosis/${predId}` : '/api/health', [predId]);
  if (!patient || !pred) return <div><h2 style={{ marginTop: 0 }}>Case Walk</h2><p>Loading cases…</p></div>;

  const ctx = {
    prediction: predId,
    individual: pred.individual,
    mechanism: `cm-${predId.split('-')[1]}`,  // pred-a -> cm-a (oracle convention)
    variant: null,
  };
  const visited = new Set(lc?.states || []);
  const terminal = lc?.terminal;
  const actionable = lc?.is_clinically_actionable;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Case Walk — facts on the ground, building to the diagnosis</h2>
      <p style={{ color: C.sub, fontSize: 13 }}>
        An upside-down reasoning model: start from the raw facts, climb the deterministic DAG one level at a time,
        and watch each case branch at its single deciding gate until the conclusion reveals itself.
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {list.map((p) => (
          <button key={p.individual_prediction_id} onClick={() => setPredId(p.individual_prediction_id)}
            style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${predId === p.individual_prediction_id ? C.ink : C.border}`, background: predId === p.individual_prediction_id ? '#222' : '#fff', color: predId === p.individual_prediction_id ? '#fff' : C.ink }}
            title={`${p.individual_ancestry_label}${p.is_ancestry_holdout ? ', holdout' : ''}`}>
            {p.individual}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        {LEVELS.map((lvl, i) => {
          const reached = visited.has(lvl.state);
          // the deciding step is the LAST non-terminal level the case reached
          const nextState = LEVELS[i + 1]?.state;
          const isDeciding = reached && (terminal === 'NotActionable') && (!visited.has(nextState) && nextState !== undefined ? !visited.has(nextState) : false) && lc?.states?.[lc.states.length - 2] === lvl.state;
          return <WalkStep key={lvl.state} level={lvl} patient={ctx} reached={reached} isDeciding={isDeciding} />;
        })}
        {/* terminal verdict */}
        <div style={{ paddingLeft: 26, position: 'relative', marginTop: 4 }}>
          <div style={{ position: 'absolute', left: 0, top: 4, width: 16, height: 16, borderRadius: 8, background: actionable ? C.pass : C.fail, border: '2px solid #fff', boxShadow: `0 0 0 1px ${C.border}` }} />
          <div style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 8, background: actionable ? C.bgPass : C.bgFail, border: `1px solid ${actionable ? C.pass : C.fail}` }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: actionable ? C.pass : C.fail }}>
              {terminal === 'Actionable' ? 'Clinically actionable' : 'Not clinically actionable'}
            </div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>
              IsClinicallyActionable = {String(actionable)} · lifecycle terminal = {terminal}
            </div>
          </div>
        </div>

        {/* the payoff: the full diagnosis writeup, rendered inline as pretty markdown */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Diagnosis writeup</h3>
            <a href={`/api/diagnosis/${predId}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.sub }}>open raw markdown ↗</a>
          </div>
          {dxLoading ? <p style={{ color: C.sub }}>Deriving diagnosis…</p>
            : dxError ? <p style={{ color: C.fail }}>{dxError}</p>
            : (
              <div style={{ background: '#fbfbfb', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 20px 16px' }}>
                {typeof dx === 'string' ? <Markdown source={dx} /> : <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(dx, null, 2)}</pre>}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
//  STATE MACHINE VIEWER — states (ordered), edges, recent transitions.
// ===========================================================================
export function StateMachineView() {
  const { data, loading, error } = useFetch('/api/state-machines/diagnosis-lifecycle');
  if (loading) return <div><h2 style={{ marginTop: 0 }}>Diagnosis Lifecycle</h2><p>Loading…</p></div>;
  if (error) return <p style={{ color: C.fail }}>{error}</p>;
  const { machine, states = [], rules = [], transitions = [] } = data || {};
  const byState = Object.fromEntries(states.map((s) => [s.state_key, s]));
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>{machine?.title || 'Diagnosis Lifecycle'}</h2>
      <p style={{ color: C.sub, fontSize: 13 }}>{machine?.description}</p>
      <p style={{ color: C.sub, fontSize: 12 }}>Subject: <code>{machine?.subject_table_name}.{machine?.subject_state_column}</code> — the current state is DERIVED, never entered.</p>

      <h3>States</h3>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {states.map((s, i) => (
          <React.Fragment key={s.state_key}>
            <span style={{ padding: '6px 12px', borderRadius: 8, border: `2px solid ${s.is_terminal ? (s.state_key === 'Actionable' ? C.pass : C.fail) : C.accent}`, background: s.is_initial ? C.bgAccent : '#fff', fontWeight: 600, fontSize: 13 }}>
              {s.title || s.state_key}
              {s.is_initial ? <span style={{ color: C.sub, fontSize: 10 }}> ▸start</span> : null}
              {s.is_terminal ? <span style={{ color: C.sub, fontSize: 10 }}> ◼end</span> : null}
            </span>
            {i < states.length - 1 && !s.is_terminal ? <span style={{ color: C.sub }}>→</span> : null}
          </React.Fragment>
        ))}
      </div>

      <h3>Transition rules ({rules.length})</h3>
      <table style={{ borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
        <thead><tr>{['From', 'To', 'Guard', 'Role'].map((h) => <th key={h} style={{ border: `1px solid ${C.border}`, padding: '4px 10px', background: '#f5f5f5', textAlign: 'left' }}>{h}</th>)}</tr></thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.state_transition_rule_id}>
              <td style={{ border: `1px solid ${C.border}`, padding: '4px 10px' }}>{r.from_state_key}</td>
              <td style={{ border: `1px solid ${C.border}`, padding: '4px 10px', color: r.to_state_key === 'NotActionable' ? C.fail : r.to_state_key === 'Actionable' ? C.pass : C.ink }}>{r.to_state_key}</td>
              <td style={{ border: `1px solid ${C.border}`, padding: '4px 10px', color: C.sub }}>{r.guard_description}</td>
              <td style={{ border: `1px solid ${C.border}`, padding: '4px 10px', fontFamily: 'monospace', fontSize: 12 }}>{r.triggered_by_role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Recent transitions ({transitions.length})</h3>
      <div style={{ maxHeight: 280, overflow: 'auto', border: `1px solid ${C.border}`, borderRadius: 6 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12.5, width: '100%' }}>
          <thead><tr>{['Subject', 'From', 'To', 'Reason'].map((h) => <th key={h} style={{ border: `1px solid ${C.border}`, padding: '4px 8px', background: '#f5f5f5', textAlign: 'left', position: 'sticky', top: 0 }}>{h}</th>)}</tr></thead>
          <tbody>
            {transitions.map((t) => (
              <tr key={t.state_transition_id || `${t.subject_id}-${t.to_state_key}`}>
                <td style={{ border: `1px solid ${C.border}`, padding: '4px 8px', fontFamily: 'monospace' }}>{t.subject_id}</td>
                <td style={{ border: `1px solid ${C.border}`, padding: '4px 8px' }}>{t.from_state_key || '—'}</td>
                <td style={{ border: `1px solid ${C.border}`, padding: '4px 8px', color: t.to_state_key === 'NotActionable' ? C.fail : t.to_state_key === 'Actionable' ? C.pass : C.ink }}>{t.to_state_key}</td>
                <td style={{ border: `1px solid ${C.border}`, padding: '4px 8px', color: C.sub }}>{t.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================================
//  ROUTING EDITOR — view the role nav trees; edit a route row.
// ===========================================================================
export function RoutingEditor({ role }) {
  const [reload, setReload] = useState(0);
  const { data, loading, error } = useFetch(`/api/routing/tree?role=${role}`, [role, reload]);
  const [edit, setEdit] = useState(null); // the row being edited
  const [saving, setSaving] = useState(false);

  const renderNode = (n, depth) => (
    <div key={n.routing_and_navigation_id}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', marginLeft: depth * 18, borderRadius: 4, cursor: 'pointer', background: edit?.routing_and_navigation_id === n.routing_and_navigation_id ? C.bgAccent : 'transparent' }}
        onClick={() => setEdit({ ...n })}>
        <span style={{ color: C.sub }}>{n.children?.length ? '▾' : '·'}</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{n.display_name}</span>
        <code style={{ fontSize: 11, color: C.sub }}>{n.route}</code>
      </div>
      {(n.children || []).map((c) => renderNode(c, depth + 1))}
    </div>
  );

  async function save() {
    setSaving(true);
    try {
      await send(`/api/routing/${edit.routing_and_navigation_id}`, 'PUT', {
        display_name: edit.display_name, route: edit.route, description: edit.description,
        sort_order: Number(edit.sort_order), role_visibility: edit.role_visibility, icon_hint: edit.icon_hint,
      });
      setReload((x) => x + 1);
    } catch (e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Routing &amp; Navigation</h2>
      <p style={{ color: C.sub, fontSize: 13 }}>
        Role-based navigation. Each route is a template (<code>/intake/new-patient/:caseId</code>); every entity row carries a
        <code> RelativePath</code> that fills in its own id. Editing the <em>{role}</em> tree.
      </p>
      <p style={{ color: C.not_surfaced, fontSize: 12 }}>
        ⚠ Edits write the Postgres base table; <code>effortless build</code> reseeds from the rulebook hub, so unsaved-to-rulebook edits are overwritten on rebuild.
      </p>
      {loading ? <p>Loading…</p> : error ? <p style={{ color: C.fail }}>{error}</p> : (
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ flex: '1 1 50%', border: `1px solid ${C.border}`, borderRadius: 8, padding: 10 }}>
            {(data?.tree || []).map((n) => renderNode(n, 0))}
          </div>
          <div style={{ flex: '1 1 50%' }}>
            {edit ? (
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
                <h3 style={{ marginTop: 0 }}>Edit route</h3>
                {[['display_name', 'Display name'], ['route', 'Route template'], ['description', 'Description'], ['sort_order', 'Sort order'], ['role_visibility', 'Role visibility (CSV)'], ['icon_hint', 'Icon']].map(([k, lbl]) => (
                  <label key={k} style={{ display: 'block', marginBottom: 8, fontSize: 12.5 }}>
                    <div style={{ color: C.sub }}>{lbl}</div>
                    <input value={edit[k] ?? ''} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} style={{ width: '100%', padding: '5px 8px', border: `1px solid ${C.border}`, borderRadius: 4 }} />
                  </label>
                ))}
                <button onClick={save} disabled={saving} style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            ) : <p style={{ color: C.sub }}>Select a route to edit.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
//  LEOPOLD EDITOR — edit loop status/goal; regenerate the derived plan.
// ===========================================================================
export function LeopoldEditor() {
  const [reload, setReload] = useState(0);
  const { data, loading, error } = useFetch('/api/leopold-loops', [reload]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const loops = Array.isArray(data) ? data : [];

  async function setStatus(id, status) {
    try { await send(`/api/leopold-loops/${id}`, 'PUT', { status }); setReload((x) => x + 1); }
    catch (e) { alert('Save failed: ' + e.message); }
  }
  async function regenerate() {
    setBusy(true); setMsg(null);
    try { const r = await send('/api/leopold-loops/regenerate-plan', 'POST'); setMsg('Plan regenerated.'); }
    catch (e) { setMsg('Regenerate failed: ' + e.message); }
    setBusy(false);
  }
  const STATUSES = ['done', 'next', 'planned', 'backlog'];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Leopold Loops</h2>
      <p style={{ color: C.sub, fontSize: 13 }}>The CHANGE-RULE → REBUILD → CONSUME loop log. Status drives the generated plan badges.</p>
      <p style={{ color: C.not_surfaced, fontSize: 12 }}>⚠ Edits write the base table; “Regenerate plan” reflects the rulebook rows, not unsaved DB edits.</p>
      <button onClick={regenerate} disabled={busy} style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', marginBottom: 12 }}>
        {busy ? 'Regenerating…' : 'Regenerate plan (effortless build)'}
      </button>
      {msg ? <span style={{ marginLeft: 10, fontSize: 13, color: msg.startsWith('Plan') ? C.pass : C.fail }}>{msg}</span> : null}
      {loading ? <p>Loading…</p> : error ? <p style={{ color: C.fail }}>{error}</p> : (
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
          <thead><tr>{['#', 'Title', 'Status', 'Set'].map((h) => <th key={h} style={{ border: `1px solid ${C.border}`, padding: '4px 8px', background: '#f5f5f5', textAlign: 'left' }}>{h}</th>)}</tr></thead>
          <tbody>
            {loops.map((l) => (
              <tr key={l.leopold_loop_id}>
                <td style={{ border: `1px solid ${C.border}`, padding: '4px 8px' }}>{l.loop_number}</td>
                <td style={{ border: `1px solid ${C.border}`, padding: '4px 8px' }}>{l.title}<div style={{ color: C.sub, fontSize: 11 }}>{l.goal}</div></td>
                <td style={{ border: `1px solid ${C.border}`, padding: '4px 8px', fontFamily: 'monospace' }}>{l.status_badge} {l.status}</td>
                <td style={{ border: `1px solid ${C.border}`, padding: '4px 8px' }}>
                  <select value={l.status} onChange={(e) => setStatus(l.leopold_loop_id, e.target.value)} style={{ fontSize: 12 }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ===========================================================================
//  EXPLAINER DAG + EXCEL EXPORT — the two "central" Effortless tools.
//  The explainer-dag bundle (generated to /public/rulebook-explainer-dag) makes
//  every derived field clickable to show its provenance. Excel export streams
//  one sheet per table via the rulebook-to-xlsx transpiler.
// ===========================================================================
export function ExplainerView() {
  const [exporting, setExporting] = React.useState(false);
  async function exportXlsx() {
    setExporting(true);
    try {
      const r = await fetch('/api/export.xlsx');
      if (!r.ok) throw new Error('export failed: ' + r.status);
      const blob = await r.blob();
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url; a.download = 'causal-autoimmune-export.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert(String(e)); }
    setExporting(false);
  }
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Explainer DAG &amp; Export</h2>
      <p style={{ color: C.sub, fontSize: 13 }}>
        Two Effortless tools central to this model. The <strong>Explainer DAG</strong> lets you click any derived value to see
        exactly how it was computed (raw inputs → lookups → calcs → aggregations). <strong>Excel export</strong> dumps every
        table — including all calculated columns — as one workbook.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
        <button onClick={exportXlsx} disabled={exporting}
          style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer' }}>
          {exporting ? 'Exporting…' : '⬇ Export model to Excel'}
        </button>
        <a href="/rulebook-explainer-dag/pages/index.html" target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
          open the full Explainer DAG ↗
        </a>
        {/* the ƒ provenance toggle is pinned to the bottom-left of the nav (see App.jsx + client/index.html init) */}
      </div>

      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Try it — click a derived value</h3>
        <p style={{ color: C.sub, fontSize: 13 }}>
          These cells are tagged <code>data-er-dag="Table.Field"</code>. With the explainer enabled (the ƒ toggle above),
          clicking one opens its derivation.
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9 }}>
          <li>Keystone: <span data-er-dag="IndividualPredictions.IsClinicallyActionable"><strong>IsClinicallyActionable</strong></span></li>
          <li>Lifecycle: <span data-er-dag="IndividualPredictions.LifecycleStateKey"><strong>LifecycleStateKey</strong></span></li>
          <li>Gate: <span data-er-dag="IndividualPredictions.IsHighConfidencePrediction"><strong>IsHighConfidencePrediction</strong></span></li>
          <li>Mechanism: <span data-er-dag="CausalMechanisms.IsCausalArchitectureNode"><strong>IsCausalArchitectureNode</strong></span></li>
          <li>Path: <span data-er-dag="CalibrationBins.RelativePath"><strong>CalibrationBins.RelativePath</strong></span></li>
        </ul>
      </div>
    </div>
  );
}
