# Corpus Structure

Apply this reference when creating a document in the corpus, deciding which
document a fact belongs in, or judging whether an existing corpus is shaped
correctly.

## The Shape

```text
docs/
  index.md          # the only entry point read unconditionally
  overview.md       # what the product is, who it is for, where its boundary sits
  glossary.md       # the vocabulary, grouped by domain
  specs/<domain>.md # how the product behaves now, one file per domain
  decisions/YYYY-MM-DD-<decision-in-kebab-case>.md
```

| Document            | Owns                                                                | Does not own                       |
| ------------------- | ------------------------------------------------------------------- | ---------------------------------- |
| `index.md`          | One line per document, naming what it covers                        | Any fact of its own                |
| `overview.md`       | The product's purpose, audience, and boundary; the cross-domain map | Any single domain's rules          |
| `glossary.md`       | What each term means and how it relates to the others               | Cardinality, invariants, lifecycle |
| `specs/<domain>.md` | Triggers, rules, state transitions, error and edge behaviour        | Vocabulary definitions; rationale  |
| `decisions/…`       | Why a constraint exists, and what was traded away                   | What the product currently does    |

`docs/` is the conventional root; a project that already keeps this material
somewhere else keeps it there.

**Guidelines:**

- MUST keep `specs/` flat. A nested `specs/billing/invoices.md` has no single
  domain heading to pair with, and the pairing is what keeps vocabulary and
  behaviour findable from each other.
- MUST require no document but `index.md`. Every other file is written when
  there is something to put in it, so a corpus can be adopted incrementally
  rather than as a template to fill.
- MUST put a fact in exactly one document. When two could hold it, the more
  specific one wins and the other refers to it in prose.
- MUST write every spec in the **present tense**, describing what the product
  does — not what it will do, should do, or once did.

## The Invariants

1. **One fact lives in exactly one document.** Two copies diverge; the reader
   cannot tell which is current, and neither can a reviewer.
2. **What is not reachable from `index.md` does not exist** — every document
   except an individual decision record, which the log itself carries.
3. **A decision is superseded by a new record, never rewritten in place.** The
   old rationale is what makes the new one legible.
4. **The diff belongs to the plan; the steady state belongs here.**
5. **Only `index.md` is read unconditionally.** Every other body is fetched
   because a task touched it.

Invariant 5 is why the index carries one line per document and nothing else. It
is also why an individual decision record is not indexed: the log is
append-only, so a corpus that listed each record would grow the one file that is
always read, without bound, until reading it cost more than it saved.

**Guidelines:**

- MUST link each document from `index.md` with a one-line statement of what it
  covers, so a reader can decide not to open it.
- MUST NOT index individual decision records; `index.md` links `decisions/` once,
  as a directory.
- MUST NOT copy a corpus body into an agent instruction file. The corpus is
  pulled through the index when a task needs it; embedding it makes every turn
  pay for text almost every turn ignores.

## The Glossary

An entry defines the term and states, in one sentence, how it stands to the
others. Detail lives in the spec that owns the behaviour.

```markdown
## Jobs

**Job** — one execution of a **Job Template**, created when the template's
schedule fires or when a user runs it by hand.

**Job Template** — the reusable definition a **Job** is created from.
```

Headings are domains, named for the spec that details them: a `## Job Templates`
heading pairs with `specs/job-templates.md`. That pairing is what makes the
glossary navigable without a single link — the section a term sits in already
says which spec owns it.

**A term costs the reader whatever it takes to reach the right meaning, and the
words it is made of set that cost.** A glossary is not read front to back; it is
read by someone meeting a term in a sentence who decides, in that moment,
whether they already know it. Where a candidate's words compose to the
definition exactly, that decision costs nothing. A reader meeting `Template`
knows the English word and moves on with the wrong meaning; one meeting **Job
Template**, as the example above has it, already knows what it holds before
reaching the entry.

Where nothing composes exactly, the remaining candidates are not equally priced.
One that visibly does not compose costs a lookup: paid once, and knowingly. One
that composes to something _nearly_ right costs more, and invisibly, because the
reader never stops, and every sentence built on the term inherits the meaning
they brought to it. Naming the stretch between a **Job** stopping and its record
being written, `Job window` sends the reader to the entry: they can see it names
some span and not which one. `Job end` sends them nowhere, because it composes to
the moment the job stopped — where the stretch begins, not what it is. So the
visibly incomplete term costs less than the plausibly wrong one, and a bare word
whose ordinary meaning is wider, narrower, or merely adjacent to what the entry
says is plausibly wrong by construction.

A qualifier earns its place only when the compound composes to the thing itself.
Say the corpus above needs a term for what one **Job** produced, kept after the
job itself is gone: **Job output** composes to exactly that, and three
near-misses each miss along one axis.

| Candidate        | Composes to                  | Axis it misses                                                               |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `Output record`  | a record of some output      | **which** — the qualifier says what kind of record, never whose output it is |
| `Failure output` | what the failures produced   | **how much** — narrower than the thing, which covers successful **Jobs** too |
| `Completed job`  | the execution, once finished | **what kind** — the execution itself, where the thing is what it left behind |

One case sits outside all of this: seeding a glossary from the code and from a
team's own usage, which the Seeding the Glossary section of
[bootstrapping.md](./bootstrapping.md#seeding-the-glossary) governs in full. The
closest-composing guideline below governs the rename that may follow the
capture, not the capture itself.

**Guidelines:**

- MUST group the glossary by domain, with each heading named for a spec — or,
  for vocabulary no single domain owns, named for the concept it collects.
- MUST keep an entry **self-sufficient**: after reading it, a reader knows what
  the term means and where it sits without opening anything else. An entry that
  only redirects has stopped paying for itself, and no check can see that.
- MUST choose the term whose words' ordinary meaning composes closest to what
  the entry says, wherever a term is being chosen rather than seeded from the
  code or the team's own usage — so a bare word already meaning exactly that
  stays bare, and one meaning something wider, narrower, or adjacent takes the
  qualifier that closes the gap; where no candidate composes exactly, prefer the
  term a reader can see they do not know to one they will mistake for a word
  they do, and no check can see this either.
- MUST mark a defined term where it appears in another entry — bold is enough —
  rather than linking to it. The file is small by construction, so an in-file
  anchor buys navigation nobody needed.
- MUST NOT state cardinality, invariants, or lifecycle in the glossary; those
  are behaviour, and behaviour lives in the spec.
- SHOULD add a term the moment a spec uses a word whose meaning a newcomer
  would have to infer.

## Diagrams

A diagram separated from the text it describes rots independently of it, so
placement follows ownership rather than medium.

**Guidelines:**

- MUST place a diagram inline in the document that owns what it depicts: a
  within-domain structure diagram in that domain's spec, a cross-domain map in
  `overview.md`.
- MUST NOT create a `diagrams/` directory, or any other home that separates a
  diagram from its prose.
- SHOULD write diagrams as Mermaid in a fenced block, so a change to one shows
  up as a readable diff rather than a replaced binary.
- SHOULD leave the glossary without diagrams; an entry that needs one is
  carrying structure that belongs in a spec.
