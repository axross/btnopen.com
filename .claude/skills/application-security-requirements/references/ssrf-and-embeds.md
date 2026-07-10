# SSRF and Embed Fetching

Apply these rules to verify server-side outbound `fetch` calls cannot be steered at internal-network or unintended targets by CMS-authored content.

## The `getWebEmbedMetadata` Risk Surface

The function `app/(app)/_/repositories/get-webembed-metadata.ts` performs an unauthenticated `fetch(url)` where `url` originates from a CMS-authored markdown link. This is the principal SSRF surface in the project.

**Guidelines:**

- MUST flag a Critical when the diff removes the `URL.canParse(href)` validation in `remarkEmbeds` (in `app/(app)/_/helpers/markdown.ts`) without replacing it with a stricter check. That parse is the only filter currently keeping malformed URLs out.
- MUST flag a Major when the diff adds a new caller of `getWebEmbedMetadata` (or a new `fetch` from CMS-authored input) without adding a hostname allowlist or a block-list for internal ranges (e.g., `127.0.0.0/8`, `169.254.169.254` — the AWS/GCP/Vercel metadata endpoint, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `localhost`, `*.internal`).
- MUST flag a Major when a new server-side `fetch` follows redirects (the default `redirect: "follow"`) without checking the final `response.url` host against an allowlist. A redirect can land on an internal host even when the initial URL passes the allowlist — `getWebEmbedMetadata` already uses `response.url` for `metadata.url`, but the redirect-target host is not currently checked.
- SHOULD flag a Minor recommendation that any new outbound fetch passes a tight timeout (e.g., `signal: AbortSignal.timeout(<ms>)`) so a hung internal endpoint does not stall the request.

## Image Optimization and Remote Hosts

The `images.remotePatterns` allowlist defines which external origins the server will fetch on a visitor's behalf, so a wildcard entry delegates that fetch capability to every host it matches.

- The existing `<WebEmbedLoaded>` uses `unoptimized` for `embedMetadata.imageUrl` (which `metascraper` extracts from a fetched OG tag) — flag a Critical only if the diff worsens this (e.g., promotes the image to `priority` so it preloads, or removes the JSX `<Image>` in favor of raw `<img>`).

**Guidelines:**

- MUST flag a Major when a new entry is added to `next.config.ts` `images.remotePatterns` whose hostname is a wildcard (`**`) or covers more than one origin. The existing entries are tightly scoped (`http://localhost:3000/api/**`, `https://cdn.hashnode.com/res/hashnode/**`).
- MUST flag a Critical when a new component renders `<Image src={…} unoptimized />` for a CMS-author-controlled URL whose host is not validated. `unoptimized` skips Next's remote-pattern check.

## OG Image / Sitemap / Robots

Metadata routes run server-side with no user session in front of them, which makes a fetched URL parameter an unauthenticated proxy into the server's network position.

**Guidelines:**

- MUST flag a Critical when an OG image route (`thumbnail.png` or a future `route.tsx`) accepts a `src` query parameter that flows into `fetch(src)` without an allowlist. This is the canonical Next.js OG-image SSRF pattern.
- MUST flag a Major when `sitemap.ts` or `robots.ts` performs an unbounded `fetch` to a CMS-controlled URL — those should fetch only Payload data through the repository layer.

## CSRF on Mutation Endpoints

Browsers attach the victim's cookies to cross-site requests automatically, so an unprotected mutation endpoint can be driven by any page the victim merely visits.

**Guidelines:**

- MUST flag a Major when a new `route.ts` mutation (`POST`, `PUT`, `PATCH`, `DELETE`) does not check the `Origin` or `Sec-Fetch-Site` header for cross-site requests. Even idempotent endpoints like `posts/caches/DELETE` can be abused (in this case to flush caches).
- SHOULD recommend a shared-secret header for new mutation endpoints invoked only by Payload hooks (the existing `/posts/caches` revalidation is invoked from a Payload `afterOperation` hook).

## Out-of-Scope

The Payload admin UI's own routes under `app/(payload)/` own their CSRF and request validation and are out of scope for this lens.

**Guidelines:**

- MUST NOT flag findings inside `app/(payload)/` per the project's code-review guideline (scoping rules); Payload owns its CSRF and request-validation.
