// ============================================================================
//  dag-oracle.js — THE WITNESSED INFERENCE ORACLE
// ============================================================================
//  This is the answer key for the entire IsClinicallyActionable DAG, for all
//  seven oracle patients (A..G). It is the test-first contract for the app.
//
//  Every entry is a triple the harness checks against the running app:
//    - rawFacts : the leaf OBSERVATIONS this node bottoms out in (the only
//                 hand-entered inputs anywhere in the model).
//    - witness  : the expert-verifiable line of reasoning — the derivation
//                 from bootstrap/derivation-spec.md §3 that takes the raw facts
//                 to the expected value. A human domain expert can read this and
//                 confirm the inference is sound WITHOUT trusting the code.
//    - expected : the derived value the APP must surface (captured live from
//                 the vw_* views; this is ground truth, frozen as the oracle).
//
//  Levels (bottom-up, matching the dependency tree in the spec):
//    L0  raw observations (no derivation — included so the witness is complete)
//    L1  per-evidence / per-replication / per-control / per-bin atoms
//    L2  mechanism aggregations
//    L3  mechanism verdicts -> IsCausalArchitectureNode / IsAncestryTransportable
//    L4  individual rollups
//    L5  prediction lookups + PredictedValue + CalibratedUncertainty
//    L6  the four gates
//    L7  the keystone: IsClinicallyActionable
//
//  DO NOT "fix" a failing test by editing `expected` here. `expected` is the
//  oracle. If a test is red, either (a) the app does not yet surface the node
//  (correct — that is the point of Loop 0.5), or (b) a rule changed and the
//  oracle must be deliberately re-captured as part of that rule-change loop.
// ============================================================================

export const PATIENTS = [
  { key: 'A', individual: 'ind-a-reyes', mechanism: 'cm-a', prediction: 'pred-a', variant: 'var-a-irf5', name: 'Ana Reyes', ancestry: 'European',            holdout: false, decidingGate: 'all-pass',           actionable: true  },
  { key: 'B', individual: 'ind-b-okafor', mechanism: 'cm-b', prediction: 'pred-b', variant: 'var-b-irf5', name: 'Bili Okafor', ancestry: 'European',           holdout: false, decidingGate: 'calibration',        actionable: false },
  { key: 'C', individual: 'ind-c-chen',  mechanism: 'cm-c', prediction: 'pred-c', variant: 'var-c-stat4', name: 'Chen Wei',   ancestry: 'East Asian',          holdout: false, decidingGate: 'spurious-mechanism', actionable: false },
  { key: 'D', individual: 'ind-d-santos', mechanism: 'cm-d', prediction: 'pred-d', variant: 'var-d-irf5', name: 'Diego Santos', ancestry: 'European',          holdout: false, decidingGate: 'cryptic-relatedness', actionable: false },
  { key: 'E', individual: 'ind-e-mensah', mechanism: 'cm-e', prediction: 'pred-e', variant: 'var-e-ctla4', name: 'Esi Mensah', ancestry: 'African',            holdout: false, decidingGate: 'falsifiability',     actionable: false },
  { key: 'F', individual: 'ind-f-haidar', mechanism: 'cm-f', prediction: 'pred-f', variant: 'var-f-il23r', name: 'Faisal Haidar', ancestry: 'Indigenous American', holdout: true,  decidingGate: 'ancestry-transport', actionable: false },
  { key: 'G', individual: 'ind-g-lin',   mechanism: 'cm-g', prediction: 'pred-g', variant: 'var-g-il23r', name: 'Grace Lin',  ancestry: 'Indigenous American', holdout: true,  decidingGate: 'transport-passes',   actionable: true  },
];

export const byPrediction = (id) => PATIENTS.find((p) => p.prediction === id);

