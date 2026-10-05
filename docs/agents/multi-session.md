# Multi-session orchestration

How the owner runs several Claude Code sessions on this repo in parallel, and what the orchestrator does before dispatching to them. Read it before dispatching a ticket. Decision record: `docs/adr/0004-multi-session-wave-workflow.md`.

## The unit

One GitHub issue labelled `ready-for-agent`: at most 3 lines of context, a `Touches:` line and a `Done when` list of falsifiable conditions. The open board is `gh issue list --label ready-for-agent`, never a list in a doc. Labels: `docs/agents/triage-labels.md`; `gh` operations: `docs/agents/issue-tracker.md`. Read an issue with `gh issue view <n> --comments`: corrections to a stale body live in the comments. Constraints that outlive an issue live in `CLAUDE.md` and `.claude/rules/`.

New issues come from the `ticket-writer` agent. `mattpocock-skills:grilling` stress-tests a plan before it is ticketed; the owner runs `/mattpocock-skills:to-tickets` to split it.

## The loop

```
1. Orchestrator SCOPES the issue and picks the model-table row
2. /wave boots one peer per ticket -> WRITER   (own worktree, branch, commits, PR closing the issue)
3. CI runs `npm run check` on the PR (check.yml)
4. Orchestrator launches a fresh pr-reviewer -> MERGE or FIX FIRST
5. Orchestrator rebase-merges, appends the dispatch-log row, closes the cycle
```

## Roles

- **Owner** approves the first wave of a session and verifies model and effort with `/model` in each pane. Once a wave is fully merged the orchestrator starts the next one. Refer to a peer as `@<name>` in chat.
- **Orchestrator** dispatches via `SendMessage`, reviews, merges, and stays thin: inline it runs only routing state (`git status`, `git worktree list`, `gh issue/pr list`, `ListAgents`) and reads at most 1-2 files to decide; investigation and artifact work go to a subagent with `model` explicit on the call. It reports to the owner in 1-2 lines; merging a clean PR is routine, not a question.
- **Peer** carries exactly one ticket, in its own worktree, and replies with the PR URL.

## Model and effort

- The table in `.claude/skills/wave/SKILL.md` is the only place a model and effort per kind of work is written. Every dispatch states one model and one effort (low, medium or high) with a one-line reason.
- The orchestrator runs opus:medium; the owner raises it to high for a `ticket-writer` run, a conflicting rebase or an ambiguous FIX FIRST.
- A session cannot see its own effort; the owner checks with `/model`.

## Slicing and waves

- One slice is one small PR: one screen, one hook, one repository change, or one migration with its service types.
- Waves are ordered by dependency. Tickets in one wave touch disjoint files, judged from their `Touches:` lines.
- **Wave of one**, label `wave-of-one`: a new migration, a change to `sync_client_state` or any RPC contract, RLS, or the SQLite schema in `db/database.ts`. These change the shared contract every other ticket builds on.
- If a peer passes ~60% context without a PR, it commits, opens a partial PR and reports.
- Before dispatching tickets an audit filed, re-verify each against `origin/main`.

## Dispatch checklist

Every dispatch includes:

- Issue number; docs to read first (`CLAUDE.md`, the `.claude/rules/` files the slice matches, the ADRs it touches, `CONTEXT.md` for every term); branch `<type>/<n>-<slug>`, created with `git switch -c` inside `../fortress-finance-<name>`; the peer's Metro port.
- The line: *"The issue's acceptance criteria are the contract and win over any file list here; run every criterion check before opening the PR."*
- Gates: `npm run check` green before every commit; conventional commits with a scope; no AI attribution (the hook in `.claude/hooks/` blocks it); English code, Spanish UI copy with `CONTEXT.md` terms; `rg` / `fd` / `bat` / `sd` / `eza`. Past gotchas: `mem_search` before starting, `mem_save` for new ones (engram tools are deferred; load them with `ToolSearch`).
- For behavior (a hook, a repository function, a sync rule, a derived value): load `mattpocock-skills:tdd`, failing test first. Pure layout or copy skips it.
- For a screen: the visual check below.
- Keep the slice small; stop and report instead of expanding scope.
- Open the PR with `Closes #N`; do not merge or watch CI; message the orchestrator the PR URL in 1-2 lines. The peer pushes its own ticket and assets branches and runs `gh pr create` without asking; a peer never pushes `main`.

## Launching peers

- `/wave <issue numbers>` is the only entry point. It classifies, states the plan, runs `scripts/jaa-wave`, waits in `ListAgents` and dispatches.
- `scripts/jaa-wave [--terminal herdr|warp|manual] name:model:effort [...]` opens one pane per peer side by side and prints `@<name> metro <port>`, assigning `8082`, `8083`, ... by position. Terminal from the flag, else `TERM_PROGRAM`. herdr: a `jaa-wave` tab in the orchestrator's workspace (the herdr server must be running). Warp: writes `~/.warp/tab_configs/jaa-wave.toml` and opens `warp://tab_config/jaa-wave`. Other terminals: `manual` prints the launch lines. Peers are addressed by `claude -n <name>`, not by the terminal.
- `scripts/jaa-session name model effort port` creates the detached worktree `../fortress-finance-<name>` from `origin/main` (or reuses it), copies the owner's untracked `.env*` files into it when missing, runs `npm ci` when `node_modules` is absent, exports `RCT_METRO_PORT=<port>` and runs `claude -n <name> --model <model> --effort <effort> --permission-mode bypassPermissions`. The project deny list still applies under bypass.

