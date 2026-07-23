# Load-Pattern Classification

Apply this reference when deciding whether a rule belongs in a skill at all, and if so which kind — or when auditing where the project's existing skills sit. Load pattern is the operative placement question: it is decided by *when the content is needed*, upstream of "is this a capability or a guideline?". A rule needed on every task wants always-on context; a procedure needed only sometimes wants an on-demand skill; a workflow a caller invokes wants a runnable entry point.

## Load Patterns

Every skill under the project skill root falls into one of three load patterns.

**Guidelines:**

- MUST treat a **runnable capability** as a workflow a human or the model invokes by name (`user-invocable: true`, usually with an `argument-hint`) — an entry point that drives a multi-step process, not a passive rule set.
- MUST treat an **always-on rule** as guidance needed on essentially every task, cheap enough to keep resident — a candidate for the always-on context (`AGENTS.md`) rather than a description-triggered skill, because a skill that only loads on a description match is unreliable for a rule that must always fire.
- MUST treat an **on-demand reference lens** as knowledge or conventions loaded only when matching work appears — the default and largest bucket, correctly modeled as a skill whose `description`/`when_to_use` gate its loading.
- SHOULD label a lens **activity-scoped always-on** when it fires on *every* instance of an on-demand activity (every review, every GitHub write) but the activity itself is occasional: it stays an on-demand skill, but its always-fire core is a candidate for hoisting into the activity's entry point.

## Classification

The project's current skills, by load pattern. Keep this synchronized with the skill root and the master skill index when skills are added, renamed, or removed.

| Skill | Load pattern | Note |
| ----- | ------------ | ---- |
| `address` | Runnable capability | `user-invocable: true` |
| `handoff` | Runnable capability | `user-invocable: true` |
| `development-guidelines` | Always-on rule | "Apply at the start of EVERY task"; candidate for hoisting its baseline into `AGENTS.md` |
| `code-review-guideline` | On-demand reference lens | Activity-scoped always-on: fires on every review; reviewer-reset/severity core is a hoist candidate |
| `github-operation-guidelines` | On-demand reference lens | Activity-scoped always-on: every GitHub-touching task |
| `agent-skills-best-practices` | On-demand reference lens | Authoring/meta discipline |
| `product-requirement-guidelines` | On-demand reference lens | |
| `project-structure` | On-demand reference lens | |
| `payload-cms-mcp` | On-demand reference lens | Procedural how-to for the MCP server; not runnable |
| `application-security-requirements` | On-demand reference lens | Review lens |
| `maintainable-code-guidelines` | On-demand reference lens | Review lens |
| `performance-and-reliability-requirements` | On-demand reference lens | Review lens |
| `quality-assurance-guidelines` | On-demand reference lens | Review lens |
| `react-component-guidelines` | On-demand reference lens | |
| `routing-guidelines` | On-demand reference lens | |
| `ui-design-principles` | On-demand reference lens | |
| `markdown-processing-guidelines` | On-demand reference lens | |
| `observability-guidelines` | On-demand reference lens | |
| `e2e-testing-guidelines` | On-demand reference lens | |
| `unit-test-guidelines` | On-demand reference lens | |

Totals: **2 runnable capabilities · 1 always-on rule · 17 on-demand reference lenses**.

## Using the Classification

The load pattern a new or existing skill lands in decides where its content should live and how its discovery metadata is written.

**Guidelines:**

- MUST place a rule needed on every task in the always-on context rather than a new skill; a skill whose `when_to_use` reduces to "every task" is an always-on rule mis-housed as a skill.
- SHOULD keep an on-demand reference lens as a skill, and invest in its `description`/`when_to_use` so it loads exactly when its work appears — see [description-writing.md](./description-writing.md).
- SHOULD reserve `user-invocable: true` for runnable capabilities, and NOT convert a reference lens into a slash-command, which suppresses the model-triggered loading a lens depends on.
- SHOULD, when a lens is activity-scoped always-on, consider hoisting only its always-fire core into the activity's entry point while leaving the occasional detail in the skill — a change to weigh separately, not a default.
- MUST re-evaluate a skill's load pattern when its scope changes, and update this table in the same change.
