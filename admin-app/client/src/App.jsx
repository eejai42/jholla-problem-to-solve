// App.jsx — the admin shell, now URL-DRIVEN. The URL is the source of truth for
// what's on screen; React never holds a "selected page" that isn't in the URL.
//   path  -> which nav route / which THING (matched against the rulebook's
//            RoutingAndNavigation route templates via routeMatch.js)
//   ?role -> which role tree is shown (shareable: a link carries its role)
//   ?tab / ?panel -> tab + open leaf-popover (handled inside the pages)
//
// The witnessed harness, the diagnosis, and the marquee Case Walk are each just
// a route. Every entity row elsewhere links to its own RelativePath, so any
// piece of the puzzle is reachable by link alone — no click-click-click.
import React, { useEffect, useState } from 'react';
import { C, useFetch, send } from './ui.jsx';
import { useLocation, useQueryParam, Link } from './router.jsx';
import { matchNavRoute, matchTemplate, segs, isParamSeg } from './routeMatch.js';
import {
  HarnessView, DiagnosisView, CaseWalk, StateMachineView, RoutingEditor, LeopoldEditor, ExplainerView, CaseDetail,
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

// route_key -> content component. A page receives { node, params, role } so it
// can read the captured URL params (e.g. params.predictionId). The diagnosis
// case routes (and their sub-routes) all resolve to CaseDetail, which keys off
// the matched route_key to decide which sub-pane to open.
const PAGES = {
  'admin.harness': () => <HarnessView />,
  'admin.cohort': () => <CaseWalk />,
  'admin.routing': ({ role }) => <RoutingEditor role={role} />,
  'admin.state-machine': () => <StateMachineView />,
  'admin.explainer': () => <ExplainerView />,
  'admin.leopold': () => <LeopoldEditor />,
  'diagnosis': () => <DiagnosisView />,
  'diagnosis.case': ({ params, node }) => <CaseDetail predId={params.predictionId} routeKey={node.route_key} />,
  'intake.new-patient': ({ params }) => <DiagnosisView caseId={params.caseId} />,
};
// every diagnosis.case.* sub-route renders CaseDetail (it picks the pane from route_key)
const CASE_SUB = ['evidence', 'mechanism', 'replication', 'controls', 'calibration', 'gates', 'keystone', 'report'];
for (const s of CASE_SUB) {
  PAGES[`diagnosis.case.${s}`] = ({ params, node }) => <CaseDetail predId={params.predictionId} routeKey={node.route_key} />;
}

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

// A nav row's concrete href. If its template has :params, fill them from the
// current match (so the active branch keeps its id) or from `defaults` (so a
// fresh click on a parameterized top-level route still lands somewhere real).
function navHref(node, captured, defaults) {
  const tmpl = node.route || '/';
  if (!tmpl.includes('/:')) return tmpl;
  const params = { ...defaults, ...captured };
  // if any param is still unknown, leave the literal prefix (drop the rest) so
  // the link is at least valid rather than containing a raw ":param".
  const parts = segs(tmpl);
  const out = [];
  for (const p of parts) {
    if (isParamSeg(p)) {
      const v = params[p.slice(1)];
      if (v == null) break; // stop at the first unresolved param
      out.push(v);
    } else out.push(p);
  }
  return '/' + out.join('/');
}

// The left-nav target for a node: { to (path), query, tab }.
// Special case: the diagnosis.case.* rows are TABS of one case, not separate
// pages. They link to the current case's path (predictionId from the active
// match or default) and tweak ONLY ?tab — so clicking a tab in the left nav
// keeps you on the same case, exactly like the in-page tab strip. Every other
// node clears ?tab (it's meaningless outside a case) and links to its own path.
function navTarget(node, captured, defaults, role) {
  const m = /^diagnosis\.case\.(.+)$/.exec(node.route_key);
  if (m) {
    const tab = m[1];
    const predictionId = captured.predictionId ?? defaults.predictionId;
    return { to: predictionId ? `/diagnosis/case/${predictionId}` : navHref(node, captured, defaults), query: { role, tab }, tab };
  }
  return { to: navHref(node, captured, defaults), query: { role }, tab: null };
}

// "Save to rulebook" — the reverse-sync trigger, pinned in the left nav.
function SaveToRulebook() {
  const [busy, setBusy] = useState(false);
  const [replace, setReplace] = useState(false);
  const [msg, setMsg] = useState(null);

  async function save() {
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

// Breadcrumbs — the parent chain of the matched node, each a Link, so every
// detail page is framed within its primary parent. Built from the flat rows by
// walking parent_route_key up from the active node.
function Breadcrumbs({ rows, activeNode, captured, defaults, role }) {
  if (!activeNode) return null;
  const byKey = Object.fromEntries(rows.map((r) => [r.route_key, r]));
  const chain = [];
  let n = activeNode;
  const guard = new Set();
  while (n && !guard.has(n.route_key)) {
    chain.unshift(n);
    guard.add(n.route_key);
    n = n.parent_route_key ? byKey[n.parent_route_key] : null;
  }
  if (chain.length < 2) return null;
  return (
    <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 12 }}>
      {chain.map((c, i) => (
        <React.Fragment key={c.route_key}>
          {i > 0 ? <span style={{ margin: '0 6px', color: C.border }}>›</span> : null}
          {i === chain.length - 1
            ? <span style={{ color: C.ink, fontWeight: 600 }}>{c.display_name}</span>
            : <Link to={navHref(c, captured, defaults)} query={{ role }} style={{ color: C.accent }}>{c.display_name}</Link>}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function App() {
  const { path, navigate } = useLocation();
  const [role, setRole] = useQueryParam('role', 'admin');
  const { data, loading } = useFetch(`/api/routing/tree?role=${role}`, [role]);
  const rows = data?.tree ? flatten(data.tree) : [];

  // Default param fills so a click on a parameterized top-level route still
  // lands on a real thing (first patient). predictionId / caseId both default
  // to the first patient's id / individual.
  const { data: patients } = useFetch('/api/patients');
  const first = Array.isArray(patients) && patients.length ? patients[0] : null;
  const defaults = first ? { predictionId: first.individual_prediction_id, caseId: first.individual } : {};

  // Resolve the active node + captured params straight from the URL.
  const matched = matchNavRoute(rows, path);
  const captured = matched ? (matchTemplateSafe(matched.route, path) || {}) : {};
  const activeNode = matched;
  // The active tab lives in ?tab (only meaningful on a case). '' = Case-walk.
  const [activeTab] = useQueryParam('tab', '');

  // Land somewhere real for "/" (and whenever the path matches no route yet).
  useEffect(() => {
    if (loading || !rows.length) return;
    if (matched) return;
    const home = role === 'admin' ? 'admin.harness'
      : role === 'intake-clinician' ? 'intake.new-patient' : 'diagnosis.case';
    const node = rows.find((r) => r.route_key === home) || rows[0];
    if (node) navigate({ path: navHref(node, {}, defaults), query: { role } }, { replace: true });
  }, [loading, rows.length, matched, role, defaults.predictionId]); // eslint-disable-line

  // Mount the explainer's ƒ provenance toggle into the pinned bottom-left slot.
  useEffect(() => {
    const mount = document.getElementById('explainer-toggle-mount');
    const ex = window.EffortlessExplainer;
    if (!mount || !ex?.mountToggle || mount.childElementCount > 0) return;
    ex.mountToggle(mount);
  }, [loading]);

  const PageFn = activeNode && PAGES[activeNode.route_key];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: C.ink, minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div>
          <Link to="/" query={{ role }}><strong style={{ fontSize: 18 }}>Causal Autoimmune Architecture</strong></Link>{' '}
          <small style={{ color: C.sub }}><HealthPill /></small>
          <div style={{ color: C.fail, fontWeight: 600, fontSize: 12 }}>Demonstration of inference structure, not validated clinical decision support.</div>
        </div>
      </header>

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* LEFT NAV — every row is a real Link to its route (with :params filled). */}
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
              const tgt = navTarget(n, captured, defaults, role);
              // active highlight: a case-tab row is active when its ?tab matches;
              // every other row is active when it's the matched node AND no tab is
              // overriding it (so the bare Case node de-highlights once a tab is on).
              const onCase = activeNode && activeNode.route_key.startsWith('diagnosis.case');
              const active = tgt.tab != null
                ? (onCase && activeTab === tgt.tab)
                : (activeNode && n.route_key === activeNode.route_key
                  && !(n.route_key === 'diagnosis.case' && activeTab));
              const onActiveBranch = activeNode && (activeNode.route_key === n.route_key || activeNode.route_key.startsWith(n.route_key + '.'));
              const isTop = n.depth === 0;
              return (
                <Link key={n.routing_and_navigation_id}
                  to={tgt.to} query={tgt.query}
                  style={{ display: 'block' }} title={n.route}>
                  <div style={{
                    padding: '6px 10px', marginLeft: n.depth * 12, borderRadius: 6, cursor: 'pointer',
                    fontWeight: isTop ? 700 : 500, fontSize: isTop ? 14 : 13,
                    color: active ? '#fff' : onActiveBranch ? C.ink : isTop ? C.ink : C.sub,
                    background: active ? C.accent : onActiveBranch ? C.bgAccent : 'transparent', margin: '1px 0',
                  }}>
                    {n.display_name}
                  </div>
                </Link>
              );
            })}
          </div>
          <SaveToRulebook />
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 12px', display: 'flex', alignItems: 'center' }}>
            <span id="explainer-toggle-mount" />
          </div>
        </nav>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: '20px 28px', maxWidth: 1000 }}>
          <Breadcrumbs rows={rows} activeNode={activeNode} captured={captured} defaults={defaults} role={role} />
          {!activeNode ? <p style={{ color: C.sub }}>Resolving route…</p>
            : PageFn ? PageFn({ node: activeNode, params: captured, role })
              : <PlaceholderPage node={activeNode} />}
        </main>
      </div>
    </div>
  );
}

// matchTemplate from routeMatch.js, but null-safe for missing templates.
function matchTemplateSafe(tmpl, path) {
  if (!tmpl) return null;
  return matchTemplate(tmpl, path);
}
