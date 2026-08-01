# Path Aliases

The TypeScript aliases in `tsconfig.json` make shared app, Payload, and e2e imports stable across route directories.

| Alias | Target | Use for |
| ----- | ------ | ------- |
| `@/*` | `app/(app)/_/*` | Shared app components, helpers, repositories, and the app runtime barrel |
| `@/shared/*` | `shared/*` | Realm-neutral modules the app and the Payload realm both import |
| `@/payload/config` | `payload/config.ts` | Payload config imports from app and Payload-owned route files |
| `@/payload/editor` | `payload/helpers/editor.ts` | Payload Lexical editor helper imports |
| `@/e2e/*` | `e2e/*` | Playwright helper imports |

**Guidelines:**

- MUST use the existing alias when importing a shared module across route boundaries.
- MUST import a `shared/` module through `@/shared/*` from both realms; the alias is the seam that lets `payload/` reach the module without importing `app/`.
- MUST keep route-local imports relative when both files live in the same route-owned subtree.
- MUST update this section when `tsconfig.json` path aliases are added, removed, or repointed.
- MUST NOT add a new alias without confirming it improves ownership clarity beyond the existing `@/*`, Payload, or e2e aliases.
- SHOULD prefer direct module imports over barrel files, per the software development capability's code-quality rules.
- SHOULD prefer an alias over a deep relative import that crosses more than two directory levels, per [architecture-boundaries.md](./architecture-boundaries.md).
