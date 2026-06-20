# V2 Response Proposal — answering the v1 audit

> **This file is the target.** Everything built in the v2 loop is designed to make the
> claims below *literally true and witnessable in the repo*. If a sentence here is not yet
> backed by a green test or an inspectable DAG node, it is a TODO, not a talking point.
> Write the response first; build the model to fit it.

---

## The audit, fairly stated (so we answer the real thing)

The doctor gave us **15%** and was right about the axis he measured. His load-bearing
sentences:

1. *"The hard part is discovering and validating real causal autoimmune biology... your
   system is much closer to an auditable clinical evidence **adjudication layer** than to a
   complete causal-disease platform."*
2. *"It simulates whether **evidence is actionable**, not whether **disease is progressing**
   in a biologically and clinically realistic way... That is the difference between an
   **evidence gate** and a **disease-state simulator**."*
3. His worked example of what we *couldn't* say:
   *"This patient is transitioning from presymptomatic autoimmunity to early lupus nephritis,
   has rising anti-dsDNA and falling complement, is at risk of renal flare, should be
   evaluated for biopsy, and would likely respond differently to mycophenolate vs belimumab
   vs anifrolumab."*
4. Missing depth: lupus nephritis, NPSLE, cutaneous lupus, sero±RA, erosive disease, axial
   PsA, enthesitis, dactylitis, uveitis, IBD overlap, organ damage, flare patterns,
   treatment lines, real disease-activity scores; and the clinical workflow referral →
   differential → workup → classification → severity → treatment → monitoring → flare →
   AE surveillance → outcomes.

**We concede the score and the axis.** We do not argue 15%. We argue what 15% in 6 hours
*means*, and we close his two worked examples specifically.

---

## The one-paragraph thesis (the spine of the reply)

> v1 answered the **per-patient adjudication** question: *is this prediction trustworthy
> enough to act on?* The audit is right that the harder, more interesting question is
> **disease-state progression and discovery** — and right that those are different things.
> So v2 adds exactly that layer, **on the same hub, with the same trust boundary**: disease
> progresses as a **witnessed state machine** whose transitions fire only on raw longitudinal
> observations (rising anti-dsDNA, falling C3/C4, proteinuria), whose current state and
> dwell-time are **derived, bitemporal, and auditable** — not hand-set. The reason we can add
> a disease-state simulator in hours rather than rebuild is the whole point of the framework:
> a new concept is not a new system, it's more **Schema/Data/Lookups/Aggregations/Formulas**
> in the one model of the concepts. **And discovery is not a per-patient act — it's a
> corpus-level one.** v1 looked at patients one at a time; v2 adds the cross-cohort views
> where the patterns that *generate* causal hypotheses emerge from the data the way they were
> originally discovered. We didn't move the 15% by arguing; we built the layer the audit said
> didn't exist and left it green and inspectable.

---

## The reframe that makes 15% the *good* number (not a defense — a measurement)

The doctor measured **domain coverage** — a snapshot. On that axis 15% is fair and *will stay
low for a long time*, because coverage is bottomless: there is always one more phenotype. **You
cannot win a coverage argument with a domain expert and we will not try.**

The framework's claim is on a different axis: **the cost-to-add-the-next-concept, and whether
adding it preserves the audit guarantee.** That's the derivative, not the snapshot. The v2
build is the evidence for the derivative:

- We add **every word he named** as vocabulary/schema (so his AI sees the coverage is no
  longer absent), and
- we make **two of his own examples** carry a deep, witnessed inference DAG (lupus-nephritis
  progression and the MMF/belimumab/anifrolumab treatment-line choice),
- **all additive into the same hub**, all bottoming out in raw leaves, all green in the same
  harness.

The honest line: *15% of the surface in 6 hours, where each next concept is additive into one
auditable structure rather than a bolt-on subsystem, is a statement about slope.*

## The classification the user proposed (use it — it's the cleanest frame)

> **v1 = individual / per-patient adjudication. v2 = corpus / cohort-level discovery &
> progression.**

This directly converts the "you don't do discovery" critique: **discovery is inherently
corpus-level.** A single patient's chart never "discovers" a mechanism; a *pattern across
many patients* does. So the v2 UI/UX is built around **cross-cohort visualizers** that show
the patterns emerging — not just one more per-patient screen.

