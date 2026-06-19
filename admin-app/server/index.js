// index.js — Express API for the Causal Autoimmune Architecture admin app.
//
// ============================================================================
//  WHAT THIS APP IS (see project CLAUDE.md "What this app actually IS")
// ============================================================================
//  Not a CRUD UI. A diagnostic inference engine validated by a witnessed test
//  harness, whose payoff is a doctor-style writeup per patient, derived from
//  raw facts alone.
//
//   - GET /api/harness          runs the WHOLE witnessed suite and returns the
//                               category -> test -> pass/fail+witness tree. The
//                               browser renders THIS as the home screen.
//   - GET /api/diagnosis/:id    the REAL PAYOFF — a doctor-style diagnosis
//                               report (Markdown) for one patient, derived from
//                               vw_* . Works today because the model is already
//                               solved in Postgres.
//
// ============================================================================
//  RED-GREEN CONTRACT (Loop 0.5 — Test Harness First)
// ============================================================================
//  The harness (tests/harness/) asserts the ENTIRE IsClinicallyActionable DAG
//  for all 7 oracle patients BY HITTING THIS API. The inference-surface
//  endpoints below are wired progressively; any still returning 501 show as RED
//  ("not surfaced") in the harness. As each is wired to read vw_*, its tests go
//  GREEN. That progression — red -> green — IS the build-out the user watches.
//
//  Inference-surface endpoints (and the loop that turns each green):
//    Loop 1  GET /api/cohort                      (keystone list)
//    Loop 1  GET /api/predictions/:id             (full prediction panel)
//    Loop 3  GET /api/mechanisms/:id              (mechanism node)
//    Loop 3  GET /api/mechanisms/:id/evidence     (evidence leaves)
//    Loop 3  GET /api/mechanisms/:id/replications (transport atoms)
//    Loop 3  GET /api/mechanisms/:id/controls     (anti-spurious atoms)
//    Loop 3  GET /api/predictions/:id/calibration (calibration atoms)
//    Loop 3  GET /api/individuals/:id             (per-person rollup)
//    Loop 3  GET /api/variants/:id                (variant candidacy)
// ============================================================================

import express from 'express';
import { query } from './db.js';
import { runHarness, groupByCategory } from '../tests/harness/check-engine.js';
import { buildDiagnosis, renderMarkdown } from './diagnosis.js';

export const app = express();
app.use(express.json());

// ---- Health -----------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    const rows = await query('SELECT 1 AS ok');
    res.json({ ok: rows[0]?.ok === 1, service: 'causal-autoimmune-admin' });
  } catch (err) {
    res.status(503).json({ ok: false, error: String(err) });
  }
});

// ---- THE HOME SCREEN: run the witnessed harness against THIS server ---------
// Self-hosted: we run the engine against our own listening origin so the tree
// reflects exactly what the app surfaces right now (red where 501, green where
// wired). Result: { summary, categories:[{category, level, pass, total, items}] }.
app.get('/api/harness', async (req, res) => {
  try {
    const base = `http://127.0.0.1:${req.socket.localPort}`;
    const { checks, summary } = await runHarness(base);
    res.json({ summary, categories: groupByCategory(checks) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- THE PAYOFF: a doctor-style diagnosis report for one patient ------------
app.get('/api/diagnosis/:id', async (req, res) => {
  try {
    const d = await buildDiagnosis(req.params.id);
    if (!d) return res.status(404).json({ error: 'not_found', id: req.params.id });
    const markdown = renderMarkdown(d);
    if (req.query.format === 'json') return res.json({ id: req.params.id, derived: d.p, markdown });
    res.type('text/markdown').send(markdown);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// List patients available for diagnosis (always works — reads vw_*).
app.get('/api/patients', async (_req, res) => {
  try {
    const rows = await query(
      'SELECT individual_prediction_id, individual, individual_ancestry_label, is_ancestry_holdout FROM vw_individual_predictions ORDER BY individual_prediction_id',
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
//  INFERENCE SURFACE — wired progressively. 501 = RED in the harness.
//  Replace a notYet(...) with a real vw_* read to turn its tests green.
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

// Mechanism + leaves (Loop 3)
app.get('/api/mechanisms/:id', notYet('Loop 3', 'mechanism:node'));
app.get('/api/mechanisms/:id/evidence', notYet('Loop 3', 'mechanism:evidence-leaves'));
app.get('/api/mechanisms/:id/replications', notYet('Loop 3', 'mechanism:replication-atoms'));
app.get('/api/mechanisms/:id/controls', notYet('Loop 3', 'mechanism:negcontrol-atoms'));

// Calibration atoms (Loop 3)
app.get('/api/predictions/:id/calibration', notYet('Loop 3', 'prediction:calibration-atoms'));

// Per-person rollup + variant candidacy (Loop 3)
app.get('/api/individuals/:id', notYet('Loop 3', 'individual:rollup'));
app.get('/api/variants/:id', notYet('Loop 3', 'variant:candidacy'));

// ---- start only when run directly (not when imported by the harness) -------
const PORT = process.env.PORT || 4173;
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  app.listen(PORT, () => {
    console.log(`[admin-app] API listening on http://localhost:${PORT}`);
    console.log(`[admin-app] Home screen = the witnessed harness:  GET /api/harness`);
    console.log(`[admin-app] Diagnosis payoff:                     GET /api/diagnosis/pred-a`);
    console.log('[admin-app] Inference surface is RED (501) — turns green as it is wired.');
  });
}
