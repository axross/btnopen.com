# E2E Scenario Catalog

This table is the **denominator** for the project's E2E scenario-coverage metric:
*which real user journeys the Playwright suite exercises* — **not** lines of
application code executed. It is authored by hand and reviewed in PRs.

Each e2e test declares the journey(s) it covers with plain-string Playwright
tags: `@scenario:<id>` (the join key to the `ID` column below), plus the matching
`@area:<area>` and `@priority:<priority>` facet tags, plus an optional `@smoke`
selection facet. A journey counts as **covered** when at least one *passing* test
carries its `@scenario:<id>` tag. The reporter
(`e2e/reporters/scenario-coverage.ts`) parses this table, so:

- Keep the `ID` stable — it is the contract between this catalog and the tests.
  Renaming one means updating every `@scenario:` tag that references it in the
  same commit.
- `Priority` MUST be one of `must` / `should` / `may`. `must` is hard-gated at
  100% by `npm run coverage:scenarios`; `should` / `may` are report-only.
- **Include genuinely-untested journeys** (there is intentionally no "covered"
  column) so the report surfaces real gaps rather than a hollow 100%. This
  initial catalog documents the journeys the current suite already asserts, so
  it starts fully covered; when a new user-facing journey ships, add its row
  here with an honest priority in the same change — even before its test
  exists — so the report shows the gap instead of hiding it.

| ID | Title | Area | Priority |
| --- | --- | --- | --- |
| index.intro | The index page shows the author bio and social links | index | must |
| index.blog-post-list | The index page lists blog posts and navigates to a post | index | must |
| index.landmarks | The index page exposes the introduction and posts landmark regions | index | should |
| index.heading-structure | The index page has a single top-level heading and list semantics | index | should |
| posts.redirect | The /posts route redirects to the index route | posts | should |
| post.header | A blog post page shows its title, date, cover image, author, and tags | posts | must |
| post.content | A blog post page renders its Markdown content | posts | must |
| post.embed | A blog post page renders an embed block as a web-embed card linking to the embedded URL | posts | should |
| post.banner | A blog post page renders note and warning banner blocks as callouts with a type label and rich-text body | posts | should |
| post.content.directives | Text and container directives render verbatim instead of vanishing | posts | must |
| post.agentic | A blog post's agentic view renders its outline Markdown and authoring notes | posts | must |
| post.agentic.empty | The agentic view shows an empty state when the post has no authoring content | posts | should |
| post.agentic.draft-fallback | The draft agentic view falls back to the published authoring fields when the draft version has none | posts | should |
| post.avatar-fallback | The author avatar falls back to initials when the image fails to load | posts | may |
| post.table.narrow-fits | A narrow content table fits the reading column | posts | should |
| post.table.wide-scrolls | A wide content table overflows and scrolls horizontally | posts | should |
| post.table.keyboard-scroll | A wide content table is keyboard-scrollable | posts | should |
| post.table.scrollbar | Only an overflowing content table renders a scrollbar | posts | may |
| post.table.edge-fades | A wide content table's edge fades track the scroll position | posts | may |
| post.comments.section | A post shows the comments section with its approved comments and count | posts | should |
| post.comments.disabled | A post with comments disabled renders no comments section | posts | should |
| post.comments.author-reply | An author reply renders nested one level under a comment with an Author badge | posts | should |
| post.comments.sign-in | A signed-out reader sees the Sign in with GitHub affordance (needs Clerk test tokens) | posts | may |
| post.comments.submit | A signed-in reader submits a comment that stays pending until approved (needs Clerk test tokens) | posts | may |
| not-found.status | An unknown route responds with a 404 status | not-found | must |
| post.not-found | An unknown post slug shows the not-found page | not-found | must |
| post.agentic.not-found | An unknown slug on the agentic view shows the not-found page | not-found | should |
| not-found.ui | The global not-found page shows its header and home link | not-found | should |
| not-found.home-link | The global not-found page's home link returns to the index route | not-found | should |
| post.not-found.home-link | The post not-found page's home link returns to the index route | not-found | should |
| not-found.reduced-motion | Reduced motion disables the not-found status-code glitch animation | not-found | may |
| localization.japanese | A Japanese browser gets Japanese chrome and locale metadata | localization | must |
| localization.english | An English browser gets the English chrome and locale metadata fallback | localization | should |
| localization.switcher-persists | An explicit locale choice persists across reloads via cookie | localization | should |
| mcp.auth-required | The MCP endpoint rejects requests without an API key | mcp | must |
| mcp.body-mutation | MCP exposes only its scoped tools and mutates blog post body nodes | mcp | should |
| metadata.foundational | The index page emits the foundational document metadata | metadata | should |
| index.json-ld | The index page emits Blog JSON-LD structured data | metadata | should |
| index.open-graph | The index page emits Open Graph metadata | metadata | should |
| post.json-ld | A blog post page emits BlogPosting JSON-LD structured data | metadata | should |
| post.open-graph | A blog post page emits Open Graph metadata | metadata | should |
| post.agentic.noindex | The agentic view opts out of search indexing | metadata | should |
| index.thumbnail | The index Open Graph thumbnail image endpoint renders | metadata | should |
| post.thumbnail | A blog post's Open Graph thumbnail image endpoint renders | metadata | should |
