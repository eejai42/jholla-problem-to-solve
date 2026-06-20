# V2 Coverage Map — what is NOT yet built

> Everything the audit named that is DERIVED or MODELED is in the model. What remains below is the
> deliberately-not-built surface: concepts present as a TYPE/slot the model can talk about
> (**VOCABULARY**), or things that need real multi-omic data / real causal inference and are
> represented only as a slot with no validated claim (**OUT-OF-SCOPE**).

| Challenge phrase | Status | Slot |
|---|---|---|
| clinical workflow (referral→differential→workup→classification→baseline-severity→treatment-choice→monitoring→flare-mgmt→AE-surveillance→outcomes) | VOCABULARY | workflow states; workup/monitoring are where raw leaves enter |
| deep adverse-event surveillance | VOCABULARY | `adverse-event-surveillance` |
| repeat expansions, mobile-element insertions, somatic mosaicism, mitochondrial variation, epigenetic inheritance | VOCABULARY | named in challenge + glossary; would be additional `VariantTypes` rows |
| assortative mating, batch effects, missing tissues, measurement error, ascertainment bias, shifting environments | VOCABULARY | named stressor types (only `OmicsAssays.MeasurementErrorScore` is wired as a leaf) |
| cell-state-specific effects, 3D enhancer–promoter, chromatin conformation | VOCABULARY / OUT-OF-SCOPE | `OmicsModalities`/`Tissues` represent the slot; no real single-cell/Hi-C data |
| counterfactual trajectories without randomized perturbation | VOCABULARY / OUT-OF-SCOPE | `CounterfactualTrajectories` (sparse); real counterfactual causal inference not done |
| omics/data-modality breadth (phased T2T genomes, pangenome graphs, scRNA/ATAC, proteomics, metabolomics, methylomes, Hi-C, immune repertoires, microbiomes, exposures) | OUT-OF-SCOPE (as real data) | `OmicsModalities`/`OmicsAssays`/`Tissues`/`EnvironmentalExposures`/`FederatedDatasets` are shaped to receive them; PoC uses synthetic values, not a real corpus |
