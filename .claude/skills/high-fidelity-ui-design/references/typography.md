# High-Fidelity UI & Visual Design — Typography

A semantic type scale and readable body text.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the `**Guidelines:**` bullets are the normative rules for this topic.

## Build a semantic type scale, not ad-hoc sizes

The failure this prevents is ad-hoc sizing: a designer wants one line to stand out and types font-size: 19px inline, or an engineer bumps body text to 18px on a single screen to "make it breathe." These orphan values never match a token, never theme, and quietly multiply until the app has forty near-duplicate sizes and no legible hierarchy. Assign by content importance, not by how a particular screen happens to feel in isolation — if the text is a section heading, it gets the title role everywhere, and if the title looks wrong, you fix the token, not the instance.

What makes that possible is a small closed set of named roles, each a token bundling size, weight, line height, and letter spacing at once; both major platforms ship a scale worth copying rather than inventing ([Material 3 type-scale tokens](https://m3.material.io/styles/typography/type-scale-tokens), [Apple Dynamic Type](https://developer.apple.com/design/human-interface-guidelines/typography)). The bundling is the part that pays: because the four properties travel as a unit, changing the brand font or nudging the scale updates every screen consistently, and light/dark or platform variants stay in lockstep.

Derive the size steps from a single modular ratio instead of hand-picking numbers ([A Responsive Guide to Type Sizing](https://cloudfour.com/thinks/responsive-guide-to-type-sizing/)). Anchor body text at 16px and multiply up by one ratio — 1.25 (major third) stays safe when a product spans dense UI and editorial content, 1.333 (perfect fourth) buys more dramatic heading contrast. Hold that one ratio across the whole system; mixing 1.2 in one place and 1.5 in another is what makes a UI read as incoherent. Keep the ladder to 6-8 sizes, because more steps stop being distinguishable and each one dilutes the hierarchy, and express emphasis through weight paired with size rather than reaching for color or all-caps as the primary signal.

**Good Example:**

> A settings screen uses `title` (22px / semibold) for the screen heading, `body` (16px / regular) for each row label, and `label` (13px / medium / +0.5 tracking) for the helper text under a toggle — three named roles pulled from the shared scale, so switching the app font or dark theme restyles all of them at once.

**Bad Example:**

> To make a card stand out, a developer writes `fontSize: 19` inline on its heading and `fontSize: 15` on its body — values that exist nowhere else in the system, match no token, don't scale with Dynamic Type, and leave the app with a dozen near-identical one-off sizes that read as visual noise instead of hierarchy.

**Guidelines:**

- MUST assign every string to a named role from the shared type scale (such as title, body, or label) and MUST NOT introduce raw font-size values that match no token.
- MUST derive the scale's size steps from one modular ratio anchored at a 16px body, and MUST NOT mix ratios across the system.
- SHOULD cap the scale at 6-8 named sizes and express emphasis by pairing weight with size rather than leaning on color or all-caps as the primary hierarchy signal.
- MUST assign roles by content importance consistently across screens and fix the token rather than overriding a single instance when a role looks wrong.

Sources: [Typographic Hierarchies — Smashing Magazine](https://www.smashingmagazine.com/2022/10/typographic-hierarchies/)

## Tune body text for readability: size, measure, and leading

Size, measure, and leading interact, so tuning them in isolation is what produces the most common failure: a wide measure with tight leading, where the reader finishes a long line and can't reliably find the next one. Constrain the text container — a max-width around 60-70ch, or a fixed column that yields ~66 characters at your body size — instead of letting paragraphs run the full viewport width. Longer measures then want more leading; short columns and large display sizes want proportionally less.

The three floors themselves are lookups: roughly 15-25px of rendered body text ([Butterick](https://practicaltypography.com/summary-of-key-rules.html)), never below the 11pt mobile minimum for legibility at arm's length ([Apple](https://developer.apple.com/design/tips/)); about 50-75 characters per line including spaces ([Baymard](https://baymard.com/blog/line-length-readability)); and 120-145% leading, defaulting to about 1.5 ([Butterick on line spacing](https://practicaltypography.com/line-spacing.html)), which conveniently also clears the author-testable floor in [SC 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html). Around the geometry sit the legibility fundamentals ([NN/g](https://www.nngroup.com/articles/legibility-readability-comprehension/)): a clean typeface — serif is fine at high resolution, but avoid handwriting or decorative faces for body — on a plain, un-textured ground, with glyph contrast at [4.5:1 or better](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

The part a mockup usually skips is surviving a user override. SC 1.4.12 requires that when a reader forces those spacing values up, no content is clipped, overlapped, or lost — which means containers that grow with their text, and paragraphs that reflow rather than truncate. Fixed-height buttons, chips, and cards sized to exactly one line, single-line clamps on dynamic copy, and absolutely-positioned text over images are the usual sources of clipped or overlapping text once real content or accessibility settings enter the picture.

**Good Example:**

> A settings screen renders body text at 17px with line-height 1.5 (≈25px) inside a content column capped at 640px, so paragraphs land at ~65 characters per line on dark, high-contrast plain backgrounds — and still reflows cleanly when the OS text-spacing override is applied.

**Bad Example:**

> An onboarding paragraph is set at 13px with 1.2 line-height and allowed to span the full 900px viewport, producing ~110-character lines the eye keeps losing — and its description sits in a fixed-height card that clips the last line once real copy or larger accessibility spacing kicks in.

**Guidelines:**

- MUST size body text at roughly 15-25px of rendered height and never below the platform floor (11pt on mobile, with 17pt the iOS body default).
- MUST constrain the body text container to yield about 50-75 characters per line, capping its measure (for example a max-width near 60-70ch) rather than letting paragraphs span the full viewport.
- MUST set body line-height to at least 1.5× the font size and keep glyph-to-background contrast at 4.5:1 or higher on a plain, un-textured ground.
- MUST let text containers grow with their content — avoid fixed-height cards, chips, and buttons and single-line clamps on dynamic copy — so no content clips or overlaps when WCAG 1.4.12 spacing overrides are applied.
