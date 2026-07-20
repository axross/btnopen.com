# Summary and Background Framing

Apply this reference when drafting or reviewing the plan sections that state what is needed and why — **Summary**, **Background** with its **Goals**, **Non-goals**, and **Assumptions** subsections, and the trailing **Open questions** section — before any UI, system-design, or implementation detail. Sourced from PRD-, RFC-, and requirements-writing practice: [Perforce's PRD guide](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd), [ProductPlan's problem-statement guide](https://www.productplan.com/learn/guide-to-writing-an-effective-problem-statement), [Intercom's "start with a problem statement"](https://www.intercom.com/blog/how-to-write-problem-statements/), [Product Talk on product outcomes](https://www.producttalk.org/product-outcomes/), [Google's design-docs practice](https://www.industrialempathy.com/posts/design-docs-at-google/), the [Rust RFC template](https://github.com/rust-lang/rfcs/blob/master/0000-template.md), the [RFC Style Guide (RFC 7322)](https://www.rfc-editor.org/rfc/rfc7322), and [GitHub's native mermaid rendering](https://github.blog/developer-skills/github/include-diagrams-markdown-files-mermaid/).

## Summary

The Summary is the document's funnel mouth: RFC and design-doc practice converges on opening with a short overview a reader can stop after — Rust RFCs limit it to one paragraph, IETF's style guide requires an abstract that stands alone without the body, and Google design docs open with context a relative newcomer can absorb. A Summary earns its place when a reader who reads nothing else still knows what the work is and what goal it serves.

**Guidelines:**

- MUST open the plan with a single-paragraph Summary explaining the work and its goal.
- MUST make the Summary readable standalone: no forward references to later sections, no undefined shorthand, no reliance on the issue thread.
- MUST keep motivation depth and circumstance detail out of the Summary; they belong in Background.

## Background

Background states the circumstances that make the work worth doing — neutrally, without embedding the chosen solution. Problem-first ordering is universal across RFC templates and PRD practice, and a brief that smuggles the solution into the problem statement forecloses design judgment that belongs later. Concise bullets beat prose paragraphs for scannability, and GitHub renders mermaid natively in issues, so a small diagram is often the clearest way to show a situation — a failing data flow, a tangled dependency, a before/after shape.

**Guidelines:**

- MUST state the circumstances and the problem before any solution, UI, or system-design detail, and keep "how" out of this section.
- SHOULD write Background as a concise bullet list rather than paragraphs.
- SHOULD add a mermaid diagram when it clarifies the circumstances better than prose — and skip it when it would only decorate.
- SHOULD ground the problem in the underlying need it serves rather than a literal feature request, so the requirement stays stable if the chosen solution changes.
- SHOULD link out to supporting research or prior discussion rather than inlining it.

## Goals

Goals make the work's purpose checkable: each one names an achievable outcome the reader can hold the finished work against. Outcome-based framing — the change in user or system behavior sought — is preferred over output-based framing (the artifact being shipped), since output-only specs risk shipping work without moving anything real.

**Guidelines:**

- MUST list concise, achievable goals as bullets under Background, each explaining part of the work's purpose.
- SHOULD frame each goal as a change in behavior or capability, not as the artifact being built.

## Non-Goals and Out-of-Scope

Non-goals are a decision, not a disclaimer. Design-doc practice at Google treats "Non-Goals" as things that could reasonably have been in scope but were deliberately excluded — not a restatement of the goal in the negative. Pairing every goal list with an equally visible non-goal list pre-empts "can we just add X" requests once work is underway.

**Guidelines:**

- MUST write explicit non-goals as a subsection beside Goals whenever the boundary is easy to misread.
- MUST phrase each non-goal as a deliberate exclusion of something that could plausibly have been included, not as a negated goal.
- SHOULD route a later request that falls outside the stated non-goals through explicit scope evaluation rather than silently absorbing it into the current change.

## Assumptions vs. Open Questions

Assumptions and open questions are easy to conflate but serve different readers and live in different places. An assumption is a stated belief the plan relies on and would need to revisit if wrong — it sits early, under Background, where the reader forms their model of the work. An open question is an unresolved item; a *blocking* one is asked before the plan is finalized, while a non-blocking one is recorded in the trailing Open questions section (see below).

**Guidelines:**

- MUST state assumptions and constraints the plan relies on in the Assumptions subsection under Background, distinct from open questions.
- MUST NOT embed an unresolved product, scope, or platform decision silently as an assumption; ask it instead, per AGENTS.md's rule to ask a concrete question when progress depends on a product, platform, privacy, compatibility, or scope decision.
- SHOULD flag an assumption the reader is likely to disagree with rather than build around it unstated.

## Open Questions and Risks

The plan ends with an Open questions section — the RFC tradition's "Unresolved questions", explicitly TBD-friendly so drafting is never blocked on having every answer. It is the plan's historical margin: unresolved non-blocking items, and known hazards recorded as risks with their mitigation, kept where humans and AI agents can salvage them later. A known hazard is a risk, not a question — write it with its mitigation rather than as an open-ended unknown.

**Guidelines:**

- MUST end the plan with an Open questions section; "None" is a valid entry and still worth stating.
- MUST record only non-blocking items here; a question that blocks confident planning is asked before the plan is finalized, never parked.
- SHOULD record a known hazard as a risk with its mitigation (e.g., "Risk: X may happen — mitigated by Y"), distinct from genuine unknowns.

## Right-Sizing Scope

Formality tracks risk and reversibility, not a fixed template. Cross-team, irreversible, or high-blast-radius changes warrant a fuller plan with alternatives and non-goals; a small, easily reversible change warrants a short line per section. Shape Up's appetite-first approach — fixing the time or resource budget and shaping scope to fit it — is a disciplined way to right-size scope instead of letting an open-ended feature list dictate it.

**Guidelines:**

- MUST right-size each section to the change: a one-line copy fix needs a sentence per required section, not a multi-paragraph spec; a cross-cutting feature needs more.
- SHOULD add detail only as decisions stabilize rather than speculatively covering capabilities not yet needed.
- SHOULD scale formality to the change's risk and reversibility, not to a fixed section template.

## Concrete, Checkable Language

Vague quality adjectives are a measured defect, not a style nitpick: empirical requirements-smell research ties subjective terms like "user-friendly," "fast," "intuitive," or "seamless" directly to lower testability and higher downstream defect risk. Classic requirements guidance names the same failure mode as words to avoid without a measurable follow-up.

**Guidelines:**

- MUST replace vague quality adjectives ("user-friendly", "fast", "intuitive", "clean", "seamless") with concrete, checkable statements.
- MUST keep each requirement to one thing with only one reasonable interpretation (atomic: one requirement, one interpretation).
- MUST name the exact copy, threshold, attribute, or state transition expected instead of describing a quality in the abstract.