---

## What v2 actually ships (each item must end green / inspectable)

### A. Vocabulary completeness (his "missing words" → present)
Every concept the audit named exists as schema + glossary + (where it has a verdict) data:
lupus nephritis, NPSLE, cutaneous lupus, seropositive/seronegative RA, erosive disease,
axial PsA, enthesitis, dactylitis, uveitis, IBD overlap, organ damage (SLICC-style), flare
patterns, treatment lines, disease-activity scores (SLEDAI / DAS28). **Coverage claim is
checkable by grep, not by trust.**

### B. Disease as a witnessed state machine (closes "evidence gate vs disease-state simulator")
- New state machines on the existing polymorphic substrate (`StateMachines` /
  `MachineStates` / `StateTransitionRules` / `StateTransitions` / `SubjectStateInstances`):
  e.g. **lupus-nephritis-progression** (`presymptomatic-autoimmunity → serologic-active →
  early-nephritis → renal-flare-risk → biopsy-indicated`), and a disease-activity track.
- **Every transition guard fires on a RAW leaf** (a lab value or a trajectory sign), never a
  hand-set state. Current state is the existing **derived** `IsCurrent` occupancy.
- **Bitemporal dwell-time** is derived: how long this patient/disease has been in a state
  (now − EnteredAt while current; ExitedAt − EnteredAt once left). Same trust boundary as
  `IsClinicallyActionable`: raw observations in, derived state out.
- Evidence/tests/facts are **tied to the occupancy window** they belong to, so the chart
  shows *what was true while the patient was in that state*.

### C. His worked example, said back to him verbatim
The system can now emit, for the right patient, the sentence he said it couldn't:
*"transitioning from presymptomatic autoimmunity to early lupus nephritis, rising anti-dsDNA,
falling complement, at renal-flare risk, biopsy-indicated"* — as a **derived** state + a
**derived** treatment-line recommendation (MMF vs belimumab vs anifrolumab), each with the
single deciding reason, each witnessed.

### D. The minimum counter-example (the thing that flips a skeptic)
At least one patient where the **disease-state simulator and the actionability gate DISAGREE**
— disease is genuinely progressing (state machine fires toward renal-flare-risk) **but** the
prediction is NOT actionable (fails a gate). This proves the two layers are *independent and
both real* — i.e. v2 is not v1 relabeled.

### E. Corpus-level discovery surface (closes "you don't do discovery")
Cross-cohort views/aggregations that show a pattern emerging across patients (e.g. a
serology-trajectory signature that co-occurs with the early-nephritis transition across the
cohort) — the shape of *how the hypothesis would have been discovered*, surfaced corpus-wide,
not patient-by-patient. UI plan in `V2-UI-PLAN.md`.

### F. Everything green, everything witnessed
New conformance tests for B–E surface in the same red→green home harness and pass against the
app's own API / `vw_*` views. Oracle captured live, never hand-edited.

---

## Honest bounds we keep stating (this is what makes it credible)

- It is still **synthetic, transparent test data** — fake numbers, fully visible, every one an
  editable knob. We model the **TYPES of ontological stressors**, not a clinical dataset.
- It is a **proof of shape / POC**, not validated clinical decision support. We are not
  claiming validated biology; we are claiming the *structure* that real biology would slot
  into is now demonstrably present and auditable.
- We do **not** claim to have done causal discovery on real multi-omic data. We claim the
  corpus-level surface where such discovery is *expressed and audited* now exists.

---

## Draft closing line (tone: peer, not salesman)

> So: 15% is fair on coverage, and we took the two examples you used to define the gap —
> lupus-nephritis progression and the MMF/belimumab/anifrolumab choice — and made the system
> *say them*, as derived, witnessed, raw-fact-grounded state, not as labels. The interesting
> part isn't that we closed two examples; it's that closing them was additive into the same
> auditable model rather than a second system. v1 was the per-patient verdict; v2 is the
> cohort-level layer where progression and discovery actually live. Same trust boundary, same
> red→green harness, still honestly synthetic. Curious whether the *shape* now reads as the
> right substrate for the hard part you named.
