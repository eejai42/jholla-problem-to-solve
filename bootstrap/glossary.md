# Glossary — Causal Autoimmune Architecture Platform

Formal vocabulary for a platform that infers the complete causal architecture of heterogeneous autoimmune disease from multi-omic cohort data and produces falsifiable, ancestry-equitable predictions.

---

## Cohort & Participants

**individuals** — The one million ancestrally diverse participants whose phased telomere-to-telomere long-read genomes, omics profiles, exposures, and clinical phenotypes feed the causal model.

**ancestrally diverse** — Cohort composition spanning multiple ancestries so the model can be tested on populations absent from training data.

**ancestries** — Population genetic background labels used to audit ancestry-equitable risk prediction and population stratification controls.

**longitudinal** — Repeated measurements over development and aging that capture disease progression and treatment-induced changes.

**privacy-preserving federated datasets** — Distributed data nodes that contribute summaries without centralizing raw genomes, enabling analysis under privacy constraints.

**federated datasets** — Registered remote cohort partitions linked to the platform for harmonized causal inference.

---

## Omics & Molecular Data

**phased telomere-to-telomere** — Complete haplotype-resolved genome assemblies used to anchor variant calls and structural variant discovery.

**long-read genomes** — Sequencing reads long enough to resolve repeats, mobile-element insertions, and complex structural variants.

**pangenome graphs** — Graph-based reference structures that represent population variation beyond a single linear reference.

**single-cell** — Measurements resolved to individual cells rather than bulk tissue averages.

**spatial** — Tissue-context-preserving assays that localize RNA or chromatin signals within histological sections.

**RNA-seq** — Transcript abundance profiling used for allele-specific expression and cell-state-specific effects.

**ATAC-seq** — Chromatin accessibility profiling that informs enhancer–promoter interactions and regulatory variant interpretation.

**proteomics** — Protein abundance and modification data linking genetic variation to molecular state.

**metabolomics** — Small-molecule profiles reflecting downstream biochemical consequences of immune dysfunction.

**methylomes** — Genome-wide DNA methylation maps supporting epigenetic inheritance and treatment-induced changes.

**chromatin-conformation** — Hi-C and related data capturing 3D enhancer–promoter interactions across tissues.

**immune-receptor repertoires** — T-cell and B-cell receptor sequencing data characterizing adaptive immune states.

**microbiomes** — Community profiles of gut and other niches that participate in gene–environment–microbiome interactions.

**omics modalities** — Canonical assay types (genome, transcriptome, epigenome, proteome, metabolome, repertoire, microbiome) registered in the platform.

---

## Disease Context

**heterogeneous autoimmune disease** — A clinically and molecularly diverse autoimmune condition whose causal architecture spans tissues, stages, and ancestries.

**autoimmune disease** — The target disease domain whose complete causal map the platform seeks to reconstruct.

**disease stages** — Ordered phases (presymptomatic, active, remission, treatment-refractory) along disease progression.

**development** — Early-life windows when maternal and developmental effects shape later autoimmune risk.

**aging** — Later-life processes that modify molecular state and feedback with disease progression.

**tissues** — Anatomical sites (blood, gut, synovium, skin, brain) where cell-state-specific effects are measured.

**missing tissues** — Absent biopsy or assay data that the model must remain valid despite.

**clinical phenotypes** — Observed signs, symptoms, lab values, and severity scores linked to each individual.

**immune dysfunction** — The pathological immune activation or tolerance failure connecting variation to disease.

---

## Variation & Genetics

**regulatory variants** — Noncoding alleles that alter enhancer–promoter interactions or expression; must be distinguished from spurious correlations.

**coding variants** — Protein-altering alleles with direct functional consequences.

**repeat expansions** — Pathogenic expansion of tandem repeats implicated in autoimmune and neuroimmune phenotypes.

**mobile-element insertions** — Retrotransposon and other insertional events contributing to structural variation.

**HLA haplotypes** — MHC allele combinations with strong autoimmune associations requiring dedicated modeling.