// ---------------------------------------------------------------------------
//  L7 — KEYSTONE. IsClinicallyActionable for each patient, with the single
//  deciding gate as the witness.
// ---------------------------------------------------------------------------
export const KEYSTONE = {
  'pred-a': {
    rawFacts: 'European in-training; rare IRF5 variant w/ ASE; 3 qualified evidence (ZStat 4.55/3.84/3.22, 2 cross-modality); 3 replications (2 concordant, 2 cross-ancestry); 2 neg-controls both survive; 1 intervention target; 5 calibration bins coverage 29-34 absErr<=0.02.',
    witness: 'IsHighConfidencePrediction (calibratedUncertainty 0.988>=0.7 AND NOT spurious) ∧ IsFalsifiabilityBacked (1 confirmed node) ∧ IsAncestryTransportSafe (in-training ⇒ vacuous) ∧ PredictedValue 3.02>0  ⇒  TRUE.',
    expected: { is_clinically_actionable: true },
  },
  'pred-b': {
    rawFacts: 'Same confirmed mechanism as A (own distinct effect sizes), but all 5 calibration bins are under-covered (coverage 7-14, each <20).',
    witness: 'CoverageCount 7-14 each <20 ⇒ 0 well-calibrated bins ⇒ WellCalibratedFraction 0 ⇒ CalibratedUncertainty 0<0.7 ⇒ IsHighConfidencePrediction FALSE  ⇒  KEYSTONE FALSE on the CALIBRATION gate alone (mechanism is fully confirmed).',
    expected: { is_clinically_actionable: false },
  },
  'pred-c': {
    rawFacts: 'STAT4 mechanism; replication signs +1/-1/+1 with rep-c-3 p=0.27 (>0.05) ⇒ 1 concordant; one neg-control permutation 0.46 (>0.1 null).',
    witness: 'Only 1 concordant replication (<2) ⇒ NOT ReplicatesAcrossCohorts; control 0.46>0.1 ⇒ NOT SurvivesNegativeControls ⇒ IsSpuriousDerived TRUE ⇒ NOT a node ⇒ 0 confirmed nodes ⇒ HasSpuriousCorrelationFlag TRUE  ⇒  KEYSTONE FALSE on the SPURIOUS-MECHANISM gate.',
    expected: { is_clinically_actionable: false },
  },
  'pred-d': {
    rawFacts: 'Mechanism fully confirmed like A; calibration good like A; but Individuals.HasCrypticRelatednessFlag = TRUE.',
    witness: 'Cryptic relatedness ⇒ IndividualHasCrypticRelatedness TRUE ⇒ HasSpuriousCorrelationFlag TRUE ⇒ IsHighConfidencePrediction FALSE  ⇒  KEYSTONE FALSE on the CRYPTIC-RELATEDNESS (leakage) branch of the spurious gate, despite a valid mechanism and good calibration.',
    expected: { is_clinically_actionable: false },
  },
  'pred-e': {
    rawFacts: 'CTLA4 mechanism: qualified, replicated, controls survive — BUT 0 intervention targets.',
    witness: 'CountInterventionTargets 0 ⇒ IsExperimentallyFalsifiable FALSE ⇒ NOT a node ⇒ 0 confirmed nodes ⇒ IsFalsifiabilityBacked FALSE  ⇒  KEYSTONE FALSE on the FALSIFIABILITY gate.',
    expected: { is_clinically_actionable: false },
  },
  'pred-f': {
    rawFacts: 'Indigenous-American HOLDOUT; confirmed IL23R node; all 3 replications ran in Indigenous-American (same ancestry as mechanism).',
    witness: 'All replications same-ancestry ⇒ CountCrossAncestryConcordant 0 ⇒ IsAncestryTransportable FALSE ⇒ IndividualCrossAncestryNodeCount 0 ⇒ holdout & no measured transport ⇒ IsAncestryTransportSafe FALSE  ⇒  KEYSTONE FALSE on the ANCESTRY-TRANSPORT gate (the marquee requirement).',
    expected: { is_clinically_actionable: false },
  },
  'pred-g': {
    rawFacts: 'Indigenous-American HOLDOUT (twin of F); IL23R effect replicated in European AND East-Asian cohorts (2 cross-ancestry concordant).',
    witness: 'IL23R replicated in 2 DIFFERENT ancestries ⇒ CountCrossAncestryConcordant 2 ⇒ IsAncestryTransportable TRUE ⇒ IsTransportableToAbsentAncestry TRUE ⇒ IsAncestryTransportSafe TRUE; all other gates pass  ⇒  KEYSTONE TRUE — actionable despite holdout, on MEASURED transport, not holdout-status.',
    expected: { is_clinically_actionable: true },
  },
};

