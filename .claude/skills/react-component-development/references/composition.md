# Composition

Apply this reference when creating a component file, deciding where a sub-component lives, exporting a component, or judging whether a repeated pattern has earned a shared component.

## File and Directory Naming

A component's file name is its identity in kebab-case, and its exported name is the PascalCase of that file name. Keeping the two mechanically related means a reader who sees `<JobListItem>` in a tree knows the file without searching.

A component made of **sub-components** gets its own directory, and every part lives in it. Cohesion, not file count, is what earns the directory: `JobList`, `JobListHeader`, `JobListItem`, `JobListItemLoading`, and `JobListLoading` change together, so they sit together.

**Example:**

```
job-list/
├── job-list.tsx              # the parent; bears the component's name
├── job-list-header.tsx
├── job-list-item.tsx
├── job-list-item-loading.tsx
└── job-list-loading.tsx
```

**Guidelines:**

- SHOULD name component files in kebab-case, and MUST match the host project's existing file-name casing where it has one.
- MUST name the exported component the PascalCase of its file name, so a reader who sees `<JobListItem>` in a tree finds the file without searching.
- MUST group a component's parts into one directory named for the component once it has sub-components, so the parts that change together sit together.
- MUST NOT scatter a component's parts across sibling directories, or leave a sub-component beside an unrelated component because it happened to be written there first.
- SHOULD name the parent's file after the component and each part's file after what it exports, prefixed by the parent's name (`job-list-item.tsx` exports `JobListItem`) — but MUST follow the host project's existing shape where it differs, such as a parent file sitting beside its directory with role-named parts (`job-list.tsx` alongside `job-list/loaded.tsx`).
- SHOULD keep a component with no sub-components as a single file, unless the host project gives every component its own directory — some do, and consistency there beats saving a directory.
- MUST follow the host project's directory layout for where component directories themselves live — a feature-owned components directory, a route-local underscore directory, or a shared component root — rather than imposing a new one.

## Exports

Named exports let a reader match an import to a file without opening it, and let a file grow a second exported part without churn. A default export is reserved for the one case a framework demands it: a route or page module whose framework loads it by file position.

**Guidelines:**

- MUST use named exports for components.
- MUST reserve `export default` for route, page, or layout modules whose framework requires it.
- SHOULD write the export inline (`export function JobListItem(…)`) as the default; follow the host project's convention where it consistently uses a trailing `export { … }` block instead.
- MUST NOT mix both forms within one file.

### Barrel Files

A barrel re-exports a directory's public parts from one module. It shortens imports and hides which file a part lives in — which is a cost as often as a benefit, because it also hides that an import reaches into a component's internals.

**Guidelines:**

- SHOULD NOT add a barrel file by default; import each part from the file that defines it.
- MUST match the host project's barrel convention where it consistently uses them, following its placement and naming — while respecting the project's development practices, which prohibit importing _through_ a barrel where a direct path exists. A barrel added under this rule serves consumers outside the directory, not siblings inside it.
- MUST, when a barrel exists, export only the parts a consumer outside the directory may use, keeping internal parts (a context module, a private sub-component) out of it.

## Compound Components

A component with configurable parts is a set of cooperating components, not one component with a render prop for every slot. The parts are exported **flat**, each name prefixed by the parent's, so the tree reads as `<Button><ButtonIcon /><ButtonText>Save</ButtonText></Button>`.

Do not attach parts to the parent as properties (`Button.Text`). The dot form defeats tree-shaking, obscures where each part is defined, and reads as a namespace the parent does not actually own.

Variant state reaches the parts through a **private context** the parent provides, so a caller sets `variant` once on the parent instead of repeating it on every child. The context hook throws when a part renders outside its parent, turning a misuse into an immediate, named error.

**Example** — three files, then the call site:

```tsx
// button-context.tsx — private to the directory; not exported from a barrel
export type ButtonVariant = "primary" | "danger";

type ButtonContextValue = { variant: ButtonVariant };

const ButtonContext = createContext<ButtonContextValue | null>(null);

export const ButtonContextProvider = ButtonContext.Provider;

export function useButtonContext({
  componentName,
}: {
  componentName: string;
}): ButtonContextValue {
  const value = useContext(ButtonContext);

  if (value === null) {
    throw new Error(
      `<${componentName}> must be used within a <Button> component.`,
    );
  }

  return value;
}
```

```tsx
// button.tsx — the parent owns the variant and publishes it
import { ButtonContextProvider, type ButtonVariant } from "./button-context";

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({
  variant = "primary",
  children,
  ...props
}: ButtonProps): JSX.Element {
  // Manual-memoization regime only — an auto-memoizing compiler already covers this.
  const context = useMemo(() => ({ variant }), [variant]);

  return (
    <ButtonContextProvider value={context}>
      <button {...props}>{children}</button>
    </ButtonContextProvider>
  );
}
```

