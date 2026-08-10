# The Documentation Root

Apply this reference when a project's documentation root also holds
`conventions/` or `operations/` beside the corpus, when placing a new
convention or operational procedure, or when judging whether a `docs/`
directory that holds runbooks is an accident to leave alone or a root to build
on.

## The Shape

The corpus this capability governs — `specs/` and `decisions/` — is not the
whole of what a documentation root can hold. A project that also keeps its own
conventions and its own operational procedures under the same root gives each
a sibling directory, so the boundary between "what the product does" and "how
the project is built" is a directory rather than a judgment call remade at
every write.

```text
docs/
  index.md          # names every body below, in prose, before listing anything
  overview.md       # the product and the repository, one cross-domain map
  glossary.md       # product vocabulary and development vocabulary, split at the top level
  specs/<domain>.md # the corpus: how the product behaves now
  decisions/…       # the corpus: why a constraint exists
  conventions/…     # how the code is written
  operations/…      # how the project is built, deployed, and operated
```

| Body                   | Answers                                           | Owns                                                          |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| `specs/`, `decisions/` | What does the product do, and why?                | The corpus — everything else in this skill governs it in full |
| `conventions/`         | How is the code written?                          | The rules and shapes a change follows, in this repository     |
| `operations/`          | How is the project built, deployed, and operated? | The pipelines, the setup, and the procedures                  |

`conventions/` and `operations/` are the two bodies
[What This Does Not Cover](../SKILL.md#what-this-does-not-cover) already
scopes out of the corpus — repository-structure conventions and contributor
documentation, respectively. Adopting this shape gives each a named home instead
of leaving every project to invent one, without pulling either under this
capability's own rules: neither earns a spec, a glossary heading, or a
decision record merely by sitting under the same root.

**Guidelines:**

- MUST hold `conventions/` and `operations/` as siblings of `specs/` and
  `decisions/`, never nested inside either, so the directory itself marks the
  boundary a fact's placement depends on.
- MUST NOT apply this capability's own rules — the corpus invariants, the
  spec/glossary pairing, the decision existence condition — to a document
  under `conventions/` or `operations/`; those bodies follow their own
  conventions.

## Adopting One Root

Splitting a repository's documentation across `docs/` and a second tree buys a
reader nothing but a decision, at every write, about which tree a paragraph
belongs to.

**Guidelines:**

- SHOULD propose one documentation root — this shape — as the default when
  [bootstrapping a corpus](./bootstrapping.md) in a project with no
  established documentation convention.
- MUST detect and adopt an existing convention first, and MUST ask before
  relocating or restructuring anything that already exists, exactly as
  [Detect Before Proposing](./bootstrapping.md#detect-before-proposing)
  requires; the SHOULD above never overrides either.
- MUST NOT require an existing, separately-rooted contributor-documentation
  tree to move under this shape; one root is the default for a project
  starting from nothing, not an obligation on a project that already chose
  otherwise.

## Naming the Bodies in the Index

`index.md` is the one file read unconditionally, and in a shared root it is
where a reader learns which body answers their question before opening
anything else.

**Guidelines:**

- MUST name, in `index.md`'s own prose, what each body under the root
  covers — `specs/` and `decisions/` alongside `conventions/` and
  `operations/` — before listing a single document.
- MUST list every document under `conventions/` and `operations/` from
  `index.md`, exactly as every corpus document is listed; the shared index
  carries no exemption for a co-located body.

## Upkeep for a Co-located Body

The corpus's own upkeep obligation — correct what a change invalidated, in the
same change — has no reason to stop at the corpus boundary. A change that
alters a convention or a procedure leaves `conventions/` or `operations/`
exactly as wrong as an uncorrected spec leaves the corpus.

**Guidelines:**

- MUST correct the affected document under `conventions/` or `operations/` in
  the same change that alters the convention or the procedure it describes,
  never as follow-up work.
- SHOULD name, in the plan for such a change, which co-located document it
  will invalidate — the same scope signal
  [Naming the Damage in the Plan](./consulting-and-upkeep.md#naming-the-damage-in-the-plan)
  asks for the corpus.

## What the Validators See

The five validators were written against the corpus, and adopting this shape
changes nothing about what any of them checks. Two of the five never read
`conventions/` or `operations/` at all; the rest walk the whole root and
already see whatever sits under either.

| Validator                      | Sees a co-located body?                                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `check-index.mjs`              | Yes — it walks the whole root, so a document under `conventions/` or `operations/` left off `index.md` is reported like any unlisted spec      |
| `check-references.mjs`         | Yes — it is body-agnostic; a broken relative link fails wherever it is written                                                                 |
| `check-decision-supersede.mjs` | Yes — a document under either directory that still links a superseded decision is reported, the same as a stale spec reference                 |
| `check-glossary.mjs`           | No — it pairs `specs/` against `glossary.md` only; a heading with no matching spec, including one for development vocabulary, is already legal |
| `check-decision-naming.mjs`    | No — it reads only the `decisions/` directory listing                                                                                          |

**Guidelines:**

- MUST run `check-index.mjs`, `check-references.mjs`, and
  `check-decision-supersede.mjs` after a change to a document under
  `conventions/` or `operations/`, exactly as after a change to the corpus.
- MUST NOT expect `check-glossary.mjs` or `check-decision-naming.mjs` to
  report anything about `conventions/` or `operations/`; neither reads those
  directories, and that is not a gap to file.