// ---------------------------------------------------------------------------
//  L6 — THE FOUR GATES (per prediction). Each gate is its own witnessed value.
// ---------------------------------------------------------------------------
export const GATES = {
  // is_high_confidence_prediction  (calibrated AND not-spurious)
  // is_falsifiability_backed
  // is_ancestry_transport_safe
  // predicted_value > 0
  'pred-a': { is_high_confidence_prediction: true,  is_falsifiability_backed: true,  is_ancestry_transport_safe: true,  predicted_value_positive: true  },
  'pred-b': { is_high_confidence_prediction: false, is_falsifiability_backed: true,  is_ancestry_transport_safe: true,  predicted_value_positive: true  },
  'pred-c': { is_high_confidence_prediction: false, is_falsifiability_backed: false, is_ancestry_transport_safe: true,  predicted_value_positive: false },
  'pred-d': { is_high_confidence_prediction: false, is_falsifiability_backed: true,  is_ancestry_transport_safe: true,  predicted_value_positive: true  },
  'pred-e': { is_high_confidence_prediction: false, is_falsifiability_backed: false, is_ancestry_transport_safe: true,  predicted_value_positive: false },
  'pred-f': { is_high_confidence_prediction: true,  is_falsifiability_backed: true,  is_ancestry_transport_safe: false, predicted_value_positive: true  },
  'pred-g': { is_high_confidence_prediction: true,  is_falsifiability_backed: true,  is_ancestry_transport_safe: true,  predicted_value_positive: true  },
};

// ---------------------------------------------------------------------------
//  L6b — THE SINGLE DECIDING GATE (derived `deciding_gate`, keystone altitude).
//  This is the witnessed answer to "five fail, each on one named gate": the
//  keystone is an AND, and deciding_gate names where the AND actually breaks
//  (in keystone priority order), or 'AllGatesPass' when it holds. C and E both
//  read 'NoValidatedMechanism' on purpose: with no confirmed causal node,
//  Falsifiability/Confidence/Magnitude are one finding, not three split gates.
//  Invariant the app must satisfy: deciding_gate === 'AllGatesPass'  ⇔  keystone.
// ---------------------------------------------------------------------------
export const DECIDING_GATE = {
  'pred-a': 'AllGatesPass',
  'pred-b': 'Calibration',
  'pred-c': 'NoValidatedMechanism',
  'pred-d': 'CrypticRelatedness',
  'pred-e': 'NoValidatedMechanism',
  'pred-f': 'AncestryTransport',
  'pred-g': 'AllGatesPass',
};

