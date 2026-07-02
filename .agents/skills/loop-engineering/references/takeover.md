# Loop Engineering — Takeover Runbook

Hand this document to a Claude Code session running in a **target repository** to replicate the autonomous issue-to-pull-request "Loop Engineering" workflow there. It is self-contained: the critical files are inlined, and every repo-specific edit is listed in the substitution matrix.

## What you are installing

An autonomous loop that takes a GitHub issue through plan → human approval → implementation → PR review, driven by short-lived cloud sessions. Three moving parts:

1. **A skill + a `/loop` dispatcher command** committed to the repo — the instructions each session follows.
2. **A `loop:*` GitHub label state machine** — the durable state, since cloud sessions are ephemeral and stateless.
3. **A claude.ai routine + a GitHub Actions bridge** — the trigger. Cloud routines can trigger natively on pull-request and release events but **not** on issues/comments, so a workflow POSTs to the routine's API endpoint on issue events; the PR side uses Auto-fix.

Core model: **GitHub is the state machine and durable memory; each session reads state, advances it one step, writes it back, and exits.** "Waiting for a reply" means the session ends and a later event spawns a new one.

## Prerequisites

- A claude.ai plan with Claude Code on the web + routines enabled (Pro, Max, Team, or Enterprise).
- The [Claude GitHub App](https://github.com/apps/claude) installed on the target repository (required for Auto-fix webhooks).
- Permission to add repository secrets and labels, and to commit the files below.
- The operator's GitHub handle (the human who approves plans and gets mentioned). Called `@OPERATOR` here.

## Step 1 — Copy the files

Copy these from the source repository, preserving paths. They are portable except for the edits in Step 2.

| Path | Purpose | Per-repo edits? |
| ---- | ------- | --------------- |
| `.claude/commands/loop.md` | The `/loop` dispatcher (entry point) | `@axross` → `@OPERATOR` |
| `.agents/skills/loop-engineering/SKILL.md` | Skill spec + routing | operator/stack notes |
| `.agents/skills/loop-engineering/references/state-machine.md` | Labels, transitions, lock, marker | none |
| `.agents/skills/loop-engineering/references/plan-phase.md` | Plan procedure | `@axross`, sibling-skill links |
| `.agents/skills/loop-engineering/references/implementation-phase.md` | Build + PR review loop | `@axross`, verification commands, links |
| `.agents/skills/loop-engineering/references/operator-setup.md` | One-time setup (btnopen) | operator/env references |
| `.github/workflows/loop-dispatch.yaml` | Issue-event → routine bridge | none (see Step 3) |

Notes:

- If the target repo places skills somewhere other than `.agents/skills/`, put the skill there and keep the directory name `loop-engineering` matching the `name:` frontmatter.
- If the target repo has no skill system at all, the skill files still work as plain instructions the `/loop` command reads; just keep them together and fix the relative links you change in Step 2.
- You may skip copying `operator-setup.md` and this `takeover.md` if you prefer; they are documentation, not runtime.

## Step 2 — Substitution matrix (the only per-repo edits)

Apply each row across the copied files.

| # | Touchpoint | Where | Change |
| - | ---------- | ----- | ------ |
| 1 | **Operator handle** | every file mentioning `@axross` | Replace `@axross` with `@OPERATOR`. |
| 2 | **Verification commands** | `implementation-phase.md` "Verify" section, and the plan's testing sections | Replace the Node/npm/Payload commands (`npm run format`/`lint`/`test:unit`/`test:e2e`/`build`, `migrate:create`) with the target repo's equivalents — its package scripts, `Makefile`, or CI steps. If the target has a development-guidelines skill, defer to it instead of hardcoding. |
| 3 | **Sibling-skill links** | `plan-phase.md`, `implementation-phase.md`, `SKILL.md` | The links to `../../ui-design-principles/SKILL.md`, `../../development-guidelines/SKILL.md`, `../../code-review-guideline/SKILL.md`, `../../e2e-testing-guidelines/SKILL.md`, `../../unit-test-guidelines/SKILL.md`, `../../project-structure/SKILL.md`, and `../../../../AGENTS.md` assume btnopen's skills. For each: repoint to the target repo's equivalent skill if present, or delete the link and inline the one-line intent (e.g. "follow the project's code-review standards"). Do not leave dangling links. |
| 4 | **Agent-index registration** | the repo's `AGENTS.md` / `CLAUDE.md` (if any) | Add a routing row for the loop-engineering skill so agents discover it (see Step 4). |
| 5 | **Branch prefix** | `implementation-phase.md`, `loop.md` (`claude/issue-<n>`) | Usually leave as-is — routines push `claude/`-prefixed branches by default. Only change if the routine has "Allow unrestricted branch pushes" and a different convention. |

After editing, verify no relative link is broken (from each file's directory, the target path must exist).

## Step 3 — Install the dispatch workflow

The workflow is repo-agnostic; copy it verbatim. It bridges issue events (which routines cannot trigger on) to the routine's API endpoint. Full contents:

```yaml
name: Loop Engineering Dispatch

on:
  issues:
    types:
      - labeled
  issue_comment:
    types:
      - created

concurrency:
  group: loop-dispatch-${{ github.event.issue.number }}
  cancel-in-progress: false

permissions: {}

jobs:
  fire:
    name: Fire Loop routine
    runs-on: ubuntu-latest
    timeout-minutes: 5
    if: >-
      (
        github.event_name == 'issues' &&
        github.event.action == 'labeled' &&
        (
          github.event.label.name == 'loop:plan' ||
          github.event.label.name == 'loop:ready-to-build'
        )
      ) || (
        github.event_name == 'issue_comment' &&
        github.event.action == 'created' &&
        github.event.issue.pull_request == null &&
        !contains(github.event.comment.body, '<!-- loop-agent -->') &&
        contains(join(github.event.issue.labels.*.name, ','), 'loop:')
      )
    steps:
      - name: POST to routine /fire endpoint
        env:
          ROUTINE_URL: ${{ secrets.CLAUDE_LOOP_ROUTINE_URL }}
          ROUTINE_TOKEN: ${{ secrets.CLAUDE_LOOP_ROUTINE_TOKEN }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
          ISSUE_URL: ${{ github.event.issue.html_url }}
          EVENT: ${{ github.event_name }}.${{ github.event.action }}
          TRIGGER_LABEL: ${{ github.event.label.name }}
        run: |
          set -euo pipefail
          if [ -z "${ROUTINE_URL:-}" ] || [ -z "${ROUTINE_TOKEN:-}" ]; then
            echo "::error::CLAUDE_LOOP_ROUTINE_URL / CLAUDE_LOOP_ROUTINE_TOKEN are not set." >&2
            exit 1
          fi

          TEXT="Loop Engineering event ${EVENT}"
          if [ -n "${TRIGGER_LABEL:-}" ]; then
            TEXT="${TEXT} (label: ${TRIGGER_LABEL})"
          fi
          TEXT="${TEXT}. Run the /loop dispatcher for issue #${ISSUE_NUMBER} (${ISSUE_URL}). Read the issue's current loop:* label and full comment thread to determine the phase, then advance the state machine by exactly one step."

          BODY="$(jq -nc --arg text "$TEXT" '{text: $text}')"

          curl --fail-with-body -sS -X POST "$ROUTINE_URL" \
            -H "Authorization: Bearer ${ROUTINE_TOKEN}" \
            -H "anthropic-beta: experimental-cc-routine-2026-04-01" \
            -H "anthropic-version: 2023-06-01" \
            -H "Content-Type: application/json" \
            -d "$BODY"
```

The `anthropic-beta` header is date-versioned; if the routines API has advanced, use the current value from https://code.claude.com/docs/en/routines.

## Step 4 — Register the skill (if the repo has an agent index)

If the target repo has an `AGENTS.md` or `CLAUDE.md` skill index, add a routing row so agents find the skill:

```markdown
| [Loop Engineering](.agents/skills/loop-engineering/SKILL.md) | Operating the autonomous issue-to-pull-request loop: running the `/loop` dispatcher, reacting to an issue/PR event, moving the `loop:*` state machine forward, or setting up the routine and dispatch workflow |
```

Adjust the path to wherever you placed the skill.

## Step 5 — Create the labels

Create the state-machine labels (via the GitHub UI or `gh`):

```bash
for l in \
  "loop:plan|0e8a16|Queued for or in planning" \
  "loop:awaiting-answer|fbca04|Paused on a human answer" \
  "loop:plan-review|1d76db|Plan written; awaiting approval" \
  "loop:ready-to-build|5319e7|Approved; implementation may start" \
  "loop:in-review|d93f0b|Draft PR open; review loop active" \
  "loop:done|c2e0c6|PR review-ready; handed back" \
  "loop:active|ededed|Concurrency lock; a session is working this" \
  "loop:blocked|b60205|Needs human intervention" ; do
  IFS='|' read -r name color desc <<< "$l"
  gh label create "$name" --color "$color" --description "$desc" --force
done
```

The human applies `loop:plan` (enroll an issue) and `loop:ready-to-build` (approve a plan). The agent owns every other `loop:*` label — it must never apply the two human-owned trigger labels, or it will re-fire the bridge.

## Step 6 — Create the routine on claude.ai

At [claude.ai/code/routines](https://claude.ai/code/routines), create a routine:

- **Repositories**: the target repository. Keep the default `claude/`-prefixed branch pushes unless a phase needs otherwise.
- **Environment**: one whose setup script installs the repo's toolchain and dependencies so verification is runnable. **Trusted** network access unless planning must reach a non-allowlisted host.
- **Connectors**: keep GitHub; remove any the loop does not need.
- **Model**: whichever the loop should run on.
- **Prompt** (the standing instruction; per-event context is appended as `text`):

  ```text
  You are the Loop Engineering dispatcher for this repository. Load the
  loop-engineering skill and run the /loop command. The triggering event
  context follows this prompt: it names a GitHub issue or pull request and the
  event that fired. Read the target's current loop:* label and full comment
  thread, then advance the state machine by exactly one step per the skill, and
  exit. Do not skip the concurrency-lock and bot-identity-marker rules.
  ```

## Step 7 — Wire the triggers

**Issue events (the bridge):**

1. On the routine, add an **API** trigger; generate a token. Copy the `/fire` URL and token immediately (the token is shown once).
2. Add repository secrets `CLAUDE_LOOP_ROUTINE_URL` and `CLAUDE_LOOP_ROUTINE_TOKEN` with those values.
3. The workflow from Step 3 now fires the routine on issue events.

**Pull-request events (Auto-fix):**

- Ensure the Claude GitHub App is installed. When a loop PR opens, enable **Auto-fix** on it (CI status bar in the web session, `/autofix-pr` from the terminal, or "watch this PR" from mobile) so review comments and CI failures re-enter the loop. Auto-fix does not react to base-branch merge conflicts; resolve those by asking the session to rebase.

## Step 8 — Verify the installation

- **Static**: if Node, run the repo's format/lint; confirm every relative link in the copied skill resolves; confirm the workflow YAML parses.
- **Dry run**: open a throwaway issue, apply `loop:plan`, and confirm the Actions run fires and a routine session starts. Watch it produce a plan and stop at `loop:plan-review`. Apply `loop:ready-to-build` and confirm it opens a draft PR. Delete the throwaway afterward.
- Confirm the routine's run list shows the sessions (a green run only means no infra error — open it to confirm the phase advanced).

## Step 9 — Adapt to the stack

- **Non-Node repos**: replace the Verify section's commands (matrix row 2) with the repo's build/test/lint entry points. Keep the *shape* — format/lint, unit, integration/e2e, build, migrations — dropping steps that do not apply.
- **No design system / not a UI project**: drop the "UI design" plan section and the UI/UX review lens.
- **Different review standards**: repoint the review references (matrix row 3) to the repo's own review guidance, or inline a short checklist in `implementation-phase.md`.

## Gotchas to preserve

- **Shared identity**: a routine acts as the operator's own GitHub user, so bot and human comments share an author. The `<!-- loop-agent -->` marker (used by both the agent and the workflow filter) is the only disambiguator — keep it.
- **No native issue trigger**: do not expect a "new issue" routine trigger to exist; the Actions bridge is mandatory for the issue half.
- **Terminal states**: the dispatcher treats `loop:done` as a no-op and only sets `loop:blocked` inside an active phase, so ordinary comments do not corrupt finished issues. Keep that routing intact if you edit `loop.md`.
- **Caps and cost**: routines have a daily run cap and metered usage; the implementation phase's 4-round review limit bounds runaway loops. Keep it.
