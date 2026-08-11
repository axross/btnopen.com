# Agent Skills

Read this when installing or refreshing the agent skills this repository uses,
when an installed capability's rule appears to collide with this codebase, when
one turns out to be wrong or silent on a case that comes up here, or when
reviewing a change that looks like a skill violation.

Every skill under `.claude/skills/` is **installed**, not written here. All of
them come from the shared [axross/skills](https://github.com/axross/skills)
library and are copied in with the
[vercel-labs/skills](https://github.com/vercel-labs/skills) CLI, pinned by
[`skills-lock.json`](../../skills-lock.json). This repository owns no skill of
its own — its conventions and operating procedures are the documents you are
reading. Why that is so, and what it costs, is in
[../decisions/2026-08-09-keep-project-conventions-in-docs-rather-than-repository-local-skills.md](../decisions/2026-08-09-keep-project-conventions-in-docs-rather-than-repository-local-skills.md).

## Install and Refresh

```bash
# refresh exactly the skills this project already manages
npx skills add axross/skills --agent claude-code --yes --copy \
  $(node -p "Object.keys(require('./skills-lock.json').skills).map(s => '--skill ' + s).join(' ')")
```

**Do not use `--skill '*'` here.** Against an external source it installs the
library's *entire* catalogue, not the subset in `skills-lock.json` — today that
would silently adopt the Expo, TanStack Query, Amplitude, and Jest layers this
project has not chosen. The command above derives the list from the lockfile
instead, so it stays correct as the set changes.

Adopting a new skill means naming it explicitly, and `--skill` takes exactly one
skill per flag: repeat the flag (`--skill a --skill b`) rather than passing a
comma-separated list. A comma-separated value matches nothing, installs nothing,
writes no lockfile, and reports an available-skill list that reads like ordinary
help rather than a failure.

**Rules:**

- MUST treat every directory under `.claude/skills/` as a generated artifact.
  Editing one is pointless — the next install discards it — so a change to a
  skill goes upstream to the library as an issue or pull request there.
- MUST commit the regenerated skill directories and `skills-lock.json` together.
- MUST NOT add a skill to `.claude/skills/` that is absent from
  `skills-lock.json`; the lockfile describes the directory's entire contents, and
  that correspondence is what makes drift detectable.

## Deviations and Gaps

Two different things route here, and they resolve the same way. A **deviation**
is a collision — an installed capability requires one thing, this repository
deliberately does another. A **gap** is an installed capability being wrong,
outdated, or simply silent on a case that comes up here. Either way the installed
skill is left exactly as it is, and the resolution is written down in this
document.

That matters because an unrecorded deviation reads to the next agent, and to a
reviewer, as a plain violation of a MUST rule, and an unrecorded gap gets
rediscovered from scratch by whoever hits it next.

**Rules:**

- MUST NOT edit an installed skill to fix a rule that is wrong, outdated, or
  missing; the edit does not survive a reinstall and misrepresents the library
  until it is discarded.
- MUST record a new deviation in the register below — the rule, the capability it
  departs from, and why it was accepted — rather than violating an installed skill
  silently.
- MUST resolve a gap by one or both of two routes: an issue opened on
  [`axross/skills`](https://github.com/axross/skills) when the gap generalizes
  beyond this project, and a written note here saying what the capability states,
  what this repository does instead, and how to handle the case meanwhile.
- MUST obtain the human's go-ahead before opening an upstream issue — it is a
  public write on a repository this project does not own — and MUST record the gap
  locally in the meantime rather than leaving the finding to depend on that issue
  landing.
- MUST verify that a suspected gap is real by reading the installed skill's own
  text before routing it anywhere; a rule that turns out to be stated correctly is
  a compliance failure to own, not a defect to file.
- MUST continue the task that exposed the finding under the skill exactly as
  installed; routing a change never blocks the work, and never licenses acting as
  though the proposed rule were already in force.
- SHOULD name any upstream issue filed or left pending in the work's completion
  report, so the finding outlives the session that produced it.

## The Register

The register is exhaustive, which is what makes it useful: anything in this
codebase that departs from an installed rule and is not listed here is a finding.
Do not read the register as licence to assume an unlisted departure was already
blessed, and do not add an entry for a rule this repository merely has not
exercised yet — a deviation is recorded when it is accepted, not when it is
anticipated.

**Rules:**

- MUST treat a departure from an installed capability's rule as a finding while
  no entry below matches it.
- MUST NOT add an entry here for a hypothetical or anticipated collision; an entry
  records a decision the human accepted, with its reason.

### Deviation — feature-agnostic modules are grouped by kind under `app/(app)/_/`

The Next.js capability's project-structure reference requires modules under the
source root to be grouped by the domain they serve — a MUST — and forbids the
alternative outright: `components/`, `hooks/`, `utils/`, or `queries/`
directories MUST NOT be the application's primary organizing axis. Per-kind
subdirectories belong *inside* a domain directory in that model, never above one,
and two cross-cutting tiers — `common/` for portable primitives, `core/` for
app-wide infrastructure — sit beside the domains.

This repository organizes its shared tier the other way. Feature-agnostic modules
live in `app/(app)/_/` split by kind — `components/`, `helpers/`,
`repositories/`, `translations/` — while feature-specific modules stay
route-local in underscore-prefixed folders such as `_components/` under the owning
route directory. There are no domain directories, no `common/`, and no `core/`.
[../conventions/repository-map.md](../conventions/repository-map.md) states that
layout as this repository's own MUST and routes new files into it.

The departure was accepted in
[#185](https://github.com/axross/btnopen.com/issues/185), the refresh that
hardened the capability's grouping guidance from a SHOULD into the MUST/MUST NOT
pair. Two things made keeping the layout the better answer. The capability itself
requires a restructure to be its own change with its own review rather than a side
effect, so adopting the domain axis is a migration to schedule, not a rule to
comply with in passing. And the shape of this codebase does not reward the split:
the routable surface is one content type with its comments, while most of
`app/(app)/_/` is cross-cutting machinery — markdown rendering, i18n, media,
embeds, analytics — that would land in a portable tier rather than in any domain.
The by-domain axis would yield one thin domain directory beside a large
`common/`, which buys none of the blast-radius clarity the rule exists to create.

Nothing else in that capability is affected. Its source-root rule already blesses
this repository's repository-root `app/`, and its thin-route-file,
no-queries-in-route-modules, and `server-only` fencing rules apply here unchanged
— only the grouping axis beneath the source root diverges.

**Rules:**

- MUST place a new feature-agnostic module under `app/(app)/_/` by kind, and a
  new route-specific module in the owning route's `_components/`, exactly as this
  repository's own structure conventions state.
- MUST NOT introduce a `src/` source root, a `common/` tier, a `core/` tier, or a
  top-level domain directory in order to satisfy the installed capability; doing so
  would split the codebase across two conventions.
- MUST NOT report a by-kind placement under `app/(app)/_/` as a review finding
  against the installed capability's grouping rules; every other rule in that
  reference still applies in full.
- SHOULD treat a proposal to adopt the domain axis as a standalone migration with
  its own issue, plan, and review — never as part of a change that happens to
  touch the affected files.

### Deviation and gap — Sentry's debug and logging statements ship in the production bundle

The Sentry-instrumentation capability's `delivery-and-footprint` reference makes
stripping them a MUST — "MUST strip debug and logging statements from production
builds; they exist for development and ship otherwise" — and presents it as a
build-plugin option that costs nothing at runtime to enable.

This repository does not strip them, because on its bundler there is no option to
enable. `@sentry/nextjs` exposes the control only as
`webpack.treeshake.removeDebugLogging`, which the SDK reads solely in its webpack
path and turns into `DefinePlugin` defines; `next build` on Next.js 16 runs
Turbopack, so the option produced nothing during the whole time it was set.
`bundleSizeOptimizations` reads like the bundler-agnostic equivalent but is not
one: the SDK hands it only to the post-compile hook, which never applies the
resulting replacement values and runs after compilation regardless. Sentry's own
build-options documentation records no Turbopack equivalent. Verified against
`@sentry/nextjs` 10.69.0.

A substitute exists outside the SDK. Next.js's `compiler.define` would replace
`__SENTRY_DEBUG__`, which is exactly the flag the SDK's `DEBUG_BUILD` guard
reads, and it is bundler-agnostic. It was put to the maintainer in
[#162](https://github.com/axross/btnopen.com/issues/162) and declined: it means
this repository maintaining a bundler-level mechanism of its own, needing its own
bundle-content verification, to recover a few kilobytes on a personal blog. The
inert option was deleted instead, in
[#188](https://github.com/axross/btnopen.com/issues/188), which leaves the bundle
exactly as it already was rather than leaving configuration that reads as though
the rule were satisfied.

Both routes apply here, because this is a deviation and a gap at once. The
deviation is the declined substitute. The gap is that the capability states the
MUST without acknowledging that the vendor supplies no mechanism under what is now
Next.js's default bundler, so a Turbopack project cannot comply through the SDK at
all. That generalizes past this repository, so it is also filed upstream as
[axross/skills#181](https://github.com/axross/skills/issues/181) — which asks the
Bundle Footprint section to carry the same bundler-split qualifier its own
neighbouring section already applies to component annotation. This entry stands
until that lands, and nothing here waits on it.

**Rules:**

- MUST NOT re-add `webpack.treeshake` or reach for `bundleSizeOptimizations` in
  the `withSentryConfig` call to satisfy the rule; neither reaches a Turbopack
  build, and `next.config.ts` carries a comment saying so.
- MUST NOT report Sentry debug logging present in the production bundle as a
  review finding against the installed capability while this entry stands.
- SHOULD delete this entry rather than leave it standing once `@sentry/nextjs`
  gains a Turbopack tree-shaking option, and strip the statements then.

### Deviation and gap — colour tokens are authored in `oklch()` with no sRGB `@supports` fallback

The React-component-styling capability's `color-and-gamut` reference makes the
fallback a MUST — "MUST author colour in a wide-gamut format (`oklch()`, or
`color(display-p3 …)`) and MUST provide an sRGB fallback for browsers that do not
parse it" — and names the mechanism for exactly this case: "MUST use the
feature-query form (`@supports`) when the colour is assigned to a custom
property".

`app/(app)/variables.css` assigns 54 `oklch()` values to custom properties and
guards none of them with a gamut feature query; the file's only `@supports`
covers `corner-shape: squircle`. The departure is older than the colour-role
layer that exposed it — before
[#221](https://github.com/axross/btnopen.com/issues/221) the count was 25 and the
fallback was already absent.

Complying would break a rule that does stand here. The brand hue is a single
global knob, per [../specs/visual-identity.md](../specs/visual-identity.md), and
a static sRGB literal cannot follow a knob. The scale is derived rather than
pasted — four knobs, a 13-value `--lightness-*` axis that inverts for dark, and
26 alpha values, which is 39 numbers forking per scheme while the 54 `oklch()`
declarations sit outside the fork and are written once. Resolving them to
literals collapses the `var()` indirection into 108 values (54 × 2 schemes) and
grows the per-scheme fork to 147, after which rotating the hue recolours only
half the palette.

Compliance is also all-or-nothing. An unparseable `oklch()` invalidates a custom
property at computed-value time — the very reason the capability mandates the
feature-query form over the cascade form — so a fallback covering some
declarations leaves the rest resolving to `unset` and the page loses its colours
anyway. A partial fallback is not a partial fix; it is an inert one.

What settles it is that the capability's own `@scope` rule has already excluded
the browsers this fallback would serve. Its `css-modules` reference makes
`@scope` a MUST with no fallback and no support caveat, and every CSS Module here
obeys it. [`@scope` reached Baseline in December
2025](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@scope)
on Firefox 146; [`oklch()` reached it in May
2023](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch).
A browser that cannot parse `oklch()` predates `@scope` by some 31 months and
cannot apply a single component rule on this site, so it never reaches a colour
token to fall back on. The mandated fallback has no reachable audience.

That inconsistency is the capability's rather than this repository's — one
reference mandates an unguarded 2025 feature while a neighbouring one mandates a
fallback for a 2023 feature, and nothing reconciles them — so it is also filed
upstream as [axross/skills#316](https://github.com/axross/skills/issues/316),
which asks that the fallback MUST be qualified by interoperability rather than by
colour format. This entry stands until that lands, and nothing here waits on it.

**Rules:**

- MUST NOT report an `oklch()` custom property without a gamut `@supports` as a
  review finding while this entry stands.
- MUST NOT add an sRGB fallback covering part of the palette. Anything short of
  all 108 values is inert, because the unguarded remainder invalidates at
  computed-value time and takes the page's colours with it.
- SHOULD treat adopting a whole-palette fallback as a standalone change with its
  own issue, plan, and review — never as part of a change that happens to touch
  `variables.css`.
- SHOULD verify that a build-time transform actually reaches a Turbopack
  `next build` before proposing one as the way to keep the single hue knob; the
  Sentry entry above records what an option that reaches nothing costs.
- SHOULD delete this entry rather than leave it standing if the capability gains
  a browser-baseline qualifier that resolves the inconsistency.

### Deviation — a Payload admin slot component takes Payload's props contract, not its root element's

The React-component capability's props reference states two of these as MUSTs:
"MUST base the props type on the root rendered element" and "MUST collect
undeclared props into a rest object and spread it onto the component's root
element", carving out only a root that renders no node of its own.
[../conventions/react-components.md](../conventions/react-components.md)
restates the spread as this repository's own rule.

Both components under `payload/components/` do neither.
`share-link-field.tsx` is typed `TextFieldClientComponent`, destructures
`field` and `path`, and drops the rest; `embed-block-card.tsx` declares no props
at all.

Payload dictates that shape and leaves no seam for one of ours. Neither
component is ever called from this repository's code: each is named as a string
in a collection's `admin.components` — a field's `Field` slot, a Lexical block's
`Block` slot — resolved through `app/(payload)/admin/importMap.js`, and
instantiated by Payload's admin runtime. What that runtime passes is field
descriptors — `field`, `path`, `permissions`, `schemaPath`, `readOnly` — not DOM
attributes. Spreading that rest object onto the root `<div>` would put `field`
and `permissions` on an HTML element as unknown attributes, and basing the props
type on `ComponentProps<"div">` would type away the contract Payload actually
calls it with. There is also no caller who could pass a `data-*` attribute,
which is the propagation the rule exists to protect.

The departure is confined to that seam: every component this repository itself
renders — everything under `app/` — is unaffected, and only another Payload
admin slot component could join it.

**Rules:**

- MUST type a Payload admin slot component with the client-component type Payload
  publishes for that slot, and MUST NOT rebase it on `ComponentProps<T>` or
  spread its rest object onto the rendered element in order to satisfy the
  installed capability.
- MUST NOT report a Payload admin slot component's missing props spread as a
  review finding against the installed capability while this entry stands.
- MUST keep applying both rules in full to every component under `app/`; nothing
  outside `payload/components/` is covered here.
