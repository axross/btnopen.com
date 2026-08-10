---
status: accepted
---

# Build on the Actions runner and deploy prebuilt

Every push to the default branch and every pull request preview triggered a build
on Vercel, and Vercel bills build minutes. A personal blog does not need to buy
compute twice: the GitHub Actions runner that already runs lint and the end-to-end
suite can produce the same artifact.

Both pipelines now run `vercel build` on the runner and publish the resulting
`.vercel/output` with `vercel deploy --prebuilt --archive=tgz`, so Vercel serves
the artifact and never rebuilds it.

Two alternatives were rejected. Leaving Vercel's Git integration to build was the
status quo being replaced, and it carries a second problem beyond cost: a
push-triggered Vercel build can promote new code in parallel with — and ahead of —
the production pipeline's migration step, reopening the drift window that pipeline
exists to close. Building a container image and deploying it elsewhere would have
replaced a hosting arrangement that otherwise works, to save build minutes.

Three consequences are accepted, and each is a live constraint on the workflows
rather than a one-time cost. A `--prebuilt` deployment does not receive Vercel's
System Environment Variables at build time, so anything the build reads from them
must be injected into the build step's environment explicitly. It cannot inherit
Vercel's auto-assigned deployment ID either, so Skew Protection needs a custom
`DEPLOYMENT_ID` — a commit SHA truncated to Vercel's 32-character limit, since a
full 40-character SHA is rejected. And `vercel pull` writes unusable placeholders
for sensitive variables, which have to be stripped from the pulled `.env` files
before the build so they cannot shadow the real values.
