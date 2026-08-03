# High-Fidelity UI & Visual Design — Design Tokens & Theming

Expressing every visual value through semantic tokens and supporting light/dark as a first-class appearance.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the `**Guidelines:**` bullets are the normative rules for this topic.

## Drive every visual value through layered semantic design tokens

A layered token system separates raw values from meaning so that visual decisions live in one place. The primitive/reference tier is the palette of raw facts — hex values, a numeric spacing/type scale, radii — named neutrally by scale position (blue-600, space-4) with no opinion about use. The semantic/system tier assigns those primitives to roles a UI actually needs (color-action-primary, color-surface, text-on-surface, border-danger), and the optional component tier binds roles to specific parts (button-primary-background) only when a component needs a stable override point. The discipline that makes this pay off is strict: components and mockups reference the semantic tier only, never a primitive and never a raw literal. Because a theme is just a different mapping of semantic roles onto primitives, a dark mode or a full rebrand becomes a remap of one layer rather than a hunt through every screen. This is exactly the structure Material 3, the W3C Design Tokens format, and systems like shadcn/ui and Carbon converge on.

Name by purpose, not appearance, and the names survive their own values. A token called color-danger can move from red to orange without becoming a lie; a token called color-red-alert cannot. The two failure modes at naming time are being too generic (color-primary-1 tells you nothing about when to use it) and too specific (button-submit-hover-blue bakes in appearance and context). Aim for a role that reads as an intent — surface, on-surface, action-primary, text-muted, border-focus — structured as category-role-variant-state so it scales predictably. Avoid the most common leak entirely: a component reaching past the semantic layer to a primitive (or a hardcoded #1A73E8) because no suitable role existed yet — that one shortcut is what quietly breaks the next theme swap, so the correct fix is to add the missing semantic token, not to inline the primitive.

Pair every surface token with a matching on-/foreground token that is engineered, not guessed, to clear contrast against it. WCAG 2.x SC 1.4.3 requires 4.5:1 for normal text and 3:1 for large text (about 18.66px bold or 24px regular), and SC 1.4.11 requires 3:1 for UI component boundaries and meaningful graphics. When color-surface and text-on-surface are defined and tested as a pair, any component placing on-surface over surface inherits a passing contrast ratio for free, in both light and dark themes; if you only define surfaces and let each component pick its own foreground, contrast becomes an accident that some pairs fail. Verify the ratios of the actual paired tokens in each theme — a pairing that passes in light mode routinely fails when the same roles are remapped for dark.

**Good Example:**

> A button reads background: color-action-primary and text: color-on-action-primary — two semantic roles defined and contrast-tested as a pair (7.1:1) — so switching to a dark theme or rebranding is a remap of those roles onto different primitives, with the button file untouched and contrast preserved.

**Bad Example:**

> A button hardcodes background: #1A73E8 and color: white (or reaches straight to blue-600) — appearance-named and unpaired, so a rebrand means find-and-replace across every component, and the white text silently drops below 4.5:1 the moment the brand blue is lightened.

**Guidelines:**

- MUST bind every visual value in a component or mockup to a semantic-tier token, and MUST NOT reference a primitive token or a raw literal (hex, rgb, numeric scale value) directly.
- MUST resolve a missing role by adding the needed semantic token rather than inlining the primitive or hardcoding the value it would have pointed to.
- MUST name each semantic token by purpose as category-role-variant-state (surface, on-surface, action-primary, text-muted, border-focus), and MUST NOT encode appearance (color-red-alert) or a single component context (button-submit-hover-blue) in the name.
- MUST pair each surface token with a foreground/on- token and verify the actual pair clears WCAG contrast (4.5:1 normal text, 3:1 large text and UI boundaries) in both the light and dark theme mappings.

Sources: [Design tokens – Overview — Material Design 3 (Google)](https://m3.material.io/foundations/design-tokens/overview) · [Color roles — Material Design 3 (Google)](https://m3.material.io/styles/color/roles) · [Best Practices For Naming Design Tokens, Components And Variables — Smashing Magazine](https://www.smashingmagazine.com/2024/05/naming-best-practices/) · [Design Tokens Format Module (2025.10) — W3C Design Tokens Community Group](https://www.designtokens.org/tr/drafts/format/) · [Theming — shadcn/ui](https://ui.shadcn.com/docs/theming) · [WCAG 2.2 — Success Criterion 1.4.3 Contrast (Minimum) — W3C](https://www.w3.org/TR/WCAG22/#contrast-minimum) · [Understanding SC 1.4.11 Non-text Contrast — W3C WAI](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) · [Color — Human Interface Guidelines — Apple](https://developer.apple.com/design/human-interface-guidelines/color)

## Treat dark mode as a first-class, tone-based appearance

Dark mode is not an inverted light theme — it is a second appearance with its own tonal logic, and it should be a user-selectable option that defaults to the OS `prefers-color-scheme` setting rather than being forced on. Nielsen Norman Group's research is the reason to offer it as a choice, not a default: light mode ("positive contrast polarity") measurably outperforms dark mode on visual-acuity and proofreading tasks for normally-sighted users, while people with cataracts or other cloudy ocular media read better in dark mode, so the correct answer is to let the user decide. Architecturally, the switch must be driven by swapping semantic-token values (surface, on-surface, border, accent) behind the same component code — if a component references `--surface` and `--text-primary` instead of literal colors, the theme change is a token remap with zero component edits. The common failure mode is a codebase where dark styles are bolted on with per-component overrides or `filter: invert()`, which desaturates images unpredictably and drifts out of sync the moment a component changes.

Get the tones right rather than reaching for pure black and pure white. Material Design bases dark surfaces on #121212, not #000000, because a fully black background maximizes the luminance gap against white text and triggers halation — the smearing/bloom where light text bleeds into dark ground, worst for readers with astigmatism. Mirror this at the text end: use an off-white (roughly 87% opacity white, or a light gray token) for body copy instead of #FFFFFF to soften that same contrast. Convey elevation by lightening the surface, not by dropping shadows, which mostly disappear on dark grounds. Material implements this as a semi-transparent white overlay whose opacity climbs with elevation — from 0% at the base up to about 16% at the highest level — so a card, then a menu, then a dialog each read as progressively lighter grays.

Rework the accents rather than reusing the light-theme brand values. Saturated, mid-value hues that read fine on white vibrate against a dark ground and often fail contrast; Material's guidance is to shift accents toward lighter, less-saturated tones (its 200–50 tonal range) so they carry the required contrast against the dark surface. Then re-verify contrast in the dark theme independently — passing in light mode proves nothing about dark, and elevation overlays change the effective background, so a token that clears WCAG AA (4.5:1 for body text, 3:1 for large text and UI-component/graphic boundaries) on the base surface must still clear it on every elevated surface. Material's own worked example targets a 15.8:1 body-text ratio and notes that its overlay reaches sufficient darkness for that around 11% opacity — a reminder to test text against the specific composited surface it sits on, not the base color alone.

**Good Example:**

> A card's background is `--surface` and its title is `--text-primary`; switching themes swaps those two tokens to #121212-family gray and 87%-white with no component change, elevated menus lift via a white overlay that grows with elevation, and the accent is a lighter, desaturated tint re-checked at 4.5:1 against each surface it appears on.

**Bad Example:**

> Dark mode is a pure-black (#000000) page with pure-white (#FFFFFF) text and the light-theme's saturated blue accent reused unchanged — text halos against the black, elevated panels are indistinguishable because they still rely on shadows, and the blue fails contrast on the dark ground.

**Guidelines:**

- MUST drive theme switching by remapping semantic tokens (surface, on-surface, border, accent) behind unchanged component code, and MUST NOT bolt on dark styling through per-component overrides or filter: invert().
- MUST base the dark base surface on a #121212-family gray with off-white body text (roughly 87% white) rather than pure #000000 on #FFFFFF, and MUST convey elevation by lightening the surface with an opacity-climbing white overlay instead of drop shadows.
- MUST shift accent tokens toward lighter, less-saturated tints for dark mode rather than reusing the light-theme brand values unchanged.
- MUST re-verify every dark-theme token against WCAG AA (4.5:1 body text, 3:1 large text and UI/graphic boundaries) on each composited elevated surface it appears on, not only the base surface.

Sources: [Dark Mode vs. Light Mode: Which Is Better? — Nielsen Norman Group](https://www.nngroup.com/articles/dark-mode/) · [Building a Material Dark Theme on Android — Google Material Design](https://m3.material.io/blog/android-dark-theme-tutorial) · [Design a dark theme with Material and Figma — Google Codelabs](https://codelabs.developers.google.com/codelabs/design-material-darktheme) · [Dark Mode - Foundations, Human Interface Guidelines — Apple](https://developer.apple.com/design/human-interface-guidelines/dark-mode) · [Inclusive Dark Mode: Designing Accessible Dark Themes For All Users — Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/) · [Elevation - Foundations — Atlassian Design System](https://atlassian.design/foundations/elevation) · [Theming — shadcn/ui](https://ui.shadcn.com/docs/theming)
