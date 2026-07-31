# Loading, Empty, and Error Surfaces

Apply this reference when a data-backed component needs to render something other than its loaded content — a skeleton, an empty state, or a failure.

## One Shared Surface

Empty states, error states, and placeholder screens converge on the same shape: a mark, a title, a subtitle, and sometimes one action. Re-authoring that shape per feature produces surfaces that drift apart in spacing, tone, and hierarchy for no reason a reader can name.

Factor the shape into **one shared component** that takes its content as props, and let each caller supply its own action element — a retry button, a navigation link — so features keep their distinct control without forking the surface.

**Example:**

```tsx
<MessageState
  icon={FolderOpen}
  title="No collections"
  subtitle="There are no collections to show for this account."
  testID="collections-empty"
/>
```

**Guidelines:**

- MUST render empty, error, and placeholder states through one shared surface component rather than re-creating the layout per feature.
- MUST let the caller pass the action as an element or a description, so the surface does not accumulate one prop per feature's control.
- MUST give the surface an optional test hook prop and forward it to the root, so each state is separately addressable (see [testability.md](./testability.md)).
- SHOULD wrap the shared surface in a per-feature component when a feature renders several variations of it, keeping that feature's icon, tone, and copy defaults in one place.

## Loading Skeletons

A loading state that does not match the shape of the loaded content produces a layout shift the moment data arrives.

**Guidelines:**

- MUST give a loading component the same internal structure and spacing as the loaded component it stands in for, so the two occupy identical space under the same consumer-supplied size.
- MUST accept the same styling prop and test-hook passthrough on the loading component as on the loaded one, so a parent swaps only the component and not the surrounding markup.
- SHOULD place a loading component beside the loaded sibling it stands in for, following the host project's component layout (see [composition.md](./composition.md)) — one directory per component puts them in adjacent directories, which is equally fine.
- SHOULD update both siblings together when either grows a row, a column, or a spacing change.

## Mapping a Failure to Copy

What a failure _means_ to a user — is it retryable, is it a permission problem, what should the title say — is domain logic, not rendering. Branching on error shapes inside a component body buries that logic where it cannot be tested or reused.

**Guidelines:**

- MUST map an error to its user-facing copy, tone, and retryability in a helper, and render the helper's result. What that copy should say, and how the failure should read, are owned by the project's high-fidelity UI design practices; this rule governs only where the mapping lives.
- MUST NOT branch on transport-level details (status codes, error class names) inside a component body.
- MUST distinguish a retryable failure from a terminal one, and render a retry control only for the former — offering a retry that cannot succeed is worse than offering none.
- SHOULD share one error-mapping helper across the surfaces of a feature, parameterized by the subject nouns each surface needs.

## Selecting the Branch

A data-backed component has four branches — loading, error, empty, loaded — and they are mutually exclusive. Selecting among them in one readable place beats scattering early returns through the body, because it keeps the component's single root and its wrapper markup in one spot.

**Example:**

```tsx
let content: JSX.Element;

if (isPending) {
  content = <JobListSkeleton />;
} else if (isError) {
  content = <JobListError error={error} onRetry={refetch} />;
} else if (data.length > 0) {
  content = <JobListLoaded jobs={data} />;
} else {
  content = <JobListEmpty />;
}

// A screen-level root, so it names its own hook. A reusable component takes
// that hook from its caller through the props spread — see testability.md.
return (
  <View style={styles.root} testID="job-list">
    {content}
  </View>
);
```

**Guidelines:**

- MUST handle all four branches for any component backed by data that can be pending, failing, or empty; an unhandled empty branch that renders a bare container is a defect. Whether the pending branch shows a visible cue at all is a latency decision owned by the project's high-fidelity UI design practices — handle the branch structurally regardless, and let that capability decide the treatment.
- MUST check the empty branch on the loaded data explicitly, rather than letting an empty collection render as an empty list.
- SHOULD select the branch into one value and render it inside the component's single root, rather than returning early from several places. This narrows the general preference for early returns that the project's code-maintainability practices set, and applies only where there is a shared root and test hook to preserve.
- SHOULD keep the root element — and its test hook — outside the branch, so a test can assert the component mounted regardless of which state it is in.
