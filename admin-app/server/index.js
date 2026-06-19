// index.js — Express API for the Causal Autoimmune Architecture admin app.
//
// ============================================================================
//  RED-GREEN CONTRACT (Loop 0.5 — Test Harness First)
// ============================================================================
//  The witnessed inference harness in tests/harness/ asserts the ENTIRE
//  inference DAG — every derived node, from raw observations up to the keystone
//  IndividualPredictions.IsClinicallyActionable — for all 7 oracle patients,
//  BY HITTING THIS API (not the DB directly). That is what makes the suite
//  load-bearing on the app: the app is correct only when it faithfully surfaces
//  the inference Postgres already computes.
//
//  Today, every inference-surface endpoint deliberately returns 501 Not
//  Implemented. So the harness is RED on arrival. Loops 1–5 turn it green by
//  implementing one endpoint at a time:
//
//    Loop 1  -> GET /api/cohort                         (keystone-level list)
//            -> GET /api/predictions/:id                (full prediction panel)
//    Loop 3  -> GET /api/predictions/:id/explain        (gate-level witness)
//    Loop 3+ -> GET /api/mechanisms/:id                 (mechanism node)
//            -> GET /api/mechanisms/:id/evidence        (evidence leaves)
//            -> GET /api/mechanisms/:id/replications    (transport atoms)
//            -> GET /api/mechanisms/:id/controls        (anti-spurious atoms)
//            -> GET /api/predictions/:id/calibration    (calibration atoms)
//            -> GET /api/individuals/:id                 (per-person rollup)
//            -> GET /api/variants/:id                    (variant candidacy)
//
//  A node is "done in the UI" only when its witnessed test passes against THIS
//  running server. Do not delete a 501 — replace it with a real view read.
// ============================================================================

import express from 'express';
import { query } from './db.js';

export const app = express();
app.use(express.json());

// ---- Health: the ONE thing that is wired today (so the harness can boot) ----
app.get('/api/health', async (_req, res) => {
  try {
    const rows = await query('SELECT 1 AS ok');
    res.json({ ok: rows[0]?.ok === 1, service: 'causal-autoimmune-admin' });
  } catch (err) {
    res.status(503).json({ ok: false, error: String(err) });
  }
});

// ---------------------------------------------------------------------------
//  INFERENCE SURFACE — all 501 today. Each turns green in a future loop.
//  The shape of the contract (which fields each endpoint must return) is
//  documented next to the harness in tests/harness/contract.js.
// ---------------------------------------------------------------------------
const notYet = (loop, node) => (_req, res) =>
  res.status(501).json({
    error: 'not_implemented',
    node,
    plannedLoop: loop,
    message: `The app does not yet surface "${node}". Wire it in ${loop} (reads vw_*), then this endpoint must serve the witnessed value.`,
  });

// Keystone level (Loop 1)
app.get('/api/cohort', notYet('Loop 1', 'cohort:keystone-list'));
app.get('/api/predictions/:id', notYet('Loop 1', 'prediction:full-panel'));

// Gate-level witness (Loop 3)
app.get('/api/predictions/:id/explain', notYet('Loop 3', 'prediction:gate-witness'));

// Mechanism + leaves (Loop 3+)
app.get('/api/mechanisms/:id', notYet('Loop 3', 'mechanism:node'));
app.get('/api/mechanisms/:id/evidence', notYet('Loop 3', 'mechanism:evidence-leaves'));
app.get('/api/mechanisms/:id/replications', notYet('Loop 3', 'mechanism:replication-atoms'));
app.get('/api/mechanisms/:id/controls', notYet('Loop 3', 'mechanism:negcontrol-atoms'));

// Calibration atoms (Loop 3)
app.get('/api/predictions/:id/calibration', notYet('Loop 3', 'prediction:calibration-atoms'));

// Per-person rollup + variant candidacy (Loop 3+)
app.get('/api/individuals/:id', notYet('Loop 3', 'individual:rollup'));
app.get('/api/variants/:id', notYet('Loop 3', 'variant:candidacy'));

// ---- start only when run directly (not when imported by the harness) -------
const PORT = process.env.PORT || 4173;
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  app.listen(PORT, () => {
    console.log(`[admin-app] API listening on http://localhost:${PORT}`);
    console.log('[admin-app] Inference surface is RED (501) — see server/index.js header.');
  });
}
