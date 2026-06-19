# 📘 Causal Autoimmune Architecture Platform — RuleSpeak

_Rulebook for inferring the complete causal architecture of heterogeneous autoimmune disease from multi-omic cohort data, producing falsifiable mechanisms and ancestry-equitable predictions with calibrated uncertainty._

> Declarative business rules rendered from the rulebook. Every statement
> below expresses truth in the business domain — it is neither a procedure
> nor an imperative. The rulebook's formulas are the single source of truth;
> this document is their plain-language reading.

## 1 Business Vocabulary

| Term | Description | Narrative Comment |
|------|-------------|-------------------|
| **Autoimmune Diseas** | Target heterogeneous autoimmune disease definitions tracked across development, aging, tissues, and disease stages. | — |
| Name | Computed as the disease label. | _Display label for the autoimmune disease._ |
| Count of Disease Stages | The number of disease stages related to the autoimmune diseas. | _Number of disease stages defined for this autoimmune disease._ |
| Count of Intervention Targets | The number of intervention targets related to the autoimmune diseas. | _Count of validated intervention targets linked to this disease._ |
| **Disease Stage** | Ordered disease stages capturing presymptomatic, active, remission, and treatment-refractory phases along disease progression. | — |
| Name | Computed as the autoimmune disease disease label, followed by the literal “ — ”, followed by the stage label. | _Display label combining disease and stage._ |
| Autoimmune Disease Disease Label | The disease label of the disease stage's autoimmune disease. | _Lookup of parent disease label._ |
| Is Presymptomatic | True when the stage label is the literal “Presymptomatic”. | _True when stage is presymptomatic diagnosis window._ |
| **Tissue** | Anatomical tissues where omics assays resolve cell-state-specific effects; includes cases of missing tissues. | — |
| Name | Computed as the tissue label. | _Display label for the tissue._ |
| Count of Omics Assays | The number of omics assays related to the tissue. | _Number of omics assays performed on this tissue._ |
| **Omics Modality** | Registry of omics assay modalities: RNA-seq, ATAC-seq, proteomics, metabolomics, methylomes, chromatin-conformation, immune-receptor repertoires, microbiomes, and long-read genomes. | — |
| Name | Computed as the modality label. | _Display label for the omics modality._ |
| Count of Omics Assays | The number of omics assays related to the omics modality. | _Count of assays using this modality._ |
| **Federated Dataset** | Privacy-preserving federated datasets contributing cohort partitions without centralizing raw genomes. | — |
| Name | Computed as the node label. | _Display label for the federated dataset._ |
| Count of Individuals | The number of individuals related to the federated dataset. | _Individuals enrolled via this federated node._ |
| **Variant Type** | Classification of genomic variant mechanisms: regulatory, coding, repeat expansions, mobile-element insertions, HLA haplotypes, structural variants, de novo mutations, somatic mosaicism, mitochondrial variation. | — |
| Name | Computed as the type label. | _Display label for variant type._ |
| Count of Genomic Variants | The number of genomic variants related to the variant type. | _Variants classified under this type._ |
| **Individual** | Ancestrally diverse cohort participants whose phased genomes, omics profiles, exposures, and clinical phenotypes feed causal architecture inference. | — |
| Name | Computed as the given name, followed by a space, followed by the family name. | _Display name for the individual._ |
| Federated Dataset Node Label | Determined by priority: an empty string if the federated dataset is blank; otherwise the node label of the individual's federated dataset. | _Lookup of federated node label._ |
| Count of Genomic Variants | The number of genomic variants related to the individual. | _Total genomic variants for rare-variant burden assessment._ |
| Count of Causal Mechanisms | The number of causal mechanisms related to the individual. | _Inferred causal mechanisms linked to this individual._ |
| Count of Epistatic Interactions | The number of epistatic interactions related to the individual. | _Higher-order epistasis interactions involving this individual._ |
| Rare Variant Burden Score | Determined by priority: the count of genomic variants divided by the age years if the age years is greater than 0; otherwise 0. | _2nd-order score from rare variant count normalized by age._ |
| Causal Architecture Score | Computed as the count of causal mechanisms times 10 plus the count of epistatic interactions times 5 plus the rare variant burden score. | _3rd-order composite of causal mechanisms and epistasis density._ |
| Is Development Window | True when the age years is at most 25. | _True when age falls in developmental effects window (0-25)._ |
| Is Aging Window | True when the age years is at least 60. | _True when age falls in aging window (60+)._ |
| Count Confirmed Causal Nodes | The number of the individual's causal mechanisms that are causal architecture nodes. | _Count of this individual's confirmed causal-architecture nodes._ |
| Sum Confirmed Causal Confidence | The total causal confidence across the individual's causal mechanisms that are causal architecture nodes. | _Summed confidence of this individual's confirmed causal nodes (derived causal mass)._ |
| Count Cross Ancestry Confirmed Nodes | The number of the individual's causal mechanisms that are ancestry transportables. | _Confirmed nodes that also showed cross-ancestry replication._ |
| **Genomic Variant** | Genomic variant calls per individual spanning regulatory, coding, structural, HLA haplotypes, de novo mutations, somatic mosaicism, and mitochondrial variation. | — |
| Name | Computed as the variant label. | _Display label._ |
| Variant Type Label | The type label of the genomic variant's variant type. | _Lookup of variant type label._ |
| Variant Class is Rare | True when the genomic variant's variant type is a rare variant class. | _Whether this variant's class is a rare-variant class (observed type property)._ |
| Individual Ancestry Label | The ancestry label of the genomic variant's individual. | _Lookup of individual ancestry for stratification checks._ |
| Is Rare Variant | True when the allele frequency is less than 0.01. | _True when allele frequency below 0.01._ |
| Is Causal Candidate | True when all of the following hold: at least one of the following holds: the is rare variant flag is set or the variant class is rare flag is set and the has allele specific expression flag is set. | _Derived: rare (by frequency or class) AND shows allele-specific expression._ |
| **Omics Assay** | Omics assay instances linking individuals to modalities and tissues; captures batch effects, measurement error, and missing tissues. | — |
| Name | Computed as the assay label. | _Display label._ |
| Modality Label | The modality label of the omics assay's omics modality. | _Lookup of modality label._ |
| Tissue Label | Determined by priority: the literal “Missing Tissue” if the tissue is blank; otherwise the tissue label of the omics assay's tissue. | _Lookup of tissue label._ |
| Has Batch Effect Risk | True when the measurement error score is greater than 0.3. | _True when measurement error exceeds 0.3._ |
| Is High Quality Assay | True when all of the following hold: it is not the case that the has batch effect risk flag is set and the measurement error score is less than 0.15. | _2nd-order quality flag._ |
| **Evidence Item** | One observed support signal for a causal mechanism, measured by one omics assay. Mechanism confidence is an aggregation over these rows. | — |
| Name | Computed as the evidence label. | _Display name._ |
| Assay is High Quality | True when the evidence item's omics assay is a high quality assay. | _Whether the supporting assay passed quality control._ |
| Z Stat | Determined by priority: the effect size divided by the standard error if the standard error is greater than 0; otherwise 0. | _Derived signal-to-noise ratio (effect / SE), 0 if SE non-positive._ |
| Is Confound Controlled | True when all of the following hold: the is adjusted for ancestry p cs flag is set and the is adjusted for batch flag is set. | _Derived: both ancestry-PC and batch adjustment present._ |
| Is Qualified Evidence | True when all of the following hold: the assay is high quality flag is set; it is not the case that the is negative control arm flag is set; the z stat is at least 2; and the is confound controlled flag is set. | _Derived: clean assay, real support arm, signal-to-noise >= 2, confound-controlled._ |
| **Cohort Replication** | One re-test of a causal mechanism in another federated cohort. Replication and cross-ancestry transport are aggregations over these rows. | — |
| Name | Computed as the replication label. | _Display name._ |
| Replicated At Nominal Sig | True when all of the following hold: the replication p value is at most 0.05 and the replication effect sign is 1. | _Derived: reproduced the predicted (positive) sign at nominal significance._ |
| Mechanism Primary Ancestry | The individual ancestry label of the cohort replication's causal mechanism. | _Ancestry of the individual the mechanism was discovered in._ |
| Is Different Ancestry Replication | True when it is not the case that the replication ancestry label is the mechanism primary ancestry. | _Derived: the re-test ran in a different ancestry than discovery._ |
| Is Cross Ancestry Concordant | True when all of the following hold: the replicated at nominal sig flag is set and the is different ancestry replication flag is set. | _Derived: replicated at significance AND in a different ancestry (the transportability atom)._ |
| **Negative Control Test** | One stratification / permutation control on a causal mechanism. A true causal signal collapses under the control. | — |
| Name | Computed as the control label. | _Display name._ |
| Is Survived | True when the permutation effect size is at most the null threshold. | _Derived: signal collapses under the control (within the null band), as a true causal effect should._ |
| **Environmental Exposure** | Longitudinal environmental exposures contributing to gene-environment-microbiome interactions and shifting environments. | — |
| Name | Computed as the exposure label. | _Display label._ |
| Individual Ancestry Label | The ancestry label of the environmental exposure's individual. | _Ancestry lookup for stratification._ |
| Is High Exposure | True when the exposure level is greater than 5. | _True when exposure level exceeds threshold._ |
| **Treatment** | Treatment histories capturing treatment-induced changes, treatment response, and adverse effects. | — |
| Name | Computed as the treatment label. | _Display label._ |
| Autoimmune Disease Label | The disease label of the treatment's autoimmune disease. | _Disease label lookup._ |
| Is Effective Treatment | True when all of the following hold: at least one of the following holds: the treatment response is the literal “Complete” or the treatment response is the literal “Partial” and it is not the case that the has adverse effect flag is set. | _True for Complete or Partial response without adverse effects._ |
| **Clinical Phenotype** | Clinical phenotypes including severity, immune dysfunction markers, and feedback from disease progression. | — |
| Name | Computed as the phenotype label. | _Display label._ |
| Disease Stage Label | Determined by priority: an empty string if the disease stage is blank; otherwise the stage label of the clinical phenotype's disease stage. | _Stage label lookup._ |
| Is High Severity | True when the severity score is greater than 7. | _True when severity exceeds 7._ |
| Is Presymptomatic Phenotype | True when the disease stage label is the literal “Presymptomatic”. | _True when stage is presymptomatic._ |
| **Causal Mechanism** | Inferred causal mechanisms linking variants, exposures, and molecular state to clinical phenotypes; must be experimentally falsifiable. | — |
| Name | Computed as the mechanism label. | _Display label._ |
| Individual Ancestry Label | The ancestry label of the causal mechanism's individual. | _Ancestry lookup._ |
| Count Qualified Evidence | The number of the causal mechanism's evidence items that are qualified evidences. | _Count of qualified evidence items supporting this mechanism._ |
| Count Modalities Supporting | The number of the causal mechanism's evidence items that are cross modalities and are qualified evidences. | _Count of qualified cross-modality evidence items (multi-omic corroboration)._ |
| Count Intervention Targets | The number of intervention targets related to the causal mechanism. | _Count of perturbable intervention targets for this mechanism (falsifiability requires >=1)._ |
| Is Experimentally Falsifiable | True when all of the following hold: the count intervention targets is at least 1 and the count qualified evidence is at least 1. | _Derived: a measurable qualified effect exists AND a named intervention can perturb it._ |
| Count Replications | The number of cohort replications related to the causal mechanism. | _Total cross-cohort re-tests of this mechanism._ |
| Count Concordant Replications | The number of the causal mechanism's cohort replications that are replicated at nominal sig. | _Re-tests reproducing the predicted sign at significance._ |
| Count Cross Ancestry Concordant | The number of the causal mechanism's cohort replications that are cross ancestry concordants. | _Concordant re-tests that ran in a DIFFERENT ancestry (the transportability measurement)._ |
| Replication Fraction | Determined by priority: the count concordant replications divided by the count replications if the count replications is greater than 0; otherwise 0. | _Derived: fraction of re-tests that were concordant (guarded division)._ |
| Replicates Across Cohorts | True when all of the following hold: the count replications is at least 2 and the count concordant replications is at least 2. | _Derived: >=2 independent re-tests and >=2 concordant._ |
| Count Neg Control Tests | The number of negative control tests related to the causal mechanism. | _Negative-control tests run on this mechanism._ |
| Count Neg Control Survived | The number of the causal mechanism's negative control tests that are survived. | _Negative-control tests the mechanism survived (collapsed under the null)._ |
| Survives Negative Controls | True when all of the following hold: the count neg control tests is at least 1 and the count neg control survived is the count neg control tests. | _Derived: at least one control run AND all of them survived._ |
| Is Spurious Derived | True when at least one of the following holds: it is not the case that the replicates across cohorts flag is set; it is not the case that the survives negative controls flag is set; the count modalities supporting is less than 2; or the has pleiotropy flag is set. | _Derived: spurious unless replicated, survives controls, has >=2 modalities, and is not purely pleiotropic._ |
| Causal Confidence | Determined by priority: 1 if 0.30 times 1 if the count qualified evidence is at least 4, otherwise the count qualified evidence divided by 4 plus 0.20 times 1 if the count modalities supporting is at least 3, otherwise the count modalities supporting divided by 3 plus 0.30 times the replication fraction plus 0.20 times 1 if the survives negative controls flag is set, otherwise 0 is greater than 1; otherwise 0.30 times 1 if the count qualified evidence is at least 4, otherwise the count qualified evidence divided by 4 plus 0.20 times 1 if the count modalities supporting is at least 3, otherwise the count modalities supporting divided by 3 plus 0.30 times the replication fraction plus 0.20 times 1 if the survives negative controls flag is set, otherwise 0. | _Derived bounded blend of qualified-evidence count, modality breadth, replication rate, and control survival._ |
| Variant is Causal Candidate | False if the genomic variant is blank, otherwise the is causal candidate of the causal mechanism's genomic variant. | _Whether the linked variant is itself a derived causal candidate (empty-guarded)._ |
| Is Causal Architecture Node | True when all of the following hold: the causal confidence is at least 0.7; the is experimentally falsifiable flag is set; it is not the case that the is spurious derived flag is set; and at least one of the following holds: the variant is causal candidate flag is set or the environmental exposure has a value. | _Derived: a confirmed causal edge - confident, falsifiable, non-spurious, and grounded in a candidate variant or a real exposure._ |
| Is Ancestry Transportable | True when all of the following hold: the is causal architecture node flag is set and the count cross ancestry concordant is at least 1. | _Derived: a confirmed node whose effect replicated in >=1 different ancestry (measured invariance)._ |
| **Epistatic Interaction** | Higher-order epistasis and pleiotropy interactions between genomic variants. | — |
| Name | Computed as the interaction label. | _Display label._ |
| Is High Order Epistasis | True when the epistasis score is greater than 0.5. | _True when epistasis score exceeds 0.5._ |
| **Counterfactual Trajectory** | Counterfactual disease trajectories inferred without randomized perturbation data. | — |
| Name | Computed as the trajectory label. | _Display label._ |
| Autoimmune Disease Label | The disease label of the counterfactual trajectory's autoimmune disease. | _Disease label lookup._ |
| Is Worsening Trajectory | True when the projected severity is greater than 7. | _True when projected severity exceeds 7._ |
| **Individual Prediction** | Predictions of disease onset, severity, treatment response, and adverse effects with calibrated uncertainty for ancestry-equitable risk prediction. | — |
| Name | Computed as the prediction label. | _Display label._ |
| Individual Ancestry Label | The ancestry label of the individual prediction's individual. | _Ancestry for equity audit._ |
| Is Ancestry Holdout | True when the individual prediction's individual is ancestry absent from training. | _True when individual ancestry absent from training._ |
| Individual Causal Mass | 0 if the individual is blank, otherwise the sum confirmed causal confidence of the individual prediction's individual. | _Summed confirmed causal confidence for this individual (empty-guarded)._ |
| Individual Confirmed Node Count | 0 if the individual is blank, otherwise the count confirmed causal nodes of the individual prediction's individual. | _Count of this individual's confirmed causal nodes (empty-guarded)._ |
| Individual Cross Ancestry Node Count | 0 if the individual is blank, otherwise the count cross ancestry confirmed nodes of the individual prediction's individual. | _Count of this individual's cross-ancestry-replicated confirmed nodes (empty-guarded)._ |
| Individual Has Cryptic Relatedness | False if the individual is blank, otherwise the has cryptic relatedness flag of the individual prediction's individual. | _Whether this individual carries a cryptic-relatedness leakage flag (empty-guarded)._ |
| Predicted Value | Determined by priority: 10 if 2 times the individual causal mass plus 1.5 times the individual confirmed node count is greater than 10; otherwise 2 times the individual causal mass plus 1.5 times the individual confirmed node count. | _Derived risk magnitude (0-10), a monotone function of validated causal mass only - rides mechanism, not ancestry correlation._ |
| Count Bins | The number of calibration bins related to the individual prediction. | _Total reliability bins for this prediction._ |
| Count Well Calibrated Bins | The number of the individual prediction's calibration bins that are well calibrated bins. | _Bins passing coverage and accuracy._ |
| Sum Bin Abs Error | The total bin abs error across the calibration bins related to the individual prediction. | _Summed reliability gap across this prediction's bins._ |
| Mean Bin Abs Error | Determined by priority: the sum bin abs error divided by the count bins if the count bins is greater than 0; otherwise 1. | _Derived mean reliability gap; defaults to 1 (worst) when no bins exist._ |
| Well Calibrated Fraction | Determined by priority: the count well calibrated bins divided by the count bins if the count bins is greater than 0; otherwise 0. | _Derived fraction of trustworthy bins (guarded division)._ |
| Calibrated Uncertainty | Computed as 0 if 1 minus the mean bin abs error is less than 0, otherwise 1 minus the mean bin abs error times the well calibrated fraction. | _Derived reliability (HIGH = trustworthy): (1 - mean gap) scaled by well-covered-bin fraction; 0 for uncovered predictions._ |
| Rests on Confirmed Mechanism | True when the individual confirmed node count is at least 1. | _Derived: grounded in >=1 validated mechanism._ |
| Has Spurious Correlation Flag | True when at least one of the following holds: it is not the case that the rests on confirmed mechanism flag is set or the individual has cryptic relatedness flag is set. | _Derived: spurious if no validated mechanism OR cryptic-relatedness leakage._ |
| Is Falsifiability Backed | True when the individual confirmed node count is at least 1. | _Derived: inherits falsifiability - every confirmed node required IsExperimentallyFalsifiable._ |
| Is Transportable to Absent Ancestry | True when all of the following hold: the is ancestry holdout flag is set; the individual cross ancestry node count is at least 1; and it is not the case that the has spurious correlation flag is set. | _Derived: a holdout individual is transportable only with >=1 cross-ancestry-replicated node and no spurious flag._ |
| Is Ancestry Transport Safe | True when the is transportable to absent ancestry if the is ancestry holdout flag is set, otherwise true. | _Derived: holdout requires measured transport; in-training is vacuously safe._ |
| Is High Confidence Prediction | True when all of the following hold: the calibrated uncertainty is at least 0.7 and it is not the case that the has spurious correlation flag is set. | _Derived: calibrated AND not spurious._ |
| Patient Stratification Tier | Determined by priority: the literal “High-Risk Pathway” if the predicted value is at least 7; the literal “Moderate-Risk Pathway” if the predicted value is at least 4; otherwise the literal “Low-Risk Pathway”. | _Derived risk tier from the derived PredictedValue._ |
| Is Clinically Actionable | True when all of the following hold: the is high confidence prediction flag is set; the is falsifiability backed flag is set; the is ancestry transport safe flag is set; and the predicted value is greater than 0. | _KEYSTONE: TRUE only when the prediction is high-confidence (calibrated + not spurious), falsifiability-backed, ancestry-transport-safe, and rests on a non-null derived magnitude._ |
| **Calibration Bin** | Per-prediction reliability-curve bins, seeded from the held-out coverage of this individual's own ancestry x disease. Calibration is an aggregation over these rows. | — |
| Name | Computed as the bin label. | _Display name._ |
| Bin Abs Error | Determined by priority: the predicted probability band minus the observed event rate if the predicted probability band is at least the observed event rate; otherwise the observed event rate minus the predicted probability band. | _Derived: absolute gap between predicted band and observed rate._ |
| Is Well Calibrated Bin | True when all of the following hold: the coverage count is at least 20 and the bin abs error is at most 0.1. | _Derived: enough held-out coverage AND small reliability gap._ |
| **Intervention Target** | Validated intervention targets for gene-based and cell-based therapies derived from falsifiable causal mechanisms. | — |
| Name | Computed as the target label. | _Display label._ |
| Causal Mechanism Label | The mechanism label of the intervention target's causal mechanism. | _Mechanism label lookup._ |
| Is Gene Based Therapy | True when the therapy class is the literal “Gene-based”. | _True when therapy class is gene-based._ |
| Is Cell Based Therapy | True when the therapy class is the literal “Cell-based”. | _True when therapy class is cell-based._ |
| **Axiom** | Non-negotiable invariants the platform must obey. Load-bearing constraints, not per-loop work. Captured from the gauntlet conversation. | — |
| Name | Computed as the statement. | _Display label._ |
| **Tests for Success** | Falsifiable conditions that prove the axioms hold. The human-readable index of what each demonstration shows; many are realized in the witnessed harness. | — |
| Name | Computed as the claim. | _Display label._ |
| **Feature** | Buildable capabilities surfaced by the conversation. Coarser grain than loops; AssignedLoop links a feature to the loop that delivers it (nullable until scheduled). | — |
| Name | Computed as the title. | _Display label._ |
| **Open Question** | Decisions still pending, captured so they are not silently re-litigated in a later session. | — |
| Name | Computed as the question. | _Display label._ |
| **Non Goal** | Explicit out-of-scope statements — the positive twin of the anti-hallucination ledger. Stops scope creep. | — |
| Name | Computed as the statement. | _Display label._ |
| **Glossary Term** | Vocabulary coined in the gauntlet conversation, so the framing is shared and stable across sessions. | — |
| Name | Computed as the term. | _Display label._ |
| **Leopold Loop** | The ordered Leopold loops that build this platform, as data. The derived plan (LEOPOLD_LOOPING_PLAN.md, via json-hbars-transform) is generated from these rows; Completedness decides what shows in the current PLAN. | — |
| Name | Computed as the literal “Loop ”, followed by the loop number, followed by the literal “ — ”, followed by the title. | _Display label._ |
| Completedness | Computed as the status. | _Normalized status used by the derived plan to decide placement._ |
| Is in Current Plan | True when it is not the case that the status is the literal “done”. | _TRUE for the current "next" loop and anything still planned/backlog (not done)._ |

