# SSRF and Embed Fetching

Apply these rules to verify server-side outbound `fetch` calls cannot be steered at internal-network or unintended targets by CMS-authored content.

## The `getWebEmbedMetadata` Risk Surface

The function `app/(app)/_/repositories/get-webembed-metadata.ts` performs an unauthenticated `fetch(url)` where `url` originates from a CMS-authored markdown link. This is the principal SSRF surface in the project.

- MUST flag a Critical when the diff removes the `URL.canParse(href)` validation in `remarkEmbeds` (in `app/(app)/_/helpers/markdown.ts`) without replacing it with a stricter check. That parse is the only filter currently keeping malformed URLs out.
- MUST flag a Major when the diff adds a new caller of `getWebEmbedMetadata` (or a new `fetch` from CMS-authored input) without adding a hostname allowlist or block-list for internal ranges (e.g., `127.0.0.0/8`, `169.254.169.254` — the AWS/GCP/Vercel metadata endpoint, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `localhost`, `*.internal`).
- MUST flag a Major when a new `fetch` call from server-side code passes through the redirect chain (the default `redirect: "follow"`) without checking the final `response.url` host against an allowlist. `getWebEmbedMetadata` already uses `response.url` for `metadata.url` — the redirect-target host is not currently checked.
- SHOULD flag a Minor recommendation that any new outbound fetch passes a tight `signal: AbortSignal.timeout(<ms>)` so a hung internal endpoint does not stall the request.

## Image Optimization and Remote Hosts

- MUST flag a Major when a new entry is added to `next.config.ts` `images.remotePatterns` whose hostname is a wildcard (`**`) or covers more than one origin. The existing entries are tightly scoped (`http://localhost:3000/api/**`, `https://cdn.hashnode.com/res/hashnode/**`).
- MUST flag a Critical when a new component renders `<Image src={…} unoptimized />` for a CMS-author-controlled URL whose host is not validated. `unoptimized` skips Next's remote-pattern check.
- The existing `<WebEmbedLoaded>` uses `unoptimized` for `embedMetadata.imageUrl` (which `metascraper` extracts from a fetched OG tag) — flag a Critical only if the diff worsens this (e.g., promotes the image to `priority` so it preloads, or removes the JSX `<Image>` in favor of raw `<img>`).

## OG Image / Sitemap / Robots

- MUST flag a Critical when an OG image route (`thumbnail.png` or a future `route.tsx`) accepts a `src` query parameter that flows into `fetch(src)` without an allowlist. This is the canonical Next.js OG-image SSRF pattern.
- MUST flag a Major when `sitemap.ts` or `robots.ts` performs an unbounded `fetch` to a CMS-controlled URL — those should fetch only Payload data through the repository layer.

## CSRF on Mutation Endpoints

- MUST flag a Major when a new `route.ts` mutation (`POST`, `PUT`, `PATCH`, `DELETE`) does not check the `Origin` or `Sec-Fetch-Site` header for cross-site requests. Even idempotent endpoints like `posts/caches/DELETE` can be abused (in this case to flush caches).
- SHOULD recommend a shared-secret header for new mutation endpoints invoked only by Payload hooks (the existing `/posts/caches` revalidation is invoked from a Payload `afterOperation` hook).

## Out-of-Scope

- The Payload admin UI's own routes under `app/(payload)/` are out of scope for this lens — Payload owns its CSRF and request-validation. The reviewer MUST NOT flag findings inside that directory per [code-review-guideline › scoping](../code-review-guideline/scoping.md).
