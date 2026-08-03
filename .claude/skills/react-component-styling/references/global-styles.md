# Global Styles

Apply this reference when deciding what belongs in a project's global stylesheet, and when a global rule fights a component that is trying to override it.

Global styles exist for things that have no component to own them: the document itself, the root box-model reset, the browser-level chrome that is not part of any React tree. Everything else belongs to a component. The failure mode is a global stylesheet that grows opinions about elements components also style — and then every component that disagrees has to out-specify it, which is how a codebase acquires `!important`.

## What Belongs Here

Ownership is the test, and it is worth applying literally: name the component that would hold the declaration. If one exists, the rule is not global. Only a short, closed list survives that question — the document itself, the reset, the browser chrome no component renders, and the typography every component inherits. Anything else reaching for global scope is a component rule that has not found its home yet.

**Guidelines:**

- MUST keep global styles to these categories:
  - **The box-model reset** — `box-sizing`, zeroed default `margin` and `padding`, and any project-wide shape default.
  - **Document-level declarations** — the colour-scheme declaration, scroll padding, the root background.
  - **Browser-level chrome** — scrollbar colours, selection colours. These are not reachable from a component and are declared once.
  - **Inherited typography defaults** — the body's font family, feature settings, base size, and line height, which every component inherits and most never restate.
  - **The root container declaration**, when the project tiers surfaces against the document.
- MUST NOT style a specific component, route, or surface from global styles; those belong to the owning component's module.
- MUST NOT declare an element-type rule that a component would reasonably want to override (`a`, `button`, `input`) beyond a neutral reset; a component styling that element then starts from a fight.
- SHOULD declare tokens in their own file, separate from the global rules that consume them, so a token change and a reset change are separately reviewable.

## Weakening Global Styles

Every global rule should carry **zero specificity**, so a component's single class beats it without escalation. Wrapping each selector in `:where()` does this — `:where()` matches identically but contributes nothing to specificity.

**Example:**

```css
@layer base {
  :where(*) {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }

  :where(:root) {
    background-color: var(--color-background-neutral-plain);
    color-scheme: var(--color-scheme);
    scrollbar-color: var(--color-border-accent-interactive)
      var(--color-background-accent-subtle);
  }

  :where(body) {
    container: body / inline-size;
    min-block-size: 100dvh;
    color: var(--color-text-neutral-low);
    font-family: var(--text-body-family);
    font-size: var(--text-body-size);
    line-height: var(--text-body-leading);

    &::selection {
      background-color: var(--color-component-accent-selected);
    }
  }
}
```

**Guidelines:**

- MUST wrap every global selector in `:where()` so the rule contributes no specificity.
- MUST NOT rely on source order alone to make a component win. Where the project declares cascade layers, layer order already settles it — the cascade compares layers before specificity, so anything in the components layer beats the base layer however specific the base rule is. `:where()` is what makes the globals safe everywhere else: in a project with no layers, against unlayered third-party CSS, and against another rule in their own layer.
- MUST NOT use `!important` in global styles. A global rule that needs it is a rule a component is legitimately trying to override.
- SHOULD keep the reset minimal. Every property a reset zeroes is a property some component has to restore.

## Cascade Layers

[Cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) order whole groups of rules independently of specificity and source order, which makes the intended precedence explicit at the top of the project rather than implied by import order.

**Example:**

```css
@layer variables, base, components;
```

**Guidelines:**

- MUST declare the layer order once, in its own file, imported before anything that populates a layer — the order is fixed by the `@layer` statement, not by which file loads first.
- MUST place tokens, global rules, and component styles in their declared layers and MUST NOT leave a rule outside every layer; an unlayered rule outranks every layered one, which inverts the intended order silently.
- SHOULD keep the layer list short. Three layers — tokens, base, components — cover a typical application; each additional layer is another precedence question a reader has to answer.

## Colour Scheme

The colour-scheme declaration tells the browser which native form controls, scrollbars, and default backgrounds to render, and it belongs at the root. Routing it through a custom property lets style queries elsewhere branch on the current scheme without each surface repeating the media query.

**Guidelines:**

- MUST declare `color-scheme` at the root from a token, and MUST NOT redeclare it per surface.
- MUST drive scrollbar, selection, and focus-ring colours from palette tokens so they adapt across schemes with no per-scheme override.
- SHOULD expose the active scheme as a custom property at the root so descendants can branch with a style query rather than repeating `prefers-color-scheme`.

## The Mobile-Native Equivalent

Mobile native has no global stylesheet and no cascade, so the same responsibilities land in three different places: the theme configuration, the root layout component, and per-navigator options. The important consequence is that there is nothing to inherit from — a `Text` does not pick up a body font from an ancestor — so typography roles have to be applied per text element rather than declared once.

**Guidelines:**

- MUST configure adaptive theming once at the app entry point so the theme follows the OS colour scheme automatically.
- MUST NOT branch on the colour scheme manually in a component; reading the scheme in JS bypasses the theming system and produces surfaces that do not update with it.
- MUST apply a typography role to every text element rather than expecting inheritance, since there is none.
- MUST theme navigator, tab-bar, header, and status-bar chrome from theme tokens at the layout level, since those surfaces are configured as options rather than styled as elements.
- SHOULD keep app-wide visual defaults in the theme rather than in a shared wrapper component, so a screen that does not use the wrapper does not silently diverge.
