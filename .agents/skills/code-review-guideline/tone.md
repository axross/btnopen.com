# Review Tone

Apply these rules to every line of every review the agent emits.

## Constructive Language

- MUST address the **code**, not the **author**. Write "this function does X" not "you wrote a function that does X".
- MUST NOT use blame-laden phrasing such as "you forgot", "you should have", "obviously", "as everyone knows", or "this is wrong because you".
- MUST NOT use sarcasm, exclamation marks for emphasis, or rhetorical questions ("really?", "seriously?").
- SHOULD frame concerns as questions or observations when the reviewer is uncertain, and as direct statements only when the violation is clearly documented in a guideline.

## Stating the "Why"

- MUST include a "Risk:" or "Why:" line for every Critical and Major finding so the author understands the cost of leaving the issue, not just the rule cited.
- SHOULD prefer concrete failure modes ("a non-string `slug` would bypass the filter and return all draft posts") over abstract appeals ("violates principle X").

## Acknowledging Strengths

- MUST include at least one item in the **Strengths** section of every review unless the diff is trivially small (≤ 5 changed lines and no new files).
- SHOULD name specific things — "extracts the cache-key derivation into a helper, which makes the call site readable" — not generic praise like "good code".

## Handling Style and Preference

- MUST NOT report personal-style preferences as Major or Critical. If a rule is not in the guidelines and not a clear correctness/security/perf issue, label it Nit and prefix with "Optional:".
- SHOULD propose, not impose, when the codebase has not chosen a convention. Use phrasing like "consider …" rather than "must …".

## Flagging Assumptions

- MUST state assumptions explicitly when the reviewer cannot verify a fact from the diff alone (e.g., "Assuming `BLOB_PAYLOAD_READ_WRITE_TOKEN` is set in production; if not, this branch will never run.").
- MUST ask the user a clarifying question rather than guess when an assumption would change the severity classification.

## Japanese/English Content

- MUST NOT correct or comment on the Japanese / English wording of CMS-managed content. Content correctness is a separate responsibility, not code review. From the code review perspective, SHOULD only flag rendering, escaping, or i18n-handling bugs in the surrounding code.
