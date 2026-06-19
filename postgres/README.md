# Rulebook to PostgreSQL Script Generation Report

**Schema:** `public`
**Database:** `demo`
**Timestamp:** 2026-06-19 21:02:15 UTC

## Parsing Rulebook

Found **28** tables in rulebook


  - **AutoimmuneDiseases** (12 fields, 3 records)
  - **DiseaseStages** (7 fields, 6 records)
  - **Tissues** (5 fields, 5 records)
  - **OmicsModalities** (6 fields, 8 records)
  - **FederatedDatasets** (9 fields, 4 records)
  - **VariantTypes** (6 fields, 5 records)
  - **Individuals** (30 fields, 7 records)
  - **GenomicVariants** (12 fields, 7 records)
  - **OmicsAssays** (15 fields, 21 records)
  - **EvidenceItems** (15 fields, 21 records)
  - **CohortReplications** (12 fields, 21 records)
  - **NegativeControlTests** (8 fields, 14 records)
  - **EnvironmentalExposures** (9 fields, 1 records)
  - **Treatments** (11 fields, 1 records)
  - **ClinicalPhenotypes** (13 fields, 1 records)
  - **CausalMechanisms** (30 fields, 7 records)
  - **EpistaticInteractions** (9 fields, 1 records)
  - **CounterfactualTrajectories** (10 fields, 1 records)
  - **IndividualPredictions** (28 fields, 7 records)
  - **CalibrationBins** (9 fields, 35 records)
  - **InterventionTargets** (10 fields, 6 records)
  - **Axioms** (5 fields, 8 records)
  - **TestsForSuccess** (6 fields, 6 records)
  - **Features** (5 fields, 6 records)
  - **OpenQuestions** (6 fields, 3 records)
  - **NonGoals** (4 fields, 5 records)
  - **GlossaryTerms** (4 fields, 6 records)
  - **LeopoldLoops** (11 fields, 10 records)

Generated **28** table definitions with **159** raw fields (mode=check-add)
Generated **218** calculation functions
Generated **28** views
Enabled RLS on **28** tables
Generated insert statements for **226** records
## Script Generation Complete

Generated files:
- `00-bootstrap.sql` - Bootstrap (overwrite Never); includes commented-out drop-all script
- `01-drop-and-create-tables.sql` - Drop and recreate tables with raw fields and FK indexes
- `01b-customize-schema.sql` - User customizations for schema
- `02-create-functions.sql` - Create calculation functions
- `02b-customize-functions.sql` - User customizations for functions
- `03-create-views.sql` - Create views with calculated fields
- `03b-customize-views.sql` - User customizations for views
- `04-create-policies.sql` - Create RLS policies
- `04b-customize-policies.sql` - User customizations for RLS policies
- `05-insert-data.sql` - Insert data from rulebook
- `05b-customize-data.sql` - User customizations for seed data
- `99-fk-constraints.sql` - FK constraints (skipped unless EFFORTLESS_ENFORCE_FKS=true)
- `init-db.sh` - Database initialization script