// ---------------------------------------------------------------------------
//  L5 — PREDICTION-LEVEL derived scalars (lookups + PredictedValue + calibration).
// ---------------------------------------------------------------------------
export const PREDICTION_LEVEL = {
  'pred-a': { individual_causal_mass: 0.7583333, individual_confirmed_node_count: 1, individual_cross_ancestry_node_count: 1, individual_has_cryptic_relatedness: false, predicted_value: 3.0166667, count_bins: 5, count_well_calibrated_bins: 5, well_calibrated_fraction: 1.0, calibrated_uncertainty: 0.988, rests_on_confirmed_mechanism: true,  has_spurious_correlation_flag: false, is_transportable_to_absent_ancestry: false, patient_stratification_tier: 'Low-Risk Pathway' },
  'pred-b': { individual_causal_mass: 0.7583333, individual_confirmed_node_count: 1, individual_cross_ancestry_node_count: 1, individual_has_cryptic_relatedness: false, predicted_value: 3.0166667, count_bins: 5, count_well_calibrated_bins: 0, well_calibrated_fraction: 0.0, calibrated_uncertainty: 0.0,   rests_on_confirmed_mechanism: true,  has_spurious_correlation_flag: false, is_transportable_to_absent_ancestry: false, patient_stratification_tier: 'Low-Risk Pathway' },
  'pred-c': { individual_causal_mass: 0.0,       individual_confirmed_node_count: 0, individual_cross_ancestry_node_count: 0, individual_has_cryptic_relatedness: false, predicted_value: 0.0,       count_bins: 5, count_well_calibrated_bins: 5, well_calibrated_fraction: 1.0, calibrated_uncertainty: 0.984, rests_on_confirmed_mechanism: false, has_spurious_correlation_flag: true,  is_transportable_to_absent_ancestry: false, patient_stratification_tier: 'Low-Risk Pathway' },
  'pred-d': { individual_causal_mass: 0.7583333, individual_confirmed_node_count: 1, individual_cross_ancestry_node_count: 1, individual_has_cryptic_relatedness: true,  predicted_value: 3.0166667, count_bins: 5, count_well_calibrated_bins: 5, well_calibrated_fraction: 1.0, calibrated_uncertainty: 0.988, rests_on_confirmed_mechanism: true,  has_spurious_correlation_flag: true,  is_transportable_to_absent_ancestry: false, patient_stratification_tier: 'Low-Risk Pathway' },
  'pred-e': { individual_causal_mass: 0.0,       individual_confirmed_node_count: 0, individual_cross_ancestry_node_count: 0, individual_has_cryptic_relatedness: false, predicted_value: 0.0,       count_bins: 5, count_well_calibrated_bins: 5, well_calibrated_fraction: 1.0, calibrated_uncertainty: 0.988, rests_on_confirmed_mechanism: false, has_spurious_correlation_flag: true,  is_transportable_to_absent_ancestry: false, patient_stratification_tier: 'Low-Risk Pathway' },
  'pred-f': { individual_causal_mass: 0.8583333, individual_confirmed_node_count: 1, individual_cross_ancestry_node_count: 0, individual_has_cryptic_relatedness: false, predicted_value: 3.2166667, count_bins: 5, count_well_calibrated_bins: 5, well_calibrated_fraction: 1.0, calibrated_uncertainty: 0.986, rests_on_confirmed_mechanism: true,  has_spurious_correlation_flag: false, is_transportable_to_absent_ancestry: false, patient_stratification_tier: 'Low-Risk Pathway' },
  'pred-g': { individual_causal_mass: 0.8583333, individual_confirmed_node_count: 1, individual_cross_ancestry_node_count: 1, individual_has_cryptic_relatedness: false, predicted_value: 3.2166667, count_bins: 5, count_well_calibrated_bins: 5, well_calibrated_fraction: 1.0, calibrated_uncertainty: 0.984, rests_on_confirmed_mechanism: true,  has_spurious_correlation_flag: false, is_transportable_to_absent_ancestry: true,  patient_stratification_tier: 'Low-Risk Pathway' },
};

export const PREDICTION_WITNESS = {
  individual_causal_mass:               'SumConfirmedCausalConfidence over the individual\'s confirmed nodes (0 if none confirmed).',
  predicted_value:                      'min(10, 2*causalMass + 1.5*confirmedNodeCount) — rides validated causal mass only, never ancestry correlation.',
  calibrated_uncertainty:               '(1 - meanBinAbsError) * wellCalibratedFraction; 0 when no bin clears coverage>=20 (structural worst-case for absent ancestry).',
  has_spurious_correlation_flag:        'TRUE if NOT rests-on-confirmed-mechanism OR cryptic-relatedness leakage.',
  is_transportable_to_absent_ancestry:  'holdout AND >=1 cross-ancestry-replicated confirmed node AND not spurious.',
};

// ---------------------------------------------------------------------------
//  L4 — INDIVIDUAL rollups.
// ---------------------------------------------------------------------------
export const INDIVIDUAL_LEVEL = {
  'ind-a-reyes':  { count_confirmed_causal_nodes: 1, count_cross_ancestry_confirmed_nodes: 1, has_cryptic_relatedness_flag: false, is_ancestry_absent_from_training: false },
  'ind-b-okafor': { count_confirmed_causal_nodes: 1, count_cross_ancestry_confirmed_nodes: 1, has_cryptic_relatedness_flag: false, is_ancestry_absent_from_training: false },
  'ind-c-chen':   { count_confirmed_causal_nodes: 0, count_cross_ancestry_confirmed_nodes: 0, has_cryptic_relatedness_flag: false, is_ancestry_absent_from_training: false },
  'ind-d-santos': { count_confirmed_causal_nodes: 1, count_cross_ancestry_confirmed_nodes: 1, has_cryptic_relatedness_flag: true,  is_ancestry_absent_from_training: false },
  'ind-e-mensah': { count_confirmed_causal_nodes: 0, count_cross_ancestry_confirmed_nodes: 0, has_cryptic_relatedness_flag: false, is_ancestry_absent_from_training: false },
  'ind-f-haidar': { count_confirmed_causal_nodes: 1, count_cross_ancestry_confirmed_nodes: 0, has_cryptic_relatedness_flag: false, is_ancestry_absent_from_training: true  },
  'ind-g-lin':    { count_confirmed_causal_nodes: 1, count_cross_ancestry_confirmed_nodes: 1, has_cryptic_relatedness_flag: false, is_ancestry_absent_from_training: true  },
};

