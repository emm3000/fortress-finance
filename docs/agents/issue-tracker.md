# Issue tracker: GitHub

Issues live in `emm3000/fortress-finance` on GitHub. Use the `gh` CLI; it infers the repo from `git remote -v`.

## Conventions

- **Create**: `gh issue create --title "..." --body "..." --label ready-for-agent`, with a heredoc for multi-line bodies.
- **Read**: `gh issue view <n> --comments`, never the bare form: the body alone misses corrections in comments.
- **List**: `gh issue list --state open --label ready-for-agent`; add `--json number,title,labels,body` when a script consumes it.
- **Comment**: `gh issue comment <n> --body "..."`.
- **Labels**: `gh issue edit <n> --add-label "..."` / `--remove-label "..."`.
- **Close**: `gh issue close <n> --comment "..."`. A PR body with `Closes #N` closes the issue on rebase-merge.
- **Blocking edge**: `gh api --method POST repos/emm3000/fortress-finance/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where the id comes from `gh api repos/emm3000/fortress-finance/issues/<n> --jq .id`. Fallback: a `Blocked by: #<n>` line at the top of the body.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create an issue with the layout in `.claude/agents/ticket-writer.md`: title `<Area>: <slice>`, at most 3 lines of context, a `Touches:` line, pointers, a `Done when` checklist, label `ready-for-agent` (plus `wave-of-one` when it applies).

## Asset requests for Codex

Image assets (Castle layers, category icons, illustrations, app icon) are issues labelled `ready-for-codex` only, never `ready-for-agent`; the owner feeds them to Codex and `/wave` refuses them (ADR 0008). Layout:

```md
Title: Asset: <name>

Prompt: <what to draw, in English>
Style reference: <JAA Design System artifact link>; matches <existing asset path>
Size: <canvas px, e.g. 1024x1024; PNG also @2x and @3x>
Format: PNG | SVG
Background: transparent
Destination: assets/images/<group>/<file>
Variants: none | light + dark (<file>-light.png, <file>-dark.png)

Done when
- [ ] Every file listed exists at its destination with the stated size (`sips -g pixelWidth -g pixelHeight <file>`)
- [ ] Background is transparent; Castle layers share the base canvas and anchor
```

A screen ticket that uses an asset is blocked by its asset issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <n> --comments`.

## Commit and branch scopes

Branches are `<type>/<n>-<slug>`; commits are conventional with a scope from `CLAUDE.md` (`sync`, `ui`, `auth`, `db`, `eas`, `ci`, `notifications`, `expo`, ...). Use the scope as the issue title's `<Area>` when one fits.
