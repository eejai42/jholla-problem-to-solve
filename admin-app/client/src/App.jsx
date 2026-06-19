// App.jsx — the admin shell: a role-filtered LEFT NAV (built from
// GET /api/routing/tree?role=…) driving a content pane. The witnessed harness is
// now ONE nav item (admin.harness), the diagnosis is another, and the marquee
// Case Walk is the centerpiece of the diagnosing-doctor flow.
//
// Roles: admin / intake-clinician / diagnosing-doctor. A role switcher stands in
// for magic-link auth until it lands.
import React, { useEffect, useState } from 'react';
import { C, useFetch, send } from './ui.jsx';
import {
  HarnessView, DiagnosisView, CaseWalk, StateMachineView, RoutingEditor, LeopoldEditor, ExplainerView,
} from './pages.jsx';

const ROLES = [
  { key: 'diagnosing-doctor', label: 'Diagnosing Doctor' },
  { key: 'intake-clinician', label: 'Intake Clinician' },
  { key: 'admin', label: 'Admin' },
];

function HealthPill() {
  const { data } = useFetch('/api/health');
  return data?.ok ? <span style={{ color: C.pass }}>· API up</span> : <span style={{ color: C.fail }}>· API unreachable</span>;
}

// route_key -> content component. Routes without a dedicated page fall back to a
// generic "view" stub describing the backing table (real pages come later).
const PAGES = {
  'admin.harness': () => <HarnessView />,
  'admin.cohort': () => <CaseWalk />,
  'admin.routing': (role) => <RoutingEditor role={role} />,
  'admin.state-machine': () => <StateMachineView />,
  'admin.explainer': () => <ExplainerView />,
  'admin.leopold': () => <LeopoldEditor />,
  'diagnosis': () => <CaseWalk />,
  'diagnosis.case': () => <CaseWalk />,
  'intake.new-patient': () => <DiagnosisView />,
};

function PlaceholderPage({ node }) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>{node.display_name}</h2>
      <p style={{ color: C.sub, fontSize: 13 }}>{node.description}</p>
      <div style={{ border: `1px dashed ${C.border}`, borderRadius: 8, padding: 16, color: C.sub, fontSize: 13 }}>
        Route <code>{node.route}</code> · backing view <code>{node.primary_view || '—'}</code>.
        <br />This nav node is wired; its dedicated page is part of the ongoing build-out.
      </div>
    </div>
  );
}

// Flatten the tree so the left nav can render indented rows in order.
function flatten(tree, depth = 0, out = []) {
  for (const n of tree) { out.push({ ...n, depth }); if (n.children?.length) flatten(n.children, depth + 1, out); }
  return out;
}

