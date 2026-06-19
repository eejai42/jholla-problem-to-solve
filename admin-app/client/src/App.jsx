// App.jsx — the admin shell: a role-filtered LEFT NAV (built from
// GET /api/routing/tree?role=…) driving a content pane. The witnessed harness is
// now ONE nav item (admin.harness), the diagnosis is another, and the marquee
// Case Walk is the centerpiece of the diagnosing-doctor flow.
//
// Roles: admin / intake-clinician / diagnosing-doctor. A role switcher stands in
// for magic-link auth until it lands.
import React, { useEffect, useState } from 'react';
import { C, useFetch } from './ui.jsx';
import {
  HarnessView, DiagnosisView, CaseWalk, StateMachineView, RoutingEditor, LeopoldEditor,
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

export default function App() {
  const [role, setRole] = useState('diagnosing-doctor');
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
        <label style={{ fontSize: 13, color: C.sub }}>
          Role:{' '}
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ fontSize: 13, padding: '3px 6px' }}>
            {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </label>
      </header>

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* LEFT NAV */}
        <nav style={{ width: 250, borderRight: `1px solid ${C.border}`, padding: '12px 8px', background: '#fafafa', minHeight: 'calc(100vh - 58px)' }}>
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
