# Run State and Reporting

Apply this reference when recording the run's durable state, and when the run reaches convergence and reports back. It expands the [Run State and Reporting](../SKILL.md) section in the parent skill.

## GitHub as Lightweight State

State lives in this running session; GitHub carries a thin, **human-invisible** breadcrumb so a resumed or reclaimed session can recover. The run posts no status or attention comments — the only comments it authors are the dedicated review request (Phase 3) and the marked review-thread replies that tie each resolved finding to its commit (Phase 4).

**Guidelines:**

- MUST keep the run's state in a single **status block**: an HTML comment (`<!-- ... -->`) embedded in the pull request description — invisible in the rendered UI, present in the raw markdown. Before the pull request exists, keep the same block in the issue body. Record the current phase, the review-round count, what the run is waiting on, and any open question; update it in place.
- MUST NOT post a separate status comment or @mention the maintainer for attention; convey ready-to-merge, dormancy, and non-convergence in the turn output instead.
- MUST NOT write the literal review trigger phrase anywhere except the dedicated review request — a comment-triggered workflow fires on that phrase appearing anywhere in a body. Refer to it as "the independent review" everywhere else.
- MUST reconstruct state from GitHub before acting on a resume, and resume the one pending step the block names rather than restarting from Plan.

## Ready-to-Merge Handoff

When a run flips its pull request to ready, that same chat turn doubles as a **verification brief**: hand the human everything they need to exercise the change before merging. Deliver it in the session's chat turn output only — never as a GitHub comment.

**Guidelines:**

- MUST name, in the handoff and in any completion claim, the tracking issue, the pull request, and the independent review's outcome (round count and verdict), with links — a completion report that cannot cite its pull request and review is reporting work that is not ready.
- MUST judge whether the change is human-observable first. Write the brief only when the change alters something a human can see or operate — a route, a rendered surface, a command, an admin view. For a purely internal change (build, refactor, non-visible logic) with nothing to walk through, say so in one line and stop.
- MUST spell out what to exercise and how, derived from the plan's acceptance criteria and the changed surfaces: the specific routes, pages, or commands to open, and the states to exercise (loading, empty, error, responsive widths, theme, locale) where they apply.
- SHOULD hand over a per-PR preview URL when the project deploys one — sourced from the newest preview-deploy comment and verified against the branch-head SHA, never constructed from memory. When there is no usable preview, give the local verification steps instead; never fabricate a URL.
