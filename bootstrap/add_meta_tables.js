#!/usr/bin/env node
/**
 * Append the 7 "reasoning-capture" tables to the rulebook, seeded from the
 * gauntlet conversation. Idempotent: skips a table if it already exists.
 * Conventions match the existing rulebook exactly:
 *   - each table is a top-level key: { Description, schema:[fieldObj], data:[rowObj] }
 *   - fieldObj: { name, datatype, type, nullable, Description, formula? }
 *   - every table has a calculated "Name" field
 *   - FK references are plain string fields holding the parent's id
 */
const fs = require('fs');
const path = require('path');
const RB = path.join(__dirname, '..', 'effortless-rulebook', 'effortless-rulebook.json');
const r = JSON.parse(fs.readFileSync(RB, 'utf8'));

const raw = (name, datatype, Description, nullable = false) => ({ name, datatype, type: 'raw', nullable, Description });
const nameField = (formula) => ({ name: 'Name', datatype: 'string', type: 'calculated', nullable: true, Description: 'Display label.', formula });

const tables = {
  Axioms: {
    Description: 'Non-negotiable invariants the platform must obey. Load-bearing constraints, not per-loop work. Captured from the gauntlet conversation.',
    schema: [
      raw('AxiomId', 'string', 'Stable identifier for the axiom.'),
      raw('Statement', 'string', 'The invariant, stated as a rule.'),
      raw('Rationale', 'string', 'Why this must hold / what it defends against.'),
      raw('Category', 'string', 'Grouping: trust-boundary | solve-by-inference | knob | witness | scope.'),
      nameField('={{Statement}}'),
    ],
    data: [
      { AxiomId: 'ax-llm-no-vote', Statement: 'The LLM never gets a vote on the conclusion.', Rationale: 'Demotes the model to intake-clerk + lab; the verdict is the deterministic DAG\'s, never the model\'s.', Category: 'trust-boundary' },
      { AxiomId: 'ax-keystone-computed', Statement: 'IsClinicallyActionable is computed, never entered.', Rationale: 'No field a curator (human or LLM) can set to make the diagnosis come out right.', Category: 'solve-by-inference' },
      { AxiomId: 'ax-line-in-dag', Statement: 'The trust boundary is a line in the DAG: fields with a formula are the model\'s; raw-input leaf fields are the LLM\'s (or a human\'s).', Rationale: 'Makes the boundary mechanically checkable rather than a vibe.', Category: 'trust-boundary' },
      { AxiomId: 'ax-llm-leaves-only', Statement: 'The LLM does exactly two things, both at the leaf layer: interpret intake facts, and produce synthetic-but-transparent test results.', Rationale: 'Intake clerk + lab — the un-alarming medical roles. It computes no higher-order inference.', Category: 'trust-boundary' },
      { AxiomId: 'ax-every-choice-knob', Statement: 'Every choice the LLM makes is a literal, editable knob in the admin UI.', Rationale: 'The model\'s judgment is fully externalized; a wrong input is nudged, not re-prompted.', Category: 'knob' },
      { AxiomId: 'ax-formula-local-edit', Statement: 'Every DAG formula is inspectable and correctable in place, like a spreadsheet cell.', Rationale: 'Editing a value or formula body is local to its dependency subtree; only retyping/regraphing ripples.', Category: 'knob' },
      { AxiomId: 'ax-independent-witness', Statement: 'Extraction and derivation are verifiable independently (three-panel witness).', Rationale: 'Input case text -> extracted facts w/ provenance -> deterministic diagnosis. Defeats the laundering objection.', Category: 'witness' },
      { AxiomId: 'ax-both-verdicts', Statement: 'The same deterministic machine must land on either side and name the single deciding gate.', Rationale: 'An engine that only ever says "actionable" proves nothing.', Category: 'solve-by-inference' },
    ],
  },

  TestsForSuccess: {
    Description: 'Falsifiable conditions that prove the axioms hold. The human-readable index of what each demonstration shows; many are realized in the witnessed harness.',
    schema: [
      raw('TestForSuccessId', 'string', 'Stable identifier.'),
      raw('Claim', 'string', 'The success condition, stated falsifiably.'),
      raw('HowWitnessed', 'string', 'How a human/expert confirms it without trusting the code.'),
      raw('RelatedHarnessFile', 'string', 'Harness file that realizes it, if any.', true),
      raw('Status', 'string', 'red | green | planned.'),
      nameField('={{Claim}}'),
    ],
    data: [
      { TestForSuccessId: 'tfs-one-gate-each', Claim: 'Five of seven patients fail, each on exactly one gate.', HowWitnessed: 'Coverage matrix in scenarios.md; L6/L7 harness assert the deciding gate per patient.', RelatedHarnessFile: 'admin-app/tests/L6-gates.test.js', Status: 'red' },
      { TestForSuccessId: 'tfs-both-sides', Claim: 'The same machine produces TRUE for {A,G} and FALSE for {B,C,D,E,F}.', HowWitnessed: 'L7-cohort.test.js asserts exactly {A,G} actionable as a set.', RelatedHarnessFile: 'admin-app/tests/L7-cohort.test.js', Status: 'red' },
      { TestForSuccessId: 'tfs-no-hand-entry', Claim: 'Raw facts alone derive the keystone with no hand-entered answer anywhere.', HowWitnessed: 'Every leaf in the harness is a raw observation; keystone == AND(gates) cross-check.', RelatedHarnessFile: 'admin-app/tests/L7-keystone.test.js', Status: 'red' },
      { TestForSuccessId: 'tfs-extraction-faithful', Claim: 'Extracted leaf facts are checkable against the source case text, independently of the verdict.', HowWitnessed: 'Three-panel witness view: per-fact provenance pointer back into the case text.', RelatedHarnessFile: '', Status: 'planned' },
      { TestForSuccessId: 'tfs-all-seven', Claim: 'All seven oracle patients resolve to their expected keystone value.', HowWitnessed: 'Build verification asserts the scenarios.md oracle against vw_individualpredictions.', RelatedHarnessFile: 'admin-app/tests/L7-keystone.test.js', Status: 'red' },
      { TestForSuccessId: 'tfs-witnessed-reasoning', Claim: 'Each derived node carries an expert-verifiable line of reasoning.', HowWitnessed: 'Derivation trace from derivation-spec.md printed in every test name/failure.', RelatedHarnessFile: 'admin-app/tests/README.md', Status: 'red' },
    ],
  },

  Features: {
    Description: 'Buildable capabilities surfaced by the conversation. Coarser grain than loops; AssignedLoop links a feature to the loop that delivers it (nullable until scheduled).',
    schema: [
      raw('FeatureId', 'string', 'Stable identifier.'),
      raw('Title', 'string', 'Short feature name.'),
      raw('Description', 'string', 'What it does.'),
      raw('AssignedLoop', 'string', 'FK -> LeopoldLoops.LeopoldLoopId; empty if unscheduled.', true),
      nameField('={{Title}}'),
    ],
    data: [
      { FeatureId: 'feat-llm-intake-clerk', Title: 'LLM intake clerk', Description: 'LLM reads a natural-language case and writes raw intake observation rows (ancestry, allele freqs, presenting facts) to base tables.', AssignedLoop: '' },
      { FeatureId: 'feat-synthetic-lab', Title: 'Synthetic-but-transparent lab generator', Description: 'LLM emits the case\'s test results (effect sizes/SEs, replication signs/p-values, permutation effect sizes, calibration coverage) as visible, sourced, editable leaf rows.', AssignedLoop: '' },
      { FeatureId: 'feat-three-panel-witness', Title: 'Three-panel witness view', Description: 'Input case text | extracted facts with provenance | deterministic diagnosis + four-gate trace.', AssignedLoop: '' },
      { FeatureId: 'feat-knob-edit-ui', Title: 'Knob-editing admin UI', Description: 'Every LLM-produced leaf value is an editable field; correcting it re-derives the DAG.', AssignedLoop: 'loop-2' },
      { FeatureId: 'feat-gate-explainability', Title: 'Gate explainability', Description: 'For a patient, show why each gate passed/failed by walking one level down (coverage, cross-ancestry count, etc.).', AssignedLoop: 'loop-3' },
      { FeatureId: 'feat-diagnosis-writeup', Title: 'Per-patient diagnosis writeup', Description: 'Doctor-style Markdown writeup (-> diagnosis.pdf once green) produced as an artifact of a passing run.', AssignedLoop: '' },
    ],
  },

  OpenQuestions: {
    Description: 'Decisions still pending, captured so they are not silently re-litigated in a later session.',
    schema: [
      raw('OpenQuestionId', 'string', 'Stable identifier.'),
      raw('Question', 'string', 'The open question.'),
      raw('Context', 'string', 'Why it is open / what it affects.'),
      raw('Resolution', 'string', 'The decision, once made.', true),
      raw('IsResolved', 'boolean', 'TRUE when decided.'),
      nameField('={{Question}}'),
    ],
    data: [
      { OpenQuestionId: 'oq-publish-now', Question: 'Publish README now as a design/thesis doc, or hold until the harness goes green?', Context: 'Repo is at Loop 0.5 (harness red, no LLM intake yet). Receipts land harder green.', Resolution: '', IsResolved: false },
      { OpenQuestionId: 'oq-extract-vs-invent', Question: 'Does the LLM extract facts present in the case, or invent plausible facts for a described case?', Context: 'Mode #1 (extract) vs mode #2 (invent) changes how strong the claim is.', Resolution: 'Mode #1 at intake (extract/interpret), and synthetic-but-transparent test results for the invented case — every number visible, sourced, editable.', IsResolved: true },
      { OpenQuestionId: 'oq-reworded-prompt', Question: 'Confirm the reworded README prompt shares no distinctive phrasing with the prospect\'s original.', Context: 'Anonymity / no verbatim leakage before publishing.', Resolution: '', IsResolved: false },
    ],
  },

  NonGoals: {
    Description: 'Explicit out-of-scope statements — the positive twin of the anti-hallucination ledger. Stops scope creep.',
    schema: [
      raw('NonGoalId', 'string', 'Stable identifier.'),
      raw('Statement', 'string', 'What we are deliberately NOT doing.'),
      raw('WhyExcluded', 'string', 'Why it is off the keystone path / out of scope.'),
      nameField('={{Statement}}'),
    ],
    data: [
      { NonGoalId: 'ng-clinical-use', Statement: 'This is not validated clinical decision support and must never be used for clinical purposes.', WhyExcluded: 'Demonstration of inference structure only; all patients synthetic, all figures literature ranges.' },
      { NonGoalId: 'ng-crud-ui', Statement: 'This is not a CRUD UI.', WhyExcluded: 'The home screen is the witnessed red/green harness; the payoff is a derived diagnosis writeup.' },
      { NonGoalId: 'ng-llm-reasoning', Statement: 'The LLM does not perform higher-order reasoning or render the diagnosis.', WhyExcluded: 'All reasoning lives in the open, editable DAG; the LLM is intake clerk + lab only.' },
      { NonGoalId: 'ng-full-breadth', Statement: 'The full omics breadth (counterfactual trajectories, most modalities, epistasis, exposures) is not on the keystone\'s dependency path.', WhyExcluded: 'Kept as deliberate sparse context for breadth; pulled onto the path only when it earns its place (anti-hallucination rule).' },
      { NonGoalId: 'ng-publish-verbatim', Statement: 'Never publish the prospect\'s verbatim problem text.', WhyExcluded: 'Anonymity / good manners; the public artifact uses a reworded generic grand-challenge prompt.' },
    ],
  },

  GlossaryTerms: {
    Description: 'Vocabulary coined in the gauntlet conversation, so the framing is shared and stable across sessions.',
    schema: [
      raw('GlossaryTermId', 'string', 'Stable identifier.'),
      raw('Term', 'string', 'The term.'),
      raw('Definition', 'string', 'What it means here.'),
      nameField('={{Term}}'),
    ],
    data: [
      { GlossaryTermId: 'gt-knob', Term: 'knob', Definition: 'A literal, editable leaf value in the admin UI representing one choice the LLM (or a human) made; nudged, not re-prompted, when wrong.' },
      { GlossaryTermId: 'gt-intake-clerk-lab', Term: 'intake clerk + lab', Definition: 'The only two roles the LLM plays: interpret intake facts (clerk) and produce the case\'s test results (lab). Never the diagnostician.' },
      { GlossaryTermId: 'gt-line-in-dag', Term: 'line in the DAG', Definition: 'The trust boundary, stated mechanically: fields with a formula belong to the model; raw-input leaf fields are the LLM\'s or a human\'s.' },
      { GlossaryTermId: 'gt-three-panel-witness', Term: 'three-panel witness', Definition: 'Input case text | extracted facts with per-fact provenance | deterministic diagnosis + gate trace — the two halves checkable independently.' },
      { GlossaryTermId: 'gt-fake-but-transparent', Term: 'fake-but-transparent', Definition: 'Test results are synthetic (the case is invented) but every number is visible, sourced to the case, and editable; nothing is hidden.' },
      { GlossaryTermId: 'gt-laundering-objection', Term: 'laundering objection', Definition: 'The skeptic\'s claim that a deterministic function over LLM-chosen inputs just launders a hallucination; defeated by externalized knobs + independent witness.' },
    ],
  },

  LeopoldLoops: {
    Description: 'The ordered Leopold loops that build this platform, as data. The derived plan (LEOPOLD_LOOPING_PLAN.md, via json-hbars-transform) is generated from these rows; Completedness decides what shows in the current PLAN.',
    schema: [
      raw('LeopoldLoopId', 'string', 'Stable identifier.'),
      raw('LoopNumber', 'string', 'Display number (0, 0.5, 1...).'),
      raw('Title', 'string', 'Loop title.'),
      raw('Goal', 'string', 'The one coherent rule-change / outcome.'),
      raw('Status', 'string', 'done | next | planned | backlog (the raw input that drives Completedness).'),
      raw('RuleCommitMsg', 'string', 'The rule commit message (or "none — app-only loop").', true),
      raw('StateCommitMsg', 'string', 'The state commit message.', true),
      raw('SortOrder', 'number', 'Ordering within the plan.'),
      nameField('=CONCATENATE("Loop ", {{LoopNumber}}, " — ", {{Title}})'),
      { name: 'Completedness', datatype: 'string', type: 'calculated', nullable: true, Description: 'Normalized status used by the derived plan to decide placement.', formula: '={{Status}}' },
      { name: 'IsInCurrentPlan', datatype: 'boolean', type: 'calculated', nullable: true, Description: 'TRUE for the current "next" loop and anything still planned/backlog (not done).', formula: '=IF({{Status}} = "done", FALSE, TRUE)' },
    ],
    data: [
      { LeopoldLoopId: 'loop-0', LoopNumber: '0', Title: 'Solve-by-inference rulebook', Goal: 'Convert 7 hand-entered answers to derived; add evidence/replication/control/calibration tables; wire raw observations -> keystone.', Status: 'done', RuleCommitMsg: 'rule: keystone IsClinicallyActionable now derived from observations', StateCommitMsg: 'state: Loop 0 — Postgres solve-by-inference verified', SortOrder: 0 },
      { LeopoldLoopId: 'loop-0-5', LoopNumber: '0.5', Title: 'Test Harness First (the red contract)', Goal: 'Ship a witnessed inference harness asserting the entire DAG x 7 patients via the app API; red on arrival, load-bearing.', Status: 'next', RuleCommitMsg: 'none — app-only loop, test-harness-first, no rule change', StateCommitMsg: 'state: Loop 0.5 — red witnessed-inference harness is the app\'s contract', SortOrder: 1 },
      { LeopoldLoopId: 'loop-1', LoopNumber: '1', Title: 'Intake app skeleton', Goal: 'Turn keystone-level red tests green: wire cohort + prediction-panel endpoints reading vw_*.', Status: 'planned', RuleCommitMsg: 'none — app-only loop, no rule change', StateCommitMsg: 'state: Loop 1 — read-only intake app surfaces the keystone', SortOrder: 2 },
      { LeopoldLoopId: 'loop-2', LoopNumber: '2', Title: 'Patient intake (facts in)', Goal: 'Form writes a new Individual + child observation rows to base tables, then re-reads the derived panel. The knob-editing payoff.', Status: 'planned', RuleCommitMsg: 'rule (if any) for new intake field', StateCommitMsg: 'state: Loop 2 — facts-in -> derived diagnosis works end to end', SortOrder: 3 },
      { LeopoldLoopId: 'loop-3', LoopNumber: '3', Title: 'Gate explainability in the UI', Goal: 'Show why each gate passed/failed one level down; consider installing the explainer-DAG transpiler.', Status: 'planned', RuleCommitMsg: 'rule: install explainer-dag', StateCommitMsg: 'state: Loop 3 — gate explainability', SortOrder: 4 },
      { LeopoldLoopId: 'loop-4', LoopNumber: '4', Title: 'Second prediction type (severity)', Goal: 'Add a derived severity prediction grounded in ClinicalPhenotypes.SeverityScore; pull one context table onto the load-bearing path.', Status: 'planned', RuleCommitMsg: 'rule: severity prediction derived from clinical-activity evidence', StateCommitMsg: 'state: Loop 4 — severity prediction', SortOrder: 5 },
      { LeopoldLoopId: 'loop-5', LoopNumber: '5', Title: 'Treatment-response prediction', Goal: 'Derive a treatment-response prediction from Treatments + mechanism match; surface in the panel.', Status: 'planned', RuleCommitMsg: 'rule: treatment-response prediction', StateCommitMsg: 'state: Loop 5 — treatment-response prediction', SortOrder: 6 },
      { LeopoldLoopId: 'loop-llm-intake', LoopNumber: '6', Title: 'LLM intake clerk + synthetic lab', Goal: 'Wire the LLM to read a NL case and write leaf observations (intake + synthetic-but-transparent test results), with three-panel witness and per-fact provenance.', Status: 'backlog', RuleCommitMsg: 'rule (if any) for provenance fields', StateCommitMsg: 'state: Loop 6 — LLM intake clerk, everything-is-a-knob', SortOrder: 7 },
      { LeopoldLoopId: 'loop-adverse', LoopNumber: '7', Title: 'Adverse-effect prediction', Goal: 'Wire adverse-effect prediction to observed treatment adverse-event rows.', Status: 'backlog', RuleCommitMsg: '', StateCommitMsg: '', SortOrder: 8 },
      { LeopoldLoopId: 'loop-equity', LoopNumber: '8', Title: 'Cohort-level equity report', Goal: 'Calibration & actionability rates by ancestry (ancestry-equity dashboard).', Status: 'backlog', RuleCommitMsg: '', StateCommitMsg: '', SortOrder: 9 },
    ],
  },
};

let added = [];
for (const [key, def] of Object.entries(tables)) {
  if (r[key]) { console.log('SKIP (exists):', key); continue; }
  r[key] = def;
  added.push(key);
}

// Reorder so _meta stays last (insertion above already places new keys before _meta only if _meta
// was deleted; JSON object key order: new keys go to end. Re-emit with _meta last to preserve convention.)
const meta = r._meta;
delete r._meta;
r._meta = meta;

fs.writeFileSync(RB, JSON.stringify(r, null, 2) + '\n');
console.log('ADDED:', added.join(', ') || '(none)');
console.log('Rulebook now has', Object.keys(r).filter(k => !k.startsWith('$') && !['Name', 'Description', '_meta'].includes(k)).length, 'tables.');
