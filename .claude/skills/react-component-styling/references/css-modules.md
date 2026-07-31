# CSS Modules (web)

Apply this reference to a web component that already uses CSS Modules, and to a new web component when CSS Modules is the project's primary styling mechanism. The platform-neutral rules — composition, tokens, property order, adaptive behaviour — apply either way and are not restated here.

## The Module Skeleton

Every module has the same three-part frame: the cascade layer that fixes its precedence, the scope that stops its selectors reaching other components, and a zero-specificity scope root that a consumer's class can override with one class.

**Example:**

```css
@layer components {
  @scope (.blogPostHeader) {
    :where(:scope) {
      display: flex;
      flex-direction: column;
      row-gap: var(--space-16);
    }

    .title {
      color: var(--color-text-neutral-high);
      font-family: var(--text-title-family);
      font-size: var(--text-title-size);
    }
  }
}
```

```tsx
import css from "./blog-post-header.module.css";
```

**Guidelines:**

- MUST place every component rule inside `@layer components`, and MUST NOT leave a rule outside a layer — an unlayered rule outranks every layered one regardless of specificity.
- MUST wrap a component's rules in `@scope (.<componentRoot>)` so its selectors cannot match another component's markup.
- MUST declare the scope root through `:where(:scope)` rather than `:scope`. The bare form carries specificity, which defeats the consumer-override contract; a consumer's single class must be enough to win.
- MUST import the module under one consistent local name across the project (`css`), so a reader recognises a module reference at a glance.
- MUST NOT nest one `@scope` inside another.
- MAY declare several sibling `@scope` blocks in one module when the file exports more than one component — a loaded and a loading variant, or a component whose fallback renders a different root.
- MUST NOT write a descendant selector that pierces another component's scope; cross-component styling goes through a consumer class or a shared token.

## Keyframes

Keyframes are globally named even inside a module, so two components that both define `pulse` collide silently and the last one loaded wins.

**Guidelines:**

- MUST declare `@keyframes` inside the component's `@scope` block, alongside the rules that use them, so the definition travels with its only consumer.
- MUST prefix a keyframe name that could plausibly collide with a component-specific prefix.
- MUST NOT duplicate the same keyframes into a second module. Two copies drift — the usual symptom is one copy gaining a reduced-motion guard and the other not — so extract a shared component instead.

## Propagating Style Context

A custom property declared on an ancestor is readable by every descendant, including descendants inside other components' scopes. That makes it the sanctioned channel for a parent to influence a child's styling without selecting into it — and the only channel, since a descendant selector across scopes is prohibited.

Two uses are common: a **tier** the parent announces and children react to, and a **state or variant** value the component toggles so a child rule changes without the rule being rewritten.

**Example — toggling a scoped property rather than re-authoring the value:**

```css
.image {
  filter: saturate(var(--image-saturation)) brightness(var(--image-brightness));
  transition: filter var(--duration-md) var(--ease-standard);

  --image-saturation: 1.75;
  --image-brightness: 1;

  @container style(--color-scheme: dark) {
    --image-saturation: 1.5;
    --image-brightness: 0.9;
  }
}
```

**Guidelines:**

- MUST declare a component-scoped custom property on the scope root when a value varies by context, and MUST resolve it either to a project token or to one of the literals the token-snapping rule permits — a ratio, a multiplier, or a fixed element dimension. A property that terminates in an off-scale colour, length, or duration is the leak the rule exists to prevent.
- MUST toggle the individual custom properties a composite value is built from, rather than re-authoring the whole composite per state; re-authoring detaches the state from every other branch that tunes the same value.
- MUST treat a custom property read across a component boundary as a contract: name it distinctly, and change it in both files together.
- SHOULD choose the propagation channel to match the axis — a style query on a custom property for a tier or scheme that many descendants read, a `data-*` attribute on the root for a discrete variant the component itself sets.

## Size-Based Styling with Container Queries

