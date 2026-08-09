# High-Fidelity UI & Visual Design — Design Tokens & Theming

Expressing every visual value through semantic tokens and supporting light/dark as a first-class appearance.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the `**Guidelines:**` bullets are the normative rules for this topic.

## Drive every visual value through layered semantic design tokens

The leak that breaks the next theme swap is always the same shortcut: a component reaches past the semantic layer to a primitive, or to a hardcoded #1A73E8, because no suitable role existed yet. The fix is to add the missing semantic token, never to inline the primitive — and the discipline that makes the whole system pay off is exactly that strict, with components and mockups referencing the semantic tier only, never a primitive and never a raw literal.

The tiers under that rule are the structure the field has converged on ([Material 3](https://m3.material.io/foundations/design-tokens/overview), the [W3C Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/), [shadcn/ui](https://ui.shadcn.com/docs/theming)): a primitive tier of raw facts named by scale position (blue-600, space-4), a semantic tier binding those to the [roles a UI actually needs](https://m3.material.io/styles/color/roles) (color-action-primary, color-surface, text-on-surface, border-danger), and an optional component tier that exists only where a part needs a stable override point. Because a theme is just a different mapping of semantic roles onto primitives, a dark mode or a full rebrand becomes a remap of one layer rather than a hunt through every screen.

Name by purpose and the names survive their own values: color-danger can move from red to orange without becoming a lie, color-red-alert cannot. Both naming failures cost later — too generic (color-primary-1 tells you nothing about when to use it) and too specific (button-submit-hover-blue bakes in appearance and context) — so structure each role as category-role-variant-state, reading as an intent: surface, on-surface, action-primary, text-muted, border-focus ([naming best practices](https://www.smashingmagazine.com/2024/05/naming-best-practices/)).

Pair every surface token with a matching on-/foreground token engineered, not guessed, to clear contrast against it ([SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum), [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). Testing the pair is what buys the guarantee: any component placing on-surface over surface then inherits a passing ratio for free, in both themes. Define only surfaces and let each component pick its own foreground, and contrast becomes an accident that some pairs fail. Verify the ratios of the actual paired tokens in each theme — a pairing that passes in light mode routinely fails when the same roles are remapped for dark.

**Good Example:**

> A button reads background: color-action-primary and text: color-on-action-primary — two semantic roles defined and contrast-tested as a pair (7.1:1) — so switching to a dark theme or rebranding is a remap of those roles onto different primitives, with the button file untouched and contrast preserved.

**Bad Example:**

> A button hardcodes background: #1A73E8 and color: white (or reaches straight to blue-600) — appearance-named and unpaired, so a rebrand means find-and-replace across every component, and the white text silently drops below 4.5:1 the moment the brand blue is lightened.

**Guidelines:**

- MUST bind every visual value in a component or mockup to a semantic-tier token, and MUST NOT reference a primitive token or a raw literal (hex, rgb, numeric scale value) directly.
- MUST resolve a missing role by adding the needed semantic token rather than inlining the primitive or hardcoding the value it would have pointed to.
- MUST name each semantic token by purpose as category-role-variant-state (surface, on-surface, action-primary, text-muted, border-focus), and MUST NOT encode appearance (color-red-alert) or a single component context (button-submit-hover-blue) in the name.
- MUST pair each surface token with a foreground/on- token and verify the actual pair clears WCAG contrast (4.5:1 normal text, 3:1 large text and UI boundaries) in both the light and dark theme mappings.

Sources: [Color — Human Interface Guidelines — Apple](https://developer.apple.com/design/human-interface-guidelines/color)

## Treat dark mode as a first-class, tone-based appearance

Dark mode is a second appearance with its own tonal logic, not an inverted light theme, and the architecture is what keeps it one: drive the switch by swapping semantic-token values (surface, on-surface, border, accent) behind unchanged component code, so a component referencing `--surface` and `--text-primary` needs zero edits. The common failure mode is a codebase where dark styles are bolted on with per-component overrides or `filter: invert()`, which desaturates images unpredictably and drifts out of sync the moment a component changes. Offer it as a user-selectable option defaulting to the OS `prefers-color-scheme` rather than forcing it on: light mode measurably outperforms dark on visual-acuity and proofreading tasks for normally-sighted users, while people with cataracts or other cloudy ocular media read better in dark, which makes it a choice to hand the user rather than an upgrade to ship ([NN/g](https://www.nngroup.com/articles/dark-mode/), [inclusive dark themes](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)).

Get the tones right rather than reaching for pure black and pure white. Dark surfaces are based on #121212 rather than #000000 because a fully black background maximizes the luminance gap against white text and triggers halation — the smearing bloom where light text bleeds into dark ground, worst for readers with astigmatism ([Material dark theme](https://m3.material.io/blog/android-dark-theme-tutorial)). Mirror this at the text end with an off-white (roughly 87% opacity white, or a light gray token) for body copy. Convey elevation by lightening the surface — a semi-transparent white overlay whose opacity climbs with level, 0% at the base to about 16% at the highest, so a card, then a menu, then a dialog each read as progressively lighter grays — because drop shadows mostly disappear on dark grounds ([elevation](https://atlassian.design/foundations/elevation), [dark-theme codelab](https://codelabs.developers.google.com/codelabs/design-material-darktheme)).

Rework the accents rather than reusing the light-theme brand values: saturated, mid-value hues that read fine on white vibrate against a dark ground and often fail contrast, so shift them toward lighter, less-saturated tones ([Apple](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [shadcn/ui theming](https://ui.shadcn.com/docs/theming)). Then re-verify contrast in the dark theme independently, and against the specific composited surface rather than the base color — passing in light mode proves nothing about dark, and the elevation overlay changes the effective background, so a token clearing AA on the base surface must still clear it on every elevated one.

**Good Example:**

> A card's background is `--surface` and its title is `--text-primary`; switching themes swaps those two tokens to #121212-family gray and 87%-white with no component change, elevated menus lift via a white overlay that grows with elevation, and the accent is a lighter, desaturated tint re-checked at 4.5:1 against each surface it appears on.

**Bad Example:**

> Dark mode is a pure-black (#000000) page with pure-white (#FFFFFF) text and the light-theme's saturated blue accent reused unchanged — text halos against the black, elevated panels are indistinguishable because they still rely on shadows, and the blue fails contrast on the dark ground.

**Guidelines:**

- MUST drive theme switching by remapping semantic tokens (surface, on-surface, border, accent) behind unchanged component code, and MUST NOT bolt on dark styling through per-component overrides or filter: invert().
- MUST base the dark base surface on a #121212-family gray with off-white body text (roughly 87% white) rather than pure #000000 on #FFFFFF, and MUST convey elevation by lightening the surface with an opacity-climbing white overlay instead of drop shadows.
- MUST shift accent tokens toward lighter, less-saturated tints for dark mode rather than reusing the light-theme brand values unchanged.
- MUST re-verify every dark-theme token against WCAG AA (4.5:1 body text, 3:1 large text and UI/graphic boundaries) on each composited elevated surface it appears on, not only the base surface.
