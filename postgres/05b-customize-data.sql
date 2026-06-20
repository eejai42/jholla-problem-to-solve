-- ============================================================================
-- CUSTOMIZE DATA - User-defined data customizations
-- ============================================================================
-- This file is for YOUR custom changes that should persist across
-- regeneration of the base ERB files.
--
-- IMPORTANT:
--   - This file runs AFTER the main data script
--   - Define your customizations in the ERBCustomizations table in Airtable
--   - Those changes will appear here after the next build
--
-- ============================================================================

-- Your custom data changes will appear here:


-- ============================================================================
-- v2 Step 3: force-update CausalMechanisms.TargetPathway (NEW RAW LEAF).
-- The main 05-insert-data.sql uses ON CONFLICT DO NOTHING, so a pre-existing
-- mechanism row keeps its old (NULL) target_pathway on reseed. This seam runs
-- AFTER the main insert and makes the leaf durable across reseeds. (See the
-- reseed-clobber gotcha: editing existing leaf rows in the rulebook is reverted
-- by ON CONFLICT DO NOTHING unless force-applied here.)
-- ============================================================================
UPDATE causal_mechanisms SET target_pathway = CASE causal_mechanism_id
  WHEN 'cm-a' THEN 'type-I-IFN'           WHEN 'cm-b' THEN 'type-I-IFN'
  WHEN 'cm-c' THEN 'B-cell/autoantibody'  WHEN 'cm-d' THEN 'B-cell/autoantibody'
  WHEN 'cm-e' THEN 'T-cell-costim'        WHEN 'cm-f' THEN 'IL-17/23'
  WHEN 'cm-g' THEN 'IL-17/23' END
WHERE causal_mechanism_id IN ('cm-a','cm-b','cm-c','cm-d','cm-e','cm-f','cm-g');

-- ============================================================================
-- v2 UI: promote the Cohort Discovery board up the left nav + rename it.
-- SortOrder/DisplayName are raw columns on a PRE-EXISTING routing row, so the
-- main 05-insert (ON CONFLICT DO NOTHING) keeps the old values on reseed. Force
-- them here (the preserved post-insert seam). Hub is the SSoT (91.5 / 'Cohort
-- discovery'); this just makes a reseeded DB match it.
-- ============================================================================
UPDATE routing_and_navigation
   SET sort_order = 91.5, display_name = 'Cohort discovery'
 WHERE route_key = 'admin.cohort';
