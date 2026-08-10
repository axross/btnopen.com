# Claude Code Environment

Read this when setting up a Claude Code session for this repository, or when
changing the hooks or telemetry configuration under `.claude/`.

## Cloud and Web Sessions

Cloud sessions automatically run
[`.claude/hooks/session-start.sh`](../../.claude/hooks/session-start.sh),
registered in the committed
[`.claude/settings.json`](../../.claude/settings.json). It installs mise,
provisions the required Node version, copies `.env.example` to `.env.local`, and
runs `npm install` so the environment is ready when a session starts. It also
copies `settings.local-example.json` to `settings.local.json`, so the quality
hooks below are enabled automatically in the cloud. The hook is gated to the
remote environment and does nothing locally.

That same `.claude/settings.json` sets the default reasoning effort level and the
telemetry resource attributes described below.

## Local Quality Hooks Are Opt-In

Recommended, but not enforced on everyone. To enable them locally, copy the
example into your personal, git-ignored local settings:

```bash
cp .claude/settings.local-example.json .claude/settings.local.json
```

Once enabled, Claude Code runs `npm run format` after each code edit, and
`npm run test:unit` and `npm run lint` before completing a task, surfacing any
failures so they get fixed first. These hooks merge with the committed
`settings.json`, so you keep the cloud `SessionStart` behaviour and add the local
checks on top. They use mise if it is installed and degrade gracefully otherwise.

## Telemetry Is Opt-In and Off by Default

The committed `.claude/settings.json` only *tags* a session — with
`OTEL_RESOURCE_ATTRIBUTES=repository=btnopen`, plus
`OTEL_METRICS_INCLUDE_ENTRYPOINT` so cloud, local, and CI sessions stay separable
by `app.entrypoint`. It enables nothing and holds no endpoint and no credential,
so a contributor who has configured no exporter sees no change.

Exporting Claude Code's own usage metrics takes configuration in two other
places.

### Cloud and local sessions

Set `CLAUDE_CODE_ENABLE_TELEMETRY`, `OTEL_METRICS_EXPORTER`,
`OTEL_LOGS_EXPORTER`, `OTEL_EXPORTER_OTLP_PROTOCOL`, and the OTLP endpoint and
headers in your own environment; for cloud sessions, in the
[web environment settings](https://code.claude.com/docs/en/claude-code-on-the-web),
which covers every repository at once.

For **Grafana Cloud**, also set
`OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE=cumulative`. Its OTLP gateway
runs Prometheus's translator, which accepts cumulative only and answers Claude
Code's `delta` default with `400 otlp parse error: invalid temporality and type
combination` — and that failure is invisible: the rejection discards the whole
request, Mimir returns HTTP 200 on partial ingestion, and Claude Code prints no
export error at any log level, so metrics simply never appear.

### The review workflow

Add the repository variable `CLAUDE_OTEL_EXPORTER_OTLP_ENDPOINT` and the
repository secret `CLAUDE_OTEL_EXPORTER_OTLP_HEADERS` (Settings → Secrets and
variables → Actions), scoping the access-policy token to `metrics:write` and
`logs:write` only. Leave them unset and
[the workflow](../../.github/workflows/claude-review.yaml) disables telemetry
outright rather than starting an exporter that fails; the reviewer behaves
identically either way.

The `CLAUDE_` prefix keeps these clear of the site's own application OTLP
configuration, should [`instrumentation.ts`](../../instrumentation.ts) ever gain
any.
