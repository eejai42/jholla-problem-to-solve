// ============================================================================
//  diagnosis.js — the REAL PAYOFF: a doctor-style writeup per patient.
// ============================================================================
//  Given a prediction id, this reads the FULL inference chain the app surfaces
//  (raw facts -> derivations -> the four gates -> keystone) and renders a
//  narrative a clinician would expect:
//
//    "The patient presented with ... tests xyz confirmed abc ... therefore C."
//
//  It needs no UI: a passing run produces this artifact. Markdown today; once
//  the inference endpoints are green, the same text renders to diagnosis.pdf.
//
//  IMPORTANT: this module NEVER computes the conclusion. It consumes the derived
//  fields from vw_* (via the route layer) as opaque truth, and only arranges
//  them into prose. If a field isn't surfaced yet, the writeup says so honestly.
// ============================================================================

import { query } from './db.js';

const yn = (b) => (b === true ? 'YES' : b === false ? 'no' : '—');
const passfail = (b) => (b === true ? 'PASS' : b === false ? 'FAIL' : 'unknown');
const num = (n, d = 2) => (n == null ? '—' : Number(n).toFixed(d));

// Map the four gates to a plain-English deciding reason.
function decidingReason(p) {
  if (p.is_clinically_actionable) {
    return p.is_ancestry_holdout
      ? 'All gates pass — and, despite this ancestry being held out of training, the carried mechanism showed **measured cross-ancestry replication**, so the prediction transports.'
      : 'All four gates pass: the prediction rests on a confident, falsifiable, non-spurious mechanism, is well-calibrated, and (in-training) is transport-safe.';
  }
  // find the single failing gate, in the order the keystone ANDs them
  if (p.is_high_confidence_prediction === false) {
    if (p.calibrated_uncertainty != null && Number(p.calibrated_uncertainty) < 0.7 && p.has_spurious_correlation_flag === false)
      return '**Calibration gate FAILED:** held-out reliability coverage was insufficient (CalibratedUncertainty < 0.7), even though the mechanism is confirmed.';
    if (p.rests_on_confirmed_mechanism === false)
      return '**Anti-spurious gate FAILED:** the prediction rests on no validated causal mechanism (the candidate failed replication-sign and/or a negative control).';
    if (p.individual_has_cryptic_relatedness === true)
      return '**Anti-spurious gate FAILED (leakage):** cryptic relatedness flags the prediction as potentially confounded, despite a valid mechanism and good calibration.';
    return '**High-confidence gate FAILED** (calibration or anti-spurious).';
  }
  if (p.is_falsifiability_backed === false)
    return '**Falsifiability gate FAILED:** the mechanism has no perturbable intervention target, so it is not experimentally falsifiable.';
  if (p.is_ancestry_transport_safe === false)
    return '**Ancestry-transport gate FAILED:** this ancestry is out-of-distribution and the carried mechanism was never replicated in a different ancestry (no measured cross-ancestry invariance).';
  if (Number(p.predicted_value) <= 0)
    return '**Magnitude gate FAILED:** no mechanism-derived predicted value (rests on no confirmed causal mass).';
  return 'Not actionable (deciding gate undetermined from surfaced fields).';
}

// Build a structured diagnosis object from live views (read-only, opaque truth).
export async function buildDiagnosis(predictionId) {
  const preds = await query('SELECT * FROM vw_individual_predictions WHERE individual_prediction_id = $1', [predictionId]);
  if (!preds.length) return null;
  const p = preds[0];

  const mechs = await query('SELECT * FROM vw_causal_mechanisms WHERE individual = $1', [p.individual]);
  const variants = await query('SELECT * FROM vw_genomic_variants WHERE individual = $1', [p.individual]);
  const bins = await query('SELECT * FROM vw_calibration_bins WHERE individual_prediction = $1 ORDER BY calibration_bin_id', [predictionId]);

  // child rows for the (typically one) mechanism
  let evidence = [], reps = [], controls = [];
  if (mechs.length) {
    const cm = mechs[0].causal_mechanism_id;
    evidence = await query('SELECT * FROM vw_evidence_items WHERE causal_mechanism = $1 ORDER BY evidence_item_id', [cm]);
    reps = await query('SELECT * FROM vw_cohort_replications WHERE causal_mechanism = $1 ORDER BY cohort_replication_id', [cm]);
    controls = await query('SELECT * FROM vw_negative_control_tests WHERE causal_mechanism = $1 ORDER BY negative_control_test_id', [cm]);
  }

  return { p, mechs, variants, bins, evidence, reps, controls };
}

