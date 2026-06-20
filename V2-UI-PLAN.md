# V2 UI — from per-patient verdicts to corpus-level discovery

> **The classification this surface renders:** **v1 = individual / per-patient adjudication.
> v2 = corpus / cohort-level discovery & disease-state progression.** v1 renders the per-patient
> chain (intake → witness → gates → keystone → diagnosis writeup). v2's UX is the layer above it:
> **the patterns that emerge across the whole cohort** — because discovery is a corpus-level act,
> never a single chart.
>
> This is now BUILT. Every screen reads a `vw_*`-backed endpoint as opaque truth and never recomputes
> a verdict; each binds to a field that is green in the harness, so the screen is correct the moment
> the test is. The one item still open is noted at the bottom.

---

## Shipped: **Cohort discovery** — the corpus-level board

`CohortDiscovery` (`pages.jsx`) is the **top-level nav item for every role** — the corpus-level
punchline at the top. It reads `/api/cohort-individuals` and has four panels (`?panel`):

- **Disease-state map (`map`)** — rows = the 12 individuals, columns = the lupus-nephritis states
  (Presymptomatic → SerologicActive → EarlyNephritis → RenalFlareRisk → BiopsyIndicated); the current
  derived state is the filled cell, SLEDAI · tier alongside. The nephritis cluster reads at a glance.
- **Emergent signature (`signature`)** — an SVG scatter: x = anti-dsDNA trend, y = complement trend,
  colour = derived nephritis state, size = SLEDAI. The rising-dsDNA + falling-complement corner is
  where the nephritis cases cluster — the *shape* of how "this serology signature precedes renal
  involvement" would be discovered across a cohort. Ships the honest synthetic-data caption.
- **Disagreement board (`disagreement`)** — "Progressing?" (simulator) vs "Actionable?" (gate) per
  patient, with the disagreeing row lit. Diego is the lit cell: progressing yet not actionable
  (cryptic relatedness). Reads `is_disease_progressing` + `is_clinically_actionable` +
  `progression_vs_actionability_disagree`.
- **Treatment lines (`treatment`)** — recommended line grouped by pathway, each patient drillable to
  the deciding factor. Reads `recommended_treatment_line` / `treatment_line_deciding_factor`.

Every point/row deep-links to the patient's per-case view at the right tab.

## Shipped: per-patient tabs (in the `diagnosis.case` view)

The per-case view gained two tabs, slotted into the existing nav so the chain reads top-to-bottom:

| Tab (`?tab`) | Shows | Endpoint |
|---|---|---|
| `progression` ("Disease course") | the disease-state **timeline**: occupancy chain with EnteredAt/ExitedAt/DwellDays, current state highlighted, the serology that drove each transition | `/api/individuals/:id/progression` |
| `treatment-line` ("Treatment line") | the derived treatment-line recommendation + the single deciding factor, with mechanism-pathway + disease-state as the upstream cells | `/api/predictions/:id` |

The per-patient **diagnosis writeup** ("Summary writeup" tab) is the payoff artifact and a side effect
of the green tests, exactly as in v1.

## Shipped: admin knobs (the spreadsheet-cell promise, extended to the new leaves)

Every new raw leaf is an editable knob via the existing intake editors + Explainer DAG —
`SerologyObservations` rows (anti-dsDNA / C3 / C4 / proteinuria / sediment),
`CausalMechanisms.TargetPathway`, `SubjectStateInstances.DwellDays`. Editing a value nudges the
derived trend → state → recommendation live. Every new derived field (state, SLEDAI, tier, line,
deciding factor, disagreement flag) is inspectable in the Explainer DAG, since the build regenerates
the explainer graph from the hub.

---

## Still open

- **Progression machine in the state-machine admin (`StateMachineView`).** The state-machine admin
  page still binds only to `diagnosis-lifecycle`. The `lupus-nephritis-progression` machine is already
  in `vw_state_machines` and served by the same router, so this is a binding change in
  `StateMachineView` (states + the 5 raw-leaf-triggered transition rules + a per-state cohort-occupancy
  strip), not a model change.

**Guardrail:** no screen recomputes a verdict; each binds to a harness-green derived field. If a screen
needs a value the model doesn't derive yet, that's a rulebook change (a new Leopold loop), not client
code — keep the trust boundary on the DAG, not in React.
