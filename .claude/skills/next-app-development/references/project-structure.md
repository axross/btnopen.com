# Project Structure

Apply this reference when creating a Next.js application's directory layout, adding a feature to an existing one, or judging where a new file belongs in a review.

## Source Root and Feature Directories

The router only cares about one directory. Everything else is yours to organize, and the failure mode is letting `app/` absorb code that has nothing to do with routing — a route directory that accumulates components, queries, and helpers becomes unmovable, because every import points at a URL path rather than at a capability.

The default is a `src/` source root holding feature directories, with `src/app/` as the router's entrypoint layer:

```
src/
├── app/                      # thin route entrypoints only
│   ├── layout.tsx
│   ├── page.tsx
│   └── articles/[slug]/page.tsx
├── article/                  # a feature: everything about articles
│   ├── article-repository.ts
│   ├── article-card.tsx
│   └── article-detail.tsx
├── auth/
└── shared/                   # cross-feature primitives
```

A route file then reads as a composition of feature imports rather than as an implementation:

```tsx
// src/app/articles/[slug]/page.tsx
import { ArticleDetail } from "@/article/article-detail";

export default async function Page(props: PageProps<"/articles/[slug]">) {
  const { slug } = await props.params;
  return <ArticleDetail slug={slug} />;
}
```

**Guidelines:**

- MUST follow the host repository's existing source-root convention when it has one — a repository-root `app/` is as valid as `src/app/`, and moving it is a migration, not a side effect of a feature change.
- SHOULD default a new application to a `src/` source root with feature directories beneath it, and `src/app/` reserved for route entrypoints.
- MUST keep `app/` route files thin: a route module composes and configures, and imports its substance from a feature directory.
- SHOULD group by feature rather than by file kind — an `article/` directory holding its component, its queries, and its types beats parallel `components/`, `queries/`, and `types/` trees that force a three-directory edit per change.
- SHOULD place code shared by more than one feature in a clearly named shared directory rather than in whichever feature happened to need it first.
- MUST NOT import from one feature's internals into another when the owning feature exposes a public surface; cross-feature reuse is a signal to promote the code to the shared directory.

## Import Alias

A relative import that climbs more than one level stops describing where the target is and starts describing where the importer is. An alias fixes the target's address so a file can move without rewriting its imports.

**Guidelines:**

- SHOULD default a new application to the `@/*` alias mapped at the source root, declared once in `tsconfig.json`'s `paths` and left for the framework to resolve.
- MUST match the host repository's existing alias when it has one — `~/*` and `@/*` are equally valid, and mixing them in one codebase is the defect.
- SHOULD use the alias for any cross-directory import, and reserve relative imports for siblings and direct children within one feature.

## File Naming

Case-insensitive filesystems make a case-only rename invisible locally and breaking in CI. A single lowercase convention removes the class of bug.

**Guidelines:**

- SHOULD name files and directories in kebab-case by default — `article-card.tsx`, not `ArticleCard.tsx` or `articleCard.tsx`.
- MUST follow the host repository's existing file-naming convention where one is established, rather than introducing a second one.
- MUST keep the router's special filenames exactly as the framework spells them (`page.tsx`, `layout.tsx`, `route.ts`); they are not subject to the project's naming convention.
- SHOULD NOT use `.client.tsx` and `.server.tsx` filename suffixes to mark the boundary. The directive at the top of the file is the marker, the suffix duplicates it, and the two drift. Follow the host repository where it has already adopted them.

## Barrel Files

A barrel — an `index.ts` re-exporting a directory — reads well and costs real money: it defeats tree-shaking, expands the module graph a bundler must walk, and turns one changed file into a rebuild of everything that imported the barrel.

**Guidelines:**

- SHOULD NOT add barrel files by default; import from the defining module directly.
- MUST follow the host repository's convention where barrels are already established, rather than introducing a mixed style.
- SHOULD import from the defining module even inside a repository that uses barrels, when the import crosses into a large third-party package (see the bundling reference for the tree-shaking consequences).

## Root-Level Files

Some files are addressed by tooling that looks in the repository root, not in the source root — moving them under `src/` makes them silently inert, which is the worst failure mode available.

**Guidelines:**

- MUST keep `next.config.ts`, `package.json`, `tsconfig.json`, and the linter and formatter configuration at the repository root regardless of the source root.
- MUST keep `.env`, `.env.local`, and the rest of the environment files at the repository root; the framework does not read them from a source root.
- MUST place `proxy.ts` beside `app/` — at the repository root when `app/` is at the root, and inside `src/` when `app/` is under `src/`. A proxy at the wrong level never runs, and nothing reports that it did not.
- SHOULD keep `instrumentation.ts` and `instrumentation-client.ts` at the same level as `app/`, for the same reason.

## Generated Output

`.next/` looks like a directory of source files and is not one. Every file in it is reproduced by the next build, so an edit there survives exactly until someone runs the build — and an import from it works locally and fails in CI.

**Guidelines:**

- MUST treat `.next/` as build output: never edit it, never commit it, and never import from it.
- MUST commit generated route types produced by the type generator only if the host repository already does; otherwise generate them in the build and ignore them.
- SHOULD ignore `.next/dev/` explicitly where a repository ignores build output by exact path, since development and build output now land in separate directories.

## Restructuring an Existing Tree

A layout change touches every import that crosses it, which makes it the kind of diff nobody can review alongside a behaviour change — the moved lines bury the changed ones.

**Guidelines:**

- MUST NOT restructure a repository's layout as a side effect of an unrelated change; propose it as its own change with its own review.
- SHOULD move one feature at a time when a restructure is agreed, keeping each step independently reviewable and the build green between steps.
- MUST update the alias mapping and every affected import in the same commit as a move, so no intermediate state fails to resolve.

**Review checks:**

- A new component, query, or helper defined inside an `app/` route directory when the repository keeps those in feature directories — **Minor**, or **Major** when it duplicates a feature module that already exists.
- A `proxy.ts`, `instrumentation.ts`, or `.env` file placed at a level where the framework does not load it — **Major**; the file looks active and does nothing.
- A second import alias or a second file-naming convention introduced alongside an established one — **Minor**.
