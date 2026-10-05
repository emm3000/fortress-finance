---
name: check
description: Run the project gate (npm run check) once and report failures grouped by step.
allowed-tools: Bash(npm run *)
---

Run `npm run check` exactly once and note the wall time.

- Green: reply with one line, e.g. `check passed in 48s`.
- Red: group failures under `typecheck`, `lint` and `test`. Quote error text exactly as printed, with `path:line` where available, at most 10 lines per step. Steps that did not run because an earlier one failed are listed as `not run`.

Report only. Fix nothing unless the user asks, and run the gate a single time.
