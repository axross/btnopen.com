---
status: accepted
---

# Split destructive schema changes expand-then-contract

Production repeatedly served code whose Payload schema outran the production
database, and core queries failed with `SQLite input error: no such column: …`
until someone applied the migration by hand — Sentry BTNOPEN-4G on 6 July 2026
and BTNOPEN-4H on 10 July. The fix was to order the deploy so migrations reach the
database before the new code is built against it and promoted to traffic.

That ordering closes the drift window in one direction and opens a narrower one in
the other: between the migration completing and the new code serving traffic, the
**old** code runs against the **new** schema. Additive changes — a new nullable
column, a new table — are invisible to old code, so the window is safe. A
destructive change is not: dropping or renaming a column the old code still reads
breaks every request in that window.

Destructive schema changes are therefore split across two releases. The first
release is additive and ships code that tolerates both shapes; only once that is
live does a later release remove the old shape.

Three alternatives were rejected. Promoting the code first and migrating after
simply restores the original failure, which is the one that actually happened
twice. Taking the site down for the migration window trades a brief inconsistency
for a certain outage, on a site where the inconsistency is avoidable by splitting.
Wrapping the promotion and the migration in a single atomic step is not available:
the database and the CDN deployment are separate systems with no shared
transaction.

The consequence accepted is that a destructive change costs two releases and the
discipline to remember why, which is why a schema-changing pull request is
expected to state whether its migration is additive or needs the sequence.
