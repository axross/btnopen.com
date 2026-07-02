# State Machine and Conventions

The loop stores all state in GitHub. Labels are the phase pointer, the issue/PR body holds the plan and the diff, and comments hold the conversation. This reference defines the labels, the transitions, the lock, and the identity marker.

## Label Set

| Label | Meaning | Applied by |
| ----- | ------- | ---------- |
| `loop:plan` | Issue is queued for planning or actively being planned. | Human (to enroll an issue) |
| `loop:awaiting-answer` | The agent asked a blocking question and yielded; the loop is paused on the human. | Agent |
| `loop:plan-review` | A comprehensive plan is written into the issue; waiting for human approval. | Agent |
| `loop:ready-to-build` | Human approved the plan; implementation may start. | Human (the plan→build gate) |
| `loop:in-review` | A draft pull request is open and the review loop is active. | Agent |
| `loop:done` | The pull request is review-ready; the loop has handed back to the human. | Agent |
| `loop:active` | Concurrency lock: a session is currently working this target. | Agent (transient) |
| `loop:blocked` | The agent could not proceed and needs human intervention. | Agent |

## Transitions

```
(issue opened) --human adds--> loop:plan
loop:plan --agent has a blocking question--> loop:awaiting-answer
loop:awaiting-answer --human replies--> loop:awaiting-answer (agent resumes in place; NO relabel)
    then, when clear --> loop:plan-review                   (agent @mentions the operator)
loop:plan --plan complete--> loop:plan-review               (agent @mentions the operator)
loop:plan-review --unmarked human comment--> loop:plan-review (agent revises plan, re-requests approval)
loop:plan-review --human approves--> loop:ready-to-build     (human applies the label; not a comment)
loop:ready-to-build --agent opens draft PR--> loop:in-review
loop:in-review --self-review round is clean--> loop:done    (PR flipped to ready; agent @mentions the operator)
loop:blocked --human comment--> (agent resumes the appropriate phase and replaces loop:blocked)
loop:done                                                   (terminal; further comments are no-ops)
(active phase) --agent genuinely stuck--> loop:blocked      (agent @mentions the operator)
```

**Guidelines:**

- MUST have exactly one non-lock `loop:*` label on a managed issue at a time; replace the prior label in the same step that adds the next one.
- MUST NOT apply a human-owned trigger label (`loop:plan`, `loop:ready-to-build`) from an agent session; those are the human's controls and applying them from the bot creates an event loop.
- MUST set `loop:blocked` and stop rather than guess when progress needs a human product, scope, or platform decision that the thread cannot answer.

## Concurrency Lock

Scheduled polls, event triggers, and manual runs can fire on the same target concurrently. The `loop:active` label is a best-effort mutex.

**Guidelines:**

- MUST, on entry, check for `loop:active`; if present and its most recent `<!-- loop-agent -->` heartbeat comment is under 30 minutes old, exit immediately without acting.
- MUST add `loop:active` before mutating anything and remove it before exiting, including on handled error paths.
- MUST treat a stale `loop:active` (no heartbeat for 30+ minutes) as an abandoned session and reclaim it.
- SHOULD post a short `<!-- loop-agent -->` heartbeat comment when starting long work so a duplicate session can detect the live lock.

## Bot-Identity Marker

A routine acts as the operator's own GitHub identity, so bot comments and human comments share the same author login. The marker is the only reliable way to tell them apart, and it is what the dispatch workflow uses to avoid re-triggering on the bot's own comments.

**Guidelines:**

- MUST begin every comment the agent posts (issue or PR) with an HTML marker line `<!-- loop-agent -->` on its own line.
- MUST treat any comment that lacks the marker as human input, and any comment that carries it as the agent's own output to ignore as a trigger.
- MUST prefix the visible body with a short badge such as `🤖 **loop-agent**` so a human reader can also see the distinction.
- MUST @mention the operator (`@axross`) in the visible body whenever the loop yields for a decision, approval, or blocker, so the human is notified despite the shared identity.
