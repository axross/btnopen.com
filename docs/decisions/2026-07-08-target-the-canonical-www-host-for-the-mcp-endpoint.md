---
status: accepted
---

# Target the canonical www host for the MCP endpoint

The site canonicalizes to `www`, so `https://btnopen.com/api/mcp` answers with a
`307` redirect to `https://www.btnopen.com/api/mcp`. The committed MCP client
configuration originally defaulted to the bare domain, which broke agent sessions
in two ways at once.

Cloud egress allowlists match exact hosts, so allowlisting `btnopen.com` never
covers the redirect target — and an agent whose first call is the mandatory
`tools/list` fails before doing anything. Separately, a cross-host redirect can
drop the `Authorization` bearer header, so even an allowlisted client can arrive
unauthenticated.

The default now points straight at `www.btnopen.com`, so no redirect is involved.

The alternative — removing the canonicalization so both hosts serve directly —
was rejected: the redirect exists for the site's own SEO and link canonicalization,
and an API client's configuration is the cheaper thing to make precise.

The consequence accepted is that the host is written into the committed
configuration rather than derived, so a future domain change has to update it
there as well as in the site's own origin resolution. Anyone documenting the
network allowlist has to name the `www` host too; naming the bare domain reads
correct and fails.
