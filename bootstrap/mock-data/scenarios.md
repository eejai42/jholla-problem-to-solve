# Mock Data Scenarios

## Scenario S1 — Presymptomatic systemic lupus (SLE)

**Individual:** `ind-yoruba-0042` — Yoruba ancestry, age 22, enrolled in federated West-Africa node.

**Variants:**
- `var-hla-dr15` — HLA haplotype (VariantType: hla-haplotype)
- `var-reg-irf5` — regulatory variant near IRF5

**Phenotype:** presymptomatic ANA elevation, DiseaseStage `sle-presymptomatic`

**Prediction:** elevated disease-onset probability with calibrated uncertainty 0.82

---

## Scenario S2 — Rheumatoid arthritis with microbiome interaction

**Individual:** `ind-european-1187` — European ancestry, age 45

**Exposure:** `exp-smoking-pack-years` — longitudinal smoking (environmental exposure)

**OmicsAssay:** gut microbiome + RNA-seq from synovial tissue

**CausalMechanism:** gene–environment–microbiome interaction linking PTPN22 coding variant + smoking + dysbiotic microbiome → T-cell activation

---

## Scenario S3 — Treatment-induced remission with feedback

**Individual:** `ind-east-asian-3301`

**Treatment:** rituximab — treatment response = Partial, treatment-induced molecular change recorded

**ClinicalPhenotype:** severity drops from 8.2 → 3.1 (feedback on disease progression)

**CounterfactualTrajectory:** without treatment, projected severity 9.4 at 12 months

---

## Scenario S4 — Ancestry holdout prediction

**Individual:** `ind-indigenous-american-0099` — ancestry absent from primary training

**FederatedDataset:** `fed-amazon-cohort` — privacy-preserving federated node

**Prediction:** ancestry-equitable risk score with calibrated uncertainty; no spurious-correlation flag

---

## Scenario S5 — Higher-order epistasis

**Individual:** `ind-african-0555`

**Variants:** two regulatory variants (`var-reg-ctla4`, `var-reg-stat4`)

**EpistaticInteraction:** higher-order epistasis score 0.67, pleiotropy across SLE and RA phenotypes

---

## Scenario S6 — Falsifiable mechanism → intervention target

**CausalMechanism:** `cm-il17-pathway` — IL-17 enhancer–promoter interaction in skin tissue

**InterventionTarget:** `it-il17-blockade` — experimentally falsifiable; guides cell-based therapy trial

---

## Seed Row Counts (rulebook data arrays)

| Table | Rows |
|-------|------|
| Individuals | 6 |
| AutoimmuneDiseases | 3 |
| DiseaseStages | 6 |
| Tissues | 5 |
| OmicsModalities | 8 |
| FederatedDatasets | 2 |
| VariantTypes | 10 |
| GenomicVariants | 8 |
| OmicsAssays | 6 |
| EnvironmentalExposures | 3 |
| Treatments | 3 |
| ClinicalPhenotypes | 6 |
| CausalMechanisms | 4 |
| EpistaticInteractions | 2 |
| CounterfactualTrajectories | 3 |
| IndividualPredictions | 4 |
| InterventionTargets | 3 |
