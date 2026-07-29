# Authentication

Apply this reference when wiring sessions, protecting a route or an endpoint, or reviewing whether a change actually enforces the access control it appears to.

This reference covers the framework mechanics. Threat modelling, credential storage, and the access-control lens belong to an application security capability; the auth provider itself is named by role, never by SDK.

## Session Strategies

Two shapes cover most applications:

- **Stateless (signed token in a cookie).** The session is self-describing and verified by signature. Cheap to read, hard to revoke before expiry.
- **Stateful (opaque id in a cookie, record in a store).** Revocation is immediate; every verification costs a lookup.

**Guidelines:**

- SHOULD choose stateful sessions when immediate revocation matters — an admin surface, anything handling payments or personal data.
- MUST set every session cookie `httpOnly`, `secure`, and `sameSite` at `lax` or `strict`, with an explicit `path` and a bounded `maxAge`.
- MUST NOT store a session token in `localStorage` or any client-readable location; a cookie the client script cannot read is the point.
- MUST rotate the session identifier on privilege change — sign-in, sign-out, role elevation — so a fixated session cannot be reused.
- MUST keep signing and encryption keys in server-only environment variables, never in a `NEXT_PUBLIC_` variable.

## Two Checks, Two Purposes

There are two places a check can live, and they are not alternatives.

**The optimistic check** runs in the proxy. It reads the session cookie's presence and shape and redirects an obviously-unauthenticated visitor away from a protected area. It is a user-experience optimization: it saves a render, and it is cheap enough to run on every matched request.

**The authoritative check** runs at the data layer — inside the data-access function, the server function, or the route handler that actually touches the record. It validates the session and confirms this caller may act on this record.

The proxy check can be bypassed. As the proxy reference explains, server functions are POSTs to the route that uses them, so a matcher change or a refactor silently drops proxy coverage. Nothing warns you.

**Guidelines:**

- MUST implement the authoritative check at the data layer for every read and write of non-public data.
- MAY add an optimistic proxy check for the redirect experience, and MUST NOT count it as the enforcement.
- MUST NOT treat cookie presence as authentication; presence is not validity.

## A Deduplicated Verifier

Session verification is called from many places in one request — a layout, a page, two server components, a server function. React's `cache()` makes the repeats free within the request.

```ts
// src/auth/session.ts
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

export const verifySession = cache(async () => {
  const token = (await cookies()).get("session")?.value;
  const session = token ? await validateSession(token) : null;
  if (!session) redirect("/sign-in");
  return session;
});
```

**Guidelines:**

- MUST fence the session module with `import "server-only"`.
- SHOULD wrap the verifier in React's `cache()` so repeat calls within one request cost one validation.
- MUST call the verifier inside **every** server function and route handler that touches non-public data, not once at a route's entry.
- MUST authorize by ownership after authenticating: a valid session proves who is calling, not what they may touch.
- SHOULD return a narrow session object — the user id and the claims the caller needs — rather than the whole user record.

## The Layout Caveat

A layout looks like the natural place to protect a subtree. It is not sufficient, for two independent reasons:

1. **Layouts do not re-render on navigation.** A check that ran when the layout mounted does not run again as the user moves between routes beneath it, so a session that expired or a role that changed mid-session is not noticed.
2. **A layout does not wrap every path to the data.** Server functions and route handlers beneath that segment are reached without rendering the layout at all.

**Guidelines:**

- MUST NOT rely on a layout check as the authorization boundary for anything below it.
- MAY read session data in a layout for presentation — showing a name, an avatar, a role-conditional nav item.
- MUST perform the enforcing check in each page, server function, handler, and data-access function that touches protected data.

## Degrading Without a Provider

A local checkout, a preview deployment, or a CI run frequently has no auth provider configured. Crashing at import time makes the whole application unbootable; silently treating everyone as signed in is worse.

**Guidelines:**

- MUST fail closed when the auth provider is unconfigured: treat every session as absent, never as valid.
- SHOULD detect the missing configuration at startup and log it once at a level that is visible, rather than throwing per request.
- MUST NOT ship a development bypass that a production build can reach; gate any such path on a build-time constant that is provably false in production.
- SHOULD keep provider configuration behind a single environment-reading module so a missing variable is reported in one place with a useful message.

**Review checks:**

- A protected page, server function, or handler whose only check is in the proxy or an ancestor layout — **Critical**.
- A session read but not validated — presence of a cookie treated as authentication — **Critical**.
- Authentication performed without an ownership check on the specific record — **Critical**.
- A session cookie set without `httpOnly`, `secure`, or `sameSite` — **Critical**.
- A signing key, session secret, or provider secret in a `NEXT_PUBLIC_` variable — **Critical**; it is inlined into the client bundle.
- An unconfigured auth provider defaulting to an authenticated session — **Critical**.
- The session identifier not rotated on sign-in — **Major**.
- A session verifier called per component with no `cache()` wrapper — **Minor**; it multiplies the lookup per request.
