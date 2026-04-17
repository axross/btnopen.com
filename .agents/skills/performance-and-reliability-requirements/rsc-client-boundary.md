# RSC / Client Component Boundary Cost

Apply these rules to verify Server / Client component composition does not create avoidable latency or unnecessary client JS.

## Async Waterfalls

- MUST flag a Major when a Server Component does `await getA()` followed by `await getB()` where `getB` does not depend on `getA`. Use `Promise.all([getA(), getB()])`, or pass each as a `Promise<T>` prop down to the consuming child per [react-component-guidelines › client-vs-server-components](../react-component-guidelines/client-vs-server-components.md).
- MUST flag a Critical when the diff converts a `Promise<T>`-prop pattern back into an awaited-at-parent pattern without a stated reason — that change re-introduces the waterfall.
- SHOULD flag the existing pattern in `app/(app)/posts/[slug]/page.tsx` as the reference: `params`, `searchParams`, and `getBlogPost(…)` are derived as Promises and passed to children that `await` them inside `<Suspense>` boundaries.

## Suspense Granularity

- MUST flag a Major when a single `<Suspense>` boundary wraps two independently-slow async children. Split into one boundary per slow unit so each can stream to the client as it resolves.
- MUST flag a Major when `<Suspense>` is missing for an async Server Component that has a meaningful loading state — without it, the parent route blocks until the data arrives.
- MUST flag a Minor when `<Suspense fallback={…}>` provides a fallback for a side-effect-only component (e.g., a JSON-LD injector). Side-effect components SHOULD use `<Suspense>` without a fallback per [react-component-guidelines › server-components](../react-component-guidelines/server-components.md).

## Loading / Loaded Split

- MUST flag a Major when a new component performs data fetching but does not split into `<name>/loaded.tsx` + `<name>/loading.tsx` + `<name>.tsx` orchestrator when the loading state is user-visible. The existing `app/(app)/_/components/webembed/` is the canonical layout.
- MUST flag a Critical when a `loading.tsx` skeleton imports the loaded data type and renders fields from it — the skeleton MUST render with no data so it can show before the fetch resolves.
- MUST flag a Major when the orchestrator does not propagate `data-testid={…+ "-loading"}` to the `<Loading>` fallback — e2e cannot assert the skeleton state otherwise.

## Client Component Promotion

- MUST flag a Major when the diff adds `"use client"` to a component whose only client-needing reason is a small interactive subtree (e.g., one button). Extract the interactive part into its own Client Component and keep the parent as a Server Component.
- MUST flag a Critical when adding `"use client"` causes a previously server-only data fetch to ship to the browser. Lift the fetch into the parent RSC and pass the result as a (non-Promise) prop.
- MUST flag a Critical when a `"use client"` file imports a function that itself imports `payload`, `@payloadcms/*`, `unified`, `@shikijs/*`, `@sentry/nextjs`'s server APIs, `pino`, or `server-only`. Cross-reference with [bundle-weight.md](./bundle-weight.md).

## React Compiler Implications

`next.config.ts` enables `reactCompiler: true`. The reviewer SHOULD be aware:

- Manual `useMemo` / `useCallback` in new Client Components are usually unnecessary — the compiler memoizes. Flag as Minor when a new `useMemo` or `useCallback` is added without a reason the compiler cannot handle (e.g., a referential identity required by a third-party library).
- The compiler does NOT optimize Server Components — they re-execute on every request unless wrapped in `"use cache"`. Flag a Major when an expensive computation lives in a non-cached Server Component.

## `cacheComponents` Implications

`next.config.ts` enables `cacheComponents: true` (formerly known as PPR / Partial Prerendering). The reviewer SHOULD be aware:

- A Server Component that reads `cookies()` / `headers()` / `searchParams` switches the parent to dynamic rendering. Flag a Major when a previously-static route gains a new request-bound read in an unexpected place (e.g., a deep child).
- The reviewer MUST NOT recommend disabling `cacheComponents` or `reactCompiler` to "fix" a perf issue — escalate to the human owner per [code-review-guideline › escalation](../code-review-guideline/escalation.md).