## 3 Operative Rules

_Operative rules state what the business **obliges**, **prohibits**, or
advises (**should**). Structural rules come from required fields and foreign keys;
semantic rules come from the Constraints table, each keyed on a boolean the rulebook
already computes (cross-referenced as DR-N in the Definitional Rules below)._

### Structural Constraints (from the schema)

- An autoimmune diseas **must** have a disease label, and record whether it is a complex disease.
- A disease stage **must** have a stage label, a sort order, and an autoimmune disease.
- A tissue **must** have a tissue label.
- An omics modality **must** have a modality label, and record whether it is a single cell.
- A federated dataset **must** have a node label and a region, and record whether it is privacy preserving.
- A variant type **must** have a type label, and record whether it is a rare variant class.
- An individual **must** have a given name, a family name, an ancestry label, and an age years, and record whether it is ancestry absent from training and whether it has a cryptic relatedness flag.
- A genomic variant **must** have a variant label, an individual, a variant type, and an allele frequency, and record whether it has an allele specific expression.
- An omics assay **must** have an assay label, an individual, an omics modality, and a measurement error score, and record whether it has a cell state specific effect.
- An evidence item **must** have an evidence label, a causal mechanism, an omics assay, an effect size, and a standard error, and record whether it is a cross modality, whether it is a negative control arm, whether it is an adjusted for ancestry p cs, and whether it is an adjusted for batch.
- A cohort replication **must** have a replication label, a causal mechanism, a federated dataset, a replication effect sign, a replication p value, and a replication ancestry label.
- A negative control test **must** have a control label, a causal mechanism, a test kind, a permutation effect size, and a null threshold.
- An environmental exposure **must** have an exposure label, an individual, and an exposure level, and record whether it is a maternal effect.
- A treatment **must** have a treatment label, an individual, an autoimmune disease, and a treatment response, and record whether it has a treatment induced change and whether it has an adverse effect.
- A clinical phenotype **must** have a phenotype label, an individual, an autoimmune disease, and a severity score, and record whether it has an immune dysfunction.
- A causal mechanism **must** have a mechanism label, an individual, and a mechanism type, and record whether it has a pleiotropy.
- An epistatic interaction **must** have an interaction label, an individual, a primary variant, a secondary variant, and an epistasis score, and record whether it has a pleiotropy.
- A counterfactual trajectory **must** have a trajectory label, an individual, an autoimmune disease, a projected severity, and a horizon months.
- An individual prediction **must** have a prediction label, an individual, an autoimmune disease, and a prediction type.
- A calibration bin **must** have a bin label, an individual prediction, a predicted probability band, an observed event rate, and a coverage count.
- An intervention target **must** have a target label, a causal mechanism, an autoimmune disease, and a therapy class, and record whether it is validated.
- An axiom **must** have a statement, a rationale, and a category.
- A tests for success **must** have a claim, a how witnessed, and a status.
- A feature **must** have a title and a description.
- An open question **must** have a question and a context, and record whether it is resolved.
- A non goal **must** have a statement and a why excluded.
- A glossary term **must** have a term and a definition.
- A leopold loop **must** have a loop number, a title, a goal, a status, and a sort order.

