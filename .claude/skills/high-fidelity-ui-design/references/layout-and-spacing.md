# High-Fidelity UI & Visual Design — Layout, Hierarchy & Spacing

Visual hierarchy, grouping, the spacing/column grid, and safe-area-aware adaptive layout.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the `**Guidelines:**` bullets are the normative rules for this topic.

## Establish a deliberate visual hierarchy and validate it with a squint test

"Everything is emphasized, so nothing is" is the failure this prevents, and the dominance rule is what prevents it: at most two genuinely dominant elements per view — typically the page's single primary action or focal content, plus maybe one secondary anchor — with everything else visibly receding. When every card has a filled button, every heading is bold, and every section is boxed, the emphasis cues cancel out and the layout flattens into uniform noise.

Build that dominance from stacked cues rather than any single one, so size, weight, color/value contrast, and position all vote for the same element. Keep the vocabulary small: roughly three size steps (body, subhead, display), one or two weight steps, and no more than about three contrast levels. [NN/g's practical numbers](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) — around 14–16px body, 18–22px subheads, up to ~32px for the dominant heading — anchor the ratios, which matter more than the exact pixels and scale directly to a native mobile type ramp. Spacing carries hierarchy too: more whitespace between groups and less within them does work that size and color then don't have to carry alone.

Then validate rather than assume. The squint test — literally squinting, or better, screenshotting the design, converting to grayscale, and applying a Gaussian blur at radii of 5, 10, and 20px ([Polypane](https://polypane.app/blog/debug-your-visual-hierarchy-with-the-squint-test/), [NN/g](https://www.nngroup.com/videos/squint-test/)) — strips away text and detail so only the true contrast and mass remain. Whatever still stands out is your real hierarchy; if the primary action disappears while a decorative banner or an accidentally-bold label dominates, the intended reading order has failed and you fix it before touching anything else. Grayscaling specifically decouples hierarchy from hue, catching designs that lean on color alone — which is why the check doubles as a low-vision and color-vision-deficiency check.

**Good Example:**

> A record-detail screen uses one 28px semibold title and a single filled primary button as the two dominant elements; metadata rows sit at 14px in a muted foreground token, and grouped fields are separated by generous whitespace — grayscale-blur the screenshot and only the title and button survive, exactly the intended reading order.

**Bad Example:**

> Every section header is bold 20px, every card carries a filled accent-colored button, and each block has its own border, so under a 5px blur the view reads as an even grid of same-weight blocks with no clear entry point and the true primary action indistinguishable from four secondary ones.

**Guidelines:**

- MUST cap each view at two dominant elements — typically the single primary action plus one focal anchor — and visibly recede everything else in size, weight, or value.
- MUST validate the intended reading order by grayscaling and Gaussian-blurring a screenshot of the mockup, confirming the primary target still stands out before addressing any other feedback.
- MUST build hierarchy from stacked cues — size, weight, value contrast, and position voting together — rather than color alone, so the reading order survives grayscale and low-vision or color-deficient viewing.
- SHOULD constrain the mockup to roughly three type sizes, one or two weights, and about three contrast levels, and separate groups with more whitespace than sits within them.

Sources: [5 Principles of Visual Design in UX — Nielsen Norman Group](https://www.nngroup.com/articles/principles-visual-design/) · [Typographic Hierarchies — Smashing Magazine](https://www.smashingmagazine.com/2022/10/typographic-hierarchies/)

## Group with proximity, whitespace, and common region before adding lines

Two failure modes bracket this one. Defensive bordering wraps every group in a box "to be safe," producing a cluttered, gridded interface where nothing stands out because everything is fenced. Its twin is uniform spacing — the same gap everywhere, so proximity carries no information and the layout reads as one undifferentiated list. Both are fixed the same way: remove the lines, then tune the gaps until the intended groups emerge on their own, adding enclosure back only where whitespace demonstrably isn't enough.

Spacing gets to go first because the eye resolves grouping from it pre-attentively, before it reads any line ([proximity](https://lawsofux.com/law-of-proximity/), [common region](https://lawsofux.com/law-of-common-region/)) — so correct spacing communicates structure faster, and with less visual noise, than a grid of dividers. The practical consequence is a hierarchy of gaps: within a group items sit tight, between groups the gap grows, and between sections it grows again, so a viewer can parse two or three levels of structure from whitespace alone.

Make the gaps quantized and clearly stepped rather than nudged. On an 8pt system a workable scale is roughly 4–8px between tightly bound elements (label and its value, icon and text), 16px of internal padding inside a component, 24px between groups within a section, and 32–48px+ between distinct sections. The single most reliable rule is internal ≤ external ([spacing best practices](https://cieden.com/book/sub-atomic/spacing/spacing-best-practices)): the space around a group must be visibly larger than the space inside it, or the grouping inverts and neighboring groups fuse. A 2:1 ratio between the between-group gap and the within-group gap is a safe default; if you can't tell where one group ends, widen the outer gap before reaching for a line.

Add a border, rule, or divider only after spacing and common region have failed — typically in dense data tables, tightly packed toolbars, or when two adjacent regions share the same background and can't be separated by gap alone. Even then, prefer the lightest treatment that works: a subtle background tint or a hairline at low contrast rather than a full boxed outline. Reserve stronger enclosure (card surface, elevation shadow) for genuinely independent objects, and let a single shared background carry a whole section rather than boxing each child inside it.

**Good Example:**

> A settings screen groups related toggles by giving each cluster 8px between its own rows and 32px of whitespace between clusters on a single shared background — no dividers — so the three groups are instantly legible and the surface stays calm.

**Bad Example:**

> Every form field, label, and button is wrapped in its own bordered box with identical 12px gaps throughout, so the screen reads as a uniform grid of cells where no grouping stands out and the borders add clutter without conveying structure.

**Guidelines:**

- MUST size between-group gaps at least twice the within-group gap so the space around a group is visibly larger than the space inside it.
- MUST draw grouping from a quantized spacing scale (roughly 4-8px bound, 16px component padding, 24px between groups, 32px+ between sections) rather than nudged or uniform gaps.
- MUST NOT add a border, rule, or divider until proximity and a shared common region have demonstrably failed to separate the groups.
- SHOULD carry a whole section on one shared background and reserve card surfaces or elevation for genuinely independent objects instead of boxing each child.

Sources: [5 Principles of Visual Design in UX — Nielsen Norman Group](https://www.nngroup.com/articles/principles-visual-design/) · [Layout — Human Interface Guidelines — Apple](https://developer.apple.com/design/human-interface-guidelines/layout) · [The Principle of Common Region: Containers Create Groupings — Nielsen Norman Group](https://www.nngroup.com/articles/common-region/) · [Proximity Principle in Visual Design — Nielsen Norman Group](https://www.nngroup.com/articles/gestalt-proximity/)

## Anchor all layout to an 8px baseline grid and a responsive column grid

The common failure mode is a mockup that keeps every value on the grid inside its components but abandons the column grid at the page level — elements centered by eye, one-off margins to "make it line up," inconsistent section gaps. It looks fine in a single screenshot and drifts the moment it is resized or the copy length changes. Up close it reads as noise for the same reason: a 13px pad next to a 20px pad is visible even when the color and type are perfect.

The dimensional discipline that prevents both: every margin, padding, gap, icon box, and line-height is a multiple of one base unit — 8px, with 4px as a half-step for tight optical corrections — so the whole interface shares a single vertical and horizontal rhythm, components snap together predictably, and handoff stops being a negotiation of arbitrary numbers. A scale of 4, 8, 12, 16, 24, 32, 48, 64 covers almost every gap you need while making "what value goes here" a menu choice rather than a free decision ([Material 3](https://m3.material.io/foundations/layout/grids-spacing/spacing), [Carbon](https://carbondesignsystem.com/elements/spacing/overview/), [spacing systems and scales](https://blog.designary.com/p/spacing-systems-and-scales-ui-design)).

Layer a responsive column grid on top of that scale so horizontal placement is systematic rather than hand-nudged: 4 columns at phone, 8 at tablet, 12 at desktop, with margins and gutters themselves staying on the scale ([Material 3 breakpoints](https://m3.material.io/foundations/layout/breakpoints/overview), [responsive layout grid](https://m2.material.io/design/layout/responsive-layout-grid.html), [Carbon's 2x grid](https://carbondesignsystem.com/elements/2x-grid/overview/)). Define margins (edge-to-content) and gutters (column-to-content) explicitly at each breakpoint and let content span whole columns, so a card that is "4 of 12" stays proportional as the container flexes instead of freezing at a pixel width ([layout grids](https://www.smashingmagazine.com/2017/12/building-better-ui-designs-layout-grids/), [Apple](https://developer.apple.com/design/human-interface-guidelines/layout)). Reserve fluid, off-grid sizing for the truly full-bleed — hero imagery, backgrounds — and keep functional content aligned to columns.

Scale spacing up with the viewport, don't just reflow: section padding and inter-block gaps that read as generous on a 375px phone look cramped on a 1280px canvas, so step section-level spacing (and often type) up at larger breakpoints while keeping component-internal padding relatively stable. Macro whitespace communicates grouping and breathing room, and that budget grows with the available real estate.

**Good Example:**

> Build the design on an 8px scale (4/8/16/24/32…) and place content on a 12-column desktop grid with 24px gutters that collapses to 4 columns with 16px margins on phone, then bump section padding from 32px on mobile to 64px on desktop — every element lands on a predictable line.

**Bad Example:**

> Hand-position cards with values like 13px, 21px, and 37px "because it looked right," center a hero by eye, and use the same 16px section gap at every width — the layout reads as noisy up close and breaks alignment as soon as the viewport or copy length changes.

**Guidelines:**

- MUST size every margin, padding, gap, icon box, and line-height as a multiple of the 8px base unit, reserving 4px only for tight optical half-step corrections.
- MUST place functional content on a responsive column grid with explicitly defined margins and gutters at each breakpoint — 4 columns at phone, 8 at tablet, 12 at desktop — and let elements span whole columns rather than freezing at hand-set pixel widths.
- MUST step section-level padding and inter-block gaps up at larger breakpoints while keeping component-internal padding stable, so a 32px mobile section gap grows toward 64px on desktop instead of repeating one value at every width.
- SHOULD reserve fluid, off-grid sizing for full-bleed elements such as hero imagery and backgrounds, and MUST NOT center or position functional content by eye with one-off values like 13px or 37px.

## Respect safe areas and design adaptively across device sizes

The common failure mode is designing every screen on one comfortable device — a mid-size iPhone — with content pinned to absolute coordinates instead of layout guides. A header slides under the Dynamic Island, a sticky footer button sits under the home indicator, and on a small device the primary CTA turns out to be below the fold while a fixed-width row forces horizontal scrolling. For a high-fidelity mockup this is part of the render, not an abstraction to defer to engineering: show the frame with its notch or Dynamic Island and home indicator, draw the safe-area insets explicitly, and prove the design at both the smallest supported width and a large one, in portrait and where relevant landscape, in both themes.

Anchoring is the fix. Bind content to the safe area — via safeAreaInsets / SafeAreaView, or platform layout margins rather than hard-coded pixel offsets ([Apple](https://developer.apple.com/design/human-interface-guidelines/layout)) — so nothing is clipped by hardware or obscured by system chrome; place primary actions above the home indicator, and reserve the thumb-reachable lower half of the screen for the most-used controls. Keep the core task's primary content and key actions visible in the initial viewport so it never depends on scrolling, and hold interactive targets to their platform minimum footprint regardless of device size, since shrinking a layout must not shrink hit areas below that floor.

Adaptive means one layout that reflows, not a handful of pixel-perfect fixed screens: relative units and flexible containers (flexbox/grid, percentage and rem-style sizing), with size classes or breakpoints driving structural changes — a single column on a compact phone becoming a two-pane or wider-margin layout on a large phone or tablet, and content that survives a rotation to landscape. The accessibility floor is concrete at 320 CSS pixels of width with no two-dimensional scrolling, which is also what a desktop page hit at 400% zoom collapses to ([SC 1.4.10](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html), [WebAIM](https://webaim.org/techniques/reflow/)). Content that reflows to 320px cleanly will almost always adapt gracefully across the real range of devices; two-dimensional layouts like maps, large data tables, and diagrams are the recognized exceptions.

**Good Example:**

> A checkout screen anchors its header below the safe-area top inset (clearing the Dynamic Island) and pins the "Pay" button above the home indicator; on a 320pt-wide phone it stays a single scrollable column with the CTA visible, and on a tablet it reflows to a two-pane summary-plus-form without any element being clipped or requiring horizontal scroll.

**Bad Example:**

> The mockup is drawn only on a mid-size iPhone with content placed at fixed pixel offsets, so on a device with a Dynamic Island the title is half-hidden under it, the sticky footer button overlaps the home indicator, and on a small phone the primary action is pushed below the fold while a fixed-width table forces the screen to scroll sideways.

**Guidelines:**

- MUST anchor headers, footers, and primary actions to the safe-area insets so no element renders under the notch, Dynamic Island, status bar, or home indicator.
- MUST keep the core task's primary content and its key actions visible in the initial viewport without depending on scrolling to reach them.
- MUST render each screen at both the smallest supported width and a large width in both themes, and MUST reflow content to a 320-pixel-wide viewport without two-dimensional scrolling except for maps, large tables, and diagrams.
- MUST NOT size interactive targets below 44x44 pt on iOS or 48x48 dp on Android, and SHOULD compose layouts from flexible containers and relative units rather than fixed pixel offsets.
