# Testable Components

## `data-testid` Attribute

`data-testid` Attribute sets the required project default: add `data-testid` attributes to all meaningful UI elements that need to be identifiable in tests.

**Guidelines:**

- MUST add `data-testid` attributes to all meaningful UI elements that need to be identifiable in tests.
- MUST use kebab-case for `data-testid` values (e.g., `"blog-post"`, `"cover-image"`).
- SHOULD accept `"data-testid"` as an explicit prop when the component may be used in different contexts so the caller can customise the test ID.
- MUST spread `...props` onto the root element so that `data-testid` (and other `data-*` attributes) propagate automatically when using the `ComponentProps<T>` pattern.

**Example:**

```tsx
export async function BlogPostHeader({
  blogPost: blogPostPromise,
  className,
  ...props
}: ComponentProps<"header"> & {
  blogPost: Promise<BlogPostDetail | null>;
}): Promise<JSX.Element> {
  const blogPost = await blogPostPromise;

  return (
    // data-testid supplied by the caller propagates via ...props
    <header className={clsx(css.header, className)} {...props}>
      <h1 className={css.title} data-testid="title">{blogPost.title}</h1>
      <div className={css.author} data-testid="author">{blogPost.author.name}</div>
    </header>
  );
}
```

## Nesting Pattern

Nesting Pattern captures the project-specific context for the checklist below: `data-testid` values MUST be intentionally **short and scope-relative**, not globally unique.

Structure overview:

```
page                  ← set on the top-level page element
  header              ← set on <BlogPostHeader> via prop
    title
    timestamp
    cover-image
    author
      avatar-image
      name
    tags
      tag             ← repeated for each list item
  content             ← set on the <main> wrapper
```

**Example:**

```tsx
// posts/[slug]/page.tsx  — sets top-level scope IDs
<article data-testid="page">
  <Suspense>
    <BlogPostHeader blogPost={blogPost} data-testid="header" />
  </Suspense>

  <main data-testid="content">
    <Suspense>
      <BlogPostContent slug={slug} draft={draft} />
    </Suspense>
  </main>
</article>
```

```tsx
// _components/blog-post-header.tsx  — uses relative IDs internally
<header {...props}>  {/* receives data-testid="header" from the page */}
  <h1 data-testid="title">{blogPost.title}</h1>
  <div data-testid="timestamp">...</div>
  <div data-testid="author">
    <Image data-testid="avatar-image" ... />
    <span data-testid="name">{blogPost.author.name}</span>
  </div>
  <ul data-testid="tags">
    {tags.map((tag) => (
      <li key={tag.slug} data-testid="tag">{tag.name}</li>
    ))}
  </ul>
</header>
```

```ts
// E2E test — chains .getByTestId() to navigate the tree
const header = page.getByTestId("page").getByTestId("header");

await expect(header.getByTestId("title")).toHaveText(blogPost.title);
await expect(header.getByTestId("author")).toHaveText(blogPost.author.name);

const tags = header.getByTestId("tags");
const firstTag = tags.getByTestId("tag").first();
```

**Guidelines:**

- MUST keep `data-testid` values intentionally **short and scope-relative**, not globally unique.
- SHOULD make E2E and unit tests navigate the tree by chaining `.getByTestId()` calls on progressively narrower locators. This mirrors the component hierarchy and keeps IDs readable.
- MUST make the page-level component own the **top scope** IDs (`"page"`, `"header"`, `"content"`) and pass them as props.
- MUST make each sub-component use only **relative, short IDs** for its internal elements (`"title"`, `"author"`, `"tags"`).

## Loading State IDs

Loading State IDs captures the project-specific context for the checklist below: When a component uses the [Loading / Loaded Split Pattern](./server-components.md), the orchestrator MUST propagate `data-testid` to the `<Loading>` fallback with a `-loading` suffix.

**Example:**

```tsx
export async function BlogPostList({
  "data-testid": dataTestId,
  ...props
}: ComponentProps<"ul"> & { "data-testid"?: string }): Promise<JSX.Element> {
  return (
    <Suspense
      fallback={
        <BlogPostListLoading
          data-testid={dataTestId ? `${dataTestId}-loading` : undefined}
          {...props}
        />
      }
    >
      <BlogPostListLoaded data-testid={dataTestId} {...props} />
    </Suspense>
  );
}
```

```ts
// E2E test — targets the loading skeleton before data arrives
const loading = page.getByTestId("blog-posts-loading");
await expect(loading).toBeVisible();

// After data loads, the loaded state appears
const loaded = page.getByTestId("blog-posts");
await expect(loaded).toBeVisible();
```

**Guidelines:**

- MUST make the orchestrator propagate `data-testid` to the `<Loading>` fallback with a `-loading` suffix when a component uses the [Loading / Loaded Split Pattern](./server-components.md).

## Additional `data-*` Attributes

Additional `data-*` Attributes describes an optional project path: use extra `data-*` attributes alongside `data-testid` to expose entity identifiers or state, allowing scoped targeting without requiring globally unique IDs.

**Guidelines:**

- MAY use extra `data-*` attributes alongside `data-testid` to expose entity identifiers or state, allowing scoped targeting without requiring globally unique IDs.

**Example:**

```tsx
// In the component
<li data-testid="blog-post" data-slug={post.slug}>...</li>
```

```ts
// In the E2E test — locate a specific post by slug
const blogPost = blogPostList.locator(
  `[data-testid="blog-post"][data-slug="${slug}"]`,
);
```