**structural variants** — Large insertions, deletions, inversions, and complex rearrangements.

**de novo mutations** — Germline variants absent in both parents, relevant to early-onset cases.

**somatic mosaicism** — Post-zygotic mutations present in subsets of cells.

**mitochondrial variation** — Heteroplasmic or homoplasmic mtDNA changes affecting energy metabolism and immunity.

**epigenetic inheritance** — Transgenerational or persistent epigenetic marks not encoded in DNA sequence alone.

**genetic variation** — The full spectrum of inherited and acquired sequence and epigenetic differences across individuals.

**rare-variant burden** — Aggregate counts of low-frequency alleles in genes or pathways.

**allele-specific expression** — Differential transcript output from maternal versus paternal alleles.

**cell-state-specific effects** — Regulatory or expression consequences confined to particular immune or stromal cell types.

---

## Causal Inference

**causal architecture** — The directed network linking variants, exposures, molecular states, and clinical outcomes.

**causal map** — A near-complete visualization and machine-readable encoding of that architecture.

**higher-order epistasis** — Multi-locus interaction effects beyond pairwise epistasis.

**epistasis** — Statistical or mechanistic interaction between genetic variants.

**pleiotropy** — Single variants or pathways influencing multiple phenotypes or diseases.

**gene–environment–microbiome interactions** — Joint effects of genotype, exposure, and microbial community on disease risk.

**maternal effects** — In utero or perinatal influences on offspring autoimmune trajectories.

**developmental effects** — Age-window-specific causal influences during organ and immune system maturation.

**treatment-induced changes** — Molecular or phenotypic shifts caused by therapy rather than disease biology alone.

**feedback** — Bidirectional coupling between disease progression and molecular state.

**counterfactual trajectories** — Predicted disease courses under unobserved interventions or environmental shifts.

**randomized perturbation** — Experimental interventions; absent data the model must infer counterfactuals without them.

**experimentally falsifiable mechanisms** — Causal hypotheses with explicit predictions testable in lab or clinic.

**intervention targets** — Validated nodes in the causal map suitable for gene-based or cell-based therapies.

---

## Model Quality & Bias

**population stratification** — Confounding from ancestry structure that must not masquerade as causality.

**assortative mating** — Non-random mating patterns that induce cryptic relatedness and allele frequency distortion.

**cryptic relatedness** — Hidden kinship among ostensibly unrelated individuals.

**batch effects** — Technical variation between sequencing or assay runs.

**measurement error** — Noise in omics and phenotype readouts that propagates into uncertainty.

**ascertainment bias** — Skewed case enrollment that distorts effect estimates.

**shifting environments** — Temporal or geographic changes in exposure profiles not represented in training.

**calibrated uncertainty** — Prediction intervals whose stated coverage matches empirical frequency.

**spurious correlations** — Associations without causal support that the model must not rely on.

---

## Predictions & Outcomes

**disease onset** — Time-to-diagnosis or presymptomatic conversion events the platform predicts.

**severity** — Continuous or staged measures of disease burden.

**treatment response** — Individualized expected benefit from specific therapies.

**adverse effects** — Predicted harm from immunosuppression or targeted treatments.

**ancestry-equitable risk prediction** — Risk scores with comparable calibration across ancestries.

**patient stratification** — Assigning individuals to molecular subtypes sharing causal pathways.

**causal molecular pathway** — The mechanistic route from variant or exposure to phenotype for a given person.

**individualized prevention** — Risk-guided interventions before clinical diagnosis.

**presymptomatic diagnosis** — Detection of autoimmune processes before overt symptoms.

**clinical trials** — Studies whose failure rates may drop when enrollment follows causal stratification.

**complex diseases** — Multifactorial conditions beyond autoimmune disease for which the framework generalizes.

**gene-based therapies** — Interventions editing or modulating specific causal genes.

**cell-based therapies** — Treatments using engineered or transplanted cells targeting causal nodes.

**adverse effects** — Harmful outcomes including broad immune suppression when causal pathways are mis-targeted.
