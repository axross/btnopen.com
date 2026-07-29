# Deployment

Apply this reference when choosing an output mode, self-hosting, setting cache headers, shaping a CI pipeline, or reviewing a change that affects how the application is built and served.

## What the Application Declares

Some of the deployment contract is the application's, wherever it runs. Getting these right first means the platform choice becomes a swap rather than a rewrite.

**Guidelines:**

- MUST declare the Node.js version the application requires in `package.json`'s `engines`, and use the same version in CI and in the runtime image.
- MUST document every environment variable the application reads, and which are required at build time versus at runtime — the distinction determines whether a value can change without a rebuild.
- MUST NOT depend on writable local disk for anything that must survive a request; instances are replaceable and, on serverless, ephemeral.
- SHOULD expose a health endpoint that checks the dependencies the application cannot serve without, and returns a non-200 when they are down.
- SHOULD emit structured logs to stdout and let the platform collect them, rather than writing log files.

## Two Adapters, One Contract

A managed platform and a self-hosted pipeline are two implementations of the same contract, not two architectures.

| Concern            | Managed platform                        | Self-hosted                                              |
| ------------------ | --------------------------------------- | -------------------------------------------------------- |
| Build              | Built on push from the repository       | Built in CI, shipped as an image                         |
| Scaling            | Automatic, per-request instances        | Explicit — replicas, autoscaling rules                   |
| Runtime cache      | Often does not persist between requests | Persists in-process; bound it with the max-memory option |
| Shared cache       | Platform-provided handler               | Configure a cache handler (Redis, KV) for multi-instance |
| Image optimization | Provided                                | Runs in-process, or delegate to a CDN                    |
| Proxy              | May be deployed to the edge             | Runs in the Node.js server                               |

The behaviour that differs most is caching: in a serverless deployment, in-memory `"use cache"` entries typically do not persist between requests, so a cache that appears to work locally may never hit in production.

**Guidelines:**

- MUST configure a shared cache handler when self-hosting across more than one instance; per-instance memory caches diverge and users see different content per replica.
- MUST bound the in-memory cache size when self-hosting, or a long-lived process grows until it is killed.
- MUST NOT assume runtime cache persistence on a serverless platform; design so a miss is correct, just slower.
- SHOULD keep platform-specific configuration in one place, so moving between adapters is a bounded change.

## Output Modes

`output` decides what the build produces, and each non-default mode trades a capability for a packaging benefit. The dangerous one is the static export, which does not fail at build time for using unsupported features — it produces output that silently lacks them.

**Guidelines:**

- SHOULD leave `output` unset for a normal server deployment.
- SHOULD use `output: 'standalone'` for a container image; it produces a minimal server with only the traced dependencies, and the static and public directories must be copied in alongside it.
- MUST NOT use `output: 'export'` for an application that uses server functions, route handlers, the proxy, image optimization, or `"use cache"` — a static export supports none of them.
- MUST verify the traced dependency set when using standalone output; a runtime-only dependency loaded dynamically may not be traced.

## Version Skew

A deploy replaces the server while browsers still hold the previous build's client code. Those clients request chunks and server-function endpoints that no longer exist, and the failure looks like a random client error rather than a deploy artifact.

**Guidelines:**

- MUST set a stable `deploymentId` when a deployment can be served by more than one build simultaneously, so a client's requests are pinned to the build it loaded.
- SHOULD keep the previous build's static assets served for a window after a deploy rather than deleting them immediately.
- SHOULD detect a version mismatch on the client and prompt a reload rather than surfacing a chunk-load error.
- MUST use the same build identifier for the error tracker's release tag, so a spike is attributable to a deploy.

## CDN and Cache Headers

A CDN caches what the headers tell it to, with no idea whether a response was personalized. The two failure directions are opposite and both severe: caching a per-user response publicly serves one user's data to another, and caching a document immutably makes the site impossible to update.

**Guidelines:**

- MUST let immutable hashed assets under `_next/static` be cached indefinitely, and MUST NOT cache HTML documents with the same policy.
- MUST NOT cache a response that varies per user at a shared CDN; a personalized page cached publicly serves one user's content to another.
- SHOULD confirm the CDN forwards, rather than strips, the cache and stale-time headers the framework sets, since overriding them silently disables revalidation.
- SHOULD set `assetPrefix` when assets are served from a separate domain, and verify the domain's CORS headers cover font and worker requests.

## CI Shape

Ordering the pipeline cheapest-first means a type error costs seconds rather than a full build and browser run. The framework-specific wrinkle is that build-time environment variables are baked into the output, so a value missing during the CI build is missing in the artifact — with nothing failing to say so.

**Guidelines:**

- SHOULD run install, type-check, lint, unit tests, build, and end-to-end tests against the built output, in that order, so the cheapest check fails first.
- MUST provide build-time environment variables to the build step; a `NEXT_PUBLIC_` value missing at build is missing in the bundle, with no runtime error.
- MUST NOT print environment variables in CI logs, and MUST scope deployment credentials to the environment being deployed.
- SHOULD build once and promote the same artifact through environments, rather than rebuilding per environment, so what was tested is what ships.

**Review checks:**

- A personalized or authenticated response with a public cache header — **Critical**; one user's content is served to another.
- `output: 'export'` on an application using server functions, handlers, the proxy, or `"use cache"` — **Critical**; those features do not exist there.
- A self-hosted multi-instance deployment with no shared cache handler — **Major**; replicas serve divergent content.
- No `deploymentId` where multiple builds can serve concurrently — **Major**; version skew surfaces as random client errors.
- HTML documents served with an immutable cache header — **Critical**; the site cannot be updated.
- A secret printed or echoed in a CI step — **Critical**.
