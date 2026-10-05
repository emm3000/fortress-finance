# Dispatch log

Outcome of every PR per row of the model table, which lives only in `.claude/skills/wave/SKILL.md`; the loop it serves is `docs/agents/multi-session.md`. When a row shows two or more first-review FIX FIRST verdicts with cause `judgment`, raise it one step and note why in the skill. A row that stays MERGE across many PRs may move one step down.

The log has a fixed size. Summary keeps totals per row forever; Recent keeps the last 20 PRs. At cycle close the orchestrator appends the new PR to Recent; when Recent passes 20 rows, it adds the oldest to the Summary counts and deletes them.

Cause values: `checklist` (a recurring reviewer-checklist item; the model was fine), `judgment` (a wrong decision the model made), `spec` (the issue was wrong or thin).

## Summary

Totals of rows already folded out of Recent.

| Row | Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|---|

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #3 | #2 | 1 | sonnet:low | MERGE (pilot; orchestrator reviewed inline, no pr-reviewer) | |