Container queries are how a component reacts to the space it was given. The tiering pattern, the choice between viewport and container units, and the breakpoint rules live in [fluid-and-responsive.md](./fluid-and-responsive.md); what follows is the CSS-Modules-specific mechanics.

**Guidelines:**

- MUST declare `container: <name> / inline-size` on the surface that owns a tier, and MUST name the container whenever a descendant needs to query a specific ancestor rather than the nearest one.
- MUST use container-relative units (`cqw`, `cqi`) for a size measured against that container, rather than a percentage that resolves against a different box than expected.
- MUST NOT declare a container on an element that also needs to be sized by its own content in the same axis; establishing an inline-size container makes that axis independent of the content.

## Styling a Third-Party Component

A component library that manages its own DOM usually exposes state as `data-*` attributes and applies structural styles inline. Those attributes are its styling API — target them rather than trying to replicate the state in React.

**Example:**

```css
.popup {
  opacity: 1;
  transition: opacity var(--duration-sm) var(--ease-standard);

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
  }
}
```

**Guidelines:**

- MUST style a third-party component's states through the attributes it documents, rather than mirroring its state into a React prop and styling that.
- MUST NOT declare a property the library applies as an inline style; the declaration cannot win and its presence misleads the next reader into thinking it does.
- MAY use `!important` in exactly one case — beating an inline style a third-party component applies, where no other mechanism can — and MUST annotate that use with the reason and the specific inline style it overrides.
- MUST NOT use `!important` anywhere else, including to resolve an ordering problem between two of the project's own rules.

## Scroll-Driven Animation

A scroll-driven animation degrades to its resting state where it is unsupported, which is only acceptable if the resting state is the correct fallback — so the guard is required, and the resting state has to be authored deliberately.

The subtle failure is the timeline resolving to the wrong scroller: [`animation-timeline: scroll()`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/scroll) resolves to the nearest _scrollable_ ancestor, so an animation on a non-scrolling wrapper silently falls through to the viewport. Naming the timeline on the real scroll container and exposing it with `timeline-scope` fixes it.

**Example:**

```css
.scrollArea {
  scroll-timeline: --table-scroll inline;
}

.wrapper {
  timeline-scope: --table-scroll;
}

@supports (animation-timeline: scroll()) {
  .wrapper::before {
    animation: fade-in 1ms linear both;
    animation-timeline: --table-scroll;
    animation-range: 0 var(--space-32);
  }
}
```

**Guidelines:**

- MUST wrap any use of a scroll timeline in `@supports (animation-timeline: scroll())`, and MUST author the un-animated resting state so it is a correct fallback rather than an accident.
- MUST use a named `scroll-timeline` plus `timeline-scope` when the animated element is an ancestor of the scroll container rather than inside it; the anonymous form resolves to the wrong scroller.
- MUST confirm the element consuming a timeline is structurally related to the intended scroll container before using the anonymous form. A silent fall-through to the viewport is the failure this rule prevents.
- SHOULD name a timeline with a component-specific prefix so a second component adopting the pattern cannot collide.

## Modern Properties and Units

Each property below removes a value the stylesheet would otherwise keep in sync by hand — a colour duplicated from the text it should track, a physical inset mirrored for right-to-left, a viewport height that is wrong the moment a mobile toolbar moves. That is what makes them worth reaching for, and also why the ones that change layout rather than polish still need a usable state authored underneath them.

**Guidelines:**

- MUST write direction-agnostic properties throughout (see the writing-direction rules in [adaptive-styling.md](./adaptive-styling.md)).
- MUST use `currentColor` for SVG strokes and fills that should track surrounding text colour.
- SHOULD prefer `stretch` to `100%` for filling a parent axis, and the dynamic viewport units (`dvh`, `dvi`, `svh`) to `vh` for viewport-relative sizing.
- MAY use line- and character-relative units where they express the intent directly — `1lh` for vertical rhythm that tracks the current line box, `1ch` for a monospace column width.
- MUST guard a property whose absence changes layout rather than polish with `@supports`, and MUST author the unguarded state as a usable fallback.
