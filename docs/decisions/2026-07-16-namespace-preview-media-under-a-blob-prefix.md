---
status: accepted
---

# Namespace preview media under a blob prefix

Uploaded media goes to a Vercel Blob store, and the store has no notion of an
environment. Once each pull request got its own preview with a live Payload admin,
an upload made in one preview landed in the same flat keyspace as every other
preview's and as production's — so previews could collide with each other, and a
closed pull request left its media behind with nothing to identify it by.

A `BLOB_PAYLOAD_PREFIX` environment variable now namespaces every uploaded file
under that path. The preview workflow injects `pr-<n>` per pull request, so a
preview's media lives under `pr-<n>/…` and teardown can delete the prefix
wholesale. Production and local development leave it empty, so their existing keys
stay flat and unchanged.

The storage plugin is loaded unconditionally with `alwaysInsertFields`, so the
persisted `prefix` field exists in the schema in every environment even though
storage itself stays gated on the token. Without that, the `prefix` column would
appear or disappear depending on whether a token was set, and generated migrations
would carry spurious add/drop diffs.

Two alternatives were rejected. A separate Blob store per pull request would have
meant provisioning and destroying a store per preview through an API that is not
designed for that churn. Deleting preview media by listing every blob and matching
it against surviving documents would have made teardown depend on the database
still existing, which it does not by then.

The consequences accepted are that migrations must be generated with the prefix
unset, or a preview value gets baked into the schema default; and that the prefix
isolates keys but not credentials, which is why previews additionally use a Blob
store dedicated to them.
