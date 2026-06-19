// pages.jsx — the content panes for the admin shell.
//   HarnessView      the witnessed inference harness (red/green tree)
//   DiagnosisView    the doctor-style per-patient writeup (the payoff)
//   CaseWalk         the MARQUEE: each case walked up the DAG to its diagnosis
//   StateMachineView the diagnosis-lifecycle viewer (states, edges, walks)
//   RoutingEditor    the role-based navigation editor (RoutingAndNavigation)
//   LeopoldEditor    the Leopold-loop editor + regenerate-plan
import React, { useEffect, useState } from 'react';
import { C, useFetch, send, Markdown } from './ui.jsx';
import { Link, useQueryParam, useLocation } from './router.jsx';

const STATUS_LABEL = { pass: '✓ green', fail: '✗ FAIL', not_surfaced: '○ not surfaced (501)' };

// Shared value formatter (booleans, nulls, arrays → display strings).
const fmtVal = (v) => (v === true ? 'true' : v === false ? 'false' : v == null ? '—' : Array.isArray(v) ? `[${v.join(', ')}]` : String(v));

// A patient chip rendered as a real Link to that case's route. Used wherever a
// cohort is shown so every patient is reachable by URL (no click-to-select).
function PatientChips({ list, predId }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
      {list.map((p) => {
        const active = predId === p.individual_prediction_id;
        return (
          <Link key={p.individual_prediction_id}
            to={`/diagnosis/case/${p.individual_prediction_id}`}
            title={`${p.individual_ancestry_label}${p.is_ancestry_holdout ? ', holdout' : ''}`}
            style={{
              padding: '6px 10px', borderRadius: 6, border: `1px solid ${active ? C.ink : C.border}`,
              background: active ? '#222' : '#fff', color: active ? '#fff' : C.ink, fontSize: 13,
            }}>
            {p.individual}
          </Link>
        );
      })}
    </div>
  );
}

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
//  DIAGNOSIS — host with two tabs:
//    "Full chain"  the interactive inference graph (every value → ground truth)
//    "Summary"     the doctor-style Markdown writeup (the PDF-able artifact)
//  The patient selector is shared; both tabs render the SAME selected patient.
// ===========================================================================
// DiagnosisView — the /diagnosis index: the cohort, each patient a Link to its
// own case route. (Selecting a patient is navigation, not local state.)
export function DiagnosisView() {
  const { data: patients } = useFetch('/api/patients');
  const list = Array.isArray(patients) ? patients : [];
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Patient Diagnosis — cohort</h2>
      <p style={{ color: C.sub, fontSize: 13 }}>
        Each patient below is a real, linkable thing. Open one to walk its case up the inference DAG —
        every conclusion is <strong>derived</strong> from raw observations, none entered by hand.
      </p>
      {!list.length ? <p style={{ color: C.sub }}>Loading patients…</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {list.map((p) => (
            <Link key={p.individual_prediction_id} to={`/diagnosis/case/${p.individual_prediction_id}`}
              style={{ display: 'block', border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', background: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.individual}</div>
              <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                {p.individual_ancestry_label}{p.is_ancestry_holdout ? ' · holdout ancestry' : ''}
              </div>
              <div style={{ color: C.accent, fontSize: 12, marginTop: 6 }}>open case ›</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// The /diagnosis/case/:predictionId tabs. Each tab is a SUB-ROUTE, so selecting
// one changes the URL — F5 (and a shared link) reopens the exact same tab.
const CASE_TABS = [
  ['', 'Case walk'],
  ['report', 'Summary writeup'],
  ['evidence', 'Evidence'],
  ['mechanism', 'Mechanism'],
  ['replication', 'Replication'],
  ['controls', 'Controls'],
  ['calibration', 'Calibration'],
  ['gates', 'Gates'],
  ['keystone', 'Full chain'],
];

// CaseDetail — the canonical URL-driven case page. `routeKey` tells it which
// pane to show (diagnosis.case = walk; diagnosis.case.<sub> = that sub-pane).
// `predId` is the captured :predictionId. A patient picker links across cases;
// a tab strip links across panes. Nothing here is local selection state.
export function CaseDetail({ predId, routeKey }) {
  const { data: patients } = useFetch('/api/patients');
  const list = Array.isArray(patients) ? patients : [];
  const patient = list.find((p) => p.individual_prediction_id === predId);
  const sub = (routeKey || 'diagnosis.case').replace(/^diagnosis\.case\.?/, ''); // '' | 'evidence' | …
  const base = `/diagnosis/case/${predId}`;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>
        Case — {patient ? patient.individual : predId}
        {patient ? <span style={{ color: C.sub, fontWeight: 400, fontSize: 14 }}> · {patient.individual_ancestry_label}{patient.is_ancestry_holdout ? ', holdout' : ''}</span> : null}
      </h2>
      <PatientChips list={list} predId={predId} />

      {/* tab strip — each tab is a Link to its sub-route */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 14, flexWrap: 'wrap' }}>
        {CASE_TABS.map(([k, lbl]) => {
          const active = sub === k;
          return (
            <Link key={k || 'walk'} to={k ? `${base}/${k}` : base}
              style={{ padding: '7px 14px', borderBottom: `2px solid ${active ? C.accent : 'transparent'}`, color: active ? C.ink : C.sub, fontWeight: active ? 700 : 500, fontSize: 14 }}>
              {lbl}
            </Link>
          );
        })}
      </div>

      {!predId ? <p style={{ color: C.sub }}>No case selected.</p> : <CasePane predId={predId} sub={sub} patient={patient} />}
    </div>
  );
}

// Which pane to render for a given sub-route. Reuses the existing renderers
// where they already exist (walk, full chain, summary); the leaf-list sub-routes
// render a focused list whose rows pop a URL-addressable detail panel.
function CasePane({ predId, sub, patient }) {
  switch (sub) {
    case '': return <CaseWalkBody predId={predId} />;
    case 'keystone': return <DiagnosisChain predId={predId} patient={patient} />;
    case 'report': return <DiagnosisSummary predId={predId} />;
    case 'evidence':
    case 'mechanism':
    case 'replication':
    case 'controls':
    case 'calibration':
    case 'gates':
      return <LeafPane predId={predId} sub={sub} patient={patient} />;
    default: return <CaseWalkBody predId={predId} />;
  }
}

// ===========================================================================
//  LEAF PANES — the deep diagnosis.case.* sub-routes. Each shows a focused list
//  of leaf rows for the case; clicking a row opens a URL-addressable detail
//  DRAWER (?panel=<sub>:<id>) instead of navigating, per the "leaves pop,
//  entities navigate" rule. The drawer is in the query string, so F5 (and a
//  shared link) reopens the exact same leaf.
// ===========================================================================
const mechOf = (predId) => `cm-${predId.split('-')[1]}`; // pred-a -> cm-a (oracle convention)

// Per sub-route: how to fetch the list, the row id field, the title, and which
// columns to show. endpoint() takes the predId.
const LEAF_CONFIG = {
  evidence: {
    title: 'Qualified evidence', noun: 'evidence item', idField: 'evidence_item_id',
    endpoint: (p) => `/api/mechanisms/${mechOf(p)}/evidence`,
    cols: [['evidence_item_id', 'ID'], ['measured_effect_size', 'Effect'], ['standard_error', 'SE'], ['z_stat', 'Z'], ['is_qualified_evidence', 'Qualified']],
  },
  replication: {
    title: 'Cross-cohort replication', noun: 'replication', idField: 'cohort_replication_id',
    endpoint: (p) => `/api/mechanisms/${mechOf(p)}/replications`,
    cols: [['cohort_replication_id', 'ID'], ['replication_ancestry_label', 'Ancestry'], ['replication_effect_sign', 'Sign'], ['replication_p_value', 'p'], ['is_concordant_replication', 'Concordant']],
  },
  controls: {
    title: 'Negative controls', noun: 'control test', idField: 'negative_control_test_id',
    endpoint: (p) => `/api/mechanisms/${mechOf(p)}/controls`,
    cols: [['negative_control_test_id', 'ID'], ['permuted_effect_size', 'Permuted effect'], ['survives_negative_control', 'Survives']],
  },
  calibration: {
    title: 'Calibration bins', noun: 'calibration bin', idField: 'calibration_bin_id',
    endpoint: (p) => `/api/predictions/${p}/calibration`,
    cols: [['calibration_bin_id', 'ID'], ['nominal_coverage', 'Nominal'], ['empirical_coverage', 'Empirical'], ['is_well_calibrated_bin', 'Well-calibrated']],
  },
};

// The gates sub-route: the four keystone gates, read straight off the prediction.
function GatesPane({ predId }) {
  const { data, loading, error } = useFetch(`/api/predictions/${predId}`, [predId]);
  if (loading) return <p style={{ color: C.sub }}>Loading gates…</p>;
  if (error) return <p style={{ color: C.fail }}>{error}</p>;
  const GATES = [
    ['is_causal_mechanism_confirmed', 'Mechanism confirmed'],
    ['is_high_confidence_prediction', 'High-confidence prediction'],
    ['is_ancestry_transport_safe', 'Ancestry transport safe'],
    ['is_clinically_actionable', 'Keystone — clinically actionable'],
  ];
  return (
    <div>
      <p style={{ color: C.sub, fontSize: 13, marginTop: 0 }}>
        The keystone ANDs the first three gates. Each is itself derived — open the full chain to see how.
      </p>
      {GATES.map(([k, lbl]) => <GateChip key={k} label={lbl} value={data?.[k]} />)}
    </div>
  );
}

function LeafPane({ predId, sub, patient }) {
  const [panel, setPanel] = useQueryParam('panel');
  if (sub === 'gates') return <GatesPane predId={predId} />;
  if (sub === 'mechanism') return <MechanismPane predId={predId} />;
  const cfg = LEAF_CONFIG[sub];
  return <LeafList predId={predId} sub={sub} cfg={cfg} panel={panel} setPanel={setPanel} />;
}

function LeafList({ predId, sub, cfg, panel, setPanel }) {
  const { data, loading, error } = useFetch(cfg.endpoint(predId), [predId]);
  const rows = Array.isArray(data) ? data : [];
  const openId = panel && panel.startsWith(`${sub}:`) ? panel.slice(sub.length + 1) : null;
  const openRow = rows.find((r) => String(r[cfg.idField]) === openId);
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>{cfg.title} <span style={{ color: C.sub, fontWeight: 400, fontSize: 13 }}>({rows.length})</span></h3>
      <p style={{ color: C.sub, fontSize: 12.5, marginTop: 0 }}>Click any {cfg.noun} to open its detail — it stays in the URL, so a refresh (or a shared link) reopens the same one.</p>
      {loading ? <p style={{ color: C.sub }}>Loading…</p> : error ? <p style={{ color: C.fail }}>{error}</p> : !rows.length ? <p style={{ color: C.sub }}>No rows.</p> : (
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
          <thead><tr>{cfg.cols.map(([, h]) => <th key={h} style={{ border: `1px solid ${C.border}`, padding: '4px 8px', background: '#f5f5f5', textAlign: 'left' }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => {
              const id = String(r[cfg.idField]);
              const isOpen = id === openId;
              return (
                <tr key={id} onClick={() => setPanel(isOpen ? null : `${sub}:${id}`)}
                  style={{ cursor: 'pointer', background: isOpen ? C.bgAccent : 'transparent' }}>
                  {cfg.cols.map(([k]) => <td key={k} style={{ border: `1px solid ${C.border}`, padding: '4px 8px', fontFamily: /id$/.test(k) ? 'ui-monospace, monospace' : 'inherit' }}>{fmtVal(r[k])}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {openRow ? <LeafDrawer title={`${cfg.noun} · ${openId}`} row={openRow} onClose={() => setPanel(null)} /> : null}
    </div>
  );
}

// The URL-addressable detail drawer for one leaf row. Every field is shown
// (the leaf IS the bottom of the spreadsheet — every number visible & editable
// later). Closing clears ?panel. relative_path, if present, is shown as the
// row's own canonical URL.
function LeafDrawer({ title, row, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: '90vw', height: '100%', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', overflowY: 'auto', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: C.sub }}>×</button>
        </div>
        {row.relative_path ? (
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 10, wordBreak: 'break-all' }}>
            canonical path: <code>{row.relative_path}</code>
          </div>
        ) : null}
        <table style={{ borderCollapse: 'collapse', fontSize: 12.5, width: '100%' }}>
          <tbody>
            {Object.entries(row).map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: '3px 10px 3px 0', color: C.sub, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{k}</td>
                <td style={{ padding: '3px 0', fontFamily: 'ui-monospace, monospace' }}>{fmtVal(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// MechanismPane — the mechanism node for this case (the cm-X rollup + verdict).
function MechanismPane({ predId }) {
  const mech = mechOf(predId);
  const { data, loading, error } = useFetch(`/api/mechanisms/${mech}`, [mech]);
  if (loading) return <p style={{ color: C.sub }}>Loading mechanism…</p>;
  if (error) return <p style={{ color: C.fail }}>{error}</p>;
  const row = data && !data.error ? data : {};
  const SHOW = [
    ['causal_mechanism_id', 'Mechanism'], ['count_qualified_evidence', 'Qualified evidence'],
    ['replicates_across_cohorts', 'Replicates'], ['survives_negative_controls', 'Survives controls'],
    ['is_spurious_derived', 'Spurious'], ['is_causal_architecture_node', 'Confirmed node'],
    ['is_transportable_to_absent_ancestry', 'Transportable'],
  ];
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Mechanism node</h3>
      <p style={{ color: C.sub, fontSize: 12.5, marginTop: 0 }}>
        Aggregations over this mechanism's atoms decide whether it is a real causal-architecture node.
        Drill into <Link to={`/diagnosis/case/${predId}/evidence`} style={{ color: C.accent }}>evidence</Link>,{' '}
        <Link to={`/diagnosis/case/${predId}/replication`} style={{ color: C.accent }}>replication</Link>, or{' '}
        <Link to={`/diagnosis/case/${predId}/controls`} style={{ color: C.accent }}>controls</Link>.
      </p>
      <div>{SHOW.map(([k, lbl]) => <GateChip key={k} label={lbl} value={row[k]} />)}</div>
    </div>
  );
}

// --- the doctor-style Markdown writeup (the original payoff, kept as a tab) ---
function DiagnosisSummary({ predId }) {
  const { loading, data: md, error } = useFetch(`/api/diagnosis/${predId}`, [predId]);
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <a href={`/api/diagnosis/${predId}`} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>open raw markdown ↗</a>
      </div>
      {loading ? <p>Deriving diagnosis…</p> : error ? <p style={{ color: C.fail }}>{error}</p> : (
        <div style={{ background: '#fbfbfb', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 20px 16px' }}>
          {typeof md === 'string' ? <Markdown source={md} /> : <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(md, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
//  DIAGNOSIS — FULL CHAIN (interactive)
//  Consumes the SAME witnessed checks the harness runs (GET /api/harness),
//  filtered to one patient, laid out top-down by DAG level: conclusion first,
//  then gates → prediction scalars → individual → mechanism → atoms → variant.
//  Each node is an expandable card exposing the derivation (witness), the
//  derived value (expected/actual), and the endpoint it was read from — so
//  every value is drillable down to ground truth. No Markdown/Handlebars/HTML
//  generation: it renders the live inference graph directly.
// ===========================================================================

// DAG levels, conclusion-first. Each maps a harness `level` number to a heading
// + one-line "what this layer means" blurb.
const CHAIN_LEVELS = [
  { level: 7, key: 'keystone', title: 'Conclusion — IsClinicallyActionable', blurb: 'The keystone. Everything below resolves into this one derived boolean.', match: (c) => c.level === 7 },
  { level: 6, key: 'gates', title: 'The four gates', blurb: 'The keystone ANDs these four. Exactly one is the deciding gate for a non-actionable case.' },
  { level: 5, key: 'prediction', title: 'Prediction scalars', blurb: 'Per-prediction derivations: causal mass, predicted value, calibration, leakage/transport flags.' },
  { level: 4, key: 'individual', title: 'Individual rollups', blurb: 'Counts over this patient’s mechanisms: confirmed nodes, cross-ancestry nodes, observation flags.' },
  { level: 3, key: 'mechanism', title: 'Mechanism — aggregations & node verdict', blurb: 'Aggregations over the mechanism’s atoms up to IsCausalArchitectureNode and transportability.' },
  { level: 1, key: 'atoms', title: 'Atoms — evidence / replication / control / calibration', blurb: 'Per-row leaf derivations: ZStat qualification, concordance, control survival, bin calibration.' },
  { level: 0, key: 'variant', title: 'Variant — IsCausalCandidate', blurb: 'The bottom of the chain: raw allele frequency + ASE ⇒ candidate causal variant. Ground truth.' },
];

// Which patient does a check belong to? The endpoint always carries one of the
// patient's ids (pred-X / cm-X / ind-X-…). Routing nav-tree checks (by role) are
// not per-patient inference and are excluded.
function checkBelongsToPatient(c, p) {
  if (!p) return false;
  const letter = p.individual_prediction_id.split('-')[1]; // pred-a -> a
  // every entity id for this patient carries the letter: pred-a / cm-a / var-a-… / ind-a-…
  const ids = [p.individual_prediction_id, `cm-${letter}`, `var-${letter}-`, p.individual];
  const hay = `${c.endpoint || ''} ${c.label || ''}`;
  return ids.some((id) => hay.includes(id));
}

function statusDot(status) {
  const color = status === 'pass' ? C.pass : status === 'fail' ? C.fail : C.not_surfaced;
  return <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: color, marginRight: 8, flex: '0 0 auto' }} />;
}

// One node card: collapsed shows field = value + status; expanded reveals the
// derivation (witness), expected vs actual, and the source endpoint (provenance).
function ChainNode({ c }) {
  const [open, setOpen] = useState(false);
  const mismatch = c.status === 'fail';
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 7, marginBottom: 6, background: '#fff', overflow: 'hidden' }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', cursor: 'pointer', border: 'none', background: 'none', textAlign: 'left' }}>
        {statusDot(c.status)}
        <code style={{ fontSize: 12.5, color: C.ink, fontFamily: 'ui-monospace, monospace' }}>{c.field}</code>
        <span style={{ color: C.sub, margin: '0 6px' }}>=</span>
        <strong style={{ fontSize: 13, color: mismatch ? C.fail : C.ink }}>{fmtVal(c.actual != null || c.status === 'pass' ? c.actual : c.expected)}</strong>
        <span style={{ flex: 1 }} />
        <span style={{ color: C.sub, fontSize: 12 }}>{c.label}</span>
        <span style={{ color: C.sub, fontSize: 11, marginLeft: 8 }}>{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <div style={{ padding: '0 14px 12px 29px', fontSize: 13 }}>
          <div style={{ color: C.ink, lineHeight: 1.5, marginBottom: 8 }}>
            <span style={{ color: C.sub, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>How it’s derived</span>
            <div style={{ marginTop: 2 }}>{c.witness || '(no witness recorded)'}</div>
          </div>
          <table style={{ borderCollapse: 'collapse', fontSize: 12.5 }}>
            <tbody>
              <tr><td style={{ color: C.sub, padding: '2px 12px 2px 0' }}>derived value</td><td><strong>{fmtVal(c.actual)}</strong></td></tr>
              <tr><td style={{ color: C.sub, padding: '2px 12px 2px 0' }}>oracle expects</td><td>{fmtVal(c.expected)}</td></tr>
              <tr><td style={{ color: C.sub, padding: '2px 12px 2px 0', verticalAlign: 'top' }}>read from</td>
                <td><a href={c.endpoint} target="_blank" rel="noreferrer" style={{ color: C.accent, fontFamily: 'ui-monospace, monospace' }}>{c.endpoint} ↗</a>
                  <span style={{ color: C.sub }}> · field <code>{c.field}</code></span></td></tr>
              {c.detail ? <tr><td style={{ color: C.fail, padding: '2px 12px 2px 0' }}>note</td><td style={{ color: C.fail }}>{c.detail}</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function ChainLevel({ def, items }) {
  const [collapsed, setCollapsed] = useState(false);
  const pass = items.filter((i) => i.status === 'pass').length;
  return (
    <section style={{ marginBottom: 18 }}>
      <button onClick={() => setCollapsed((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'baseline', gap: 10, cursor: 'pointer', border: 'none', background: 'none', padding: 0, textAlign: 'left', marginBottom: 6 }}>
        <span style={{ color: C.sub, fontSize: 12 }}>{collapsed ? '▸' : '▾'}</span>
        <h3 style={{ margin: 0, fontSize: 16 }}>{def.title}</h3>
        <span style={{ fontSize: 12, color: pass === items.length ? C.pass : C.fail, fontWeight: 700 }}>{pass}/{items.length}</span>
        <span style={{ flex: 1 }} />
      </button>
      <div style={{ color: C.sub, fontSize: 12.5, marginBottom: 8, paddingLeft: 22 }}>{def.blurb}</div>
      {!collapsed ? <div style={{ paddingLeft: 22 }}>{items.map((c, i) => <ChainNode key={`${c.endpoint}:${c.field}:${i}`} c={c} />)}</div> : null}
    </section>
  );
}

function DiagnosisChain({ predId, patient }) {
  const { loading, data, error } = useFetch('/api/harness');
  // elapsed counter so a cold harness run (first load, ~15s) reads as "working", not "hung".
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!loading) return undefined;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);
  if (loading) return (
    <div style={{ color: C.sub }}>
      <p style={{ margin: '4px 0' }}>Running the witnessed inference harness — deriving every node from ground truth…</p>
      <p style={{ fontSize: 12.5, margin: 0 }}>First load runs all 303 checks (~15s); subsequent loads are cached and instant. Elapsed: {elapsed}s</p>
    </div>
  );
  if (error) return <p style={{ color: C.fail }}>{error}</p>;
  const all = Array.isArray(data?.categories) ? data.categories.flatMap((cat) => cat.items) : [];
  const mine = all.filter((c) => checkBelongsToPatient(c, patient));

  // bucket by DAG level using CHAIN_LEVELS (conclusion-first)
  const byLevel = CHAIN_LEVELS.map((def) => ({ def, items: mine.filter((c) => c.level === def.level) })).filter((b) => b.items.length);
  const keystone = mine.find((c) => c.field === 'is_clinically_actionable');
  const actionable = keystone?.actual === true;

  return (
    <div>
      {/* the conclusion banner — the same derived boolean, front and center */}
      {keystone ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: actionable ? C.bgPass : C.bgFail, border: `1px solid ${actionable ? C.pass : C.fail}` }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: actionable ? C.pass : C.fail }}>
            {actionable ? '✅ Clinically actionable' : '⛔ Not clinically actionable'}
          </div>
          <div style={{ color: C.sub, fontSize: 12.5, flex: 1 }}>{keystone.witness}</div>
        </div>
      ) : null}
      <p style={{ color: C.sub, fontSize: 12.5, marginTop: 0 }}>
        {mine.length} derived nodes for this patient, from the keystone down to ground-truth observations.
        Click any node to see its derivation and the endpoint it was read from.
      </p>
      {byLevel.map(({ def, items }) => <ChainLevel key={def.key} def={def} items={items} />)}
      {!byLevel.length ? <p style={{ color: C.sub }}>No chain nodes matched this patient.</p> : null}
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

function WalkStep({ level, patient, reached, isDeciding, drillTo }) {
  const { data } = useFetch(level.endpoint(patient), [patient.prediction, patient.individual]);
  const row = data && !data.error ? data : {};
  const dim = !reached;
  const Title = (
    <>
      {level.title} <span style={{ color: C.sub, fontWeight: 400, fontFamily: 'monospace', fontSize: 12 }}>· {level.state}</span>
    </>
  );
  return (
    <div style={{ position: 'relative', paddingLeft: 26, marginBottom: 14, opacity: dim ? 0.4 : 1 }}>
      <div style={{ position: 'absolute', left: 0, top: 2, width: 14, height: 14, borderRadius: 7, background: reached ? (isDeciding ? C.accent : C.pass) : '#ccc', border: '2px solid #fff', boxShadow: `0 0 0 1px ${C.border}` }} />
      {/* connector line */}
      <div style={{ position: 'absolute', left: 6, top: 16, bottom: -14, width: 2, background: C.border }} />
      <div style={{ fontWeight: 700, fontSize: 14 }}>
        {drillTo ? <Link to={drillTo} style={{ color: C.ink, borderBottom: `1px dotted ${C.sub}` }}>{Title}</Link> : Title}
        {isDeciding ? <span style={{ marginLeft: 8, color: C.accent, fontSize: 12, fontWeight: 700 }}>◀ deciding step</span> : null}
        {drillTo ? <span style={{ marginLeft: 8, color: C.accent, fontSize: 12 }}>drill in ›</span> : null}
      </div>
      <div style={{ fontSize: 12.5, color: C.sub, margin: '2px 0 4px' }}>{level.blurb}</div>
      <div>{level.fields.map(([k, lbl]) => <GateChip key={k} label={lbl} value={row[k]} />)}</div>
    </div>
  );
}

// CaseWalk — the admin.cohort entry point: a thin wrapper that, lacking a
// predId in the URL, renders the cohort grid (each patient a Link). The actual
// walk lives in CaseWalkBody, reused by CaseDetail's default pane.
export function CaseWalk() {
  return <DiagnosisView />;
}

// Each walk level can deep-link to the matching case sub-route, so the walk
// itself is clickable down to its evidence / mechanism / calibration panes.
const LEVEL_SUBROUTE = {
  Intake: null,
  EvidenceAssessed: 'evidence',
  MechanismConfirmed: 'mechanism',
  CalibrationChecked: 'calibration',
  TransportChecked: 'replication',
};

// CaseWalkBody — the upside-down reasoning walk for ONE case (predId from URL).
// No patient picker / header here: those belong to CaseDetail.
export function CaseWalkBody({ predId }) {
  const { data: lc } = useFetch(predId ? `/api/predictions/${predId}/lifecycle` : '/api/health', [predId]);
  const { data: pred } = useFetch(predId ? `/api/predictions/${predId}` : '/api/health', [predId]);
  const { data: dx, loading: dxLoading, error: dxError } = useFetch(predId ? `/api/diagnosis/${predId}` : '/api/health', [predId]);
  if (!pred || pred.error) return <p style={{ color: C.sub }}>Loading case…</p>;

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
      <p style={{ color: C.sub, fontSize: 13, marginTop: 0 }}>
        An upside-down reasoning model: start from the raw facts, climb the deterministic DAG one level at a time,
        and watch the case branch at its single deciding gate until the conclusion reveals itself.
        <br />Each level links to its detail pane — click any to drill in.
      </p>

      <div style={{ marginTop: 8 }}>
        {LEVELS.map((lvl, i) => {
          const reached = visited.has(lvl.state);
          // the deciding step is the LAST non-terminal level the case reached
          const nextState = LEVELS[i + 1]?.state;
          const isDeciding = reached && (terminal === 'NotActionable') && (!visited.has(nextState) && nextState !== undefined ? !visited.has(nextState) : false) && lc?.states?.[lc.states.length - 2] === lvl.state;
          const sub = LEVEL_SUBROUTE[lvl.state];
          return <WalkStep key={lvl.state} level={lvl} patient={ctx} reached={reached} isDeciding={isDeciding}
            drillTo={sub ? `/diagnosis/case/${predId}/${sub}` : null} />;
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
