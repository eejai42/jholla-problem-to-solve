# V2 Coverage Map — the original challenge, clause by clause

> **Demonstration of inference structure, NOT a validated clinical product.**
> This maps every clause of `THE-ORIGINAL-CHALLENGE.md` to its status in the repo after v2,
> with an honest label. It exists so a reviewer (human or AI) can check coverage by reading the
> hub, not by trusting prose. Three labels:
>
> - **DERIVED** — a witnessed formula DAG computes it from raw leaves; asserted green in the harness.
> - **MODELED** — first-class schema + data (a concept that *structures* the model), but not (yet)
>   carrying a deep multi-hop inference of its own.
> - **VOCABULARY** — present as a named concept/stressor TYPE so the model can *talk about* it and
>   it is no longer "absent", but deliberately not deeply simulated in this PoC.
> - **OUT-OF-SCOPE (honest)** — requires real multi-omic data / real causal discovery; this is a
>   proof-of-shape, so we represent the *slot* but make no validated claim.
>
> The point of v2 is not that everything is DERIVED. It is that **every clause now has a home in
> one auditable model**, and the load-bearing ones the audit named are DERIVED and green.

---

## A. The binary target (the thing the whole system reduces to)

| Challenge phrase | Status | Where |
|---|---|---|
| "individualized … actionable prediction … calibrated uncertainty … no spurious correlations" | **DERIVED** | `IndividualPredictions.IsClinicallyActionable` = AND(4 gates); harness L6/L7 green for all 7 |
| "ancestry-equitable risk prediction … ancestries absent from training" | **DERIVED** | ancestry-transport gate; F fails it, G (also holdout) passes — both witnessed |
| "presymptomatic diagnosis" | **DERIVED (v2)** | disease-state machine starts at `PresymptomaticAutoimmunity`; transitions on serology |

## B. Disease-state progression (the audit's central gap — "evidence gate vs disease-state simulator")

| Challenge phrase | Status | Where |
|---|---|---|
| "across development, aging, tissues, and **disease stages**" | **DERIVED (v2)** | `lupus-nephritis-progression` machine: Presymptomatic→SerologicActive→EarlyNephritis→RenalFlareRisk→BiopsyIndicated; current state derived from raw serology |
| "feedback between disease progression and molecular state" | **DERIVED (v2)** | progression state is a pure function of longitudinal molecular leaves (anti-dsDNA/complement trends); state advances as molecules change |
| "predict disease **onset**" | **DERIVED** | `PredictedValue` / onset keystone (v1) |
| "predict **severity**" | **DERIVED** | `IsSeverityActionable` + `SeverityTier` (v1 L5b) + v2 `ActivityTier`/`SledaiScore` |
| "predict **treatment response**" | **DERIVED** | `IsTreatmentResponseActionable` (v1 L5c) + v2 `RecommendedTreatmentLine`/`TreatmentLineDecidingFactor` (MMF/belimumab/anifrolumab) |
| "how long … in a state" (bitemporal) | **DERIVED (v2)** | `SubjectStateInstances.DwellDays`/`IsLongDwell`, EnteredAt/ExitedAt/IsCurrent occupancy |
| "real disease activity scores" | **DERIVED (v2)** | `SledaiScore` derived from raw renal + serology sub-scores; `ActivityTier` |
| "predict **adverse effects**" | **MODELED** | `Treatments.HasAdverseEffect` leaf feeds the treatment-response gate; deep AE surveillance is VOCABULARY (`adverse-event-surveillance`) |

## C. Disease-domain depth the audit listed as absent (now present in `DiseaseDomainConcepts`)

| Concept | Status |
|---|---|
| lupus nephritis | **DERIVED (v2)** — the load-bearing progression DAG |
| treatment lines / treatment-line selection | **DERIVED (v2)** — MMF vs belimumab vs anifrolumab + deciding reason |
| disease-activity scores (SLEDAI / DAS28) | **DERIVED (v2)** SLEDAI; DAS28 MODELED (schema, sparse) |
| neuropsychiatric lupus, cutaneous lupus, organ damage (SLICC) | **MODELED** — first-class phenotype subtypes / damage axis |
| seropositive/seronegative RA, erosive disease | **MODELED** |
| axial PsA, enthesitis, dactylitis, uveitis, IBD overlap | **MODELED** — phenotype subtypes / extra-articular & pleiotropy domains |
| flare patterns | **MODELED** — flare-risk as a derived progression state |
| clinical workflow (referral→differential→workup→classification→baseline-severity→treatment-choice→monitoring→flare-mgmt→AE-surveillance→outcomes) | **VOCABULARY** — present as workflow states; workup/monitoring are where raw leaves enter |

## D. Variant / molecular taxonomy ("distinguish true causal …")

