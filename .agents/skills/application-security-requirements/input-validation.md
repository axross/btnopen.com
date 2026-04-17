# Input Validation

Apply these rules to verify every untrusted input is validated and coerced before reaching Payload, `fetch`, or the markdown pipeline. In Next.js 15+, `params` and `searchParams` are async (`Promise<…>`) and runtime-untyped despite the TypeScript signature.

## Route Inputs (`params`, `searchParams`)

- MUST flag a Critical when a `params` / `searchParams` value reaches a Payload `where` clause, a `fetch` URL, or a redirect target without an explicit type assertion or Zod parse. The TypeScript type at the boundary lies — at runtime a `searchParams.draft` could be `string | string[] | undefined`.
- MUST flag a Major when a `searchParams` boolean is coerced via truthy check (`if (searchParams.draft)`) instead of value comparison (`searchParams.draft === "true"`). The repository pattern in `app/(app)/_/repositories/get-blog-post.ts` uses `=== "true"` — diverging risks treating `?draft=false` as truthy.
- MUST flag a Critical when a dynamic segment (e.g., `[slug]`) is passed into `payload.find({ where: { slug: { equals: slug } } })` without ensuring it is a string. An array slug bypasses the equals filter.

## Server Actions and Route Handlers

- MUST flag a Critical when a new `route.ts` handler reads `request.json()`, `request.formData()`, or `request.url` without a Zod schema (or equivalent) validating the parsed shape before use.
- MUST flag a Critical when a new server action (`"use server"` async function exported from a component file) accepts arguments without runtime validation, regardless of TypeScript types.
- MUST flag a Major when a route handler or server action returns Payload documents directly without first parsing them through the appropriate `app/(app)/_/repositories/payload-types.ts` Zod schema. Direct return leaks fields the consumer did not request and may include draft-only fields.

## Repository Layer

- MUST flag a Critical when a new repository function does not run `Payload<…>.parse(…)` or `safeParse(…)` on the result before returning. The pattern in this project is to define a Zod transform (e.g., `BlogPostDetail`, `BlogPostSummary`) and parse before return.
- MUST flag a Major when a `safeParse` failure is **silently** dropped in production code (no `logger.warn`). The current pattern in `getBlogPosts` is to `logger.warn({ slug, error: z.flattenError(parseResult.error) }, "Skipped a blog post due to parse error.")` — match it.
- MUST flag a Critical when a repository's `where` clause is built by string concatenation, template literal, or anything other than the typed Payload object syntax. Payload's filter object IS the safe interface; building it dynamically with untrusted keys is the SQL-injection-equivalent path.

## Markdown Pipeline Inputs

- MUST flag a Critical when a new code path passes user-supplied markdown into the renderer without going through `getBlogPostMarkdown` (which loads from Payload, never the filesystem or HTTP). The pipeline assumes its input came from Payload's Lexical editor.
- MUST flag a Major when a new custom MDAST directive (under `remarkEmbeds` or a new sibling plugin) reads attribute values without validating them — see `remarkEmbeds` in `app/(app)/_/helpers/markdown.ts`, which validates `URL.canParse(href)` before constructing the directive.

## File Uploads

- MUST flag a Critical when a Payload collection's `upload` config (e.g., a new `mediaCollection`-style config) lacks a `mimeTypes` filter when the collection accepts user-uploaded files. The current `cover-images` collection has `mimeTypes: ["image/*"]` — match the pattern.
- MUST flag a Major when a new collection's `beforeOperation` hook does not enforce filename sanitization. The existing `media.ts` and `cover-image.ts` hooks rewrite `req.file.name` to `${uuid}.${ext}` — match the pattern.
