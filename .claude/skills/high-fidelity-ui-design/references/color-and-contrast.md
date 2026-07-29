# High-Fidelity UI & Visual Design — Color & Contrast

Contrast minimums recalculated per theme, and never encoding meaning in color alone.

Part of the research-grounded best-practices set for this skill (see the skill's `SKILL.md` for the full routing). Each principle below is distilled from reputable design sources; the `**Guidelines:**` bullets are the normative rules for this topic.

## Meet contrast minimums for text and non-text UI, per theme

Contrast is what makes a high-fidelity mockup legible rather than merely attractive, so every real color pairing must clear a floor before the design ships. WCAG 2 sets that floor: 4.5:1 for normal text and 3:1 for large text, where "large" means 18pt (about 24px) or 14pt bold (about 18.67px) and heavier. Non-text UI has its own 3:1 requirement (SC 1.4.11) covering the visual information needed to identify a control and operate it — a button or input's boundary when nothing else marks the hit area, the parts of an icon required to read it, and the indicators that distinguish selected, focused, or checked states from their neighbors. The ratios are computed from relative luminance and are symmetric (swapping foreground and background yields the same number), so a passing pair passes regardless of which color sits on top.

Recalculate every pairing separately for light and dark; a token set that passes in one theme routinely fails in the other, because dark themes invert the luminance relationship and low-chroma grays behave differently against near-black than against near-white. Check text against the actual surface it lands on, which in an elevated system means the lightest tinted or shadowed surface a card, sheet, or menu can produce — not the base background you sampled once. Do the same for every interactive state independently: hover, focus, active, and disabled each recolor text or its ground, and each must clear the threshold on its own (disabled controls are the one documented exception under 1.4.11, but faded "muted" text that is still meant to be read is not exempt). The numbers are hard floors, never targets to approach — 4.47:1 fails 4.5:1 and 2.999:1 fails 3:1; do not round up, and do not accept a tool that reports a rounded value.

Treat APCA (the WCAG 3 research method) as supplementary readability guidance, useful for catching pairings that technically pass WCAG 2 yet read poorly — especially thin weights, small type, and mid-tone-on-mid-tone — but keep WCAG 2 AA as the pass/fail baseline the mockup is measured against. The common failure mode is checking one representative screen in one theme against the base background and declaring the palette compliant, then shipping placeholder gray captions, icon-only controls, focus rings, and disabled-looking-but-active states that quietly fall below 3:1 or 4.5:1 in the theme nobody re-measured.

**Good Example:**

> Verifying a caption token both ways: #6B7280 secondary text reads 4.83:1 on the light base and 5.1:1 on the lightest elevated card surface it can sit on, and its dark-theme counterpart is recalculated separately to 4.6:1 — plus the focus ring and the checkbox's checked-state fill are each confirmed at 3:1 against their adjacent colors.

**Bad Example:**

> Sampling one hero screen in light mode, seeing body text at 4.5:1, and calling the whole palette accessible — while the same gray caption lands at 3.9:1 on an elevated sheet, the dark theme's muted text sits at 3.2:1, and the icon-only toolbar buttons never get measured at all.

**Guidelines:**

- MUST recalculate every text and non-text color pairing separately for light and dark, since a token that clears the floor in one theme routinely fails in the inverted-luminance other.
- MUST clear WCAG 2 AA floors as hard thresholds — 4.5:1 for normal text, 3:1 for large text (18pt/24px, or 14pt bold/18.67px and heavier) — and 3:1 for the boundary, icon, and state indicators that identify or operate a control, without rounding a below-floor ratio up to pass.
- MUST measure text against the lightest elevated surface a card, sheet, or menu can produce and recheck each hover, focus, active, and muted state on its own ground, exempting only truly disabled controls under 1.4.11.
- MAY consult APCA as supplementary readability guidance for thin weights, small type, and mid-tone-on-mid-tone pairings, while keeping WCAG 2 AA as the pass/fail baseline.

Sources: [Understanding Success Criterion 1.4.3: Contrast (Minimum) — W3C Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [Understanding Success Criterion 1.4.11: Non-text Contrast — W3C Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) · [Contrast and Color Accessibility — WebAIM](https://webaim.org/articles/contrast/) · [The Easy Intro to the APCA Contrast Method — APCA / Myndex](https://git.apcacontrast.com/documentation/APCAeasyIntro.html) · [5 Visual Treatments that Improve Accessibility — Nielsen Norman Group](https://www.nngroup.com/articles/visual-treatments-accessibility/) · [Color — Human Interface Guidelines — Apple](https://developer.apple.com/design/human-interface-guidelines/color)

## Never encode meaning in color alone

Roughly 1 in 12 men and 1 in 200 women have some form of color vision deficiency, and low-vision users, glare, dimmed night screens, and grayscale power-saving modes all strip hue for everyone else. Because a high-fidelity mockup is where you commit real hues to statuses and states, it is also where color-only encoding silently ships. WCAG 2.1 success criterion 1.4.1 (Use of Color) makes this a hard requirement: color must not be the only visual means of conveying information, indicating an action, or distinguishing an element. The fix is redundancy — every place a color carries meaning, pair it with a second channel: an icon (checkmark for success, exclamation for warning, X for error), a text label, a shape, a stroke or border, weight, or a fill pattern.

There is one measurable escape hatch worth knowing precisely. When two elements are distinguished by color, WCAG treats a difference in both hue and lightness of at least 3:1 contrast as an acceptable additional distinction — this is why a body-text link that differs from surrounding text by 3:1 can rely on color plus (ideally) an underline. But the 3:1 allowance only helps when the user does not need to identify a specific color's meaning; if the information is "green means valid, red means invalid," no contrast ratio between them substitutes for a non-color cue, since a viewer who cannot separate the two hues learns nothing from their contrast. Treat 3:1 as covering "these two things are different," never "this one specifically means X."

The concrete how-to for a high-fidelity design: build every status, validation, selection, and interactive-affordance state with its non-color signal already in place, then run a grayscale test on the full mockup (desaturate the artboard or view it through a color-blindness simulator for protanopia, deuteranopia, and tritanopia). Anything that becomes ambiguous when hue is removed — a selected chip that only changes fill color, a required field marked by red asterisk color alone, a chart with a red line and a green line — is a defect to fix before handoff. The common failure mode is the two-line chart and the traffic-light status dot: both read perfectly to the designer with full color vision and collapse into identical grays for a meaningful slice of users. Fix them with dash patterns, marker shapes, or direct labels; and with an icon plus text beside the dot.

**Good Example:**

> A form field in the error state shows a red border AND a red-tinted X icon AND helper text ("Enter a valid email") below it — desaturate the screen and the field still reads as broken via the icon, the text, and the border weight change.

**Bad Example:**

> A status dashboard shows service health as colored dots only — green, amber, red — with no label or icon, so a deuteranopic viewer (or anyone on a grayscale display) sees three near-identical gray dots and cannot tell which service is down.

**Guidelines:**

- MUST pair every color that carries status, validation, selection, or interactive-affordance meaning with a second non-color channel — an icon, text label, shape, border, weight, or fill pattern — in the mockup itself.
- MUST run a grayscale or color-blindness-simulator pass (protanopia, deuteranopia, tritanopia) over the full artboard before handoff and fix any status dot, selected chip, required-field marker, or multi-line chart that becomes ambiguous once hue is removed.
- MUST NOT rely on a 3:1 hue-and-lightness difference to convey a specific color's meaning, reserving that allowance only for signaling that two elements differ.
- SHOULD distinguish chart series and traffic-light statuses with dash patterns, marker shapes, or direct labels rather than line or dot color alone.

Sources: [Understanding SC 1.4.1: Use of Color (WCAG 2.1) — W3C/WAI](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html) · [5 Visual Treatments that Improve Accessibility — Nielsen Norman Group](https://www.nngroup.com/articles/visual-treatments-accessibility/) · [Error-Message Guidelines — Nielsen Norman Group](https://www.nngroup.com/articles/error-message-guidelines/) · [Colour — GOV.UK Design System](https://design-system.service.gov.uk/styles/colour/) · [Don't use color alone to convey information (colorblind) — Access Guide](https://www.accessguide.io/guide/colorblind)
