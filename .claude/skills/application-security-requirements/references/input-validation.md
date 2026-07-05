# Input Validation

Apply these rules to verify every untrusted input is validated and coerced before reaching Payload, an outbound `fetch`, or the markdown pipeline. Treat the static types at a request boundary as unverified: in Next.js 15+, `params` and `searchParams` are async (`Promise<…>`) and runtime-untyped despite the TypeScript signature.

## Route Inputs (`params`, `searchParams`)

Route and query params are the cheapest input an attacker controls — anyone crafts them in a URL — and the declared types at the boundary promise shapes the runtime never enforces.

**Guidelines:**

- MUST flag a Critical when a `params` / `searchParams` value reaches a Payload `where` clause, a `fetch` URL, or a redirect target without an explicit type assertion or Zod parse. The TypeScript type at the boundary lies — at runtime a `searchParams.draft` can be `string | string[] | undefined`.
- MUST flag a Major when a `searchParams` boolean is coerced via a truthy check (`if (searchParams.draft)`) instead of value comparison (`searchParams.draft === "true"`). The repository pattern in `app/(app)/_/repositories/get-blog-post.ts` uses `=== "true"` — diverging risks treating `?draft=false` as truthy.
- MUST flag a Critical when a dynamic segment (e.g., `[slug]`) is passed into `payload.find({ where: { slug: { equals: slug } } })` without ensuring it is a string. An array slug can bypass the equals filter.

## Server Actions and Route Handlers

Request bodies and form data arrive from arbitrary clients, so the handler's parameter types describe intent, not what actually shows up at runtime.

**Guidelines:**

- MUST flag a Critical when a new `route.ts` handler reads `request.json()`, `request.formData()`, or `request.url` without a Zod schema (or equivalent runtime check) validating the parsed shape before use.
- MUST flag a Critical when a new server action (`"use server"` async function exported from a component file) accepts arguments without runtime validation, regardless of TypeScript types.
- MUST flag a Major when a route handler or server action returns Payload documents directly without first parsing them through the appropriate `app/(app)/_/repositories/payload-types.ts` Zod schema. Direct return leaks fields the consumer did not request and may include draft-only fields.

## Repository Layer

Stored records drift from the code's expectations — schema migrations, older writes, and hand-edited rows all produce shapes the static types no longer describe.

**Guidelines:**

- MUST flag a Critical when a new repository function does not run `Payload<…>.parse(…)` or `safeParse(…)` on the result before returning. The pattern in this project is to define a Zod transform (e.g., `BlogPostDetail`, `BlogPostSummary`) and parse before return.
- MUST flag a Major when a `safeParse` failure is **silently** dropped in production code (no `logger.warn`). The current pattern in `getBlogPosts` is to `logger.warn({ slug, error: z.flattenError(parseResult.error) }, "Skipped a blog post due to parse error.")` — match it.
- MUST flag a Critical when a repository's `where` clause is built by string concatenation, template literal, or anything other than the typed Payload object syntax. Payload's filter object IS the safe interface; building it dynamically with untrusted keys is the SQL-injection-equivalent path.

## Markdown Pipeline Inputs

The markdown pipeline's safety argument rests entirely on where its input comes from, so a new feed path invalidates that argument even when the pipeline code is untouched.

**Guidelines:**

- MUST flag a Critical when a new code path passes user-supplied markdown into the renderer without going through `getBlogPostMarkdown` (which loads from Payload, never the filesystem or arbitrary HTTP). The pipeline assumes its input came from Payload's Lexical editor.
- MUST flag a Major when a new custom MDAST directive (under `remarkEmbeds` or a new sibling plugin) reads attribute values without validating them — see `remarkEmbeds` in `app/(app)/_/helpers/markdown.ts`, which validates `URL.canParse(href)` before constructing the directive.

## File Uploads

An uploaded file is attacker-controlled bytes the server stores and later serves back, so type and filename restrictions are what separate an image host from a malware host.

**Guidelines:**

- MUST flag a Critical when a Payload collection's `upload` config (e.g., a new `mediaCollection`-style config) lacks a `mimeTypes` filter when the collection accepts user-uploaded files. The current `cover-images` collection has `mimeTypes: ["image/*"]` — match the pattern.
- MUST flag a Major when a new collection's `beforeOperation` hook does not enforce filename sanitization. The existing `media.ts` and `cover-image.ts` hooks rewrite `req.file.name` to `${uuid}.${ext}` — match the pattern.
