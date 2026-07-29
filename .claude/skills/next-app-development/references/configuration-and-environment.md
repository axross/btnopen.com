# Configuration and Environment

Apply this reference when editing `next.config.ts`, adding an environment variable, reading configuration at runtime, or reviewing a change to either.

## A Typed Config

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.example.com" }],
  },
};

export default nextConfig;
```

**Guidelines:**

- SHOULD write the config as `next.config.ts` with the `NextConfig` type, so an unknown or misspelled option is a type error rather than a silent no-op.
- SHOULD compose plugin wrappers explicitly and in a documented order when more than one wraps the config; the order changes the result.
- MUST treat a change to a behaviour-changing option — `cacheComponents`, `reactCompiler`, `output`, `serverExternalPackages`, `images` — as its own change with its own review, not as a line inside a feature.
- MUST NOT read secrets in the config file for the purpose of passing them to the client; see the inlining rules below.

## Turbopack Is the Default

Turbopack is stable and used by both `next dev` and `next build` as of v16. Consequently, **a project with a custom `webpack` config fails the build** — deliberately, to prevent a silently ignored configuration.

Three ways out, in order of preference: migrate the webpack config to Turbopack options; run `next build --turbopack` to ignore the webpack config; or run `next build --webpack` to keep using webpack.

The `experimental.turbopack` option moved to a top-level `turbopack` key.

**Guidelines:**

- SHOULD use Turbopack for both development and production, and migrate a webpack config rather than opting out.
- MUST move `experimental.turbopack` to the top-level `turbopack` key when arriving on v16.
- SHOULD check whether a plugin injected the `webpack` option when a build fails citing one that the project did not write.
- MUST NOT use the `~` prefix in Sass imports from `node_modules`; Turbopack does not support it.

## Environment Files

Precedence, highest first: the process environment, then `.env.$(NODE_ENV).local`, then `.env.local` (not loaded in test), then `.env.$(NODE_ENV)`, then `.env`. All of them live at the repository root regardless of the source root.

**Guidelines:**

- MUST commit `.env.example` documenting every variable the application reads, and MUST NOT commit `.env.local` or any file holding a real secret.
- MUST keep environment files at the repository root; they are not read from a source root.
- SHOULD keep `.env` for non-secret defaults that are safe in version control, and put real values in `.env.local`.

## `NEXT_PUBLIC_` Inlines

A variable prefixed `NEXT_PUBLIC_` is **inlined into the client bundle at build time**. It is public, permanently, for that build.

The inlining is a literal text substitution, which has a consequence people trip on: it only happens when the variable is written out in full.

```ts
process.env.NEXT_PUBLIC_API_URL; // inlined
const key = "NEXT_PUBLIC_API_URL";
process.env[key]; // NOT inlined — undefined in the browser
```

**Guidelines:**

- MUST NOT prefix any secret with `NEXT_PUBLIC_`; the prefix publishes it.
- MUST reference a `NEXT_PUBLIC_` variable by its full literal name, never through a computed key or destructuring of `process.env`.
- MUST rebuild after changing a `NEXT_PUBLIC_` value; it is baked into the bundle, and changing the deployment environment does not change it.
- SHOULD keep the count of public variables small and reviewed; each is a permanent disclosure.

## One Environment Module

Reads scattered across a codebase fail one at a time, at whatever moment the code path first runs — usually in production, usually as `undefined` flowing into something that does not check.

```ts
// src/env.ts
import "server-only";

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL", process.env.DATABASE_URL),
  sessionSecret: required("SESSION_SECRET", process.env.SESSION_SECRET),
};
```

**Guidelines:**

- SHOULD centralize environment reads in one module that validates presence and shape at startup, so a missing variable fails immediately with a useful name.
- MUST fence a server environment module with `import "server-only"`, and keep public variables in a separate unfenced module.
- MUST NOT default a security-relevant variable to a permissive value when it is missing; fail closed.
- SHOULD parse non-string values (ports, flags, URLs) into their real types in that module rather than at each call site.

## Build Time Versus Runtime

`process.env` read during a static render is evaluated at **build** time and frozen into the output. `connection()` forces a runtime boundary, guaranteeing the read happens per request.

```tsx
import { connection } from "next/server";

export default async function Page() {
  await connection();
  const value = process.env.RUNTIME_CONFIG; // read at request time
}
```

**Guidelines:**

- MUST call `await connection()` before reading an environment variable whose value must reflect the running environment rather than the build.
- MUST NOT read a runtime-varying variable inside a `"use cache"` scope; it is baked into the entry.
- SHOULD use `@next/env` to load the same environment files in scripts, migrations, and tooling that run outside the framework, so they resolve variables identically.

## Runtime Config Is Gone

`serverRuntimeConfig` and `publicRuntimeConfig`, with `getConfig()` from `next/config`, were removed in v16. Server values are read from `process.env` directly on the server; client values use the `NEXT_PUBLIC_` prefix.

**Guidelines:**

- MUST NOT add `serverRuntimeConfig` or `publicRuntimeConfig`; they no longer exist.
- MUST replace an existing `getConfig()` call with a direct `process.env` read on the server or a `NEXT_PUBLIC_` variable on the client.
- MAY use the taint API to make accidentally passing a server value to a Client Component a runtime error.

**Review checks:**

- A secret prefixed `NEXT_PUBLIC_` — **Critical**; it is inlined into the client bundle and published.
- A `NEXT_PUBLIC_` variable read through a computed key — **Major**; it is `undefined` in the browser with no error.
- A security-relevant environment variable defaulting to a permissive value when absent — **Critical**.
- A behaviour-changing config option flipped inside an unrelated feature change — **Major**.
- An environment read that must vary at runtime with no `connection()` before it — **Major**; it freezes the build-time value.
- `serverRuntimeConfig`, `publicRuntimeConfig`, or `getConfig()` in new code — **Critical**; removed in v16.
- A committed `.env` file containing a real credential — **Critical**.