```tsx
// button-text.tsx — a part reads the variant instead of re-declaring it
export function ButtonText({
  children,
  ...props
}: ComponentProps<"span">): JSX.Element {
  const { variant } = useButtonContext({ componentName: "ButtonText" });

  return (
    <span className={styles[variant]} {...props}>
      {children}
    </span>
  );
}
```

The caller sets `variant` once, and every part picks it up:

```tsx
<Button variant="danger" onClick={onDelete}>
  <ButtonIcon icon={TrashIcon} />
  <ButtonText>Delete</ButtonText>
</Button>
```

`ButtonText` renders outside a `<Button>` — a copy-paste into another tree, say — and `useButtonContext` throws `<ButtonText> must be used within a <Button> component.` rather than rendering with a silently wrong variant.

**Guidelines:**

- MUST export compound parts as flat, named exports whose names begin with the parent component's name.
- MUST NOT expose parts as properties of the parent component (`Button.Text`, `Card.Header`).
- MUST pass variant state (`variant`, `intent`, `size`, and similar) from the parent to its parts through a private context rather than re-declaring those props on every part.
- SHOULD place that context in a module named `<parent>-context.tsx` beside the parts it serves.
- MUST expose the context through a hook that throws when a part renders outside its parent, naming both — the general contract for a context hook lives in [state.md](./state.md).
- MUST NOT export the context or its hook outside the component's own directory.
- SHOULD keep a part's own props limited to what that part alone varies; anything the whole component varies belongs on the parent.

## Primitive and Domain Components

A **primitive** knows nothing about the product's domain — a button, a text field, a select list. A **domain component** knows one entity and composes primitives to present it — a feed row, a collection list item. Keeping them apart is what lets a primitive serve a second feature without carrying the first feature's vocabulary.

A domain component **composes** a primitive; it never re-implements the primitive's appearance, and it never reaches into the primitive's internals to restyle it.

**Guidelines:**

- MUST place primitives in the host project's shared component location and domain components with the feature that owns their entity.
- MUST compose an existing primitive rather than re-creating its appearance; re-implementing a control that already exists is a defect, not a shortcut.
- MUST NOT give a primitive a prop, a branch, or a name that refers to a domain entity.
- SHOULD build a domain wrapper around a primitive when a feature needs the primitive bound to something specific — a form library's field controller, or one entity's shape — rather than adding that binding to the primitive itself.

### Promotion

Promoting too early costs as much as promoting too late. A component pulled into the shared location before a second consumer exists gets shaped entirely by the first caller's needs, and the second caller then either bends to a fit nobody designed for it or quietly forks. Waiting until the pattern has actually repeated is what makes the shared version's shape trustworthy.

**Guidelines:**

- MUST keep a component in the feature that owns it until a second feature needs it identically, or a third needs it at all; only then promote it to the shared location. This deliberately tightens, for components specifically, the second-consumer threshold the project's code-maintainability practices set for modules generally — a shared component is far more expensive to reshape than a shared helper.
- SHOULD promote by moving the component and updating its importers in one change, rather than copying it and leaving two divergent versions.

Building a variant, prop, or slot no current consumer uses is prohibited by the project's code-maintainability practices, which own speculative-configuration rules generally.

## Icon Components

A component that renders a fixed icon imports it directly. A component that lets its caller choose the icon accepts the **icon component itself** as a prop — not a glyph-name string, which defeats type checking and hides which icons a bundle actually includes.

**Example:**

```tsx
export function MenuItem({
  icon: Icon,
  label,
  style,
  ...props
}: ComponentPropsWithRef<typeof View> & {
  icon: ComponentType<{ color?: string; size?: number }>;
  label: string;
}): JSX.Element {
  return (
    <View style={[styles.item, style]} {...props}>
      <Icon color={theme.colors.text.neutral.base} size={24} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
```

**Guidelines:**

- MUST alias a component-typed icon prop to a capitalized local name (`icon: Icon`) so it renders as an element rather than an unknown tag.
- MUST spread the rest object onto the root even when a component's only visible job is to place an icon and a label; an icon wrapper is a component like any other.

What an icon is coloured and sized _with_ — a token, `currentColor`, or a literal — and which icon set a project draws from are owned by the project's React component styling practices, not restated here. That capability also owns the rule that a caller-chosen icon arrives as a component rather than a glyph-name string; this section covers only how that prop is received and forwarded.
