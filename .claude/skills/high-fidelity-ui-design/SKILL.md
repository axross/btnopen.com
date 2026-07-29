---
name: high-fidelity-ui-design
description: The ability to design, build, and review a high-fidelity (real-token) UI surface — the round where real color, type, spacing, radii, motion, and interaction states become the subject, on web or native. Covers layered semantic design tokens and first-class dark mode; visual hierarchy and the squint test; proximity and whitespace grouping; the 8px spacing grid, responsive column grid, and safe areas; semantic type scales and body-text readability; per-theme WCAG contrast and never encoding meaning in color alone; touch targets, interactive affordances, complete interaction-state sets, disabled-vs-error, and response-time-matched feedback; visible focus, preference-aware motion, assistive-tech semantics, cognitive load, and the aesthetic-usability effect. Distilled from Nielsen Norman Group, Material Design 3, Apple HIG, W3C/WAI WCAG, Laws of UX, and shadcn/ui.
when_to_use: Use when designing, building, or reviewing a high-fidelity user-facing surface with real colors, type, spacing, and states — "visual design", "design tokens", "dark mode", "theme", "contrast", "a11y", "typography", "spacing scale", "touch target", "focus state", "interaction states", "loading state", or "make it production-ready". For low-fidelity regions-and-flow wireframes, use a wireframe or breadboard approach instead.
user-invocable: false
---

# High-Fidelity UI Design

Use this capability whenever you design, build, or review a **high-fidelity** UI surface — one rendered with **real design tokens**: actual color, type, spacing, radii, motion, and interaction states, in light and dark, at the device sizes where the design differs. High fidelity is the round where those values stop being placeholders and become the subject of the work, so every decision here is about committing real vocabulary rather than sketching regions. For low-fidelity work — regions, hierarchy, and flow with no brand color or final type — use a wireframe or breadboard approach instead.

This skill owns **how a surface looks and responds** at full fidelity, in design vocabulary that applies equally to web and native. It does not own the concrete token _values_ — the specific palette, type ramp, spacing scale, and radii — which belong to the host project's own design system; bind every visual value to that system's semantic tokens rather than to the raw numbers this skill uses to illustrate its rules. Where a needed role is missing from the design system, add the semantic token rather than hardcoding a literal.

The normative rules live in the topic references below, each distilled from reputable design sources — Nielsen Norman Group, Material Design 3, Apple Human Interface Guidelines, W3C/WAI WCAG, Laws of UX, and shadcn/ui — with reasoning, do/don't examples, and citations. Several carry a verification technique you run against the actual render, not the intent: the grayscale squint test for hierarchy, per-theme contrast re-measurement, side-by-side interaction-state coverage, a color-blindness/grayscale pass, and reflow to a 320px viewport. Load the reference whose topic matches the decision in front of you; consult all six before calling a high-fidelity surface done.

## Design Tokens and Theming

See [tokens-and-theming.md](./references/tokens-and-theming.md) for:

- driving every visual value through layered semantic design tokens
- treating dark mode as a first-class, tone-based appearance rather than an inverted light theme

## Layout, Hierarchy, and Spacing

See [layout-and-spacing.md](./references/layout-and-spacing.md) for:

- building a deliberate visual hierarchy and validating it with a squint test
- grouping with proximity, whitespace, and common region before adding lines
- anchoring layout to an 8px grid and a responsive column grid, and respecting safe areas across device sizes

## Typography

See [typography.md](./references/typography.md) for:

- building a semantic type scale instead of ad-hoc sizes
- tuning body text for readability — size, measure, and leading

## Color and Contrast

See [color-and-contrast.md](./references/color-and-contrast.md) for:

- meeting text and non-text contrast minimums, recalculated separately for each theme
- never encoding meaning in color alone

## Interaction States and Feedback

See [interaction-states-and-feedback.md](./references/interaction-states-and-feedback.md) for:

- sizing and spacing touch targets, and making interactive elements look interactive
- designing complete, differentiated interaction states and preferring error surfacing over disabled controls
- writing clear error feedback and matching feedback to response-time thresholds

## Accessibility and Cognitive Load

See [accessibility-and-cognitive-load.md](./references/accessibility-and-cognitive-load.md) for:

- providing a visible focus indicator with a logical focus order, and preference-aware motion
- using native semantics and labels for assistive technology
- reducing cognitive load and investing in visual quality without masking usability
