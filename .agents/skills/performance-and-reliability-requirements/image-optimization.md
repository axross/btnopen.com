# Image Optimization

Apply these rules to verify images are sized, formatted, and rendered through `next/image` efficiently.

## `next/image` Usage

- MUST flag a Critical when a new component renders a raw `<img>` tag for any image that comes from Payload, the public folder, or a known external host. Use `next/image` so Next.js serves the right size for the device.
- MUST flag a Major when `<Image>` is rendered without both `width` and `height` (or `fill` for absolute-positioned cases) — without dimensions, Next falls back to `unoptimized` and ships a layout-shift-prone image.
- The existing `app/(app)/_/components/media.tsx` reads `file.width` / `file.height` from Payload and falls back to `unoptimized: true` when missing. Match this pattern for new image components.

## `unoptimized` Discipline

- MUST flag a Critical when `<Image src={userControlled} unoptimized />` is added with a `userControlled` URL whose host is not in `next.config.ts` `images.remotePatterns`. Cross-reference with [application-security-requirements › ssrf-and-embeds](../application-security-requirements/ssrf-and-embeds.md).
- MUST flag a Major when `unoptimized` is used for an image whose dimensions are known (the field is on the Payload doc, or is a static asset). Optimization saves bandwidth — `unoptimized` should be a fallback, not a default.

## Loading and Priority

- MUST flag a Major when a new above-the-fold image (e.g., a blog post cover) is rendered without `priority` or with `loading="lazy"`. The cover image at `posts/[slug]/page.tsx` should be prioritized.
- MUST flag a Major when a new below-the-fold image is rendered without `loading="lazy"`. The existing `<Media>` component sets `loading="lazy"` — match this for body content.

## Payload Upload Configuration

- MUST flag a Major when a new Payload upload collection is added without `formatOptions: webpFormatOptions` (or a documented reason). The existing `media`, `cover-images`, `avatar-images` collections use the shared `webpFormatOptions` helper.
- MUST flag a Major when a new upload collection lacks `resizeOptions` with a sensible upper bound (`fit: "cover"`, `withoutEnlargement: true`, explicit `width` and `height`) — unbounded uploads consume Vercel Blob storage and bandwidth.
- SHOULD flag a Minor when a new `imageSizes` variant is added (like the `og` size on `cover-images`) without a stated consumer — variants generate on every upload and cost storage.

## `images.remotePatterns`

- MUST flag a Critical when a new entry to `next.config.ts` `images.remotePatterns` uses a wildcard hostname (`**`) or omits a path scope (`/...`). The existing entries are tightly scoped: `http://localhost:3000/api/**`, `https://cdn.hashnode.com/res/hashnode/**`.
- MUST flag a Major when the pattern's protocol is `http://` for a non-localhost host. Production images should be HTTPS only.

## Sharp Configuration

- The project's `payload/config.ts` passes `sharp` to Payload for image processing. The reviewer MUST flag a Critical when the diff removes `sharp` from `payload/config.ts` — image upload will fall back to copying files unprocessed, breaking the WebP and resize pipeline.
- MUST flag a Major when a new upload collection's `formatOptions.options` set `quality` above 90 for general media — diminishing returns past that point. The current `og` variant uses `quality: 90`.
