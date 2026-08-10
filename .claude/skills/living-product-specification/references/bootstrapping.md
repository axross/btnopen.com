# Bootstrapping a Corpus

Apply this reference when a project has no product specification and one is
being started.

## Detect Before Proposing

A project that already documents something has already made choices, and those
choices are usually load-bearing for people who are not in the room. The default
shape is what to propose in the absence of a convention, never what to impose
over one.

That default is not the same as an accident. A `docs/` directory naming
`conventions/` or `operations/` as siblings of `specs/` and `decisions/`, with
an index that says as much, is
[the shape a documentation root takes](./documentation-root.md) when adopted
on purpose, and detecting it means detecting the whole root rather than
stopping at the corpus's own three files.

**Guidelines:**

- MUST look for an existing convention first — a `docs/` directory, a wiki
  export, a long `README` section, an `adr/` or `decisions/` directory — and
  adopt its layout and naming where one exists.
- MUST leave documentation that is out of scope exactly where it is,
  distinguishing a `docs/` directory that merely shares its name — no
  `conventions/` or `operations/` siblings, no index naming them — from a
  documentation root adopted on purpose. Where it merely shares the name:
  adding an index beside it does not make it part of the corpus, and
  rewriting it is not this capability's business.
- MUST ask before relocating or restructuring anything that already exists.
  Where the corpus lives is a project decision with consequences for links,
  bookmarks, and tooling nobody in the session can see.
- SHOULD adopt an existing decision-record convention rather than converting it,
  even when it numbers records sequentially. A conversion invalidates every
  reference that already points at them, which is a cost with no matching
  benefit.

## The Smallest Corpus Worth Having

Adoption fails when it starts as a template to fill. Three files, each with real
content, beat a complete tree of headings with nothing under them.

Write in this order:

1. **`index.md`** — the adoption marker. Until it exists there is no corpus, and
   the bundled validators stay silent.
2. **`overview.md`** — what the product is, who it is for, and what it
   deliberately does not do. One page. The boundary is the part people disagree
   about, so it is the part worth writing first.
3. **`specs/<domain>.md` for one domain** — the one whose behaviour is most
   often asked about, or most often got wrong.
4. **`glossary.md`** — seeded from that spec's own vocabulary.
5. **`decisions/`** — from the next decision made, not backfilled.

**Guidelines:**

- MUST create `index.md` first, and add a line to it for each document as it is
  written rather than afterwards.
- MUST NOT scaffold empty files or heading-only documents. An empty document is
  indistinguishable from a subject nobody has considered, and it makes the index
  claim coverage the corpus does not have.
- MUST NOT backfill decision records for choices already made. Reconstructed
  rationale is a guess presented as history, and the existence condition rules
  out most of what would be written.
- SHOULD grow the corpus one domain at a time, as changes touch each area,
  rather than in a single documentation push that nobody has a reason to keep
  current.

## Seeding the Glossary

The vocabulary already exists — in type names, table names, route segments, and
the words the team uses in review. Writing it down is a matter of collecting and
reconciling it, not inventing it.

**Guidelines:**

- MUST take terms from the code and the team's own usage, and record the term
  the product actually uses even where it is imperfect.
- MUST record a conflict rather than silently resolving it. Where the code says
  `Account` and people say "workspace", that divergence is the single most
  useful thing the glossary can surface, and picking one quietly hides it.
- SHOULD stop at the terms a newcomer would have to infer. A glossary that
  defines every noun is one nobody finishes reading.

## What Not to Import

| Tempting to move in                          | Why it stays out                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| README, setup, commands, deployment runbooks | Contributor documentation, with its own owner and audience                      |
| Roadmap, upcoming work, deprecation plans    | The corpus is the present tense; a plan owns the future                         |
| API reference generated from source          | Generated output goes stale differently and is better regenerated than restated |
| Meeting notes, incident timelines            | History, not steady state; a decision record captures the part that constrains  |

**Guidelines:**

- MUST keep the corpus to the present tense of the product. Anything describing
  what will change belongs to a plan.
- SHOULD extract the constraint from an incident or a long discussion into a
  decision record when it meets the existence condition, and leave the narrative
  where it is.
