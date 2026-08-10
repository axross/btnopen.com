---
status: accepted
---

# Seed preview databases from fixtures rather than branching production

A per-pull-request preview is served from a publicly reachable Vercel URL whose
Payload admin and MCP endpoints are live. Branching each preview from production —
the arrangement recorded in
`2026-07-06-branch-preview-databases-from-production.md` — meant every one of
those public previews carried a copy of real production rows, including the
`users` collection and the `payload-mcp-api-keys` collection.

Each preview is now provisioned as a **fresh, empty** database. Migrations build
its schema from scratch in CI, and the application's own idempotent `onInit` seed
populates it from the repository's fixtures during the build — the same seed local
development and the end-to-end suite use. Production database credentials are
never routed to a preview, the preview Blob store is a separate store from
production's, and the preview seed-admin credential is a distinct value from
production's.

Two alternatives were rejected. Keeping the branch-from-production arrangement and
scrubbing sensitive collections after the copy would have left the exposure open
between the copy and the scrub, and would have needed maintaining for every
collection added later. Restricting preview URLs behind Vercel's deployment
protection would have hidden the previews from the reviewers they exist for.

The consequences accepted are that a preview shows fixture content rather than
real content, so a reviewer cannot use one to check how a specific production post
renders; and that the seed populates a database only on first boot, so refreshing
a live preview's content needs the workflow's manual `recreate` dispatch rather
than another push.
