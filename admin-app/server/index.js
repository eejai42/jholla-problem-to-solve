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
import { router as routingRouter } from './routes/routing.js';
import { router as stateMachineRouter } from './routes/state-machines.js';
import { router as leopoldRouter } from './routes/leopold.js';

export const app = express();
app.use(express.json());

// ---- small helpers for the inference surface (read vw_*; project rule) -------
// one(view, idCol): serve a single row by id, 404 if missing.
const one = (view, idCol) => async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM ${view} WHERE ${idCol} = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'not_found', id: req.params.id });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: String(err) }); }
};
// many(view, fkCol, orderCol): serve all rows whose FK column == :id.
const many = (view, fkCol, orderCol) => async (req, res) => {
  try {
    const order = orderCol ? ` ORDER BY ${orderCol}` : '';
    res.json(await query(`SELECT * FROM ${view} WHERE ${fkCol} = $1${order}`, [req.params.id]));
  } catch (err) { res.status(500).json({ error: String(err) }); }
};

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
//  INFERENCE SURFACE — wired to vw_* (project rule: read views, never base).
//  These are what the witnessed harness asserts against. Each serves the
//  deterministic derived value for one DAG node so its tests go GREEN.
// ---------------------------------------------------------------------------

// Keystone level — cohort list + full prediction panel.
app.get('/api/cohort', async (_req, res) => {
  try {
    res.json(await query('SELECT * FROM vw_individual_predictions ORDER BY individual_prediction_id'));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});
app.get('/api/predictions/:id', one('vw_individual_predictions', 'individual_prediction_id'));

// The MARQUEE walk: each case's ordered path through the diagnosis-lifecycle machine,
// ending at its deciding terminal. Anchors the case-by-case "upside-down" presentation.
app.get('/api/predictions/:id/lifecycle', async (req, res) => {
  try {
    const pred = (await query(
      'SELECT individual_prediction_id, lifecycle_state_key, is_clinically_actionable FROM vw_individual_predictions WHERE individual_prediction_id = $1',
      [req.params.id],
    ))[0];
    if (!pred) return res.status(404).json({ error: 'not_found', id: req.params.id });
    const instances = await query(
      `SELECT state_key, entered_at, exited_at, sequence_index::int AS sequence_index,
              is_current, entered_via_transition, prior_instance
       FROM vw_subject_state_instances
       WHERE subject_table_name = 'IndividualPredictions' AND subject_id = $1
       ORDER BY sequence_index`,
      [req.params.id],
    );
    const transitions = await query(
      `SELECT from_state_key, to_state_key, transition_at, triggered_by_role, reason
       FROM vw_state_transitions
       WHERE subject_table_name = 'IndividualPredictions' AND subject_id = $1
       ORDER BY transition_at`,
      [req.params.id],
    );
    res.json({
      prediction: req.params.id,
      states: instances.map((i) => i.state_key),
      current: pred.lifecycle_state_key,
      terminal: instances.length ? instances[instances.length - 1].state_key : null,
      is_clinically_actionable: pred.is_clinically_actionable,
      instances,
      transitions,
    });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// Mechanism node + its leaf atoms.
app.get('/api/mechanisms/:id', one('vw_causal_mechanisms', 'causal_mechanism_id'));
app.get('/api/mechanisms/:id/evidence', many('vw_evidence_items', 'causal_mechanism', 'evidence_item_id'));
app.get('/api/mechanisms/:id/replications', many('vw_cohort_replications', 'causal_mechanism', 'cohort_replication_id'));
app.get('/api/mechanisms/:id/controls', many('vw_negative_control_tests', 'causal_mechanism', 'negative_control_test_id'));

// Calibration atoms (per prediction).
app.get('/api/predictions/:id/calibration', many('vw_calibration_bins', 'individual_prediction', 'calibration_bin_id'));

// Per-person rollup + variant candidacy.
app.get('/api/individuals/:id', one('vw_individuals', 'individual_id'));
app.get('/api/variants/:id', one('vw_genomic_variants', 'genomic_variant_id'));

// ---------------------------------------------------------------------------
//  ROUTING & NAVIGATION + STATE MACHINE surfaces (the new admin tooling).
// ---------------------------------------------------------------------------
app.use('/api/routing', routingRouter);
app.use('/api/state-machines', stateMachineRouter);
app.use('/api/leopold-loops', leopoldRouter);

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