// ---------------------------------------------------------------------------
//  L3 — MECHANISM verdicts.  L2 — MECHANISM aggregations.
//  (one row per mechanism; aggregations + verdicts together)
// ---------------------------------------------------------------------------
export const MECHANISM_LEVEL = {
  'cm-a': { count_qualified_evidence: 3, count_modalities_supporting: 2, count_intervention_targets: 1, is_experimentally_falsifiable: true,  count_replications: 3, count_concordant_replications: 2, count_cross_ancestry_concordant: 2, replicates_across_cohorts: true,  count_neg_control_tests: 2, count_neg_control_survived: 2, survives_negative_controls: true,  is_spurious_derived: false, causal_confidence: 0.7583333, variant_is_causal_candidate: true, is_causal_architecture_node: true,  is_ancestry_transportable: true  },
  'cm-b': { count_qualified_evidence: 3, count_modalities_supporting: 2, count_intervention_targets: 1, is_experimentally_falsifiable: true,  count_replications: 3, count_concordant_replications: 2, count_cross_ancestry_concordant: 2, replicates_across_cohorts: true,  count_neg_control_tests: 2, count_neg_control_survived: 2, survives_negative_controls: true,  is_spurious_derived: false, causal_confidence: 0.7583333, variant_is_causal_candidate: true, is_causal_architecture_node: true,  is_ancestry_transportable: true  },
  'cm-c': { count_qualified_evidence: 3, count_modalities_supporting: 2, count_intervention_targets: 1, is_experimentally_falsifiable: true,  count_replications: 3, count_concordant_replications: 1, count_cross_ancestry_concordant: 0, replicates_across_cohorts: false, count_neg_control_tests: 2, count_neg_control_survived: 1, survives_negative_controls: false, is_spurious_derived: true,  causal_confidence: 0.4583333, variant_is_causal_candidate: true, is_causal_architecture_node: false, is_ancestry_transportable: false },
  'cm-d': { count_qualified_evidence: 3, count_modalities_supporting: 2, count_intervention_targets: 1, is_experimentally_falsifiable: true,  count_replications: 3, count_concordant_replications: 2, count_cross_ancestry_concordant: 2, replicates_across_cohorts: true,  count_neg_control_tests: 2, count_neg_control_survived: 2, survives_negative_controls: true,  is_spurious_derived: false, causal_confidence: 0.7583333, variant_is_causal_candidate: true, is_causal_architecture_node: true,  is_ancestry_transportable: true  },
  'cm-e': { count_qualified_evidence: 3, count_modalities_supporting: 2, count_intervention_targets: 0, is_experimentally_falsifiable: false, count_replications: 3, count_concordant_replications: 2, count_cross_ancestry_concordant: 2, replicates_across_cohorts: true,  count_neg_control_tests: 2, count_neg_control_survived: 2, survives_negative_controls: true,  is_spurious_derived: false, causal_confidence: 0.7583333, variant_is_causal_candidate: true, is_causal_architecture_node: false, is_ancestry_transportable: false },
  'cm-f': { count_qualified_evidence: 3, count_modalities_supporting: 2, count_intervention_targets: 1, is_experimentally_falsifiable: true,  count_replications: 3, count_concordant_replications: 3, count_cross_ancestry_concordant: 0, replicates_across_cohorts: true,  count_neg_control_tests: 2, count_neg_control_survived: 2, survives_negative_controls: true,  is_spurious_derived: false, causal_confidence: 0.8583333, variant_is_causal_candidate: true, is_causal_architecture_node: true,  is_ancestry_transportable: false },
  'cm-g': { count_qualified_evidence: 3, count_modalities_supporting: 2, count_intervention_targets: 1, is_experimentally_falsifiable: true,  count_replications: 3, count_concordant_replications: 3, count_cross_ancestry_concordant: 2, replicates_across_cohorts: true,  count_neg_control_tests: 2, count_neg_control_survived: 2, survives_negative_controls: true,  is_spurious_derived: false, causal_confidence: 0.8583333, variant_is_causal_candidate: true, is_causal_architecture_node: true,  is_ancestry_transportable: true  },
};

