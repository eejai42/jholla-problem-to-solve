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
| **Genomic Variant** | Genomic variant calls per individual spanning regulatory, coding, structural, HLA haplotypes, de novo mutations, somatic mosaicism, and mitochondrial variation. | — |
| Name | Computed as the variant label. | _Display label._ |
| Variant Type Label | The type label of the genomic variant's variant type. | _Lookup of variant type label._ |
| Individual Ancestry Label | The ancestry label of the genomic variant's individual. | _Lookup of individual ancestry for stratification checks._ |
| Is Rare Variant | True when the allele frequency is less than 0.01. | _True when allele frequency below 0.01._ |
| Is Causal Candidate | True when all of the following hold: the is rare variant flag is set and the is true causal candidate flag is set. | _2nd-order: rare and flagged as true causal candidate._ |
| **Omics Assay** | Omics assay instances linking individuals to modalities and tissues; captures batch effects, measurement error, and missing tissues. | — |
| Name | Computed as the assay label. | _Display label._ |
| Modality Label | The modality label of the omics assay's omics modality. | _Lookup of modality label._ |
| Tissue Label | Determined by priority: the literal “Missing Tissue” if the tissue is blank; otherwise the tissue label of the omics assay's tissue. | _Lookup of tissue label._ |
| Has Batch Effect Risk | True when the measurement error score is greater than 0.3. | _True when measurement error exceeds 0.3._ |
| Is High Quality Assay | True when all of the following hold: it is not the case that the has batch effect risk flag is set and the measurement error score is less than 0.15. | _2nd-order quality flag._ |
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
| Is Causal Architecture Node | True when all of the following hold: the causal confidence is at least 0.7; it is not the case that the has spurious correlation flag is set; and the is experimentally falsifiable flag is set. | _True when confidence high and not spurious._ |
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
| Is High Confidence Prediction | True when all of the following hold: the calibrated uncertainty is at least 0.7 and it is not the case that the has spurious correlation flag is set. | _3rd-order: high confidence without spurious flag._ |
| Patient Stratification Tier | Determined by priority: the literal “High-Risk Pathway” if the predicted value is at least 7; the literal “Moderate-Risk Pathway” if the predicted value is at least 4; otherwise the literal “Low-Risk Pathway”. | _4th-order patient stratification tier from prediction value._ |
| **Intervention Target** | Validated intervention targets for gene-based and cell-based therapies derived from falsifiable causal mechanisms. | — |
| Name | Computed as the target label. | _Display label._ |
| Causal Mechanism Label | The mechanism label of the intervention target's causal mechanism. | _Mechanism label lookup._ |
| Is Gene Based Therapy | True when the therapy class is the literal “Gene-based”. | _True when therapy class is gene-based._ |
| Is Cell Based Therapy | True when the therapy class is the literal “Cell-based”. | _True when therapy class is cell-based._ |

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
- A genomic variant **must** have a variant label, an individual, a variant type, and an allele frequency, and record whether it has an allele specific expression and whether it is a true causal candidate.
- An omics assay **must** have an assay label, an individual, an omics modality, and a measurement error score, and record whether it has a cell state specific effect.
- An environmental exposure **must** have an exposure label, an individual, and an exposure level, and record whether it is a maternal effect.
- A treatment **must** have a treatment label, an individual, an autoimmune disease, and a treatment response, and record whether it has a treatment induced change and whether it has an adverse effect.
- A clinical phenotype **must** have a phenotype label, an individual, an autoimmune disease, and a severity score, and record whether it has an immune dysfunction.
- A causal mechanism **must** have a mechanism label, an individual, a mechanism type, and a causal confidence, and record whether it is an experimentally falsifiable, whether it has a spurious correlation flag, and whether it has a pleiotropy.
- An epistatic interaction **must** have an interaction label, an individual, a primary variant, a secondary variant, and an epistasis score, and record whether it has a pleiotropy.
- A counterfactual trajectory **must** have a trajectory label, an individual, an autoimmune disease, a projected severity, and a horizon months.
- An individual prediction **must** have a prediction label, an individual, an autoimmune disease, a prediction type, a predicted value, and a calibrated uncertainty, and record whether it has a spurious correlation flag.
- An intervention target **must** have a target label, a causal mechanism, an autoimmune disease, and a therapy class, and record whether it is validated.

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
| **DR-24 Name** | A genomic variant's name is computed as the variant label. |
| **DR-25 Variant Type Label** | A genomic variant's variant type label is the type label of the genomic variant's variant type. |
| **DR-26 Individual Ancestry Label** | A genomic variant's individual ancestry label is the ancestry label of the genomic variant's individual. |
| **DR-27 Is Rare Variant** | A genomic variant is considered a rare variant if the allele frequency is less than 0.01. |
| **DR-28 Is Causal Candidate** | A genomic variant is considered a causal candidate if all of the following hold: the is rare variant flag is set and the is true causal candidate flag is set. |
| **DR-29 Name** | An omics assay's name is computed as the assay label. |
| **DR-30 Modality Label** | An omics assay's modality label is the modality label of the omics assay's omics modality. |
| **DR-31 Tissue Label** | The omics assay's tissue label is determined by the following priority:<br>1. the literal “Missing Tissue”, if the tissue is blank;<br>2. otherwise the tissue label of the omics assay's tissue. |
| **DR-32 Has Batch Effect Risk** | An omics assay is considered to have a batch effect risk if the measurement error score is greater than 0.3. |
| **DR-33 Is High Quality Assay** | An omics assay is considered a high quality assay if all of the following hold: it is not the case that the has batch effect risk flag is set and the measurement error score is less than 0.15. |
| **DR-34 Name** | An environmental exposure's name is computed as the exposure label. |
| **DR-35 Individual Ancestry Label** | An environmental exposure's individual ancestry label is the ancestry label of the environmental exposure's individual. |
| **DR-36 Is High Exposure** | An environmental exposure is considered a high exposure if the exposure level is greater than 5. |
| **DR-37 Name** | A treatment's name is computed as the treatment label. |
| **DR-38 Autoimmune Disease Label** | A treatment's autoimmune disease label is the disease label of the treatment's autoimmune disease. |
| **DR-39 Is Effective Treatment** | A treatment is considered an effective treatment if all of the following hold: at least one of the following holds: the treatment response is the literal “Complete” or the treatment response is the literal “Partial” and it is not the case that the has adverse effect flag is set. |
| **DR-40 Name** | A clinical phenotype's name is computed as the phenotype label. |
| **DR-41 Disease Stage Label** | The clinical phenotype's disease stage label is determined by the following priority:<br>1. an empty string, if the disease stage is blank;<br>2. otherwise the stage label of the clinical phenotype's disease stage. |
| **DR-42 Is High Severity** | A clinical phenotype is considered a high severity if the severity score is greater than 7. |
| **DR-43 Is Presymptomatic Phenotype** | A clinical phenotype is considered a presymptomatic phenotype if the disease stage label is the literal “Presymptomatic”. |
| **DR-44 Name** | A causal mechanism's name is computed as the mechanism label. |
| **DR-45 Individual Ancestry Label** | A causal mechanism's individual ancestry label is the ancestry label of the causal mechanism's individual. |
| **DR-46 Is Causal Architecture Node** | A causal mechanism is considered a causal architecture node if all of the following hold: the causal confidence is at least 0.7; it is not the case that the has spurious correlation flag is set; and the is experimentally falsifiable flag is set. |
| **DR-47 Name** | An epistatic interaction's name is computed as the interaction label. |
| **DR-48 Is High Order Epistasis** | An epistatic interaction is considered a high order epistasis if the epistasis score is greater than 0.5. |
| **DR-49 Name** | A counterfactual trajectory's name is computed as the trajectory label. |
| **DR-50 Autoimmune Disease Label** | A counterfactual trajectory's autoimmune disease label is the disease label of the counterfactual trajectory's autoimmune disease. |
| **DR-51 Is Worsening Trajectory** | A counterfactual trajectory is considered a worsening trajectory if the projected severity is greater than 7. |
| **DR-52 Name** | An individual prediction's name is computed as the prediction label. |
| **DR-53 Individual Ancestry Label** | An individual prediction's individual ancestry label is the ancestry label of the individual prediction's individual. |
| **DR-54 Is Ancestry Holdout** | An individual prediction's is ancestry holdout is true when the individual prediction's individual is ancestry absent from training. |
| **DR-55 Is High Confidence Prediction** | An individual prediction is considered a high confidence prediction if all of the following hold: the calibrated uncertainty is at least 0.7 and it is not the case that the has spurious correlation flag is set. |
| **DR-56 Patient Stratification Tier** | The individual prediction's patient stratification tier is determined by the following priority:<br>1. the literal “High-Risk Pathway”, if the predicted value is at least 7;<br>2. the literal “Moderate-Risk Pathway”, if the predicted value is at least 4;<br>3. otherwise the literal “Low-Risk Pathway”. |
| **DR-57 Name** | An intervention target's name is computed as the target label. |
| **DR-58 Causal Mechanism Label** | An intervention target's causal mechanism label is the mechanism label of the intervention target's causal mechanism. |
| **DR-59 Is Gene Based Therapy** | An intervention target is considered a gene based therapy if the therapy class is the literal “Gene-based”. |
| **DR-60 Is Cell Based Therapy** | An intervention target is considered a cell based therapy if the therapy class is the literal “Cell-based”. |

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
| **GenomicVariants.Name** | formula | `VariantLabel` |
| **GenomicVariants.VariantTypeLabel** | formula | `Lookup(VariantTypes.TypeLabel via VariantType)` |
| **GenomicVariants.IndividualAncestryLabel** | formula | `Lookup(Individuals.AncestryLabel via Individual)` |
| **GenomicVariants.IsRareVariant** | formula | `If(AlleleFrequency < 0.01, True(), False())` |
| **GenomicVariants.IsCausalCandidate** | formula | `If(And(IsRareVariant, IsTrueCausalCandidate), True(), False())` |
| **OmicsAssays.Name** | formula | `AssayLabel` |
| **OmicsAssays.ModalityLabel** | formula | `Lookup(OmicsModalities.ModalityLabel via OmicsModality)` |
| **OmicsAssays.TissueLabel** | formula | `If(Tissue = "", "Missing Tissue", Lookup(Tissues.TissueLabel via Tissue))` |
| **OmicsAssays.HasBatchEffectRisk** | formula | `If(MeasurementErrorScore > 0.3, True(), False())` |
| **OmicsAssays.IsHighQualityAssay** | formula | `If(And(Not(HasBatchEffectRisk), MeasurementErrorScore < 0.15), True(), False())` |
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
| **CausalMechanisms.IsCausalArchitectureNode** | formula | `If(And(CausalConfidence >= 0.7, Not(HasSpuriousCorrelationFlag), IsExperimentallyFalsifiable), True(), False())` |
| **EpistaticInteractions.Name** | formula | `InteractionLabel` |
| **EpistaticInteractions.IsHighOrderEpistasis** | formula | `If(EpistasisScore > 0.5, True(), False())` |
| **CounterfactualTrajectories.Name** | formula | `TrajectoryLabel` |
| **CounterfactualTrajectories.AutoimmuneDiseaseLabel** | formula | `Lookup(AutoimmuneDiseases.DiseaseLabel via AutoimmuneDisease)` |
| **CounterfactualTrajectories.IsWorseningTrajectory** | formula | `If(ProjectedSeverity > 7, True(), False())` |
| **IndividualPredictions.Name** | formula | `PredictionLabel` |
| **IndividualPredictions.IndividualAncestryLabel** | formula | `Lookup(Individuals.AncestryLabel via Individual)` |
| **IndividualPredictions.IsAncestryHoldout** | formula | `Lookup(Individuals.IsAncestryAbsentFromTraining via Individual)` |
| **IndividualPredictions.IsHighConfidencePrediction** | formula | `If(And(CalibratedUncertainty >= 0.7, Not(HasSpuriousCorrelationFlag)), True(), False())` |
| **IndividualPredictions.PatientStratificationTier** | formula | `If(PredictedValue >= 7, "High-Risk Pathway", If(PredictedValue >= 4, "Moderate-Risk Pathway", "Low-Risk Pathway"))` |
| **InterventionTargets.Name** | formula | `TargetLabel` |
| **InterventionTargets.CausalMechanismLabel** | formula | `Lookup(CausalMechanisms.MechanismLabel via CausalMechanism)` |
| **InterventionTargets.IsGeneBasedTherapy** | formula | `If(TherapyClass = "Gene-based", True(), False())` |
| **InterventionTargets.IsCellBasedTherapy** | formula | `If(TherapyClass = "Cell-based", True(), False())` |

---

_This document is rendered in **RuleSpeak®**, the declarative business-rule
notation created by **Ronald G. Ross**, and follows the conventions of
**SBVR** (Semantics of Business Vocabulary and Business Rules). With thanks to
Ronald G. Ross for RuleSpeak and his foundational work on business rules —
[www.RonRoss.info](https://www.RonRoss.info)._
