# Images, Fonts, and Assets

Apply this reference when rendering an image, configuring remote image sources, loading a font, or serving a static asset.

## The Image Component

`next/image` handles format negotiation, responsive `srcset` generation, lazy loading, and reserved space. A bare `<img>` gives up all of it and reintroduces layout shift.

```tsx
import Image from "next/image";

<Image
  src={article.coverUrl}
  alt={article.coverAlt}
  width={1200}
  height={630}
  sizes="(max-width: 768px) 100vw, 768px"
  priority={isAboveTheFold}
/>;
```

**Guidelines:**

- MUST use `next/image` for content images; reserve a raw `<img>` for cases the component cannot serve, and state the reason.
- MUST supply `width` and `height`, or `fill` with a positioned parent; without dimensions the component cannot reserve space and the page shifts.
- MUST supply a `sizes` value whenever `fill` is used or the rendered width varies with the viewport; without it the browser assumes full viewport width and downloads an oversized file.
- SHOULD set `priority` on the largest above-the-fold image and on nothing else; marking several defeats the purpose.
- SHOULD provide a `blurDataURL` placeholder for large hero images to avoid an empty box during load.
- MUST write a real `alt` describing the image's content, or `alt=""` when it is decorative — never a filename.
- MUST NOT import `next/legacy/image`; it is deprecated.

## Remote and Local Patterns

`remotePatterns` is an allowlist for the optimizer. A wildcard host turns the application into an open image proxy: anyone can pass any URL and have the server fetch and re-serve it, at the project's expense and under its domain.

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "cdn.example.com", pathname: "/images/**" },
  ],
}
```

**Guidelines:**

- MUST scope `remotePatterns` to specific hostnames, and narrow `pathname` where the host serves more than the application needs.
- MUST NOT use a wildcard hostname; it is an open proxy and an SSRF surface.
- MUST NOT use `images.domains`; it is deprecated in favour of `remotePatterns`.
- MUST enumerate `localPatterns` exhaustively when local images are served with query strings, since v16 requires a matching `search` entry.
- SHOULD leave `dangerouslyAllowLocalIP` off; enable it only on a private network, and record why.

## What Changed in v16

Each of these is a silent behaviour change on upgrade:

| Setting             | Was           | Now                         | What breaks                                        |
| ------------------- | ------------- | --------------------------- | -------------------------------------------------- |
| `minimumCacheTTL`   | 60 seconds    | 4 hours (14400s)            | Images refresh far less often                      |
| `imageSizes`        | included `16` | `16` removed                | 16px sources no longer generated                   |
| `qualities`         | all allowed   | `[75]` only                 | Any other `quality` prop is coerced to the nearest |
| `maximumRedirects`  | unlimited     | `3`                         | Deeply-redirecting sources fail                    |
| Local IP sources    | allowed       | blocked                     | Local-network images stop optimizing               |
| Local query strings | allowed       | need `localPatterns.search` | `/img?v=1` fails without config                    |

**Guidelines:**

- MUST re-check each of these against the application's actual image sources when arriving on v16, rather than assuming the defaults still match.
- MUST add every quality value the codebase passes to `images.qualities`, or accept the coercion knowingly.
- SHOULD lower `minimumCacheTTL` deliberately when images genuinely change more often than every four hours.

## Unoptimized Images

`unoptimized` is a per-image escape hatch for sources the optimizer cannot usefully process. It is legitimate for one image and a mistake as a global setting, where it usually means a `remotePatterns` entry was missing and the symptom got silenced instead of the cause.

**Guidelines:**

- SHOULD set `unoptimized` on an individual image when optimization cannot work — an SVG, an already-optimized asset, or a source the optimizer must not fetch.
- MUST NOT disable optimization globally to work around a `remotePatterns` failure; fix the pattern.
- MUST treat an SVG from an untrusted source as an XSS vector; serve it as a downloadable asset or sanitize it rather than inlining it.

## Fonts

`next/font` self-hosts the font at build time, generates a fallback metric-matched to it, and removes the render-blocking request a stylesheet link creates. A manual `<link>` to a font CDN gives up all three and adds a third-party connection.

```ts
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});
```

**Guidelines:**

- MUST load fonts through `next/font/google` or `next/font/local`; never a manual `<link>` to a font CDN.
- MUST list only the weights and styles the design actually uses; each unused weight is a downloaded file.
- SHOULD specify `subsets` explicitly to avoid shipping glyph ranges the application never renders.
- SHOULD set `display: 'swap'` so text renders in the fallback rather than staying invisible.
- MUST declare the font at module scope, not inside a component; it is evaluated at build time.
- SHOULD use `next/font/local` for a licensed or custom face, with `variable` set when the styles reference it through a CSS custom property.

## Static Assets

`public/` is served by path with no route in front of it — no auth, no redirect, no header logic. Anything placed there is world-readable by anyone who can guess or find the filename, and an obscure name is not access control.

**Guidelines:**

- SHOULD serve genuinely static files from `public/`, referenced by root-relative path.
- MUST NOT put anything secret in `public/`; every file there is publicly fetchable by path, with no route in front of it.
- SHOULD import an asset that participates in the build — an image with generated dimensions, an SVG rendered as a component — rather than referencing it from `public/`.
- SHOULD set `assetPrefix` when static assets are served from a CDN domain, and confirm the CDN forwards the headers the framework sets.

**Review checks:**

- A wildcard hostname in `remotePatterns` — **Critical**; the optimizer becomes an open proxy and an SSRF surface.
- `unoptimized` set globally, or `dangerouslyAllowLocalIP` enabled, with no stated reason — **Major**.
- An `<img>` where `next/image` would serve — **Major**; it reintroduces layout shift and unoptimized transfer.
- `next/image` with `fill` and no `sizes` — **Major**; the browser downloads a full-viewport-width source.
- An image with no `width`/`height` and no `fill` — **Major**; layout shifts on load.
- A font loaded via `<link>` to a CDN instead of `next/font` — **Major**.
- A font declared with every weight when the design uses two — **Minor**.
- `priority` set on several images — **Minor**; it stops prioritizing anything.
- A secret or internal document placed under `public/` — **Critical**.
