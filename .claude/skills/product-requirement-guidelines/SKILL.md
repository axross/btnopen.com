---
name: product-requirement-guidelines
description: How to write and review a product requirement, feature spec, plan document, or issue description. Owns the canonical plan-document structure — Summary; Background with Goals, Non-goals, and Assumptions; Functional requirements with UI design and System design (plus Alternatives considered); Non-functional requirements; Acceptance criteria; Verification strategy; Open questions — and the per-section craft: problem/outcome framing, "what should be" requirement phrasing, design-section triggers including intricate minor-scoped mechanics, testable criteria, ordered verification steps, and TBD-friendly open questions.
when_to_use: Apply when writing, refining, or reviewing a product requirement, feature spec, plan document, or issue description, including any plan-writing or issue-drafting step of a delivery workflow — "write a PRD", "refine this issue", "structure this plan", "write acceptance criteria", "how do I verify this is done", "what's the scope of this change", or "does this need a UI design / system design section".
user-invocable: false
---

# Product Requirement Guidelines

Apply this skill whenever drafting or reviewing a product requirement, feature spec, or plan document — the parts that describe **what** is needed and **how completion is verified**, not how it is built. It is general-purpose: any product requirement, feature specification, or issue description benefits from it, not only a delivery workflow's plan-writing step.

This skill owns the canonical plan-document structure, in this order. Required sections appear in every plan; conditional sections are omitted only with a stated reason.

1. **Summary** — one standalone paragraph.
2. **Background** — with **Goals**, **Non-goals**, and **Assumptions** subsections.
3. **Functional requirements** *(conditional)* — with **UI design** *(conditional)* and **System design** *(conditional, with **Alternatives considered** when a plausible competing approach exists)* nested under it.
4. **Non-functional requirements** *(conditional)*.
5. **Acceptance criteria**.
6. **Verification strategy**.
7. **Open questions**.

This skill deliberately does not own everything a plan contains. It owns the structure, problem framing, scope boundaries, requirement and criteria craft, and the spec-level framing of the UI design and System design sections. It does not own the implementation mechanics behind them:

- UI component structure, CSS, and markup mechanics — the project's UI design principles and the project's React component guidelines. This skill owns only how to *describe* hierarchy, states, accessibility, and responsive intent in the spec. The visual options exhibit and its design record (per-round selections, design-artifact links) are owned by the address skill's visual-design-options reference.
- Actual data flow implementation, routes, and module placement — the project's project-structure skill. This skill owns only how to *describe* system-design decisions in the spec.
- Test-writing mechanics — the project's e2e testing guidelines and the project's unit-test guidelines. This skill owns only how a spec *names* the coverage and verification steps that make it checkable.

## Summary and Background Framing

See [problem-and-scope.md](./references/problem-and-scope.md) for:

- writing the standalone one-paragraph Summary
- framing Background as concise bullets, with mermaid diagrams when they clarify circumstances
- stating goals, explicit non-goals, and assumptions distinct from open questions
- writing the trailing Open questions section, including known risks with mitigation
- right-sizing the document to the size of the change
- replacing vague quality adjectives with concrete, checkable statements

## Functional Requirements Craft

See [functional-requirements.md](./references/functional-requirements.md) for:

- writing user-perspective requirements as "what should be", not "what to do"
- ordering guide-level explanation before reference-level detail
- covering the primary flow and the relevant empty, error, and edge states
- deciding when the section applies and how to omit it with a stated reason

## UI Design Section Framing

See [ui-design-framing.md](./references/ui-design-framing.md) for:

- when a spec needs a UI design section at all (view-affected changes only) and at what fidelity
- describing hierarchy and layout intent in spec terms, not implementation
- enumerating interaction states (default, disabled, loading, error, empty)
- stating accessibility intent as testable, WCAG-referencing criteria
- stating responsive behavior intent and copy/microcopy constraints
- how the section's durable design record relates to the visual options exhibit

## System Design Section Framing

See [architecture-overview-framing.md](./references/architecture-overview-framing.md) for:

- when a spec needs a System design section — boundary-crossing or hard-to-reverse changes, and intricate minor-scoped mechanics
- describing data flow and module boundaries at spec level, with mermaid diagrams and clarifying code snippets
- recording alternatives considered and why they were rejected
- stating non-functional requirements as measurable targets

## Acceptance Criteria Craft

See [acceptance-criteria.md](./references/acceptance-criteria.md) for:

- writing criteria a reviewer can verify independently, without reading implementation code
- preferring concrete, checkable phrasing over adjectives
- covering the happy path, edge/error/empty states, and explicit non-effects
- right-sizing the checklist and tracing every criterion back to the rest of the spec

## Verification Strategy Craft

See [verification-strategy.md](./references/verification-strategy.md) for:

- writing the ordered verification steps that show the work is done
- steps-to-reproduce for bug work, before and after the fix
- naming the project's verification gates the changed surface requires
- naming the test coverage to add or update

## Plan Document Template

See [template.md](./references/template.md) for:

- a self-contained, annotated Markdown skeleton of the full plan-document structure
- what belongs in each slot, each conditional section's omit-rule, and the right-sizing note