// "Save to rulebook" — the reverse-sync trigger, pinned in the left nav.
// Default click = upsert (safe: updates/adds rows, never deletes). The
// "full overwrite" checkbox sends mode=replace, rebuilding each entity's rows
// from its view so DB deletions also drop out of the rulebook. Either way the
// rulebook gets every CURRENT value — raw AND computed (scores, the
// IsClinicallyActionable keystone, RelativePath, counts…) — written back to disk.
function SaveToRulebook() {
  const [busy, setBusy] = useState(false);
  const [replace, setReplace] = useState(false);
  const [msg, setMsg] = useState(null);

  async function save() {
    const label = replace ? 'FULL OVERWRITE' : 'save';
    if (replace && !window.confirm(
      'Full overwrite: each table’s rulebook rows are REBUILT from the live database. '
      + 'Rows deleted in the DB will be removed from the rulebook too. Continue?')) return;
    setBusy(true); setMsg(null);
    try {
      const r = await send(`/api/snapshot-to-rulebook${replace ? '?mode=replace' : ''}`, 'POST');
      const s = r.summary || {};
      const n = replace ? `${s.replaced ?? 0} rows written`
        : `${s.updated ?? 0} updated, ${s.added ?? 0} added`;
      setMsg(`Saved to rulebook (${r.mode}): ${n}.`);
    } catch (e) {
      setMsg('Save failed: ' + e.message);
    }
    setBusy(false);
  }

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 12px' }}>
      <button onClick={save} disabled={busy}
        title="Write the live DB's current raw + computed values back into effortless-rulebook.json"
        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', cursor: busy ? 'default' : 'pointer', fontSize: 13, fontWeight: 600 }}>
        {busy ? 'Saving…' : '⇡ Save to rulebook'}
      </button>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: C.sub, cursor: 'pointer' }}>
        <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
        full overwrite (replace, not merge)
      </label>
      {msg && <div style={{ fontSize: 11, marginTop: 6, color: msg.startsWith('Save failed') ? C.fail : C.pass }}>{msg}</div>}
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState('admin');
  const { data, loading } = useFetch(`/api/routing/tree?role=${role}`, [role]);
  const rows = data?.tree ? flatten(data.tree) : [];
  const [activeKey, setActiveKey] = useState(null);

  // pick a sensible default page when the role (and thus the tree) changes
  useEffect(() => {
    if (!rows.length) return;
    const has = (k) => rows.some((r) => r.route_key === k);
    const def = role === 'admin' ? (has('admin.harness') ? 'admin.harness' : rows[0].route_key)
      : role === 'intake-clinician' ? (has('intake.new-patient') ? 'intake.new-patient' : rows[0].route_key)
        : (has('diagnosis.case') ? 'diagnosis.case' : rows[0].route_key);
    setActiveKey((cur) => (cur && rows.some((r) => r.route_key === cur) ? cur : def));
  }, [role, rows.length]); // eslint-disable-line

  // Mount the explainer's ƒ provenance toggle into the pinned bottom-left nav
  // slot, once that DOM node exists. (index.html init runs on DOMContentLoaded,
  // before React renders the nav, so the toggle is mounted here instead.)
  useEffect(() => {
    const mount = document.getElementById('explainer-toggle-mount');
    const ex = window.EffortlessExplainer;
    if (!mount || !ex?.mountToggle || mount.childElementCount > 0) return;
    ex.mountToggle(mount);
  }, [loading]);

  const activeNode = rows.find((r) => r.route_key === activeKey);
  const PageFn = activeKey && PAGES[activeKey];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: C.ink, minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div>
          <strong style={{ fontSize: 18 }}>Causal Autoimmune Architecture</strong>{' '}
          <small style={{ color: C.sub }}><HealthPill /></small>
          <div style={{ color: C.fail, fontWeight: 600, fontSize: 12 }}>Demonstration of inference structure, not validated clinical decision support.</div>
        </div>
      </header>

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* LEFT NAV — a flex column so the provenance (ƒ) toggle pins to the bottom. */}
        <nav style={{ width: 250, borderRight: `1px solid ${C.border}`, background: '#fafafa', minHeight: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
            <label style={{ display: 'block', fontSize: 12, color: C.sub, padding: '0 2px 10px' }}>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: 4, fontSize: 13, padding: '5px 6px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff' }}>
                {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </label>
            {loading ? <p style={{ color: C.sub, fontSize: 13 }}>Loading nav…</p> : rows.map((n) => {
              const active = n.route_key === activeKey;
              const isTop = n.depth === 0;
              return (
                <div key={n.routing_and_navigation_id}
                  onClick={() => setActiveKey(n.route_key)}
                  style={{
                    padding: '6px 10px', marginLeft: n.depth * 12, borderRadius: 6, cursor: 'pointer',
                    fontWeight: isTop ? 700 : 500, fontSize: isTop ? 14 : 13,
                    color: active ? '#fff' : isTop ? C.ink : C.sub,
                    background: active ? C.accent : 'transparent', margin: '1px 0',
                  }}
                  title={n.route}>
                  {n.display_name}
                </div>
              );
            })}
          </div>
          {/* Pinned bottom-left actions. "Save to rulebook" is the reverse-sync
              (DB -> rulebook); below it, the Explainer DAG (ƒ) provenance toggle
              mounts (it renders its own "PROVENANCE · ON/OFF" label). */}
          <SaveToRulebook />
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 12px', display: 'flex', alignItems: 'center' }}>
            <span id="explainer-toggle-mount" />
          </div>
        </nav>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: '20px 28px', maxWidth: 1000 }}>
          {!activeNode ? <p style={{ color: C.sub }}>Select a page from the left.</p>
            : PageFn ? PageFn(role)
              : <PlaceholderPage node={activeNode} />}
        </main>
      </div>
    </div>
  );
}
