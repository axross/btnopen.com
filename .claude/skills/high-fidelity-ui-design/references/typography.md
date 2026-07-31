# High-Fidelity UI & Visual Design — Typography

A semantic type scale and readable body text.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the `**Guidelines:**` bullets are the normative rules for this topic.

## Build a semantic type scale, not ad-hoc sizes

A semantic type scale replaces the question "how big should this text be?" with "what job does this text do?" You define a small closed set of named roles — Material 3 ships display, headline, title, body, and label (each in large/medium/small), while Apple's Dynamic Type offers Large Title, Title 1-3, Headline, Body, Callout, Subheadline, Footnote, and Caption 1-2 — and every string on the screen is assigned to a role rather than a raw pixel value. Each role is a token that bundles four properties at once: size, weight, line height, and letter spacing (Material 3's Body Large, for example, is 16sp / weight 400 / 24 line height / +0.5 tracking; its Title Large is 22sp with a tighter -0 tracking; Apple's Body is 17pt). Because the bundle travels as a unit, changing the brand font or nudging the scale updates every screen consistently, and light/dark or platform variants stay in lockstep.

Derive the size steps from a single modular ratio instead of hand-picking numbers. Anchor body text at 16px (the browser default and the readability floor for sustained reading; iOS uses 17pt) and multiply up by one ratio — 1.25 (major third, Material's balanced choice, safe when a product spans dense UI and editorial content) or 1.333 (perfect fourth, more dramatic heading contrast). Pick one ratio and hold it across the whole system; mixing 1.2 in one place and 1.5 in another is what makes a UI read as incoherent. Keep the ladder short: 6-8 sizes total is the working ceiling, because more steps stop being distinguishable and each one dilutes the hierarchy. Express emphasis through weight paired with size — a semibold title at 22px reads as more important than a regular body at 16px on two reinforcing axes — rather than reaching for color or all-caps as the primary signal.

The common failure mode is ad-hoc sizing: a designer wants one line to stand out and types font-size: 19px inline, or an engineer bumps body text to 18px on a single screen to "make it breathe." These orphan values never match a token, never theme, and quietly multiply until the app has forty near-duplicate sizes and no legible hierarchy. Assign by content importance, not by how a particular screen happens to feel in isolation — if the text is a section heading, it gets the title role everywhere, and if the title looks wrong, you fix the token, not the instance.

**Good Example:**

> A settings screen uses `title` (22px / semibold) for the screen heading, `body` (16px / regular) for each row label, and `label` (13px / medium / +0.5 tracking) for the helper text under a toggle — three named roles pulled from the shared scale, so switching the app font or dark theme restyles all of them at once.

**Bad Example:**

> To make a card stand out, a developer writes `fontSize: 19` inline on its heading and `fontSize: 15` on its body — values that exist nowhere else in the system, match no token, don't scale with Dynamic Type, and leave the app with a dozen near-identical one-off sizes that read as visual noise instead of hierarchy.

**Guidelines:**

- MUST assign every string to a named role from the shared type scale (such as title, body, or label) and MUST NOT introduce raw font-size values that match no token.
- MUST derive the scale's size steps from one modular ratio anchored at a 16px body, and MUST NOT mix ratios across the system.
- SHOULD cap the scale at 6-8 named sizes and express emphasis by pairing weight with size rather than leaning on color or all-caps as the primary hierarchy signal.
- MUST assign roles by content importance consistently across screens and fix the token rather than overriding a single instance when a role looks wrong.

Sources: [Typography — Type scale tokens — Material Design 3](https://m3.material.io/styles/typography/type-scale-tokens) · [Typography — Human Interface Guidelines — Apple](https://developer.apple.com/design/human-interface-guidelines/foundations/typography/) · [Typographic Hierarchies — Smashing Magazine](https://www.smashingmagazine.com/2022/10/typographic-hierarchies/) · [A Responsive Guide to Type Sizing — Cloud Four](https://cloudfour.com/thinks/responsive-guide-to-type-sizing/)

## Tune body text for readability: size, measure, and leading

Body copy is the text users actually read, so its metrics are the highest-leverage typography decision in a real-token mockup. Three variables govern comfort. Size: aim for roughly 15-25px of rendered body text on screen (Butterick's ~15-25px browser guidance), and never go below the platform floor on mobile — 11pt is Apple's minimum for legibility at arm's length, with 17pt the iOS body default. Measure (line length): keep lines to about 50-75 characters including spaces, the range Baymard and typographic convention converge on; below ~45 the eye jumps back too often and above ~75-80 it loses the start of the next line. Leading (line-height): set 120-145% of the font size for body text and default to about 1.5 — which conveniently also satisfies WCAG 1.4.12, whose author-testable floor is line-height ≥ 1.5×, paragraph spacing ≥ 2×, letter spacing ≥ 0.12×, and word spacing ≥ 0.16× the font size. Longer measures want more leading; short columns and large display sizes want proportionally less.

These three interact, so tune them together rather than in isolation. A wide measure with tight leading is the most common failure — the reader finishes a long line and can't reliably find the next one. Constrain the text container (a max-width around 60-70ch, or a fixed column that yields ~66 characters at your body size) instead of letting paragraphs run the full viewport width. On top of the geometry, honor NN/g's legibility fundamentals: a clean typeface (serif is fine at high resolution; avoid handwriting or decorative faces for body), high contrast between glyphs and background, and a plain, un-textured background — WCAG AA requires ≥ 4.5:1 contrast for normal-size text.

Because a mockup demonstrates real states, it must also survive user overrides. WCAG 1.4.12 requires that when a user forces the spacing values above, no content is clipped, overlapped, or lost. That means designing containers that grow with their text — avoid fixed-height buttons, chips, and cards sized to exactly one line, and let paragraphs reflow rather than truncate. Fixed heights, single-line clamps on dynamic copy, and absolutely-positioned text over images are the usual sources of clipped or overlapping text once real content or accessibility settings enter the picture.

**Good Example:**

> A settings screen renders body text at 17px with line-height 1.5 (≈25px) inside a content column capped at 640px, so paragraphs land at ~65 characters per line on dark, high-contrast plain backgrounds — and still reflows cleanly when the OS text-spacing override is applied.

**Bad Example:**

> An onboarding paragraph is set at 13px with 1.2 line-height and allowed to span the full 900px viewport, producing ~110-character lines the eye keeps losing — and its description sits in a fixed-height card that clips the last line once real copy or larger accessibility spacing kicks in.

**Guidelines:**

- MUST size body text at roughly 15-25px of rendered height and never below the platform floor (11pt on mobile, with 17pt the iOS body default).
- MUST constrain the body text container to yield about 50-75 characters per line, capping its measure (for example a max-width near 60-70ch) rather than letting paragraphs span the full viewport.
- MUST set body line-height to at least 1.5× the font size and keep glyph-to-background contrast at 4.5:1 or higher on a plain, un-textured ground.
- MUST let text containers grow with their content — avoid fixed-height cards, chips, and buttons and single-line clamps on dynamic copy — so no content clips or overlaps when WCAG 1.4.12 spacing overrides are applied.

Sources: [Summary of key rules — Butterick's Practical Typography](https://practicaltypography.com/summary-of-key-rules.html) · [Line spacing — Butterick's Practical Typography](https://practicaltypography.com/line-spacing.html) · [Readability: The Optimal Line Length — Baymard Institute](https://baymard.com/blog/line-length-readability) · [Legibility, Readability, and Comprehension: Making Users Read Your Words — Nielsen Norman Group](https://www.nngroup.com/articles/legibility-readability-comprehension/) · [Understanding Success Criterion 1.4.12: Text Spacing — W3C Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) · [UI Design Dos and Don'ts — Apple Developer (Human Interface Guidelines)](https://developer.apple.com/design/tips/) · [Understanding Success Criterion 1.4.3: Contrast (Minimum) — W3C Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
