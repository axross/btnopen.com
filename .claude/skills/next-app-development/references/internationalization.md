# Internationalization

Apply this reference when adding locale support, negotiating a language, loading translations, or reviewing a change to a multi-locale application.

The App Router has no built-in i18n routing — the Pages Router's `i18n` config does not apply here. Locale handling is composed from routing, request negotiation, and a dictionary loader, with the translation library chosen by the host project.

## Locale Segment or Single URL

Two shapes, with different consequences:

**A `[lang]` segment** (`/en/articles`, `/ja/articles`) gives each locale its own URL. Pages are independently cacheable and prerenderable, crawlers index each language, and users can share a language-specific link. It is the default for content that should be discoverable.

**Single-URL negotiation** serves one path and picks the language from the request. URLs stay clean, but every page becomes request-dependent — which means dynamic rendering, a cache keyed per locale, and no distinct URL for a crawler to index.

**Guidelines:**

- SHOULD default to a `[lang]` route segment for any application whose content should be indexed or shared per language.
- SHOULD reserve single-URL negotiation for applications behind authentication, where indexing and sharing do not apply.
- MUST redirect a bare path to a locale-prefixed one when using a locale segment, rather than serving a default locale at two URLs.
- MUST validate the incoming locale against a known list before using it; `params.lang` is caller-controlled and reaches a dictionary lookup.

## Negotiating from the Request

`Accept-Language` carries an ordered list with quality values (`ja,en-US;q=0.9,en;q=0.8`). Reading the first entry ignores the ordering the user configured.

Precedence should be: an explicit user choice (a cookie) first, then the negotiated header, then the default.

**Guidelines:**

- MUST parse `Accept-Language` with its quality values rather than taking the first token.
- MUST match against the application's supported locales and fall back to a default, never echoing the requested tag.
- SHOULD let an explicit cookie override negotiation, and set it when the user changes language.
- SHOULD negotiate in the proxy and redirect to the locale-prefixed URL, keeping the negotiation out of every route.
- MUST NOT negotiate inside a cached scope; the header is request data. Resolve the locale outside and pass it in.

## Dictionaries on the Server

A dictionary loaded in a Client Component ships every string of every locale it can reach. Loading on the server ships only the rendered output.

```ts
// src/i18n/dictionaries.ts
import "server-only";

const dictionaries = {
  en: () => import("./messages/en.json").then((m) => m.default),
  ja: () => import("./messages/ja.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  return (dictionaries[locale] ?? dictionaries.en)();
}
```

**Guidelines:**

- MUST load dictionaries on the server and pass resolved strings down as props.
- SHOULD import each locale dynamically so only the requested one is loaded.
- MUST NOT ship every locale's messages to the client to support a client-side language switch; switch by navigating to the other locale's URL.
- SHOULD pass a narrow slice of the dictionary to a Client Component that needs strings, not the whole object.
- MUST use the host project's translation library where one is established, rather than introducing a second mechanism.

## Locale in the Document and Metadata

Translating the visible strings is the part that gets noticed. The document-level declarations are the part that gets forgotten, and they are what screen readers, hyphenation, font selection, and crawlers actually read to decide what language a page is in.

**Guidelines:**

- MUST set `<html lang>` to the active locale in the root layout; it drives screen-reader pronunciation, hyphenation, and font selection.
- SHOULD set `dir="rtl"` for right-to-left locales on the same element.
- SHOULD declare `openGraph.locale` and `alternateLocale`, and `alternates.languages` with a URL per locale, so crawlers connect the translations.
- MUST format dates, numbers, and currency with the active locale via `Intl`, rather than a hardcoded format.

## Pregeneration and Caching

Locale multiplies every cached entry, and the multiplication has to be in the key. A cached scope that renders translated output but does not take the locale as an argument produces one entry — and serves whichever language happened to populate it to everyone else.

**Guidelines:**

- SHOULD implement `generateStaticParams` over the supported locales so each locale's routes prerender.
- MUST include the locale in the cache key of any `"use cache"` scope whose output is locale-dependent — pass it as an argument, since it cannot be read from the request inside the scope.
- MUST NOT cache a locale-dependent render under a locale-independent key; one language's output is then served to another.
- SHOULD tag cached content per locale where invalidation is per-translation.

**Review checks:**

- A locale-dependent `"use cache"` scope whose key does not include the locale — **Critical**; one language's content is served to another.
- `params.lang` used to index a dictionary or build a path with no validation against the supported list — **Critical**.
- Dictionaries imported into a Client Component — **Major**; every locale's strings ship to the browser.
- `Accept-Language` read by taking the first token — **Minor**; it ignores the user's stated preference order.
- `<html lang>` left at a hardcoded value in a multi-locale application — **Major**; assistive technology reads the wrong language.
