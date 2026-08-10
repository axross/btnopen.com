---
name: living-product-specification
description: Updating a project's product documentation when a change alters what it says, and reading it before planning one — a behaviour, a domain term, or a decision that constrains future work; also placing or updating a project's conventions or operational procedures when they share a documentation root with that corpus. Triggers on "docs/", "spec", "domain model", "glossary", "ubiquitous language", "ADR", "supersede", "the docs are stale", "is this documented anywhere", "one documentation root", "conventions/", "operations/". Not spec-driven development — a plan drives the change and this records what became true, so "spec-first" and "generate from the spec" route elsewhere. Covers the corpus, its invariants, decision records, the documentation-root shape, and five single-purpose validators.
user-invocable: true
---

# Living Product Specification

Use this capability to keep a project's own description of its product — what it
is, the language its domain speaks, how it currently behaves, and the decisions
that constrain it — true as the code changes, and to read that description
before planning a change rather than discovering it afterwards.

The weight is on **upkeep**. Documentation that is only ever created is a
liability: it accumulates claims nobody re-checks, and a reader cannot tell
which of them still hold. What makes a corpus worth keeping is a mechanism that
corrects it, tied to the change that invalidated it. That mechanism is the whole
subject here; creating documents is the small part.

Two claims this capability does **not** make. It does not promise to make an
agent better at its task — the evidence for context files improving task success
is weak, and the design below assumes a body is read only when a task needs it,
rather than loaded on every turn. And it does not drive development from a
specification: the plan drives the change, and the corpus records what became
true once that change landed.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

## What This Does Not Cover

Four neighbouring bodies of documentation are deliberately out of scope, because
each already has an owner and mixing them is what turns a corpus into a
junk drawer:

| Not this                                                            | Where it belongs                                                            |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| README, setup steps, how to run the tests, deployment runbooks      | The project's contributor documentation                                     |
| The plan for a change — what is about to be built                   | A product-requirement or plan-document capability, recorded with the change |
| What the code's layout and conventions are                          | The project's own repository-structure conventions                          |
| How to write a clear sentence, and which document type to reach for | A technical-writing capability                                              |

The line against the second is the one worth stating twice, because both
describe the product and only the tense differs: **a plan describes the diff, a
specification describes the steady state.** When a change merges, the part of
the plan that became true is absorbed here; the plan itself stays where it is,
as the record of a decision made at a point in time.

Out of the corpus is not out of the directory: a project that keeps its
contributor documentation and its own conventions beside the corpus, under one
root, has a named shape for that too — see
[The Documentation Root](#the-documentation-root).

## The Three Modes

| Mode          | When                                     | What happens                                                                                                                                                                |
| ------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Consult**   | Before writing a plan                    | Read the index, open the one or two documents the task touches, follow their dependency and decision links, and name in the plan which documents the change will invalidate |
| **Upkeep**    | In the same change that alters behaviour | Correct what the change invalidated — restate facts, supersede decisions, add a spec for new behaviour, repoint stale references                                            |
| **Bootstrap** | A project with no corpus                 | Detect whatever convention already exists and follow it; propose the default shape only where there is none                                                                 |

**Guidelines:**

- MUST read the corpus index before proposing a plan for a change to a documented area, and name in that plan every document the change will invalidate.
- MUST correct what a change invalidated in the same change, never as follow-up work — a corpus updated separately is a corpus that drifts between the two.
- MUST NOT copy a plan's forward-looking text into the corpus verbatim; restate what is now true in the present tense, and drop what did not land.
- MUST run the validators this skill bundles over any corpus a change touched, and fix what they report before calling the change done.
- SHOULD leave a document alone when a change did not alter what it claims; an edit that only restyles prose adds review surface and no truth.

## The Corpus

See [corpus-structure.md](./references/corpus-structure.md) for:

- the five-part shape — `index.md`, `overview.md`, `glossary.md`, `specs/<domain>.md`, `decisions/` — and what each one owns
- the five invariants, including why only the index is read unconditionally and why an individual decision record is exempt from the index
- why `specs/` is flat, and why `index.md` is the only file a corpus must have
- what a glossary entry holds, the domain grouping that makes it navigable, and two rules no validator can enforce — an entry that stands on its own, and a term whose own words cost the reader least to read correctly
- where a Mermaid diagram goes, and why there is no `diagrams/` directory

## The Documentation Root

See [documentation-root.md](./references/documentation-root.md) for:

- the shape a root takes once it also holds `conventions/` and `operations/` beside the corpus, and what each sibling owns
- the recommendation that makes one root the bootstrap default for a project with no established documentation convention
- the `index.md` obligation to name every body before listing a document
- the same-change upkeep obligation for a convention or a procedure a change alters
- which of the five validators see a co-located body and which do not

## Cross-References

See [cross-references.md](./references/cross-references.md) for:

- the single rule that decides every link: a reference exists only where it carries what the structure does not already encode
- the per-reference verdict table, including why the glossary links into nothing and the index links to `decisions/` once rather than per record
- the dependency condition that keeps `specs/` from becoming a link mesh
- why a decision record carries no outbound links, and what that protects

## Decision Records

See [decision-records.md](./references/decision-records.md) for:

- the existence condition — a decision constrains future work _and_ its rationale is unrecoverable from the code — and what it keeps out
- the `YYYY-MM-DD-<decision-in-kebab-case>.md` filename, why the date is the decision date and never changes, and why it beats sequential numbering under parallel branches
- the two-value `status` frontmatter and its `superseded_by` companion, and why `proposed` and `rejected` are absent
- the supersede protocol: a new record, never an edit to the old one's substance

## Consulting and Upkeep

See [consulting-and-upkeep.md](./references/consulting-and-upkeep.md) for:

- reading the index first and stopping there when nothing matches
- the invalidation table — which kind of code change puts which document in question
- absorbing a merged plan into the present tense without importing its speculation
- superseding rather than rewriting, and repointing what the supersede left stale

## Bootstrapping a Corpus

See [bootstrapping.md](./references/bootstrapping.md) for:

- detecting an existing convention before proposing one, and leaving an unrelated `docs/` directory alone
- the smallest corpus worth having, and the order to write it in
- seeding a glossary from the code's own vocabulary rather than inventing one
- what not to import — runbooks, setup steps, and anything a plan already owns

## Validators

See [validators.md](./references/validators.md) for:

- the five commands, the change each one answers for, and why there is no run-all script
- the two-level opt-in that keeps an unrelated `docs/` directory from turning red
- the boundary between "does this link resolve" and "is this file listed", so no defect is reported twice
- what these deliberately do not check, and why a spec/implementation mismatch is not among them
