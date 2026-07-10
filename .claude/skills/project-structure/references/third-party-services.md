# Third-Party Services

The app uses external services for error tracking and analytics. Treat these integrations as runtime and privacy-sensitive surfaces, not ordinary UI dependencies.

| Service | Purpose |
| ------- | ------- |
| [Sentry](https://sentry.io/) | Error tracking |
| [Mixpanel](https://mixpanel.com/) | Analytics |

**Guidelines:**

- MUST consult the project's observability guidelines before changing Sentry initialization, error reporting, or logging behavior.
- MUST consult the project's application-security requirements when service changes affect secrets, environment variables, public exposure, or captured user data.
- SHOULD keep third-party service inventory here instead of duplicating it in `AGENTS.md`.