## 4 Definitional Rules

_All statements express truth in the business domain; they are neither
procedures nor imperatives. "iff" is avoided in favor of "only if" so a
one-directional necessity is not mistaken for an equivalence. A
**⚠︎ mechanical** chip marks a rule whose deterministic wording is faithful
but clunky — a flag for an optional downstream reword pass, not a defect._

| ID | Declarative rule |
|----|------------------|
| **DR-1 Name** | An autoimmune diseas's name is computed as the disease label. |
| **DR-2 Count of Disease Stages** | An autoimmune diseas's count of disease stages is the number of disease stages related to the autoimmune diseas. |
| **DR-3 Count of Intervention Targets** | An autoimmune diseas's count of intervention targets is the number of intervention targets related to the autoimmune diseas. |
| **DR-4 Name** | A disease stage's name is computed as the autoimmune disease disease label, followed by the literal “ — ”, followed by the stage label. |
| **DR-5 Autoimmune Disease Disease Label** | A disease stage's autoimmune disease disease label is the disease label of the disease stage's autoimmune disease. |
| **DR-6 Is Presymptomatic** | A disease stage is considered a presymptomatic if the stage label is the literal “Presymptomatic”. |
| **DR-7 Name** | A tissue's name is computed as the tissue label. |
| **DR-8 Count of Omics Assays** | A tissue's count of omics assays is the number of omics assays related to the tissue. |
| **DR-9 Name** | An omics modality's name is computed as the modality label. |
| **DR-10 Count of Omics Assays** | An omics modality's count of omics assays is the number of omics assays related to the omics modality. |
| **DR-11 Name** | A federated dataset's name is computed as the node label. |
| **DR-12 Count of Individuals** | A federated dataset's count of individuals is the number of individuals related to the federated dataset. |
| **DR-13 Name** | A variant type's name is computed as the type label. |
| **DR-14 Count of Genomic Variants** | A variant type's count of genomic variants is the number of genomic variants related to the variant type. |
| **DR-15 Name** | An individual's name is computed as the given name, followed by a space, followed by the family name. |
| **DR-16 Federated Dataset Node Label** | The individual's federated dataset node label is determined by the following priority:<br>1. an empty string, if the federated dataset is blank;<br>2. otherwise the node label of the individual's federated dataset. |
| **DR-17 Count of Genomic Variants** | An individual's count of genomic variants is the number of genomic variants related to the individual. |
| **DR-18 Count of Causal Mechanisms** | An individual's count of causal mechanisms is the number of causal mechanisms related to the individual. |
| **DR-19 Count of Epistatic Interactions** | An individual's count of epistatic interactions is the number of epistatic interactions related to the individual. |
| **DR-20 Rare Variant Burden Score** | The individual's rare variant burden score is determined by the following priority:<br>1. the count of genomic variants divided by the age years, if the age years is greater than 0;<br>2. otherwise 0. |
| **DR-21 Causal Architecture Score** | An individual's causal architecture score is computed as the count of causal mechanisms times 10 plus the count of epistatic interactions times 5 plus the rare variant burden score. |
| **DR-22 Is Development Window** | An individual is considered a development window if the age years is at most 25. |
| **DR-23 Is Aging Window** | An individual is considered an aging window if the age years is at least 60. |
| **DR-24 Count Confirmed Causal Nodes** | An individual's count confirmed causal nodes is the number of the individual's causal mechanisms that are causal architecture nodes. |
| **DR-25 Sum Confirmed Causal Confidence** | An individual's sum confirmed causal confidence is the total causal confidence across the individual's causal mechanisms that are causal architecture nodes. |
| **DR-26 Count Cross Ancestry Confirmed Nodes** | An individual's count cross ancestry confirmed nodes is the number of the individual's causal mechanisms that are ancestry transportables. |
| **DR-27 Name** | A genomic variant's name is computed as the variant label. |
| **DR-28 Variant Type Label** | A genomic variant's variant type label is the type label of the genomic variant's variant type. |
| **DR-29 Variant Class is Rare** | A genomic variant's variant class is rare is true when the genomic variant's variant type is a rare variant class. |
| **DR-30 Individual Ancestry Label** | A genomic variant's individual ancestry label is the ancestry label of the genomic variant's individual. |
| **DR-31 Is Rare Variant** | A genomic variant is considered a rare variant if the allele frequency is less than 0.01. |
| **DR-32 Is Causal Candidate** | A genomic variant is considered a causal candidate if all of the following hold: at least one of the following holds: the is rare variant flag is set or the variant class is rare flag is set and the has allele specific expression flag is set. |
| **DR-33 Name** | An omics assay's name is computed as the assay label. |
| **DR-34 Modality Label** | An omics assay's modality label is the modality label of the omics assay's omics modality. |
| **DR-35 Tissue Label** | The omics assay's tissue label is determined by the following priority:<br>1. the literal “Missing Tissue”, if the tissue is blank;<br>2. otherwise the tissue label of the omics assay's tissue. |
| **DR-36 Has Batch Effect Risk** | An omics assay is considered to have a batch effect risk if the measurement error score is greater than 0.3. |
| **DR-37 Is High Quality Assay** | An omics assay is considered a high quality assay if all of the following hold: it is not the case that the has batch effect risk flag is set and the measurement error score is less than 0.15. |
| **DR-38 Name** | An evidence item's name is computed as the evidence label. |
| **DR-39 Assay is High Quality** | An evidence item's assay is high quality is true when the evidence item's omics assay is a high quality assay. |
| **DR-40 Z Stat** | The evidence item's z stat is determined by the following priority:<br>1. the effect size divided by the standard error, if the standard error is greater than 0;<br>2. otherwise 0. |
| **DR-41 Is Confound Controlled** | An evidence item is considered confound controlled if all of the following hold: the is adjusted for ancestry p cs flag is set and the is adjusted for batch flag is set. |
| **DR-42 Is Qualified Evidence** | An evidence item is considered a qualified evidence if all of the following hold: the assay is high quality flag is set; it is not the case that the is negative control arm flag is set; the z stat is at least 2; and the is confound controlled flag is set. |
| **DR-43 Name** | A cohort replication's name is computed as the replication label. |
| **DR-44 Replicated At Nominal Sig** | A cohort replication is flagged replicated at nominal sig if all of the following hold: the replication p value is at most 0.05 and the replication effect sign is 1. |
| **DR-45 Mechanism Primary Ancestry** | A cohort replication's mechanism primary ancestry is the individual ancestry label of the cohort replication's causal mechanism. |
| **DR-46 Is Different Ancestry Replication** | A cohort replication is considered a different ancestry replication if it is not the case that the replication ancestry label is the mechanism primary ancestry. |
| **DR-47 Is Cross Ancestry Concordant** | A cohort replication is considered a cross ancestry concordant if all of the following hold: the replicated at nominal sig flag is set and the is different ancestry replication flag is set. |
| **DR-48 Name** | A negative control test's name is computed as the control label. |
| **DR-49 Is Survived** | A negative control test is considered survived if the permutation effect size is at most the null threshold. |
| **DR-50 Name** | An environmental exposure's name is computed as the exposure label. |
| **DR-51 Individual Ancestry Label** | An environmental exposure's individual ancestry label is the ancestry label of the environmental exposure's individual. |
| **DR-52 Is High Exposure** | An environmental exposure is considered a high exposure if the exposure level is greater than 5. |
| **DR-53 Name** | A treatment's name is computed as the treatment label. |
| **DR-54 Autoimmune Disease Label** | A treatment's autoimmune disease label is the disease label of the treatment's autoimmune disease. |
| **DR-55 Is Effective Treatment** | A treatment is considered an effective treatment if all of the following hold: at least one of the following holds: the treatment response is the literal “Complete” or the treatment response is the literal “Partial” and it is not the case that the has adverse effect flag is set. |
| **DR-56 Name** | A clinical phenotype's name is computed as the phenotype label. |
| **DR-57 Disease Stage Label** | The clinical phenotype's disease stage label is determined by the following priority:<br>1. an empty string, if the disease stage is blank;<br>2. otherwise the stage label of the clinical phenotype's disease stage. |
| **DR-58 Is High Severity** | A clinical phenotype is considered a high severity if the severity score is greater than 7. |
| **DR-59 Is Presymptomatic Phenotype** | A clinical phenotype is considered a presymptomatic phenotype if the disease stage label is the literal “Presymptomatic”. |
| **DR-60 Name** | A causal mechanism's name is computed as the mechanism label. |
| **DR-61 Individual Ancestry Label** | A causal mechanism's individual ancestry label is the ancestry label of the causal mechanism's individual. |
| **DR-62 Count Qualified Evidence** | A causal mechanism's count qualified evidence is the number of the causal mechanism's evidence items that are qualified evidences. |
| **DR-63 Count Modalities Supporting** | A causal mechanism's count modalities supporting is the number of the causal mechanism's evidence items that are cross modalities and are qualified evidences. |
| **DR-64 Count Intervention Targets** | A causal mechanism's count intervention targets is the number of intervention targets related to the causal mechanism. |
| **DR-65 Is Experimentally Falsifiable** | A causal mechanism is considered an experimentally falsifiable if all of the following hold: the count intervention targets is at least 1 and the count qualified evidence is at least 1. |
| **DR-66 Count Replications** | A causal mechanism's count replications is the number of cohort replications related to the causal mechanism. |
| **DR-67 Count Concordant Replications** | A causal mechanism's count concordant replications is the number of the causal mechanism's cohort replications that are replicated at nominal sig. |
| **DR-68 Count Cross Ancestry Concordant** | A causal mechanism's count cross ancestry concordant is the number of the causal mechanism's cohort replications that are cross ancestry concordants. |
| **DR-69 Replication Fraction** | The causal mechanism's replication fraction is determined by the following priority:<br>1. the count concordant replications divided by the count replications, if the count replications is greater than 0;<br>2. otherwise 0. |
| **DR-70 Replicates Across Cohorts** | A causal mechanism is considered to replicate across cohorts if all of the following hold: the count replications is at least 2 and the count concordant replications is at least 2. |
| **DR-71 Count Neg Control Tests** | A causal mechanism's count neg control tests is the number of negative control tests related to the causal mechanism. |
| **DR-72 Count Neg Control Survived** | A causal mechanism's count neg control survived is the number of the causal mechanism's negative control tests that are survived. |
| **DR-73 Survives Negative Controls** | A causal mechanism is considered to survive negative controls if all of the following hold: the count neg control tests is at least 1 and the count neg control survived is the count neg control tests. |
| **DR-74 Is Spurious Derived** | A causal mechanism is considered spurious derived if at least one of the following holds: it is not the case that the replicates across cohorts flag is set; it is not the case that the survives negative controls flag is set; the count modalities supporting is less than 2; or the has pleiotropy flag is set. |
| **DR-75 Causal Confidence** | The causal mechanism's causal confidence is determined by the following priority:<br>1. 1, if 0.30 times 1 if the count qualified evidence is at least 4, otherwise the count qualified evidence divided by 4 plus 0.20 times 1 if the count modalities supporting is at least 3, otherwise the count modalities supporting divided by 3 plus 0.30 times the replication fraction plus 0.20 times 1 if the survives negative controls flag is set, otherwise 0 is greater than 1;<br>2. otherwise 0.30 times 1 if the count qualified evidence is at least 4, otherwise the count qualified evidence divided by 4 plus 0.20 times 1 if the count modalities supporting is at least 3, otherwise the count modalities supporting divided by 3 plus 0.30 times the replication fraction plus 0.20 times 1 if the survives negative controls flag is set, otherwise 0. |
| **DR-76 Variant is Causal Candidate** | A causal mechanism's variant is causal candidate is false if the genomic variant is blank, otherwise the is causal candidate of the causal mechanism's genomic variant. |
| **DR-77 Is Causal Architecture Node** | A causal mechanism is considered a causal architecture node if all of the following hold: the causal confidence is at least 0.7; the is experimentally falsifiable flag is set; it is not the case that the is spurious derived flag is set; and at least one of the following holds: the variant is causal candidate flag is set or the environmental exposure has a value. |
| **DR-78 Is Ancestry Transportable** | A causal mechanism is considered an ancestry transportable if all of the following hold: the is causal architecture node flag is set and the count cross ancestry concordant is at least 1. |
| **DR-79 Name** | An epistatic interaction's name is computed as the interaction label. |
| **DR-80 Is High Order Epistasis** | An epistatic interaction is considered a high order epistasis if the epistasis score is greater than 0.5. |
| **DR-81 Name** | A counterfactual trajectory's name is computed as the trajectory label. |
| **DR-82 Autoimmune Disease Label** | A counterfactual trajectory's autoimmune disease label is the disease label of the counterfactual trajectory's autoimmune disease. |
| **DR-83 Is Worsening Trajectory** | A counterfactual trajectory is considered a worsening trajectory if the projected severity is greater than 7. |
| **DR-84 Name** | An individual prediction's name is computed as the prediction label. |
| **DR-85 Individual Ancestry Label** | An individual prediction's individual ancestry label is the ancestry label of the individual prediction's individual. |
| **DR-86 Is Ancestry Holdout** | An individual prediction's is ancestry holdout is true when the individual prediction's individual is ancestry absent from training. |
| **DR-87 Individual Causal Mass** | An individual prediction's individual causal mass is 0 if the individual is blank, otherwise the sum confirmed causal confidence of the individual prediction's individual. |
| **DR-88 Individual Confirmed Node Count** | An individual prediction's individual confirmed node count is 0 if the individual is blank, otherwise the count confirmed causal nodes of the individual prediction's individual. |
| **DR-89 Individual Cross Ancestry Node Count** | An individual prediction's individual cross ancestry node count is 0 if the individual is blank, otherwise the count cross ancestry confirmed nodes of the individual prediction's individual. |
| **DR-90 Individual Has Cryptic Relatedness** | An individual prediction's individual has cryptic relatedness is false if the individual is blank, otherwise the has cryptic relatedness flag of the individual prediction's individual. |
| **DR-91 Predicted Value** | The individual prediction's predicted value is determined by the following priority:<br>1. 10, if 2 times the individual causal mass plus 1.5 times the individual confirmed node count is greater than 10;<br>2. otherwise 2 times the individual causal mass plus 1.5 times the individual confirmed node count. |
| **DR-92 Count Bins** | An individual prediction's count bins is the number of calibration bins related to the individual prediction. |
| **DR-93 Count Well Calibrated Bins** | An individual prediction's count well calibrated bins is the number of the individual prediction's calibration bins that are well calibrated bins. |
| **DR-94 Sum Bin Abs Error** | An individual prediction's sum bin abs error is the total bin abs error across the calibration bins related to the individual prediction. |
| **DR-95 Mean Bin Abs Error** | The individual prediction's mean bin abs error is determined by the following priority:<br>1. the sum bin abs error divided by the count bins, if the count bins is greater than 0;<br>2. otherwise 1. |
| **DR-96 Well Calibrated Fraction** | The individual prediction's well calibrated fraction is determined by the following priority:<br>1. the count well calibrated bins divided by the count bins, if the count bins is greater than 0;<br>2. otherwise 0. |
| **DR-97 Calibrated Uncertainty** | An individual prediction's calibrated uncertainty is computed as 0 if 1 minus the mean bin abs error is less than 0, otherwise 1 minus the mean bin abs error times the well calibrated fraction. |
| **DR-98 Rests on Confirmed Mechanism** | An individual prediction is considered to rest on confirmed mechanism if the individual confirmed node count is at least 1. |
| **DR-99 Has Spurious Correlation Flag** | An individual prediction is considered to have a spurious correlation flag if at least one of the following holds: it is not the case that the rests on confirmed mechanism flag is set or the individual has cryptic relatedness flag is set. |
| **DR-100 Is Falsifiability Backed** | An individual prediction is considered falsifiability backed if the individual confirmed node count is at least 1. |
| **DR-101 Is Transportable to Absent Ancestry** | An individual prediction is considered a transportable to absent ancestry if all of the following hold: the is ancestry holdout flag is set; the individual cross ancestry node count is at least 1; and it is not the case that the has spurious correlation flag is set. |
| **DR-102 Is Ancestry Transport Safe** | An individual prediction is considered an ancestry transport safe if the is transportable to absent ancestry if the is ancestry holdout flag is set, otherwise true. |
| **DR-103 Is High Confidence Prediction** | An individual prediction is considered a high confidence prediction if all of the following hold: the calibrated uncertainty is at least 0.7 and it is not the case that the has spurious correlation flag is set. |
| **DR-104 Patient Stratification Tier** | The individual prediction's patient stratification tier is determined by the following priority:<br>1. the literal “High-Risk Pathway”, if the predicted value is at least 7;<br>2. the literal “Moderate-Risk Pathway”, if the predicted value is at least 4;<br>3. otherwise the literal “Low-Risk Pathway”. |
| **DR-105 Is Clinically Actionable** | An individual prediction is considered a clinically actionable if all of the following hold: the is high confidence prediction flag is set; the is falsifiability backed flag is set; the is ancestry transport safe flag is set; and the predicted value is greater than 0. |
| **DR-106 Name** | A calibration bin's name is computed as the bin label. |
| **DR-107 Bin Abs Error** | The calibration bin's bin abs error is determined by the following priority:<br>1. the predicted probability band minus the observed event rate, if the predicted probability band is at least the observed event rate;<br>2. otherwise the observed event rate minus the predicted probability band. |
| **DR-108 Is Well Calibrated Bin** | A calibration bin is considered a well calibrated bin if all of the following hold: the coverage count is at least 20 and the bin abs error is at most 0.1. |
| **DR-109 Name** | An intervention target's name is computed as the target label. |
| **DR-110 Causal Mechanism Label** | An intervention target's causal mechanism label is the mechanism label of the intervention target's causal mechanism. |
| **DR-111 Is Gene Based Therapy** | An intervention target is considered a gene based therapy if the therapy class is the literal “Gene-based”. |
| **DR-112 Is Cell Based Therapy** | An intervention target is considered a cell based therapy if the therapy class is the literal “Cell-based”. |
| **DR-113 Name** | An axiom's name is computed as the statement. |
| **DR-114 Name** | A tests for success's name is computed as the claim. |
| **DR-115 Name** | A feature's name is computed as the title. |
| **DR-116 Name** | An open question's name is computed as the question. |
| **DR-117 Name** | A non goal's name is computed as the statement. |
| **DR-118 Name** | A glossary term's name is computed as the term. |
| **DR-119 Name** | A leopold loop's name is computed as the literal “Loop ”, followed by the loop number, followed by the literal “ — ”, followed by the title. |
| **DR-120 Completedness** | A leopold loop's completedness is computed as the status. |
| **DR-121 Is in Current Plan** | A leopold loop is considered in current plan if it is not the case that the status is the literal “done”. |

