---
name: wave
description: "Trigger: /wave, levantar wave, abrir peers, dispatch wave, lanzar sesiones. Boot one terminal pane per ticket (herdr or Warp) and dispatch each ticket to its peer session."
argument-hint: <issue numbers>
allowed-tools: Bash(gh issue view:*) Bash(scripts/jaa-wave:*) Bash(git worktree list) ListAgents SendMessage Read
---

## Activation contract

Run when the owner invokes `/wave` with one or more issue numbers, or when the orchestrator starts the next wave after the previous one is fully merged. Each number becomes one peer session and one dispatch. Stop and report if any number is not an open `ready-for-agent` issue.

## Hard rules

- Read `docs/agents/multi-session.md` first. Its dispatch checklist and isolation rules bind every dispatch.
- One ticket per peer. No dispatch while a PR from the previous wave is unmerged.
- One explicit model and one explicit effort per ticket, stated to the owner before booting.
- Peers work only in the worktree `scripts/jaa-session` creates; the owner's checkout stays untouched.
- Tickets in one wave touch disjoint files (compare their `Touches:` lines). A ticket labelled `wave-of-one` runs alone.
- Dispatch only `ready-for-agent` issues. Refuse any issue labelled `ready-for-codex` (an image asset request the owner hands to Codex) and name it in the report.
- Each peer gets the Metro port `scripts/jaa-wave` prints for it, never `8081`.

## Model table

Rows are ordered by blast radius: how much a mistake breaks and whether a gate catches it. A ticket matching several rows takes the highest-numbered match. The table lives only here; `docs/agents/dispatch-log.md` records outcomes per row.

| Row | Work | Model:effort | Extra instruction |
|---|---|---|---|
| 1 | Docs, Spanish UI copy, renames, applying a diff already designed; every criterion is a command with empty output | sonnet:low | none: `npm run check` and the criteria fail loudly |
| 2 | Code a test or `tsc` catches: one screen, component, hook, service function or repository function with its tests | sonnet:medium | load `mattpocock-skills:tdd` for behavior; simulator screenshots for a screen |
| 3 | Code on the trap list, where nothing catches the error: root `app/_layout.tsx` and providers, `app.config.ts`, `eas.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js` tokens, `package.json` dependencies, `jest.setup.ts` shared mocks, ESLint boundaries, `.github/` | opus:medium | screenshots of every affected screen; `npx expo install --check` after a dependency change |
| 4 | Sync and data: `db/` repositories and SQLite schema, the sync queue, `services/sync.service.ts`, `supabase/migrations/`, RLS, any RPC contract, auth store, Liquidation | opus:high | a test per invariant in `.claude/rules/sync.md` the change touches; schema work is `wave-of-one` |

Other roles: `pr-reviewer` runs sonnet:medium on row 1 PRs and opus:high on rows 2 to 4; post-review fixes run sonnet:low; `ticket-writer` runs opus:high; fable is reserved for a new ADR, an adversarial audit or a peer that failed the same ticket twice.

The rows are this repo's starting bets, with no inherited history. When a row shows two or more first-review FIX FIRST verdicts with cause `judgment`, raise it one step and add a dated note below naming the PRs. A row that stays MERGE across many PRs may move one step down.

## Execution steps

1. For each issue run `gh issue view <n> --json title,labels,body,comments`. Confirm the `ready-for-agent` label and the absence of `ready-for-codex`, note `wave-of-one`, read the `Touches:` line, and derive a short pane name from the title (one lowercase word, no digits).
2. Classify each ticket with the table. Deviate only with a one-line reason in the plan. Tell the owner one line per ticket, `@<name> #<n> <model>:<effort>`, before booting.
3. Run `scripts/jaa-wave <name>:<model>:<effort> ...` once with every ticket. It opens panes in the orchestrator's terminal (`TERM_PROGRAM`: herdr or Warp) and prints `@<name> metro <port>` per peer. When the owner names a terminal ("con warp", "con herdr"), pass `--terminal warp|herdr` first for the rest of the session. On `manual` it prints one `scripts/jaa-session` line per peer: hand them to the owner, then poll.
4. Poll `ListAgents` until every pane name is listed, at most 60 seconds.
5. Send each peer one dispatch built from the checklist in `docs/agents/multi-session.md`: issue, docs to read, branch `<type>/<n>-<slug>`, worktree `../fortress-finance-<name>`, its Metro port, the acceptance-criteria line, `npm run check`, TDD or screenshots per the table, `Closes #<n>`, no merge, reply with the PR URL. Ask for `notify_when_idle`.
6. Report to the owner in one or two lines: peers booted, tickets dispatched.

## Output contract

Return the list `@<name> #<n> <model>:<effort>` and nothing else until a peer reports back.

## References

- `docs/agents/multi-session.md` - dispatch checklist, isolation, review cycle.
- `docs/agents/dispatch-log.md` - outcomes per table row.
- `scripts/jaa-wave` - opens one pane per peer in herdr or Warp, or prints the launch lines.
- `scripts/jaa-session` - worktree, `npm ci`, Metro port, `claude` launcher.