| Challenge phrase | Status | Where |
|---|---|---|
| regulatory variants, coding variants, HLA haplotypes, structural variants, de novo mutations | **MODELED** | `VariantTypes` (5 rows) + `GenomicVariants`; the causal-candidacy DAG runs on top (L0) |
| repeat expansions, mobile-element insertions, somatic mosaicism, mitochondrial variation, epigenetic inheritance | **VOCABULARY** | named in the challenge + glossary; not instantiated as `VariantTypes` rows in this PoC (would be additional rows on the same table) |
| allele-specific expression | **DERIVED** | `GenomicVariants.HasAlleleSpecificExpression` → `IsCausalCandidate` |
| rare-variant burden | **DERIVED** | `Individuals.RareVariantBurdenScore`; rare-AF cutoff in candidacy |
| higher-order epistasis | **MODELED** | `EpistaticInteractions` (sparse) |
| pleiotropy | **MODELED** | `CausalMechanisms.HasPleiotropy`; v2 uveitis/IBD-overlap as cross-tissue pleiotropy |
| cell-state-specific effects, 3D enhancer–promoter, chromatin conformation | **VOCABULARY / OUT-OF-SCOPE** | `OmicsModalities`/`Tissues` represent the slot; no real single-cell/Hi-C data |

## E. The omics / data-modality breadth ("phased T2T genomes, pangenome graphs, scRNA/ATAC, proteomics, metabolomics, methylomes, Hi-C, immune repertoires, microbiomes, exposures")

| Status | Where |
|---|---|
| **MODELED (as modality slots) / OUT-OF-SCOPE (as real data)** | `OmicsModalities` (8), `OmicsAssays`, `Tissues`, `EnvironmentalExposures`, `FederatedDatasets`. The model is shaped to receive them; the PoC uses synthetic transparent values, not a real million-person multi-omic corpus. We make no validated biology claim. |

## F. Inference validity under confounding ("valid despite … no spurious correlations")

| Challenge phrase | Status | Where |
|---|---|---|
| population stratification / confounding | **DERIVED** | `NegativeControlTests` → `SurvivesNegativeControls` → `IsSpuriousDerived` (spurious gate) |
| cryptic relatedness | **DERIVED** | `HasCrypticRelatednessFlag` → `HasSpuriousCorrelationFlag`; Diego (D) fails the keystone here |
| replication / sign-flips across cohorts | **DERIVED** | `CohortReplications` → `ReplicatesAcrossCohorts`; Chen (C) fails on a sign-flip |
| calibration / interval coverage (ECE) | **DERIVED** | `CalibrationBins` → `WellCalibratedFraction` → `CalibratedUncertainty`; Bili (B) fails on calibration |
| experimentally falsifiable mechanisms | **DERIVED** | `InterventionTargets` → `IsExperimentallyFalsifiable`; Esi (E) fails on falsifiability |
| assortative mating, batch effects, missing tissues, measurement error, ascertainment bias, shifting environments | **VOCABULARY** | named stressor types; `OmicsAssays.MeasurementErrorScore` is the one wired as a leaf |
| privacy-preserving federated datasets | **MODELED** | `FederatedDatasets.IsPrivacyPreserving` (the federation slot; no real federation) |
| counterfactual trajectories without randomized perturbation | **VOCABULARY / OUT-OF-SCOPE** | `CounterfactualTrajectories` (sparse); honest: real counterfactual causal inference is not done |

---

## G. The discovery axis (the deepest part of the audit) — v1 = per-patient, v2 = corpus-level

The audit's hardest point: *"discovering and validating real causal autoimmune biology."* Discovery
is **inherently corpus-level** — a single chart never discovers a mechanism; a *pattern across many
patients* does. The v2 reframe:

- **v1** answered the **per-patient adjudication** question (is THIS prediction actionable).
- **v2** adds the **cohort-level disease-state layer**: the same serology-trajectory signature
  (rising anti-dsDNA + falling complement) that fires the `EarlyNephritis`/`RenalFlareRisk`
  transitions is now visible **across the whole cohort** as a derived field on every individual.
  That cross-patient pattern is the *shape* of how the hypothesis "this serology signature precedes
  renal involvement" would be **discovered** — surfaced corpus-wide, not patient-by-patient.
- **Honest bound:** we are **not** claiming to have discovered new biology from real data. We are
  claiming the **auditable corpus-level surface where such discovery is expressed and checked** now
  exists, on the same hub, with the same trust boundary. The corpus visualizers that make this a UX
  are specified in `V2-UI-PLAN.md` (Step 8).

## The minimum counter-example that proves the two layers are real and independent

**Diego Santos (D):** disease-state simulator → `BiopsyIndicated`, `SledaiScore 12`, `High/flare`,
`is_disease_progressing = TRUE`; actionability gate → `IsClinicallyActionable = FALSE` (cryptic
relatedness). `progression_vs_actionability_disagree = TRUE`. A system that *only* gated evidence
could never produce this sentence: *"this patient is clearly progressing toward a renal flare and
needs attention, but our causal-mechanism prediction is not trustworthy enough for targeted
therapy."* That it can is the proof that v2 is a disease-state simulator bolted onto — not a
relabeling of — the v1 evidence gate.

---

## Scorecard delta (our own honest read, not a claim on the doctor's number)

| Axis the audit scored | v1 | v2 |
|---|---|---|
| auditable actionability-gating demo | ~70% | ~85% (treatment-line + disease-state added on the same gates) |
| clinical-research workflow scaffold | ~30% | ~50% (disease-state machine, activity scores, treatment lines, workflow states present) |
| clinically-validated prediction engine | 5–10% | 5–10% (UNCHANGED — still synthetic; we did not and do not claim validated biology) |

The needle that actually moves is **#2**, and it moves because adding the disease-state layer was
*additive into one auditable model* — which is the framework claim the snapshot score can't see.
