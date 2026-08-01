# Mutations

Apply this reference when writing or reviewing anything that changes state — a server function, a form submission, or a client-initiated write.

## Server Functions Are the Default

A server function is an async function marked `"use server"` that the client may call directly. The framework generates the endpoint, the client calls it as a POST, and the result comes back in the same round trip that re-renders the affected tree.

```tsx
// src/article/models/article-actions.ts
"use server";

export async function publishArticle(formData: FormData) {
  const session = await verifySession();
  const id = ArticleId.parse(formData.get("id"));
  await assertCanPublish(session, id);
  await articleRepository.publish(id);
  updateTag(`article-${id}`);
}
```

```tsx
// the form — no client component required
<form action={publishArticle}>
  <input type="hidden" name="id" value={article.id} />
  <button type="submit">Publish</button>
</form>
```

For pending state and returned errors, `useActionState` wires the same function to a Client Component:

```tsx
"use client";
const [state, formAction, isPending] = useActionState(publishArticle, {
  error: null,
});
```

**Guidelines:**

- SHOULD default to a server function for a mutation initiated by this application's own UI.
- SHOULD pass a server function directly as a form `action` when no pending state or returned error is needed, so the form works without JavaScript.
- SHOULD use `useActionState` when the form needs pending state, a returned error, or optimistic UI, rather than hand-rolling a fetch.
- MUST NOT wrap a server function in a client-side `fetch` to the generated endpoint; call it directly.

## The Three Checks

A server function is a public endpoint. The UI around it constrains nothing — an attacker calls the function, not the form. Every server function performs three checks in order, in its own body, before it writes:

1. **Authenticate** — establish who is calling. A missing session is a rejection, not a default.
2. **Authorize by ownership** — confirm this caller may act on _this_ record. A session proves identity, not entitlement.
3. **Validate** — parse every argument into the shape the write expects. Arguments arrive as whatever the caller sent.

```ts
const session = await verifySession(); // 1 — throws or returns a session
const input = UpdateArticleInput.parse(raw); // 3 — parse, don't cast
await assertOwns(session.userId, input.id); // 2 — this caller, this record
```

**Guidelines:**

- MUST authenticate inside every server function, never relying on the proxy or a layout to have done it.
- MUST authorize against the specific record being changed, not merely against a role; a signed-in user who may edit _an_ article may not edit _this_ one.
- MUST parse and validate every argument with a schema rather than casting it; `FormData` values are `string | File`, and a type assertion checks nothing at runtime.
- MUST NOT accept an identifier for the acting user from the client; derive it from the session.
- SHOULD reject with a controlled error before any write when a check fails, and never partially apply a mutation.

## Thin Function Over a Fenced Module

The exposed function is a boundary, not a place for business logic. Keeping it thin over a `server-only` module means the logic stays reusable and unit-testable, and the exposed surface stays small enough to audit.

**Guidelines:**

- SHOULD keep a server function to its three checks plus a call into a fenced module and an invalidation.
- MUST keep mutation modules (`"use server"`) and data-access modules (`server-only`) in separate files.
- SHOULD prefer an inline `"use server"` in the single exported function over a file-level directive, so a helper added to the file later is not exposed by accident.

## Return Values and Navigation

Whatever a server function returns crosses to the client, so an error object returned for debugging convenience publishes its stack. Navigation has a stranger failure: `redirect()` works by throwing, so an ordinary `try`/`catch` around it swallows the navigation and the user simply stays where they were.

**Guidelines:**

- MUST return only serializable, non-sensitive values; the return value crosses to the client.
- MUST NOT return a raw error object or a stack trace; map failures to a controlled shape the UI can render.
- MUST call `redirect()` **outside** a `try`/`catch`, or rethrow with `unstable_rethrow`. `redirect()` works by throwing a control-flow error, and a surrounding `catch` swallows it — the navigation silently does not happen.
- SHOULD invalidate the cache entries the write affects before returning; see the caching reference for which API to use.

## Encryption, Origins, and Render-Time Writes

Three smaller traps around the same surface. A server function defined inside a component captures its enclosing scope, and those captured values are encrypted and shipped to the client — which makes a captured secret both a disclosure risk and a thing that breaks across a deploy when the build key rotates.

**Guidelines:**

- MUST NOT close over a secret in a server function defined inside a component; closed-over values are encrypted with a per-build key and sent to the client, and a key rotation across a deploy invalidates them.
- SHOULD configure `serverActions.allowedOrigins` when the application is served behind a proxy or on multiple hostnames, so the built-in origin check does not reject legitimate calls or accept forged ones.
- MUST NOT call a server function during render; mutations belong in event handlers, form actions, and effects.
- SHOULD keep server functions idempotent where the operation allows it, since a retried submission is indistinguishable from a duplicate one.

## Calling an External Backend Instead

When the write belongs to a service this application does not own, the server function becomes a thin proxy — and the three checks still apply on this side, because the backend's own authorization does not cover what this application chose to send.

**Guidelines:**

- MUST authenticate and authorize locally even when delegating the write, unless the backend receives the end user's own credential rather than a service credential.
- MUST NOT forward a client-supplied identifier as the acting principal to a backend that trusts it.
- SHOULD keep the service credential in a `server-only` module and never in a value that could be returned or logged.

**Review checks:**

- A `"use server"` function that reads or writes non-public data with no authentication check — **Critical**.
- A server function authorizing by role but not by ownership of the specific record — **Critical**.
- An acting user id taken from an argument rather than from the session — **Critical**.
- Arguments cast (`as`) rather than parsed before a write — **Major**.
- `redirect()` called inside a `try` with a `catch` that does not rethrow control-flow errors — **Major**; the redirect silently never happens.
- A write with no cache invalidation for the data it changed — **Major**; readers keep serving stale content.
- A raw error or stack trace returned to the client — **Major**.
