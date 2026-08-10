---
status: superseded
superseded_by: 2026-07-18-seed-preview-databases-from-fixtures-rather-than-branching-production.md
---

# Branch preview databases from production

Agent-authored pull requests could not be reviewed with their real look and feel,
because branch deployments were not wired up. Payload is backed by a single Turso
(SQLite) database, so the naive wiring — point every preview at the same database
the production site uses — would have let any preview's CMS writes corrupt
production content.

Each pull request was therefore given its own throwaway database, created with
`turso db create --from-db` against production, so a preview carried realistic
content while its writes stayed contained. The branch's migrations were applied to
that copy, and only the per-branch credentials were injected into the Vercel
preview.

Two alternatives were rejected. Sharing the production database was the failure
mode being avoided outright. Standing up a single shared preview database would
have made concurrent pull requests interfere with each other's content, which is
exactly the confusion a preview exists to remove.

The consequence accepted was that a preview held a copy of real production rows —
including the `users` and `payload-mcp-api-keys` collections — on a publicly
reachable URL. That exposure is what the superseding decision reverses.
