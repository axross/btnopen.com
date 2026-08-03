# List Virtualization

Apply this reference when rendering a collection whose size is driven by data rather than fixed by the design.

Virtualization renders only the rows near the viewport and recycles them as the user scrolls. It buys a bounded render cost at the price of real complexity: measured or estimated row heights, scroll restoration, keyboard and screen-reader behavior, and a nested-scrolling constraint that is easy to violate. Reach for it when the item count justifies that cost, not by default.

## When a Web List Earns It

On web, a plain `.map` is correct until the row count makes it expensive — which is later than it feels, and depends on how heavy each row is.

Use **more than 100 items** as the trigger to raise the question: a list that is not paginated and can exceed roughly a hundred rows, or a paginated list rendering more than roughly a hundred rows per page.

**Crossing that threshold is a recommendation to the human, not a decision to make unilaterally** — it adds a dependency and changes the component's structure, scroll behavior, and accessibility characteristics at once. Say what the count is, what it costs to leave as-is, and which library you would reach for.

**Guidelines:**

- MUST render a data-driven web list with a plain map until it crosses the threshold; virtualization added early is complexity with no measured benefit.
- MUST raise virtualization with the human — naming the expected item count and the proposed library — rather than introducing it as an incidental part of another change.
- MUST NOT virtualize a list whose length the design fixes (a navigation menu, a settings group, a tab bar); those are bounded regardless of data.
- SHOULD prefer paginating or windowing the **data** over virtualizing the view when the source supports it, since fetching less is cheaper than rendering less.
- SHOULD state the row's rendering cost alongside the count; a hundred rows of rich media justify virtualization far sooner than a hundred rows of text.

### Choosing a Web Library

The choice is usually already made: a project that virtualizes anywhere has paid the dependency and the learning cost once, and a second library means two scroll implementations to keep behaviourally consistent for no gain. The default below applies only to a project starting from none.

**Guidelines:**

- MUST use a virtualization library the host project already installs, rather than adding a second one for consistency with this default.
- SHOULD start the evaluation from a headless virtualizer such as TanStack Virtual, since it composes with whatever markup and styling mechanism the project already uses. Admitting the dependency still goes through the project's supply-chain and change-management practices, which require weighing alternatives rather than adopting the first fit.
- MUST treat a virtualization library as a fast-moving dependency whose API the project's current-documentation practices require refreshing before writing against it.
- MUST keep the row component independent of the virtualizer, so the same row renders under a plain map in a test.

## When a Mobile Native List Earns It

Mobile native inverts the web default: the platform ships virtualized list components, so the decision is which container to render into, not whether to add a dependency.

| The content is…                                                 | Render it in                 |
| --------------------------------------------------------------- | ---------------------------- |
| bounded by the design — a settings screen, a form, a fixed menu | a scroll container           |
| data-driven and unbounded                                       | a flat virtualized list      |
| data-driven and grouped under headings                          | a sectioned virtualized list |

**Guidelines:**

- MUST render data-driven, unbounded content in a virtualized list rather than mapping it inside a scroll container.
- MUST render design-bounded content in a plain scroll container; a virtualized list for a five-row settings group adds recycling machinery for nothing.
- MUST use a sectioned list when rows group under headings, rather than flattening groups into one list and faking headers as rows.
- SHOULD derive section grouping inside the list component and memoize it, so a re-render does not rebuild the section array.

### Choosing a Mobile List Component

The platform's own list components are already virtualized, so the question is never whether to virtualize but whether to add a **dependency** on top of what ships. That trade is worth making against a measured problem, not a predicted one: a third-party list changes recycling, measurement, and scroll restoration together, so adopting one pre-emptively swaps a known set of behaviours for an unknown one.

**Guidelines:**

- MUST use the platform's core list components by default.
- MUST build a new list on the third-party library — such as FlashList or LegendList — that the host project already installs, matching what comparable lists there already use; leave existing core-component lists alone unless migrating them is the task.
- SHOULD raise a third-party list library with the human when core components measurably underperform for a specific list, rather than adopting one pre-emptively.

## Never Nest Virtualized Lists

A virtualized list nested inside another scrolling container of the same orientation breaks the outer container's virtualization: the inner list receives unbounded height, renders every row, and the windowing that justified the component disappears — while the two scroll containers fight over the same gesture.

**Guidelines:**

- MUST NOT nest a virtualized list inside a scroll container or another virtualized list of the same scroll orientation.
- MUST restructure instead: flatten the data into one list, move the surrounding content into the list's header and footer slots, or use a sectioned list where the nesting was expressing grouping.
- MAY nest a list of the **opposite** orientation — a horizontal carousel inside a vertical list — since the two do not compete for the same gesture or the same unbounded axis.
- MUST treat a runtime warning about a nested virtualized list as a defect to restructure, never as noise to suppress.

## Shaping a List Component

Split the list into a **wrapper** and a **row**. The wrapper owns the list container, its content-container styling, and any grouping it derives; the row is exported separately so it renders — and is asserted against — without the list. The screen supplies the render callback, which keeps navigation and press behavior at the call site rather than baked into the row.

**Guidelines:**

- MUST export the row component separately from the list wrapper, so a test can render one row in isolation.
- MUST supply an explicit key extractor built on the item's stable identifier rather than on its position alone; a composite that carries the index alongside the id is acceptable, an index by itself is not, because reordering then reuses the wrong row state.
- MUST memoize the row, the separator, and the section header components under manual memoization, since the list re-creates their elements on every scroll-driven render; check the project's regime first (see [memoization.md](./memoization.md)).
- MUST NOT define the render callback's component inline in the callback body; an inline component remounts every row on each render and defeats memoization.
- SHOULD let the wrapper accept and forward the underlying list's props, so a caller sets refresh, end-reached, and scroll behavior without the wrapper enumerating each one (see [props.md](./props.md)).
- SHOULD keep the empty branch out of the list itself and select it alongside the other states (see [component-states.md](./component-states.md)).