## Isolation: worktrees

- Every peer works in `../fortress-finance-<name>`, never in the owner's checkout: a checkout there changes the branch under every session.
- Each worktree has its own `node_modules` from `npm ci --prefer-offline`; never symlink one into another.
- `git checkout main` fails inside a worktree while the main checkout is on `main`; use `git fetch` and `git switch -c <branch> origin/main`.
- Before changing any checkout's state, find out who uses it: an unexpected branch may be a live peer.
- Review and verification are read-only on existing checkouts. A build or red/green check on a branch uses a throwaway worktree under the session scratchpad, removed afterwards.

## Isolation: Metro, devices, database

- **Metro**: run `npx expo start --port "$RCT_METRO_PORT"`. Never `8081`, which is the owner's.
- **iOS simulator** (default on this Mac): one simulator per peer, never the owner's booted one. `xcrun simctl create jaa-<name> "iPhone 16"` (any installed device type, `xcrun simctl list devicetypes`), `xcrun simctl boot jaa-<name>`, then `xcrun simctl openurl jaa-<name> exp://127.0.0.1:$RCT_METRO_PORT` to open the app in Expo Go. Screenshot: `xcrun simctl io jaa-<name> screenshot <file>.png`. Delete it at cycle close: `xcrun simctl delete jaa-<name>`.
- **Android emulator**, when the ticket is Android-specific: `emulator -avd <avd> -port <5554 + 2*index> -read-only -no-snapshot-save`, then `adb -s emulator-<port> reverse tcp:$RCT_METRO_PORT tcp:$RCT_METRO_PORT` and open `exp://127.0.0.1:$RCT_METRO_PORT`. Screenshot: `adb -s emulator-<port> exec-out screencap -p > <file>.png`.
- **Database**: no database by default; `npm run check` mocks Supabase at the module boundary. A visual check uses the project in the copied `.env`, which must be the development project, signed in with a test account. Peers never apply migrations, run SQL or call service-role endpoints against a hosted project; the owner applies a merged migration. Without an `.env` in the owner's checkout the app throws `Missing EXPO_PUBLIC_SUPABASE_URL`; the peer reports instead of improvising credentials.
- A peer changes nothing outside its worktree: no global install, no `brew services`, no system config.

## Visual check

For a screen-touching ticket: capture every changed screen and state, publish the images on a branch `assets/<N>-visual-check` with the PR head short SHA in every file name (`budgets-<sha>.png`), and link them in the PR body with `raw.githubusercontent.com` URLs (`gh` cannot attach images). Add the image files explicitly; `git checkout --orphan` leaves the previous branch's files on disk. Evidence a criterion turns on goes in the PR body in full; quote measured lines, not conclusions. The assets branch is deleted at cycle close.

## Review cycle

- Every PR gets a fresh `pr-reviewer` subagent, launched by the orchestrator with `model` explicit (row 1 PRs sonnet:medium, rows 2-4 opus:high). It reads the diff, the issue, `gh pr checks` and the screenshots (`git show origin/assets/<N>-visual-check:<file>`, SHA in the name matching the PR head); it does not rerun the gate. It follows `mattpocock-skills:code-review` with the merge-base against `origin/main` as the fixed point and returns `blocking|minor` findings, a verdict and, on FIX FIRST, one cause word (`checklist`, `judgment`, `spec`).
- Post-review fixes run sonnet:low, on the same peer.
- Merge is rebase-only: `gh pr merge <N> --rebase` when `gh pr view <N> --json mergeStateStatus` is `CLEAN`; `--auto` only while checks are pending. The orchestrator never blocks its turn on CI; it merges when the notification or the peer's report arrives, and every background wait has a hard bound.
- A PR that conflicts after an earlier merge: the peer rebases onto `origin/main` locally and asks the owner to push it, because `git push --force-with-lease` is in the project deny list.

## Between tickets

A cycle closes in this order:

1. The PR is merged.
2. The peer leaves its worktree clean and reports. The orchestrator removes it (`git worktree remove ../fortress-finance-<name>`), deletes the branch (`git branch -D <branch>`; a rebase-merged branch never counts as merged), runs `git worktree prune`, deletes the assets branch and the peer's simulator, then kills the pane (the peer's `claude` pid, then `kill -HUP` its parent shell). It checks `git worktree list` before reporting the peer as free.
3. The orchestrator appends one row to Recent in `docs/agents/dispatch-log.md`. Rows ship as one docs commit per wave, pushed only with the owner's OK.
4. If the merged work changed a domain term, an invariant or an architecture decision, the orchestrator files a docs ticket that loads `mattpocock-skills:domain-modeling` and updates `CONTEXT.md` and `docs/adr/`. An ADR the shipped behavior contradicts is fixed the same way.
5. A merged migration is applied by the owner before the next wave depends on it.

When every PR of the wave is merged, the orchestrator invokes `/wave` with the next tickets.