export const MECHANISM_WITNESS = {
  is_causal_architecture_node:  'CausalConfidence>=0.7 ∧ IsExperimentallyFalsifiable ∧ NOT IsSpuriousDerived ∧ (variant candidate OR exposure).',
  is_spurious_derived:          'spurious if NOT ReplicatesAcrossCohorts OR NOT SurvivesNegativeControls OR <2 modalities OR pleiotropy.',
  is_experimentally_falsifiable:'>=1 intervention target ∧ >=1 qualified evidence.',
  is_ancestry_transportable:    'a confirmed node whose effect replicated in >=1 DIFFERENT ancestry (CountCrossAncestryConcordant>=1).',
  causal_confidence:            '0.30*min(1,qualEv/4)+0.20*min(1,modalities/3)+0.30*replFraction+0.20*survivesControls, capped at 1.',
};

// ---------------------------------------------------------------------------
//  L1 — ATOMS: per-evidence, per-replication, per-control, per-bin derivations.
//  These are the rows that the L2 aggregations count over. We assert a
//  representative, story-critical atom per mechanism/prediction.
// ---------------------------------------------------------------------------
export const EVIDENCE_ATOMS = {
  // mechanism -> the qualified-evidence count its rows produce, with the ZStat witness
  'cm-a': { count_qualified: 3, witness: 'ZStat = |effect|/SE = 0.91/0.20 = 4.55 (and 3.84, 3.22) all >=2, high-quality assay, confound-controlled, not control-arm ⇒ all 3 qualify.' },
  'cm-c': { count_qualified: 3, witness: 'Same evidence quality as A (3 qualify) — C\'s failure is at replication/control, NOT evidence.' },
  'cm-e': { count_qualified: 3, witness: 'Evidence qualifies (3) — E\'s failure is the missing intervention target, NOT evidence.' },
};

export const REPLICATION_ATOMS = {
  // the single deciding replication fact per transport-relevant mechanism
  'cm-c': { count_cross_ancestry_concordant: 0, witness: 'rep-c-2 sign -1 (discordant) and rep-c-3 p=0.27 (>0.05) ⇒ only 1 concordant; cross-ancestry concordant 0.' },
  'cm-f': { count_cross_ancestry_concordant: 0, witness: 'All 3 replications ran in Indigenous-American = mechanism ancestry ⇒ IsDifferentAncestryReplication FALSE for all ⇒ 0 cross-ancestry concordant.' },
  'cm-g': { count_cross_ancestry_concordant: 2, witness: 'rep-g-1 (European, p=0.004,+1) and rep-g-2 (East Asian, p=0.012,+1) are sig + different-ancestry ⇒ 2 cross-ancestry concordant.' },
};

export const CONTROL_ATOMS = {
  'cm-a': { count_survived: 2, witness: 'nct-a-1 (0.012) and nct-a-2 (0.028) both within +/-0.1 null band ⇒ both survive ⇒ SurvivesNegativeControls.' },
  'cm-c': { count_survived: 1, witness: 'nct-c-2 permutationEffectSize 0.46 > 0.1 null threshold ⇒ does NOT collapse ⇒ NOT survived ⇒ SurvivesNegativeControls FALSE.' },
};

export const CALIBRATION_ATOMS = {
  'pred-a': { count_well_calibrated_bins: 5, witness: 'All 5 bins coverage 29-34 (>=20) and binAbsError<=0.02 (<=0.1) ⇒ all well-calibrated.' },
  'pred-b': { count_well_calibrated_bins: 0, witness: 'All 5 bins coverage 7-14 (<20) ⇒ NONE well-calibrated, regardless of low abs error ⇒ the calibration gate fails here alone.' },
};

// ---------------------------------------------------------------------------
//  L0 — RAW OBSERVATIONS (variant candidacy is the lowest derived bit; the
//  allele-frequency / ASE facts beneath it are pure observations).
// ---------------------------------------------------------------------------
export const VARIANT_LEVEL = {
  'var-a-irf5':  { allele_frequency: 0.006, is_rare_variant: true, has_allele_specific_expression: true, is_causal_candidate: true },
  'var-c-stat4': { allele_frequency: 0.008, is_rare_variant: true, has_allele_specific_expression: true, is_causal_candidate: true },
  'var-f-il23r': { allele_frequency: 0.009, is_rare_variant: true, has_allele_specific_expression: true, is_causal_candidate: true },
};

