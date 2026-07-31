# Identity and Releases

Apply this reference when configuring a DSN, deciding what `environment`, `release`, or `dist` should be, wiring release creation into a pipeline, or investigating why an event cannot be traced to the build that produced it.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0, `@sentry/react-native` 8.20.0, and `@sentry/cli` 3.6.2.

## The DSN Is Public, the Token Is Not

Two credentials are involved and they are not alike. The **DSN** identifies the project events are sent to. It is designed to ship inside the application, it is visible to anyone who opens the network tab, and it carries no read access — so it belongs behind the bundler's public environment prefix like any other client-visible value. The **auth token** authenticates uploads and API calls, carries real scopes, and belongs only to the build. Confusing the two in either direction causes a distinct failure: a DSN treated as a secret ends up unavailable at runtime, and a token treated as public ends up in the shipped bundle.

A leaked DSN is not harmless, though — it lets a third party send events into the project and burn quota. That is a quota and noise problem, not a disclosure one, and the answer is Sentry-side rate limiting rather than hiding the value.

**Guidelines:**

- MUST expose the DSN through the bundler's public environment prefix, and read it in exactly one configuration module.
- MUST NOT give an auth token a public prefix under any circumstance; the build-time token rules live with source maps.
- MUST treat an absent DSN as "reporting disabled", never as a fatal configuration error.
- SHOULD respond to DSN abuse with Sentry-side rate limits rather than by rotating the value on every incident.

## Environment

`environment` is what keeps production signal separable from everything else. Without it every build reports into one undifferentiated stream, and the first thing anyone does during an incident — filter to production — is unavailable.

Derive it from something the build already knows rather than hard-coding it: a hosting platform's environment name, an over-the-air update channel, or the build profile that produced the binary. A derived value stays correct when a new preview environment appears; a hard-coded one does not.

**Guidelines:**

- MUST set `environment` explicitly rather than relying on a default.
- MUST derive it from a build-supplied value — a platform environment variable, an update channel, or a build profile — rather than hard-coding a string per branch.
- MUST distinguish at least development, preview, and production; a project with more deployment tiers distinguishes those too.
- SHOULD keep development events out of the project entirely by disabling sending rather than by tagging them and filtering later.

## Release

A report is only actionable if it says which build produced it. `release` is that identifier, and it does double duty: it groups events for regression tracking and release health, and it is the key a source-map upload is filed under.

That second job is why the value cannot be casual. The release the application reports at runtime and the release the upload is filed under must be the same string, produced from one source. When they diverge, events arrive and source maps arrive and Sentry has no way to connect them — a failure that surfaces as unreadable stack traces long after the deploy that caused it.

Prefer an identifier the build already has and can hand to both sides: a commit SHA, a deployment identifier, or an application version. Which one matters less than that one value reaches both.

**Guidelines:**

- MUST set `release` explicitly at initialization, and pass the same value to the source-map upload from one shared source.
- MUST derive it from a build-supplied identifier rather than reconstructing it separately in the application and in the pipeline.
- SHOULD prefer an identifier that maps back to source without a lookup — a commit SHA, or a deployment identifier that resolves to one.
- SHOULD enable session tracking so release health — crash-free sessions and users — is available per release; it is on by default on mobile.

## Dist

`dist` distinguishes multiple binaries or bundles shipped under one release. It matters wherever one release identifier can correspond to more than one artifact:

- an application shipping over-the-air updates, where two devices on the same store version can run different JavaScript
- a mobile release built for more than one platform, where each platform's bundle has its own source map
- any pipeline producing multiple build variants from one version

Where none of those apply, `dist` earns nothing and can be left unset. Where any does, omitting it collapses distinct artifacts into one release and breaks source-map lookup for all but whichever uploaded last.

**Guidelines:**

- MUST set `dist` wherever one release can correspond to more than one artifact — over-the-air updates, multi-platform bundles, or multiple build variants.
- MUST use the same `dist` at initialization and at upload, from the same source as the release.
- SHOULD derive it from the artifact's own identity — an update identifier, a build number, or a platform name — rather than an incrementing counter maintained by hand.

## Creating and Finalizing a Release

Beyond tagging events, a release can be registered with Sentry so it carries commits, an author list, and a deploy record. Three mechanisms do this, and a project should use exactly one:

| Mechanism                          | Fits                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| The build plugin's release options | A web build that already runs the plugin for source maps                                |
| The command-line client            | A pipeline that needs release, commit association, and deploy marking as separate steps |
| A continuous-integration action    | A workflow that creates the release outside the application build                       |

Commit association is what turns "this release regressed" into "these commits are candidates", so it is worth the extra step wherever the pipeline can reach the repository history.

**Guidelines:**

- MUST create each release through exactly one mechanism; two of them running produces duplicate or conflicting release records.
- SHOULD associate commits with the release wherever the pipeline has repository history available.
- SHOULD finalize a release only once its artifacts are uploaded, so a release is never briefly present without its source maps.
- MUST supply the auth token these mechanisms need from build-time secret storage, per the rules in [source-maps-and-tokens.md](./source-maps-and-tokens.md).
