# Scope Discipline

Apply these rules to verify the diff is exactly what the stated task required — nothing more, nothing less.

## In-Scope vs Out-of-Scope

- MUST identify the stated user goal (from the PR description, commit message, or the task the user gave the reviewer) and confirm every changed file traces back to that goal.
- MUST flag any drive-by change — a renamed unrelated variable, a refactor of an untouched file, a formatter change to a file that did not need to be edited — as Minor scope creep, per [development-guidelines › change-management](../development-guidelines/change-management.md).
- MUST NOT itself extend the review into pre-existing concerns; surface them under "Pre-existing Observations" per [evidence.md](../code-review-guideline/evidence.md).

## YAGNI

- MUST flag a new abstraction (a new helper, a new repository function, a new component prop, a new generic type parameter) that has only **one** caller in the diff and no documented future caller. Inline it.
- MUST flag a new configuration option (a new prop, a new function argument, a new environment variable) added "just in case" with no live consumer.
- MUST flag speculative type widening — e.g., a function signature changed from `(slug: string)` to `(slug: string | string[])` when no caller passes an array.

## DRY (Done Right)

- SHOULD flag two or more code blocks in the diff that are byte-for-byte (or near-identical) duplicates **of the same concern**. Extract a helper.
- MUST NOT recommend extracting a helper when two blocks are coincidentally similar but represent different concerns (e.g., a logger child and an analytics tracker that both happen to take a `module` parameter). Coupling unrelated callers is worse than the duplication.
- SHOULD prefer "rule of three" — duplication is a smell after the third occurrence, not the second.

## KISS

- SHOULD flag a clever one-liner that requires more than ten seconds to parse when a multi-line, named-step version would read cleaner.
- SHOULD flag a regex used for a string operation that `String.prototype.split` / `URL.parse` / `URL.canParse` could express more clearly. (Note: the project does use regex for tightly-bounded matches like `mediaSrcRegex` in `app/(app)/_/components/media.tsx`; do not flag those.)
- SHOULD flag a new generic type parameter on a function with one concrete usage — replace with the concrete type.

## SOLID Applied to RSC Trees

- SHOULD flag a Server Component whose responsibility extends across multiple unrelated entities (e.g., one component that fetches a blog post **and** the website settings **and** the tag list). Split per concern; each child gets its own Suspense boundary per [react-component-guidelines › server-components](../react-component-guidelines/server-components.md).
- MUST flag a Server Component that **mutates** data — repositories under `app/(app)/_/repositories/` are read-only. Mutations belong in `route.ts` handlers or Payload hooks.
- SHOULD flag a Loading component that depends on the loaded data shape (defeats the loaded/loading split) — the loading skeleton must render with no data.

## Diff Size

- SHOULD flag a single PR/diff that touches more than ~15 unrelated files or more than ~600 lines net change as Minor "consider splitting". Large diffs increase the chance the reviewer misses something. Defer the split decision to the human owner per [escalation.md](../code-review-guideline/escalation.md).