export const VARIANT_WITNESS =
  'IsCausalCandidate = (rare-by-frequency OR rare-by-class) AND HasAlleleSpecificExpression. ' +
  'All seven seed variants are rare + ASE ⇒ candidate TRUE; candidacy alone does NOT confirm a node.';

// Numeric tolerance for the few non-integer derived scalars.
export const TOL = 1e-3;

// ===========================================================================
//  L8 — LIFECYCLE PATHS (the case-by-case walk through the diagnosis machine).
// ===========================================================================
//  Each patient walks its OWN branch from Intake down to a terminal, stopping
//  at its single deciding gate. The path is DERIVED from the frozen decidingGate
//  above — NOT hand-typed independently — so this section can never drift from
//  the keystone oracle. The app must surface the same ordered StateKeys via
//  GET /api/predictions/:id/lifecycle (states[]), ending at `terminal`.
//
//  Machine spine: Intake → EvidenceAssessed → MechanismConfirmed →
//                 CalibrationChecked → TransportChecked → Actionable.
//  A failing gate diverts to NotActionable at the step that gate is checked.
// ---------------------------------------------------------------------------
const SPINE = ['Intake', 'EvidenceAssessed', 'MechanismConfirmed', 'CalibrationChecked', 'TransportChecked', 'Actionable'];

// decidingGate -> the spine state AFTER which the case diverts to NotActionable.
// (all-pass / transport-passes ride the full spine to Actionable.)
const DIVERT_AFTER = {
  'spurious-mechanism': 'EvidenceAssessed',   // C: not a node ⇒ stop after evidence
  'falsifiability': 'EvidenceAssessed',       // E: 0 intervention targets ⇒ stop after evidence
  'cryptic-relatedness': 'MechanismConfirmed', // D: leakage ⇒ stop after mechanism
  'calibration': 'CalibrationChecked',        // B: uncertainty<0.7 ⇒ stop after calibration
  'ancestry-transport': 'TransportChecked',   // F: not transport-safe ⇒ stop after transport
};

// Build the ordered lifecycle path for one patient from its decidingGate.
function pathFor(p) {
  if (p.actionable) return [...SPINE]; // A, G ride to Actionable
  const after = DIVERT_AFTER[p.decidingGate];
  const upto = SPINE.slice(0, SPINE.indexOf(after) + 1);
  return [...upto, 'NotActionable'];
}

export const LIFECYCLE_PATHS = Object.fromEntries(
  PATIENTS.map((p) => {
    const states = pathFor(p);
    return [p.prediction, {
      states,
      terminal: states[states.length - 1],
      is_clinically_actionable: p.actionable,
      witness: `${p.key} · ${p.name}: walks ${states.join(' → ')} — diverges at the ${p.decidingGate} gate; the IsCurrent occupancy's StateKey must equal the derived LifecycleStateKey.`,
    }];
  }),
);

// ===========================================================================
//  L9 — ROUTING: per-entity RelativePath + the role nav trees.
// ===========================================================================
//  RelativePath is a computed field assembling each entity's own page path,
//  chaining its parent's path where hierarchical. We assert one representative
//  row per depth so the chain (case → prediction → bins) is witnessed. The app
//  surfaces relative_path on every vw_* row (e.g. /api/predictions/:id).
export const ROUTING = {
  // entity endpoint + id field -> expected relative_path
  relativePaths: [
    { endpoint: '/api/individuals/ind-a-reyes', field: 'relative_path', expected: '/intake/new-patient/reyes-ana' },
    { endpoint: '/api/predictions/pred-a', field: 'relative_path', expected: '/intake/new-patient/reyes-ana/predictions/pred-a' },
    { endpoint: '/api/mechanisms/cm-a', field: 'relative_path', expected: '/intake/new-patient/reyes-ana/mechanisms/cm-a' },
    { endpoint: '/api/variants/var-a-irf5', field: 'relative_path', expected: '/intake/new-patient/reyes-ana/variants/var-a-irf5' },
  ],
  // role -> the set of TOP-LEVEL route_keys that role can see (admin sees all 3 trees).
  navTrees: {
    'intake-clinician': ['intake'],
    'diagnosing-doctor': ['diagnosis'],
    'admin': ['intake', 'diagnosis', 'admin'],
  },
};