// Render the structured diagnosis to Markdown.
export function renderMarkdown(d) {
  if (!d) return null;
  const { p, mechs, variants, bins, evidence, reps, controls } = d;
  const m = mechs[0];
  const L = [];

  L.push(`# Diagnosis Report — ${p.individual}`);
  L.push('');
  L.push('> **Demonstration of inference structure, not validated clinical decision support.**');
  L.push(`> Generated from the derived inference chain (\`vw_*\`). Conclusion is computed, never entered.`);
  L.push('');
  L.push(`**Prediction:** ${p.individual_prediction_id} · **Disease:** ${p.autoimmune_disease || '—'} · **Type:** ${p.prediction_type || '—'}`);
  L.push(`**Ancestry:** ${p.individual_ancestry_label} ${p.is_ancestry_holdout ? '(held out of training)' : '(in training)'}`);
  L.push('');

  // ---- PRESENTATION (raw facts) ----
  L.push('## Presentation (raw observations)');
  if (variants.length) {
    for (const v of variants) {
      L.push(`- **Genomic variant ${v.genomic_variant_id}:** allele frequency ${num(v.allele_frequency, 4)} ` +
        `(${v.is_rare_variant ? 'rare' : 'common'}), allele-specific expression ${yn(v.has_allele_specific_expression)} ` +
        `⇒ candidate causal variant: **${yn(v.is_causal_candidate)}**.`);
    }
  } else {
    L.push('- No genomic variants on record.');
  }
  L.push(`- Cryptic-relatedness leakage flag: **${yn(p.individual_has_cryptic_relatedness)}**.`);
  L.push('');

  // ---- DIAGNOSTIC WORKUP (the tests) ----
  L.push('## Diagnostic workup (tests run)');
  if (m) {
    L.push(`### Mechanism ${m.causal_mechanism_id}`);
    L.push('');
    L.push('**Evidence assays:**');
    if (evidence.length) {
      for (const e of evidence) {
        L.push(`- ${e.evidence_item_id}: ZStat ${num(e.z_stat)} ` +
          `(high-quality assay ${yn(e.assay_is_high_quality)}, confound-controlled ${yn(e.is_confound_controlled)}, ` +
          `cross-modality ${yn(e.is_cross_modality)}) ⇒ qualified: **${yn(e.is_qualified_evidence)}**.`);
      }
      L.push(`- ⇒ ${m.count_qualified_evidence} qualified evidence rows across ${m.count_modalities_supporting} modalities.`);
    } else L.push('- (none)');
    L.push('');
    L.push('**Cross-cohort replication:**');
    for (const r of reps) {
      L.push(`- ${r.cohort_replication_id}: ${r.replication_ancestry_label} cohort, ` +
        `p=${num(r.replication_p_value, 3)}, sign ${r.replication_effect_sign > 0 ? '+' : r.replication_effect_sign < 0 ? '−' : '0'} ⇒ ` +
        `replicated@sig ${yn(r.replicated_at_nominal_sig)}, cross-ancestry-concordant **${yn(r.is_cross_ancestry_concordant)}**.`);
    }
    L.push(`- ⇒ ${m.count_concordant_replications}/${m.count_replications} concordant; ${m.count_cross_ancestry_concordant} cross-ancestry concordant ⇒ replicates-across-cohorts: **${yn(m.replicates_across_cohorts)}**.`);
    L.push('');
    L.push('**Negative controls:**');
    for (const c of controls) {
      L.push(`- ${c.negative_control_test_id}: permutation effect ${num(c.permutation_effect_size, 3)} vs null ±${num(c.null_threshold, 2)} ⇒ survived: **${yn(c.is_survived)}**.`);
    }
    L.push(`- ⇒ ${m.count_neg_control_survived}/${m.count_neg_control_tests} survived ⇒ survives-negative-controls: **${yn(m.survives_negative_controls)}**.`);
    L.push('');
    L.push('**Falsifiability:** ' + `${m.count_intervention_targets} intervention target(s) ⇒ experimentally falsifiable: **${yn(m.is_experimentally_falsifiable)}**.`);
    L.push('');
    L.push(`**Mechanism verdict:** causal confidence ${num(m.causal_confidence)} (threshold 0.70), spurious ${yn(m.is_spurious_derived)} ⇒ ` +
      `**IsCausalArchitectureNode = ${yn(m.is_causal_architecture_node)}**` +
      `${m.is_causal_architecture_node ? `, ancestry-transportable ${yn(m.is_ancestry_transportable)}` : ''}.`);
  } else {
    L.push('- No causal mechanisms on record for this individual.');
  }
  L.push('');
  L.push('**Calibration (reliability bins):** ' +
    `${p.count_well_calibrated_bins}/${p.count_bins} bins well-calibrated ` +
    `(coverage≥20 & |gap|≤0.1) ⇒ CalibratedUncertainty **${num(p.calibrated_uncertainty)}** (threshold 0.70).`);
  L.push('');

  // ---- ASSESSMENT (the four gates) ----
  L.push('## Assessment (the four gates)');
  L.push('');
  L.push('| Gate | Result |');
  L.push('|---|---|');
  L.push(`| Causally grounded (mechanism-derived magnitude) | **${passfail(Number(p.predicted_value) > 0)}** (PredictedValue ${num(p.predicted_value)}) |`);
  L.push(`| Well calibrated ∧ not spurious | **${passfail(p.is_high_confidence_prediction)}** |`);
  L.push(`| Falsifiability-backed | **${passfail(p.is_falsifiability_backed)}** |`);
  L.push(`| Ancestry-transport-safe | **${passfail(p.is_ancestry_transport_safe)}** |`);
  L.push('');

  // ---- CONCLUSION (keystone) ----
  L.push('## Conclusion');
  L.push('');
  L.push(`**Stratification tier:** ${p.patient_stratification_tier}`);
  L.push('');
  L.push(`### IsClinicallyActionable: ${p.is_clinically_actionable ? '✅ **TRUE**' : '⛔ **FALSE**'}`);
  L.push('');
  L.push(decidingReason(p));
  L.push('');
  L.push('---');
  L.push('_This report is the output of the witnessed inference chain. Every value above is derived from raw observations through the DAG in `bootstrap/derivation-spec.md`; none of the conclusions were entered by hand._');
  return L.join('\n');
}
