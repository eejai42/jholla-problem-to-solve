# Causal Autoimmune Architecture — a deterministic diagnosis from raw facts alone

> **Demonstration of inference structure, not validated clinical decision support.**
> Gene, HLA, drug, and threshold names are real and literature-aligned only so the synthetic data
> reads plausibly. Nothing here is for any clinical purpose. All patients are invented; all clinical
> figures are public, cited literature ranges.

## Why this example exists

We went looking for the **most complex medical reasoning problem we could construct** — the kind of
grand-challenge that's supposed to be the high-water mark of "you'd need a giant opaque model for
this." The canonical version reads like an NIH program announcement:

> *Given phased long-read genomes, pangenome graphs, single-cell and spatial multi-omics,
> proteomics, metabolomics, methylomes, chromatin conformation, immune-receptor repertoires,
> microbiomes, longitudinal exposures, treatment histories, and clinical phenotypes from a million
> ancestrally diverse individuals, infer the complete causal architecture of a heterogeneous
> autoimmune disease — distinguishing true causal variants from confounded ones, surviving
> population stratification and cryptic relatedness, producing falsifiable mechanisms, and predicting
> onset/severity/treatment-response in ancestries absent from training, with calibrated uncertainty
> and no reliance on spurious correlations.*

That's the prompt. This repo is the **answer**, and the answer is not a bigger model. It's a
**deterministic, auditable derivation** — an [Effortless Rulebook](https://github.com/effortlessapi)
whose calculated-field DAG reduces the whole problem to one falsifiable boolean, reached *for the
right reason* on both sides of the line.

## The one fact everything reduces to

`IndividualPrediction.IsClinicallyActionable` is **computed, never entered**. It is `TRUE` only when
**all four** derived gates hold:

1. **Causally grounded** — rests on ≥1 confirmed causal mechanism (`CausalConfidence ≥ 0.7`,
   experimentally falsifiable, non-spurious).
2. **Well calibrated** — for this patient's ancestry × disease, predicted probabilities match observed
   rates with enough held-out coverage. No coverage ⇒ the gate fails. Equity is *structural*, not promised.
3. **Not spurious** — replicated across cohorts, survived permutation controls, drew on ≥2 omics
   modalities, and the patient carries no cryptic-relatedness leakage.
4. **Ancestry-generalizable** — a holdout ancestry is actionable **only** if the mechanism was
   *measured to replicate in a different ancestry*. Holdout status alone is never enough.

Every gate bottoms out **only in raw observations** — allele frequencies, measured effect sizes and
standard errors, replication p-values and effect signs, permutation effect sizes, calibration-bin
coverage counts, ancestry labels, a cryptic-relatedness flag. **There is no field a curator can set
to make the diagnosis come out right.**

## The receipts: same machine, both verdicts, named reason

A diagnostic engine that only ever says "actionable" proves nothing. The demonstration is that the
**same deterministic DAG** lands on either side and names the **single deciding gate** — five of seven
patients fail, each on exactly one gate:

| Patient | Ancestry | Actionable | The single deciding reason |
|---|---|:--:|---|
| A | European (in-training)        | **TRUE**  | All gates pass — confirmed IRF5→IFN node, calibrated, not spurious, in-training. |
| B | European (in-training)        | FALSE | **Calibration** — same mechanism as A, but reliability-bin coverage 8 (<20) ⇒ uncertainty collapses. |
| C | East Asian (in-training)      | FALSE | **Spurious mechanism** — STAT4 replication sign-flips and a negative control fails to collapse. |
| D | European (in-training)        | FALSE | **Cryptic relatedness** — fully confirmed + well-calibrated, but a relatedness leakage flag is set. |
| E | African (in-training)         | FALSE | **Falsifiability** — qualified, replicated CTLA4 mechanism, but zero intervention targets exist. |
| F | Indigenous American (holdout) | FALSE | **Ancestry transport** — confirmed IL23R node, but all replications ran in the same ancestry. |
| G | Indigenous American (holdout) | **TRUE**  | The positive twin of F — same setup, but IL23R replicated in European *and* East-Asian cohorts. |

Every gate is exercised by both a passing and a failing case. The build verifies against exactly this
oracle; it is not asserted by hand.

## The architecture — and why the LLM never gets a vote

```
case details (natural language)  →  [ LLM: intake clerk + lab ]  →  leaf observations  →  [ rulebook DAG ]  →  deterministic diagnosis
        messy, human                  intake facts + test results       (the two bottom        trusted, pure        + four-gate trace
                                   └────── trust boundary ──────┘         rows only)
```

The LLM does **exactly two things, both at the leaf/observation layer only** — the un-alarming roles
that already exist in medicine:

1. **Interpret the intake facts** the way a doctor/nurse does — history → raw observation rows
   (ancestry, allele frequencies, the case's presenting facts).
2. **Produce the case's test results** — the "labs come back" values: measured effect sizes/SEs,
   replication signs/p-values, permutation effect sizes, calibration-bin coverage. These are *fake*
   (the case is invented) but **transparent**: every number is visible, sourced to the case, and
   editable.

That is the entire LLM surface. It never computes a higher-order inference — no ZStat, no
`IsQualifiedEvidence`, no `CausalConfidence`, no gate, no keystone, no diagnosis. **Everything above
the leaves is the deterministic, fully-witnessed inference graph.** The trust boundary isn't a vibe —
it's a *line in the DAG:* any field with a formula belongs to the model; any raw-input field is the
LLM's (or a human's). The LLM is the intake clerk and the lab; it is never the diagnostician.

The obvious objection is: *"you didn't remove the model's judgment, you moved it down a layer —
that's a hallucination laundered through a deterministic function."* The answer is structural:

- **Every choice the LLM makes is a literal knob.** Each value it emits is an editable field in the
  admin UI. The model's judgment is fully externalized — it can't hide. A wrong effect size is
  *nudged*, not re-prompted.
- **Every formula is inspectable and correctable in place, like a spreadsheet cell** — without
  touching the rest of the DAG; the change re-derives and propagates only as far as it should.
- **The reasoning lives in the open DAG, not in the model.** The LLM is demoted to a replaceable,
  fully-overridable transcriber.

So the system is **"an auditable, correctable derivation with an LLM as an overridable front-end,"**
not "an LLM that diagnoses." Witness it as **three independently-checkable panels**:

1. the **input** case text,
2. the **extracted raw facts**, each with a provenance pointer back into the text
   (`ZStat 3.1 ← "effect 0.42, SE 0.13 in the discovery cohort"`) — a human checks the *extraction*
   was faithful, separately from trusting the verdict,
3. the **derived diagnosis + four-gate trace** — deterministic, every step auditable.

The two halves (extraction vs. derivation) are verifiable independently — which is precisely what
defeats the laundering objection.

> **Honest bound.** "Without touching the rest of the DAG" holds for editing a field's *value or
> formula body* — that stays within its dependency subtree. Changing a field's *type* or its *place
> in the dependency graph* can ripple. The spreadsheet analogy is exact and exactly bounded: editing
> a cell is local; restructuring what-depends-on-what is not.

## How it's built

This is an **Effortless Rulebook (ERB)**: one JSON hub (`effortless-rulebook/effortless-rulebook.json`)
projected into a Postgres substrate by `effortless build`. The causal-inference logic lives entirely
in the calculated-field DAG, built bottom-up:

- **Evidence layer** — `EvidenceItems` derive `ZStat` and `IsQualifiedEvidence` per (mechanism × assay).
- **Replication & control layer** — `CohortReplications` derive sign-concordant reproduction (and
  whether it happened in a *different* ancestry); `NegativeControlTests` derive permutation collapse.
- **Mechanism layer** — `CausalMechanisms` aggregate to `CausalConfidence`,
  `IsExperimentallyFalsifiable`, `IsSpuriousDerived`, `ReplicatesAcrossCohorts`,
  `IsAncestryTransportable` → `IsCausalArchitectureNode`.
- **Individual & prediction layers** — roll up confirmed nodes and causal mass, then derive
  `PredictedValue`, `CalibratedUncertainty`, the four gates, and the keystone.

The full breadth of the problem (every omics modality, disease stages, epistasis, counterfactual
trajectories) is represented as ontology context but kept **deliberately off the keystone's dependency
path**, so the core inference stays minimal, auditable, and testable.

## Run it

```bash
./start.sh build           # effortless build → regenerates the Postgres substrate
cd postgres && ./init-db.sh # create + seed the local database
cd ../admin-app && npm install && npm test   # the witnessed red→green inference harness
```

The app's home page **is** the witnessed red/green harness tree — every DAG node, for all seven
patients, asserted against the app's own API. Nodes go green as each endpoint is wired to read the
`vw_*` views. A passing run produces a per-patient, doctor-style diagnosis writeup as its artifact.

See `admin-app/tests/README.md` for the harness contract, `CLAUDE.md` for the running north star,
and `LEOPOLD_LOOPING_PLAN.md` for the build loop.
