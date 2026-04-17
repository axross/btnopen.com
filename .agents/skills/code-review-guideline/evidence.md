# Evidence-Based Reporting

Apply these rules so every finding is verifiable, actionable, and traceable back to either project code or a guideline rule.

## Citation Requirements

- MUST cite a `file:line` (or `file:line-line` for a range) for every finding. Use repo-relative paths from the project root (e.g., `app/(app)/posts/[slug]/page.tsx:42`).
- MUST quote the offending code (one-to-five lines) directly under the citation when the surrounding context is needed to understand the finding.
- MUST link to the violated guideline section when the finding is a guideline violation, using a relative path from the report context (e.g., `[react-component-guidelines › client-vs-server-components](../react-component-guidelines/client-vs-server-components.md)`).
- MUST NOT invent line numbers or paths. If unsure, re-read the file.

## Fix Snippet Format

- MUST provide a concrete fix snippet for every Critical and Major finding. Minor findings SHOULD include a fix; Nits MAY omit it when the suggestion is self-evident.
- MUST format fixes as a unified-diff style block with `-` for the line to remove and `+` for the line to add. Use the same indentation (tabs) as the surrounding source.

Example:

````
[CRITICAL] app/(app)/_/repositories/get-blog-post.ts:53 — Unsanitized slug used in Payload `where` clause without explicit string assertion.
Risk: A non-string `slug` (e.g., array via search-param coercion) bypasses the equals filter and could leak draft content.
Fix:
```ts
- where: {
- 	slug: { equals: slug },
+ where: {
+ 	slug: { equals: String(slug) },
```
````

## Report Structure

The reviewer MUST emit findings in this exact section order so downstream agents and humans can parse them:

1. **Summary** — 2-4 sentences. MUST end with the verdict (Request Changes / Approve with Nits / Approve) per [severity.md](./severity.md).
2. **Strengths** — short bullet list of what the change does well. MUST contain at least one item unless the change is trivially small.
3. **Critical Findings** — numbered list. Each entry: `[CRITICAL] file:line — short title`, then a "Risk:" line, then a "Fix:" snippet, then a "Guideline:" line linking the violated rule (when applicable).
4. **Major Findings** — same structure as Critical, prefixed `[MAJOR]`.
5. **Minor Findings & Nits** — concise bullets, prefixed `[MINOR]` or `[NIT]`, with `file:line`. Fix snippet optional.
6. **Pre-existing Observations** — bullets for issues outside the diff scope per [scoping.md](./scoping.md). Do not assign severity here.
7. **Recommended Actions** — ordered checklist the author MUST complete before re-requesting review (e.g., "Run `npm run lint` after applying fix #1", "Re-run `npm run test:e2e` and confirm `posts/[slug]` snapshots are unchanged").

## What Counts as Evidence

- A failing or missing-but-required check (e.g., `npm run lint` would error on the changed file) is evidence — the reviewer SHOULD state explicitly that the check was reasoned about and the expected outcome.
- A guideline rule citation is evidence. A vague appeal to "best practices" is not — replace it with a specific rule or remove the finding.
- A reproduced failure path (e.g., "if `searchParams.draft` is `'true'` then line 22 returns `true` and …") is evidence. A "smells wrong" hunch is not.

## When the Reviewer Cannot Verify

- MUST mark findings as "needs verification" and lower severity by one step when the reviewer cannot confirm the issue without running code (e.g., a perf claim without measurement).
- SHOULD suggest the specific command or test the author should run to confirm or refute the finding.
