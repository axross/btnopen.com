---
name: loop-engineering
description: Apply this skill when operating the autonomous issue-to-pull-request "Loop Engineering" workflow in this repository - running the `/loop` dispatcher, reacting to a GitHub issue or pull request event from a routine or the Actions bridge, deciding which phase (plan, implementation, PR review loop) an issue is in, moving the `loop:*` label state machine forward, or setting up the claude.ai routine, API trigger, and dispatch workflow. Covers the stateless-worker model, GitHub-as-state-machine conventions, the bot-identity marker, concurrency locking, the plan/implementation phases, the self-review termination guard, and one-time operator setup.
---

# Loop Engineering

Loop Engineering runs blog development as an autonomous loop: a GitHub issue is planned, refined, implemented, opened as a pull request, reviewed, and driven to review-ready with minimal human input. It is operated by short-lived cloud sessions triggered by GitHub events.

## The Stateless-Worker Model

Cloud sessions are ephemeral and every trigger starts a fresh session, so no session waits or watches across turns. Each session is a stateless worker: it reads the current state from GitHub, advances the loop by exactly one step, writes the new state back, and exits. "Waiting for a reply" means ending the session; a later event spawns a new one that reconstructs context from the thread.

**Guidelines:**

- MUST treat GitHub (labels, issue/PR body, comment history) as the only durable state; never assume continuity from a previous session.
- MUST re-read the target's `loop:*` label and full comment thread on entry before taking any action.
- MUST advance the state machine by at most one phase-step per session and then exit.
- MUST keep every action idempotent so a re-triggered duplicate session is a no-op, not a double-action.

## State Machine and Conventions

See [references/state-machine.md](./references/state-machine.md) for:

- the `loop:*` label set, the allowed transitions, and which actor applies each label
- the concurrency lock label that prevents two sessions working the same target
- the `<!-- loop-agent -->` bot-identity marker that disambiguates bot comments from human replies under a shared GitHub identity

## Plan Phase

See [references/plan-phase.md](./references/plan-phase.md) for:

- investigating an issue, asking blocking questions as marked comments, and yielding to the human
- resuming planning after a human reply and writing the comprehensive plan into the issue
- refining the issue title/body, collapsing the original description, and stopping at the human approval gate

## Implementation Phase

See [references/implementation-phase.md](./references/implementation-phase.md) for:

- building from the approved plan on the `claude/issue-<n>` branch and running repository verification
- opening the draft pull request, watching it, and addressing human review comments and CI failures
- running the comprehensive self-review, posting findings as comments, the round-count termination guard, and flipping to review-ready

## Operator Setup

See [references/operator-setup.md](./references/operator-setup.md) for:

- creating the `loop:*` labels and the claude.ai routine, API trigger, and repository secrets
- wiring the `.github/workflows/loop-dispatch.yaml` bridge and enabling Auto-fix for the PR watch
- the routine prompt, network/branch-push settings, and the daily-run and usage caveats

## Relationship to Project Skills

The loop orchestrates existing project skills; it does not restate their rules. Planning, implementation, verification, and review each defer to their owning skill.

**Guidelines:**

- MUST follow [Development Guidelines](../development-guidelines/SKILL.md) and the [Response Approach](../../../AGENTS.md) workflow inside every phase.
- MUST produce the comprehensive plan and the self-review using the same standards a human-run task would, consulting every skill whose routing condition matches the changed surface.
- MUST apply [Code Review Guideline](../code-review-guideline/SKILL.md) for the self-review step, including severity labels and `file:line` evidence.
