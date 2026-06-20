# V2 UI Plan — from per-patient verdicts to corpus-level discovery

> **The classification that organizes this plan (the user's framing):**
> **v1 = individual / per-patient adjudication. v2 = corpus / cohort-level discovery & disease-state
> progression.** v1 already renders the per-patient chain (intake → witness → gates → keystone →
> diagnosis writeup). v2's UX job is the layer above it: **show the patterns that EMERGE across the
> whole cohort** — because discovery is inherently a corpus-level act, never a single chart.
>
> This is a PLAN, not built UI. The data + endpoints it needs already exist and are green in the
> harness (L11 / L11b / L5d). Nothing here invents new model semantics; it surfaces what the hub
> already derives. Routes use the existing `RoutingAndNavigation` tree (intake / diagnosis / admin).

---

## 0. Principle: every new screen reads a DERIVED field; nothing is computed in the client

Same rule as v1: the UI consumes `vw_*`-backed endpoints as opaque truth and never recomputes a
verdict. New screens bind to fields that are already green in the harness, so the screen is correct
the moment the test is. Every value remains an inspectable knob via the existing Explainer DAG.

---

## 1. The new top-level surface: **Cohort Discovery** (`admin.cohort` → expand)

Today `admin.cohort` is a keystone list (7 rows, who's actionable). v2 turns it into the
**corpus-level discovery board** — the single most important new screen, because it answers the
audit's "you don't do discovery" directly.

### 1a. Disease-state cohort map (the headline)
A matrix: **rows = the 9 individuals, columns = the lupus-nephritis states**
(Presymptomatic → SerologicActive → EarlyNephritis → RenalFlareRisk → BiopsyIndicated). Each cell
shows dwell-time; the current state is highlighted. Reads from `/api/individuals/:id/progression`.
- **What it makes visible:** the *cohort moving through disease space over time* — not one chart, a
  population. You can see the cluster that has crossed into nephritis.

### 1b. The emergent-signature panel (the discovery claim, made visual)
A small-multiples / scatter view across the cohort: x = anti-dsDNA trend, y = complement trend,
point color = derived `nephritis_progression_state_key`, size = `SledaiScore`. The
rising-dsDNA + falling-complement quadrant lights up with the EarlyNephritis/RenalFlareRisk/Biopsy
cases.
- **What it makes visible:** *the pattern that would have been DISCOVERED* — "this serology
  signature precedes renal involvement" — as an emergent cluster in cohort data, with a one-click
  drill from any point to that patient's witnessed derivation. This is the v2 reframe rendered:
  discovery is the cohort view; adjudication is the per-patient drill-down.
- **Honest caption (must ship on the panel):** *synthetic, transparent data; the cluster is a
  demonstration of the SHAPE of discovery, not a finding.*

### 1c. The disagreement board (the counter-example, promoted to UX)
A two-column reconciliation across the cohort: **"disease progressing?"** (simulator) vs
**"prediction actionable?"** (gate), with the cell where they **disagree** flagged. Diego is the lit
cell: progressing (BiopsyIndicated, SLEDAI 12) yet NOT actionable (cryptic). Reads
`is_disease_progressing` + `is_clinically_actionable` + `progression_vs_actionability_disagree`.
- **Why it matters in UX:** it teaches the viewer, at a glance, that the two layers are independent
  — the thing that proves v2 isn't v1 relabeled.

### 1d. Treatment-line distribution
A bar/sankey across the cohort: confirmed-mechanism pathway → recommended line
(Anifrolumab / Belimumab / Secukinumab / MMF-induction / no-targeted-line), each segment drillable
to the deciding factor. Reads `/api/predictions/:id` (`recommended_treatment_line`,
`treatment_line_deciding_factor`).

---

## 2. Per-patient integration (extend the existing `diagnosis.case` tabs)

The per-patient case view (v1) gains two tabs, slotted into the existing
`diagnosis.case.*` nav so the chain reads top-to-bottom:

| New tab (route key) | Shows | Endpoint |
|---|---|---|
| `diagnosis.case.progression` | the patient's disease-state **timeline**: occupancy chain with EnteredAt/ExitedAt/DwellDays, current state highlighted, the serology panels that drove each transition (raw leaves with provenance, like the v1 witness panel) | `/api/individuals/:id/progression` |
| `diagnosis.case.treatment-line` | the derived treatment-line recommendation + the single deciding factor, with the mechanism-pathway + disease-state inputs shown as the two upstream cells | `/api/predictions/:id` |

The per-patient **diagnosis writeup** (the payoff artifact) gains a paragraph generated from these:
*"…has been in RenalFlareRisk for ~90 days; serology shows rising anti-dsDNA with falling
complement; disease state is BiopsyIndicated; recommended line is mycophenolate induction because
the patient is in active nephritis…"* — a side effect of the green tests, exactly as v1's writeup is.

For the **disagreement cases**, the writeup adds the honest reconciliation sentence:
*"NB: although the disease is progressing and warrants clinical attention, the causal-mechanism
prediction is NOT clinically actionable (cryptic-relatedness leakage) — do not use it to choose
targeted therapy."*

---

## 3. The disease-state machine, in the existing State-Machine admin (`admin.state-machine`)

The state-machine admin already visualizes `diagnosis-lifecycle`. v2 adds the
`lupus-nephritis-progression` machine to the same page (it's already in `vw_state_machines`):
states, the 5 raw-leaf-triggered transition rules (guard prose + the leaf each cites), and a
cohort-occupancy heat strip per state. No new endpoint — the state-machine router already serves it.

---

## 4. Admin knobs (the spreadsheet-cell promise, extended to the new leaves)

Every NEW raw leaf becomes an editable knob, same as v1:
- `SerologyObservations` rows — anti-dsDNA / C3 / C4 / proteinuria / sediment per panel. Editing a
  value nudges the derived trend → state → recommendation live (via Explainer DAG), proving the
  "wrong fact is nudged, not re-prompted" claim on the new layer.
- `CausalMechanisms.TargetPathway` — the druggable-pathway leaf that drives treatment-line.
- `SubjectStateInstances.DwellDays` — the bitemporal dwell knob.

Every NEW derived field (state, SLEDAI, tier, recommended line, deciding factor, disagreement flag)
is inspectable in the Explainer DAG with its formula and witnesses — already true, since the build
regenerates the explainer graph from the hub.

---

## 5. Build order (when we build it)

1. Cohort Discovery board (1a → 1c → 1b → 1d) — highest payoff, all endpoints exist.
2. Per-patient `progression` + `treatment-line` tabs (2).
3. Writeup paragraphs (2, generated).
4. Progression machine in state-machine admin (3) — mostly free.
5. Knob wiring is automatic via the existing Explainer DAG + intake editors (4).

**Guardrail:** no screen recomputes a verdict; each binds to a harness-green derived field. If a
screen needs a value the model doesn't derive yet, that's a rulebook change (a new Leopold loop),
not client code — keep the trust boundary on the DAG, not in React.
