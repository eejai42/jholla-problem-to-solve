# V2 UI — not yet built

The Cohort discovery board and the per-patient progression / treatment-line tabs are in the model.
The only screen NOT yet built:

- **Progression machine in the state-machine admin (`StateMachineView`).** `StateMachineView` binds
  only to `diagnosis-lifecycle`. The `lupus-nephritis-progression` machine is already in
  `vw_state_machines` and served by the same router, so this is a binding change in `StateMachineView`
  (states + the 5 raw-leaf-triggered transition rules + a per-state cohort-occupancy strip), not a
  model change.
