# High-Fidelity UI & Visual Design — Color & Contrast

Contrast minimums recalculated per theme, and never encoding meaning in color alone.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the `**Guidelines:**` bullets are the normative rules for this topic.

## Meet contrast minimums for text and non-text UI, per theme

A palette that passes its audit and still fails in production is the ordinary case, and it fails in the pairings nobody sampled. Recalculate every pairing separately for light and dark; a token set that passes in one theme routinely fails in the other, because dark themes invert the luminance relationship and low-chroma grays behave differently against near-black than against near-white. Check text against the actual surface it lands on, which in an elevated system means the lightest tinted or shadowed surface a card, sheet, or menu can produce — not the base background you sampled once. Do the same for every interactive state independently: hover, focus, active, and disabled each recolor text or its ground, and each must clear the threshold on its own (disabled controls are the one documented exception under 1.4.11, but faded "muted" text that is still meant to be read is not exempt).

The floors themselves are a one-line lookup: 4.5:1 for normal text and 3:1 for large text ([SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)), plus 3:1 for the visual information needed to identify and operate a control — a boundary when nothing else marks the hit area, the parts of an icon required to read it, and the indicators separating selected, focused, or checked from their neighbors ([SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). Read them as hard floors rather than targets to approach: 4.47:1 fails 4.5:1 and 2.999:1 fails 3:1, so do not round up, and do not accept a tool that reports a rounded value. [APCA](https://git.apcacontrast.com/documentation/APCAeasyIntro.html), the WCAG 3 research method, is worth consulting alongside them as supplementary readability guidance — it catches thin weights, small type, and mid-tone-on-mid-tone pairings that clear WCAG 2 and still read poorly — but WCAG 2 AA stays the pass/fail baseline the mockup is measured against.

The common failure mode is checking one representative screen in one theme against the base background and declaring the palette compliant, then shipping placeholder gray captions, icon-only controls, focus rings, and disabled-looking-but-active states that quietly fall below 3:1 or 4.5:1 in the theme nobody re-measured.

**Good Example:**

> Verifying a caption token both ways: #6B7280 secondary text reads 4.83:1 on the light base and 5.1:1 on the lightest elevated card surface it can sit on, and its dark-theme counterpart is recalculated separately to 4.6:1 — plus the focus ring and the checkbox's checked-state fill are each confirmed at 3:1 against their adjacent colors.

**Bad Example:**

> Sampling one hero screen in light mode, seeing body text at 4.5:1, and calling the whole palette accessible — while the same gray caption lands at 3.9:1 on an elevated sheet, the dark theme's muted text sits at 3.2:1, and the icon-only toolbar buttons never get measured at all.

**Guidelines:**

- MUST recalculate every text and non-text color pairing separately for light and dark, since a token that clears the floor in one theme routinely fails in the inverted-luminance other.
- MUST clear WCAG 2 AA floors as hard thresholds — 4.5:1 for normal text, 3:1 for large text (18pt/24px, or 14pt bold/18.67px and heavier) — and 3:1 for the boundary, icon, and state indicators that identify or operate a control, without rounding a below-floor ratio up to pass.
- MUST measure text against the lightest elevated surface a card, sheet, or menu can produce and recheck each hover, focus, active, and muted state on its own ground, exempting only truly disabled controls under 1.4.11.
- MAY consult APCA as supplementary readability guidance for thin weights, small type, and mid-tone-on-mid-tone pairings, while keeping WCAG 2 AA as the pass/fail baseline.

Sources: [Contrast and Color Accessibility — WebAIM](https://webaim.org/articles/contrast/) · [5 Visual Treatments that Improve Accessibility — Nielsen Norman Group](https://www.nngroup.com/articles/visual-treatments-accessibility/) · [Color — Human Interface Guidelines — Apple](https://developer.apple.com/design/human-interface-guidelines/color)

## Never encode meaning in color alone

Color-only encoding is the defect that survives every review conducted in full color on a good screen — which is every review. The concrete how-to is to build each status, validation, selection, and interactive-affordance state with its non-color signal already in place (an icon, a text label, a shape, a stroke or border, weight, or a fill pattern), then run a grayscale test on the full mockup — desaturate the artboard, or view it through a color-blindness simulator for protanopia, deuteranopia, and tritanopia — and treat whatever became ambiguous as a defect to fix before handoff. The recurring pair is the two-line chart and the traffic-light status dot: both read perfectly to a designer with full color vision and collapse into identical grays for a meaningful slice of users. Fix them with dash patterns, marker shapes, or direct labels; and with an icon plus text beside the dot.

The requirement behind that pass is short — color must not be the only visual means of conveying information, indicating an action, or distinguishing an element ([SC 1.4.1](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)) — and it has exactly one measurable escape hatch, which is also where it is most often misread. WCAG treats a difference in both hue and lightness of at least 3:1 contrast as an acceptable additional distinction, which is why a body-text link that differs from surrounding text by 3:1 can rely on color plus (ideally) an underline. But the 3:1 allowance only helps when the user does not need to identify a specific color's meaning; if the information is "green means valid, red means invalid," no contrast ratio between them substitutes for a non-color cue, since a viewer who cannot separate the two hues learns nothing from their contrast. Treat 3:1 as covering "these two things are different," never "this one specifically means X."

**Good Example:**

> A form field in the error state shows a red border AND a red-tinted X icon AND helper text ("Enter a valid email") below it — desaturate the screen and the field still reads as broken via the icon, the text, and the border weight change.

**Bad Example:**

> A status dashboard shows service health as colored dots only — green, amber, red — with no label or icon, so a deuteranopic viewer (or anyone on a grayscale display) sees three near-identical gray dots and cannot tell which service is down.

**Guidelines:**

- MUST pair every color that carries status, validation, selection, or interactive-affordance meaning with a second non-color channel — an icon, text label, shape, border, weight, or fill pattern — in the mockup itself.
- MUST run a grayscale or color-blindness-simulator pass (protanopia, deuteranopia, tritanopia) over the full artboard before handoff and fix any status dot, selected chip, required-field marker, or multi-line chart that becomes ambiguous once hue is removed.
- MUST NOT rely on a 3:1 hue-and-lightness difference to convey a specific color's meaning, reserving that allowance only for signaling that two elements differ.
- SHOULD distinguish chart series and traffic-light statuses with dash patterns, marker shapes, or direct labels rather than line or dot color alone.

Sources: [5 Visual Treatments that Improve Accessibility — Nielsen Norman Group](https://www.nngroup.com/articles/visual-treatments-accessibility/) · [Error-Message Guidelines — Nielsen Norman Group](https://www.nngroup.com/articles/error-message-guidelines/) · [Colour — GOV.UK Design System](https://design-system.service.gov.uk/styles/colour/) · [Don't use color alone to convey information (colorblind) — Access Guide](https://www.accessguide.io/guide/colorblind)
