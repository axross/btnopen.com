# Description Writing

Apply these rules whenever authoring or revising the `description` field of a skill. The description is the *only* thing the agent reads at discovery time, so it carries the entire burden of triggering.

## Imperative Phrasing

- MUST use imperative, agent-facing phrasing: "Apply this skill when…", "Use this skill whenever…".
- MUST NOT phrase the description as third-person prose ("This skill provides…", "The purpose of this skill is…") — the agent is deciding whether to act, so tell it when to act.
- SHOULD lead with the verb form that names the trigger condition (`Apply`, `Use`, `Consult`) before listing what the skill covers.

## What and When in One Field

- The description MUST cover both *what the skill does* and *when to apply it* — either dimension alone fails the discovery check.
- The "what" SHOULD enumerate the rule categories or topics your skill actually covers — for a domain skill, things like input validation, query construction, or error handling; for this authoring skill, frontmatter, naming, MECE, progressive disclosure — so the agent can match against the specific rule the user is asking about.
- The "when" SHOULD enumerate the user-visible triggers your skill should fire on — for a domain skill, things like querying a database, deploying a release, or parsing a payload; for this authoring skill, drafting, restructuring, splitting, auditing, renaming — including ones where the user does not name the domain directly.

## Triggering Keywords

- SHOULD list user phrasings *your* skill's users would type, especially short or oblique ones (e.g., for a domain skill: `"is this query SQL-injection-safe"`, `"how do I migrate this"`; for this authoring skill: `"split this skill"`, `"is this in scope"`).
- SHOULD include domain-specific tokens the user is likely to type literally (`MECE`, `SKILL.md`, the host project's master-index filename, the names of neighboring skills) — agents match on lexical surface, not just semantics.
- MUST include cases where the user describes the *symptom* rather than the *domain* — e.g., "this skill is getting too long" should trigger an authoring skill, not just an explicit "split this skill" command.
- SHOULD NOT pad the description with keywords unrelated to the skill's actual scope; broad triggers without precise scope cause false positives.

## Length Discipline

- SHOULD target ~768 characters for the description, leaving headroom under the 1024-character limit defined by the agentskills.io spec. The 768 target is a working budget — large enough to cover *what* + *when*, small enough to compose with many other skill descriptions in the agent's discovery context without crowding it.
- MUST NOT exceed the 1024-character spec hard limit. Behavior on overflow is not specified by the spec; assume the description may be truncated, ignored, or rejected by the host runtime.
- When trimming an over-length description, cut in this order: (1) duplicated synonyms, (2) marginal triggering phrases, (3) the third-tier coverage list, (4) the explicit "Use even when…" tail.
- MUST NOT cut the *what* or the *when* dimension to fit the budget; cut breadth within each instead.

## Common Failure Modes

- **Too narrow**: The description names only the obvious triggers (`"Use when designing the homepage"`) and misses adjacent ones (`"deciding the look-and-feel of any new component"`). Symptom: skill doesn't fire on prompts it should.
- **Too broad**: The description triggers on every prompt that mentions a shared keyword (e.g., the word "code"). Symptom: skill fires on prompts it shouldn't, crowding the agent's context.
- **Vague verbs**: `"Helps with X"`, `"Handles Y"`, `"Manages Z"` — the agent has no concrete trigger to match against. Replace with the specific verbs the user is likely to use.
- **Missing the "when"**: The description lists what the skill does but never tells the agent the situation that activates it. Add an explicit "Apply this skill when…" clause.
