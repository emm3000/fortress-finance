# Triage labels

The skills speak in five canonical triage roles. This file maps them to the labels in this repo's tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                   |
| -------------------------- | -------------------- | ----------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue   |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information  |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent   |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation             |
| `wontfix`                  | `wontfix`            | Will not be actioned                      |
| none                       | `wave-of-one`        | Must run alone in its wave                |
| none                       | `ready-for-codex`    | Image asset request for Codex, not a wave ticket |

`wave-of-one` is this repo's own label; no skill applies it. `ticket-writer` adds it to a ticket that creates a migration, changes `sync_client_state` or any RPC contract, changes RLS, or changes the SQLite schema in `db/database.ts`. The `/wave` skill refuses to pair it with another ticket.

`ready-for-codex` marks an image asset request (ADR 0008): the owner hands it to Codex, and `/wave` refuses it. It never carries `ready-for-agent`. Its layout is in `docs/agents/issue-tracker.md`.

When a skill names a role (for example "apply the AFK-ready triage label"), use the label string from this table.

Every label above exists on GitHub.
