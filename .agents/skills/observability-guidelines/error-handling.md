# Error Handling

Apply these rules when writing, reviewing, or modifying any code that might throw or receive an error.

## Placement of try-catch

- MUST place `try-catch` blocks at the **root call site** — the outermost function that initiates an operation (e.g., a route handler, a React Server Component, or an API route).
- MUST NOT swallow errors silently in nested helpers. Let errors propagate naturally up the call stack so the root call site can handle them.
- MUST rethrow a caught error when the catch block exists only for a side effect (e.g., logging). Catching without rethrowing hides the error from the root call site.

```typescript
// CORRECT — nested helper lets errors propagate
async function fetchBlogPost(slug: string) {
  const result = await payloadClient.find({ collection: "posts", where: { slug: { equals: slug } } });
  return result;
}

// CORRECT — root call site catches, reports, then handles
export async function GET(request: Request) {
  try {
    const post = await fetchBlogPost(slug);
    return Response.json(post);
  } catch (error) {
    captureException(error);
    return notFound();
  }
}

// WRONG — nested helper swallows the error
async function fetchBlogPost(slug: string) {
  try {
    return await payloadClient.find(...);
  } catch (error) {
    console.error(error); // error is lost after this
  }
}
```

## Reporting to Sentry

- MUST call `captureException()` from `@sentry/nextjs` whenever a caught error represents an unexpected failure that should be investigated.
- MUST import from `@sentry/nextjs`, not from `@sentry/node` or other Sentry packages, to stay consistent with the Next.js integration.
- SHOULD call `captureException()` before any early return or redirect so the report is always sent, even when execution continues along an alternate path.

```typescript
import { captureException } from "@sentry/nextjs";

try {
  imageBuffer = await retrieveImageFromVercelBlob(filename);
} catch (error) {
  captureException(error);
  notFound(); // early exit after reporting
}
```

- SHOULD also use `captureException()` to report non-thrown unexpected states — for example, receiving an unrecognized data type:

```typescript
unknownHandler: (_state, node) => {
  captureException(new Error(`Handled unknown mdast node (type: ${node.type}).`));
},
```

## Next.js Error Boundaries

- MUST keep `app/(app)/global-error.tsx` as the last-resort error boundary for the entire application. This file MUST call `captureException(error)` inside a `useEffect` so that unexpected React render errors are also reported to Sentry.
- MUST NOT remove or bypass the global error boundary.
- MAY add route-specific `error.tsx` files for routes that need customized error UI, following the same `captureException` pattern.

```typescript
// app/(app)/global-error.tsx
"use client";

import { captureException } from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  // ...
}
```

## Error Messages

- SHOULD write error messages that identify the exact function or condition that failed, so Sentry issues are immediately actionable without reading the stack trace.

```typescript
// GOOD — context is clear from the message alone
throw new Error(
  `retrieveImageFromVercelBlob() was called but the Vercel Blob token is null.`
);

// LESS GOOD — requires stack trace to understand
throw new Error("Token is missing.");
```
