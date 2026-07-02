# Operator Setup

One-time setup for **this** repository, performed by the operator (`@axross`). Steps 1-3 are done once; step 4 is per-issue. To replicate the whole system in a **different** repository, follow [takeover.md](./takeover.md) instead — it covers the same setup plus the repo-specific substitutions.

## 1. Create the Labels

Create the `loop:*` labels the state machine uses (via the GitHub UI or `gh`):

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

The human applies `loop:plan` to enroll an issue and `loop:ready-to-build` to approve a plan. The agent owns every other `loop:*` label.

## 2. Create the Routine

Create a routine at [claude.ai/code/routines](https://claude.ai/code/routines):

- **Repositories**: this repository. Leave branch pushes at the default (`claude/`-prefixed only) unless a phase needs otherwise.
- **Environment**: the project environment with the `SessionStart` hook (so `npm install` and the toolchain are ready). **Trusted** network access is sufficient unless planning must reach a non-allowlisted host.
- **Connectors**: keep the GitHub connector; remove any the loop does not need.
- **Model**: pick the model the loop should run on.
- **Prompt** (the standing instruction; the per-event context is appended as `text`):

  ```text
  You are the Loop Engineering dispatcher for this repository. Load the
  loop-engineering skill and run the /loop command. The triggering event
  context follows this prompt: it names a GitHub issue or pull request and the
  event that fired. Read the target's current loop:* label and full comment
  thread, then advance the state machine by exactly one step per the skill, and
  exit. Do not skip the concurrency-lock and bot-identity-marker rules.
  ```

## 3. Add the Triggers and the Bridge

Cloud routines can trigger natively on **pull request** and **release** events, but **not** on issues or issue comments. The issue half of the loop is therefore driven by a GitHub Actions bridge that calls the routine's API trigger; the pull-request half uses Auto-fix.

**Issue events (bridge):**

1. On the routine, add an **API** trigger and generate a token. Copy the `/fire` URL and the token immediately (the token is shown once).
2. Add them as repository secrets: `CLAUDE_LOOP_ROUTINE_URL` and `CLAUDE_LOOP_ROUTINE_TOKEN`.
3. `.github/workflows/loop-dispatch.yaml` (already committed) POSTs to `/fire` on the relevant `issues` and `issue_comment` events. It skips the bot's own `<!-- loop-agent -->` comments and pull-request comments.

**Pull request events (Auto-fix):**

- Install the [Claude GitHub App](https://github.com/apps/claude) on the repository (required for Auto-fix webhooks).
- When a loop pull request opens, enable **Auto-fix** on it (CI status bar in the web session, `/autofix-pr` from the terminal, or "watch this PR" from mobile) so review comments and CI failures re-enter the loop. Auto-fix does not react to base-branch merge conflicts; resolve those by asking the session to rebase.

## 4. Run the Loop

- Enroll an issue by applying `loop:plan`. The bridge fires the routine; the plan phase runs.
- Answer the agent's questions by commenting on the issue (an unmarked human comment); the bridge resumes the loop.
- Approve the refined plan by applying `loop:ready-to-build`; the implementation phase runs and opens the draft pull request.
- Review the pull request; the watch loop addresses comments and CI, then flips it to review-ready and @mentions you.

## Caveats

- **Shared identity**: routine actions appear as the operator's GitHub user, so bot and human comments share an author. The `<!-- loop-agent -->` marker is the only disambiguator; the bridge and the agent both depend on it.
- **Caps and cost**: routines have a daily run cap and draw metered usage; GitHub webhook triggers have per-account hourly caps. The implementation phase's round limit exists partly to bound this.
- **Latency**: the bridge is real-time. If you instead add a **schedule** trigger as a fallback, its minimum interval is one hour.
- **Green status is not success**: a green run only means the session did not error. Open the run to confirm the phase actually advanced.