## 5 Traceability to Schema

_The expression column is the rule's definition in RuleSpeak notation —
the same logic the rulebook stores, written for a business reader._

| Schema element | Kind | Expression |
|----------------|------|------------|
| **AutoimmuneDiseases.Name** | formula | `DiseaseLabel` |
| **AutoimmuneDiseases.CountOfDiseaseStages** | rollup | `Count(DiseaseStages via AutoimmuneDisease)` |
| **AutoimmuneDiseases.CountOfInterventionTargets** | rollup | `Count(InterventionTargets via AutoimmuneDisease)` |
| **DiseaseStages.Name** | formula | `AutoimmuneDiseaseDiseaseLabel & " — " & StageLabel` |
| **DiseaseStages.AutoimmuneDiseaseDiseaseLabel** | formula | `Lookup(AutoimmuneDiseases.DiseaseLabel via AutoimmuneDisease)` |
| **DiseaseStages.IsPresymptomatic** | formula | `If(StageLabel = "Presymptomatic", True(), False())` |
| **Tissues.Name** | formula | `TissueLabel` |
| **Tissues.CountOfOmicsAssays** | rollup | `Count(OmicsAssays via Tissue)` |
| **OmicsModalities.Name** | formula | `ModalityLabel` |
| **OmicsModalities.CountOfOmicsAssays** | rollup | `Count(OmicsAssays via OmicsModality)` |
| **FederatedDatasets.Name** | formula | `NodeLabel` |
| **FederatedDatasets.CountOfIndividuals** | rollup | `Count(Individuals via FederatedDataset)` |
| **VariantTypes.Name** | formula | `TypeLabel` |
| **VariantTypes.CountOfGenomicVariants** | rollup | `Count(GenomicVariants via VariantType)` |
| **Individuals.Name** | formula | `GivenName & " " & FamilyName` |
| **Individuals.FederatedDatasetNodeLabel** | formula | `If(FederatedDataset = "", "", Lookup(FederatedDatasets.NodeLabel via FederatedDataset))` |
| **Individuals.CountOfGenomicVariants** | rollup | `Count(GenomicVariants via Individual)` |
| **Individuals.CountOfCausalMechanisms** | rollup | `Count(CausalMechanisms via Individual)` |
| **Individuals.CountOfEpistaticInteractions** | rollup | `Count(EpistaticInteractions via Individual)` |
| **Individuals.RareVariantBurdenScore** | formula | `If(AgeYears > 0, CountOfGenomicVariants / AgeYears, 0)` |
| **Individuals.CausalArchitectureScore** | formula | `CountOfCausalMechanisms * 10 + CountOfEpistaticInteractions * 5 + RareVariantBurdenScore` |
| **Individuals.IsDevelopmentWindow** | formula | `If(AgeYears <= 25, True(), False())` |
| **Individuals.IsAgingWindow** | formula | `If(AgeYears >= 60, True(), False())` |
| **Individuals.CountConfirmedCausalNodes** | rollup | `Count(CausalMechanisms via Individual)` |
| **Individuals.SumConfirmedCausalConfidence** | rollup | `Sum(CausalMechanisms.CausalConfidence via Individual)` |
| **Individuals.CountCrossAncestryConfirmedNodes** | rollup | `Count(CausalMechanisms via Individual)` |
| **GenomicVariants.Name** | formula | `VariantLabel` |
| **GenomicVariants.VariantTypeLabel** | formula | `Lookup(VariantTypes.TypeLabel via VariantType)` |
| **GenomicVariants.VariantClassIsRare** | lookup | `Lookup(VariantTypes.IsRareVariantClass via VariantType)` |
| **GenomicVariants.IndividualAncestryLabel** | formula | `Lookup(Individuals.AncestryLabel via Individual)` |
| **GenomicVariants.IsRareVariant** | formula | `If(AlleleFrequency < 0.01, True(), False())` |
| **GenomicVariants.IsCausalCandidate** | formula | `If(And(Or(IsRareVariant, VariantClassIsRare), HasAlleleSpecificExpression), True(), False())` |
| **OmicsAssays.Name** | formula | `AssayLabel` |
| **OmicsAssays.ModalityLabel** | formula | `Lookup(OmicsModalities.ModalityLabel via OmicsModality)` |
| **OmicsAssays.TissueLabel** | formula | `If(Tissue = "", "Missing Tissue", Lookup(Tissues.TissueLabel via Tissue))` |
| **OmicsAssays.HasBatchEffectRisk** | formula | `If(MeasurementErrorScore > 0.3, True(), False())` |
| **OmicsAssays.IsHighQualityAssay** | formula | `If(And(Not(HasBatchEffectRisk), MeasurementErrorScore < 0.15), True(), False())` |
| **EvidenceItems.Name** | formula | `EvidenceLabel` |
| **EvidenceItems.AssayIsHighQuality** | lookup | `Lookup(OmicsAssays.IsHighQualityAssay via OmicsAssay)` |
| **EvidenceItems.ZStat** | formula | `If(StandardError > 0, EffectSize / StandardError, 0)` |
| **EvidenceItems.IsConfoundControlled** | formula | `If(And(IsAdjustedForAncestryPCs, IsAdjustedForBatch), True(), False())` |
| **EvidenceItems.IsQualifiedEvidence** | formula | `If(And(AssayIsHighQuality, Not(IsNegativeControlArm), ZStat >= 2, IsConfoundControlled), True(), False())` |
| **CohortReplications.Name** | formula | `ReplicationLabel` |
| **CohortReplications.ReplicatedAtNominalSig** | formula | `If(And(ReplicationPValue <= 0.05, ReplicationEffectSign = 1), True(), False())` |
| **CohortReplications.MechanismPrimaryAncestry** | lookup | `Lookup(CausalMechanisms.IndividualAncestryLabel via CausalMechanism)` |
| **CohortReplications.IsDifferentAncestryReplication** | formula | `If(ReplicationAncestryLabel = MechanismPrimaryAncestry, False(), True())` |
| **CohortReplications.IsCrossAncestryConcordant** | formula | `If(And(ReplicatedAtNominalSig, IsDifferentAncestryReplication), True(), False())` |
| **NegativeControlTests.Name** | formula | `ControlLabel` |
| **NegativeControlTests.IsSurvived** | formula | `If(PermutationEffectSize <= NullThreshold, True(), False())` |
| **EnvironmentalExposures.Name** | formula | `ExposureLabel` |
| **EnvironmentalExposures.IndividualAncestryLabel** | formula | `Lookup(Individuals.AncestryLabel via Individual)` |
| **EnvironmentalExposures.IsHighExposure** | formula | `If(ExposureLevel > 5, True(), False())` |
| **Treatments.Name** | formula | `TreatmentLabel` |
| **Treatments.AutoimmuneDiseaseLabel** | formula | `Lookup(AutoimmuneDiseases.DiseaseLabel via AutoimmuneDisease)` |
| **Treatments.IsEffectiveTreatment** | formula | `If(And(Or(TreatmentResponse = "Complete", TreatmentResponse = "Partial"), Not(HasAdverseEffect)), True(), False())` |
| **ClinicalPhenotypes.Name** | formula | `PhenotypeLabel` |
| **ClinicalPhenotypes.DiseaseStageLabel** | formula | `If(DiseaseStage = "", "", Lookup(DiseaseStages.StageLabel via DiseaseStage))` |
| **ClinicalPhenotypes.IsHighSeverity** | formula | `If(SeverityScore > 7, True(), False())` |
| **ClinicalPhenotypes.IsPresymptomaticPhenotype** | formula | `If(DiseaseStageLabel = "Presymptomatic", True(), False())` |
| **CausalMechanisms.Name** | formula | `MechanismLabel` |
| **CausalMechanisms.IndividualAncestryLabel** | formula | `Lookup(Individuals.AncestryLabel via Individual)` |
| **CausalMechanisms.CountQualifiedEvidence** | rollup | `Count(EvidenceItems via CausalMechanism)` |
| **CausalMechanisms.CountModalitiesSupporting** | rollup | `Count(EvidenceItems via CausalMechanism)` |
| **CausalMechanisms.CountInterventionTargets** | rollup | `Count(InterventionTargets via CausalMechanism)` |
| **CausalMechanisms.IsExperimentallyFalsifiable** | formula | `If(And(CountInterventionTargets >= 1, CountQualifiedEvidence >= 1), True(), False())` |
| **CausalMechanisms.CountReplications** | rollup | `Count(CohortReplications via CausalMechanism)` |
| **CausalMechanisms.CountConcordantReplications** | rollup | `Count(CohortReplications via CausalMechanism)` |
| **CausalMechanisms.CountCrossAncestryConcordant** | rollup | `Count(CohortReplications via CausalMechanism)` |
| **CausalMechanisms.ReplicationFraction** | formula | `If(CountReplications > 0, CountConcordantReplications / CountReplications, 0)` |
| **CausalMechanisms.ReplicatesAcrossCohorts** | formula | `If(And(CountReplications >= 2, CountConcordantReplications >= 2), True(), False())` |
| **CausalMechanisms.CountNegControlTests** | rollup | `Count(NegativeControlTests via CausalMechanism)` |
| **CausalMechanisms.CountNegControlSurvived** | rollup | `Count(NegativeControlTests via CausalMechanism)` |
| **CausalMechanisms.SurvivesNegativeControls** | formula | `If(And(CountNegControlTests >= 1, CountNegControlSurvived = CountNegControlTests), True(), False())` |
| **CausalMechanisms.IsSpuriousDerived** | formula | `If(Or(Not(ReplicatesAcrossCohorts), Not(SurvivesNegativeControls), CountModalitiesSupporting < 2, HasPleiotropy), True(), False())` |
| **CausalMechanisms.CausalConfidence** | formula | `If(0.30 * If(CountQualifiedEvidence >= 4, 1, CountQualifiedEvidence / 4) + 0.20 * If(CountModalitiesSupporting >= 3, 1, CountModalitiesSupporting / 3) + 0.30 * ReplicationFraction + 0.20 * If(SurvivesNegativeControls, 1, 0) > 1, 1, 0.30 * If(CountQualifiedEvidence >= 4, 1, CountQualifiedEvidence / 4) + 0.20 * If(CountModalitiesSupporting >= 3, 1, CountModalitiesSupporting / 3) + 0.30 * ReplicationFraction + 0.20 * If(SurvivesNegativeControls, 1, 0))` |
| **CausalMechanisms.VariantIsCausalCandidate** | lookup | `If(GenomicVariant = "", False(), Lookup(GenomicVariants.IsCausalCandidate via GenomicVariant))` |
| **CausalMechanisms.IsCausalArchitectureNode** | formula | `If(And(CausalConfidence >= 0.7, IsExperimentallyFalsifiable, Not(IsSpuriousDerived), Or(VariantIsCausalCandidate, EnvironmentalExposure <> "")), True(), False())` |
| **CausalMechanisms.IsAncestryTransportable** | formula | `If(And(IsCausalArchitectureNode, CountCrossAncestryConcordant >= 1), True(), False())` |
| **EpistaticInteractions.Name** | formula | `InteractionLabel` |
| **EpistaticInteractions.IsHighOrderEpistasis** | formula | `If(EpistasisScore > 0.5, True(), False())` |
| **CounterfactualTrajectories.Name** | formula | `TrajectoryLabel` |
| **CounterfactualTrajectories.AutoimmuneDiseaseLabel** | formula | `Lookup(AutoimmuneDiseases.DiseaseLabel via AutoimmuneDisease)` |
| **CounterfactualTrajectories.IsWorseningTrajectory** | formula | `If(ProjectedSeverity > 7, True(), False())` |
| **IndividualPredictions.Name** | formula | `PredictionLabel` |
| **IndividualPredictions.IndividualAncestryLabel** | formula | `Lookup(Individuals.AncestryLabel via Individual)` |
| **IndividualPredictions.IsAncestryHoldout** | formula | `Lookup(Individuals.IsAncestryAbsentFromTraining via Individual)` |
| **IndividualPredictions.IndividualCausalMass** | lookup | `If(Individual = "", 0, Lookup(Individuals.SumConfirmedCausalConfidence via Individual))` |
| **IndividualPredictions.IndividualConfirmedNodeCount** | lookup | `If(Individual = "", 0, Lookup(Individuals.CountConfirmedCausalNodes via Individual))` |
| **IndividualPredictions.IndividualCrossAncestryNodeCount** | lookup | `If(Individual = "", 0, Lookup(Individuals.CountCrossAncestryConfirmedNodes via Individual))` |
| **IndividualPredictions.IndividualHasCrypticRelatedness** | lookup | `If(Individual = "", False(), Lookup(Individuals.HasCrypticRelatednessFlag via Individual))` |
| **IndividualPredictions.PredictedValue** | formula | `If(2 * IndividualCausalMass + 1.5 * IndividualConfirmedNodeCount > 10, 10, 2 * IndividualCausalMass + 1.5 * IndividualConfirmedNodeCount)` |
| **IndividualPredictions.CountBins** | rollup | `Count(CalibrationBins via IndividualPrediction)` |
| **IndividualPredictions.CountWellCalibratedBins** | rollup | `Count(CalibrationBins via IndividualPrediction)` |
| **IndividualPredictions.SumBinAbsError** | rollup | `Sum(CalibrationBins.BinAbsError via IndividualPrediction)` |
| **IndividualPredictions.MeanBinAbsError** | formula | `If(CountBins > 0, SumBinAbsError / CountBins, 1)` |
| **IndividualPredictions.WellCalibratedFraction** | formula | `If(CountBins > 0, CountWellCalibratedBins / CountBins, 0)` |
| **IndividualPredictions.CalibratedUncertainty** | formula | `If(1 - MeanBinAbsError < 0, 0, 1 - MeanBinAbsError) * WellCalibratedFraction` |
| **IndividualPredictions.RestsOnConfirmedMechanism** | formula | `If(IndividualConfirmedNodeCount >= 1, True(), False())` |
| **IndividualPredictions.HasSpuriousCorrelationFlag** | formula | `If(Or(Not(RestsOnConfirmedMechanism), IndividualHasCrypticRelatedness), True(), False())` |
| **IndividualPredictions.IsFalsifiabilityBacked** | formula | `If(IndividualConfirmedNodeCount >= 1, True(), False())` |
| **IndividualPredictions.IsTransportableToAbsentAncestry** | formula | `If(And(IsAncestryHoldout, IndividualCrossAncestryNodeCount >= 1, Not(HasSpuriousCorrelationFlag)), True(), False())` |
| **IndividualPredictions.IsAncestryTransportSafe** | formula | `If(IsAncestryHoldout, IsTransportableToAbsentAncestry, True())` |
| **IndividualPredictions.IsHighConfidencePrediction** | formula | `If(And(CalibratedUncertainty >= 0.7, Not(HasSpuriousCorrelationFlag)), True(), False())` |
| **IndividualPredictions.PatientStratificationTier** | formula | `If(PredictedValue >= 7, "High-Risk Pathway", If(PredictedValue >= 4, "Moderate-Risk Pathway", "Low-Risk Pathway"))` |
| **IndividualPredictions.IsClinicallyActionable** | formula | `If(And(IsHighConfidencePrediction, IsFalsifiabilityBacked, IsAncestryTransportSafe, PredictedValue > 0), True(), False())` |
| **CalibrationBins.Name** | formula | `BinLabel` |
| **CalibrationBins.BinAbsError** | formula | `If(PredictedProbabilityBand >= ObservedEventRate, PredictedProbabilityBand - ObservedEventRate, ObservedEventRate - PredictedProbabilityBand)` |
| **CalibrationBins.IsWellCalibratedBin** | formula | `If(And(CoverageCount >= 20, BinAbsError <= 0.1), True(), False())` |
| **InterventionTargets.Name** | formula | `TargetLabel` |
| **InterventionTargets.CausalMechanismLabel** | formula | `Lookup(CausalMechanisms.MechanismLabel via CausalMechanism)` |
| **InterventionTargets.IsGeneBasedTherapy** | formula | `If(TherapyClass = "Gene-based", True(), False())` |
| **InterventionTargets.IsCellBasedTherapy** | formula | `If(TherapyClass = "Cell-based", True(), False())` |
| **Axioms.Name** | formula | `Statement` |
| **TestsForSuccess.Name** | formula | `Claim` |
| **Features.Name** | formula | `Title` |
| **OpenQuestions.Name** | formula | `Question` |
| **NonGoals.Name** | formula | `Statement` |
| **GlossaryTerms.Name** | formula | `Term` |
| **LeopoldLoops.Name** | formula | `Concat("Loop ", LoopNumber, " — ", Title)` |
| **LeopoldLoops.Completedness** | formula | `Status` |
| **LeopoldLoops.IsInCurrentPlan** | formula | `If(Status = "done", FALSE, TRUE)` |

---

_This document is rendered in **RuleSpeak®**, the declarative business-rule
notation created by **Ronald G. Ross**, and follows the conventions of
**SBVR** (Semantics of Business Vocabulary and Business Rules). With thanks to
Ronald G. Ross for RuleSpeak and his foundational work on business rules —
[www.RonRoss.info](https://www.RonRoss.info)._
