# Verification Evidence

Apply these rules when reviewing whether the author proved the change works. Verification evidence is the observable record of checks performed, not a general claim that the change was tested.

## Evidence Required Before Completion

A review should connect each changed surface to the command, manual check, or reasoning that covers it.

**Guidelines:**

- MUST require `npm run format` and `npm run lint` evidence after code or documentation edits.
- MUST require `npm run test:e2e` evidence when the change affects UI output, e2e coverage, snapshots, route behavior, metadata, markdown rendering, or browser-visible state.
- MUST require `npm run build` evidence when the change affects Next.js routes, metadata, Payload config, runtime config, dependencies, or TypeScript signatures.
- MUST require manual browser evidence for changed output surfaces listed in [manual-verification.md](./manual-verification.md).
- MUST map skipped required checks to a concrete reason and residual risk.
- MUST require a second-pass verification statement after fixing any Critical or Major finding.

## Evidence Format

Evidence should be short but specific enough that another reviewer can see what was covered.

**Guidelines:**

- SHOULD state each command with its observed result, such as "`npm run lint` passed" or "`npm run test:e2e` failed in `posts/[slug]` snapshot".
- SHOULD name manual routes or surfaces checked, such as "`/posts/example?draft=true` rendered the draft banner".
- SHOULD include relevant log, screenshot, or diff context when the result is not obvious from command success alone.
- MUST NOT accept "tested manually" or "looks fine" without the route, state, or behavior that was checked.
- MUST NOT accept a passing command as coverage for a surface the command does not exercise.
