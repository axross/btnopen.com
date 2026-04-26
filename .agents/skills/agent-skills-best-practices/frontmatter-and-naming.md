# Frontmatter and Naming

Apply these rules whenever authoring or editing a `SKILL.md` frontmatter block or choosing the directory name for a new skill.

## Required Fields

- MUST include a `name` field — 1–64 characters, lowercase letters, digits, and hyphens only, with no leading, trailing, or consecutive hyphens (regex: `^[a-z0-9]+(-[a-z0-9]+)*$`). Valid: `pdf-processing`, `code-review`, `web3-utils`, `oauth2-callback`. Invalid: `PDF-Processing` (uppercase), `-pdf` (leading hyphen), `pdf--processing` (consecutive hyphens), `pdf_processing` (underscore).
- MUST include a `description` field — 1–1024 characters, non-empty, covering both *what the skill does* and *when to apply it* (see [description-writing.md](./description-writing.md) for the craft).
- The `name` field MUST exactly match the parent directory name. A mismatch breaks discovery in spec-conformant agents.

## Optional Fields

- MAY include `license` when the skill is licensed differently from the surrounding project. Keep the value short — either an SPDX identifier or a reference to a bundled license file.
- MAY include `compatibility` (max 500 chars) when the skill has environment requirements (specific runtime, system packages, network access). Most skills do not need it.
- MAY include `metadata` as a string-to-string map for client-specific extensions. Use reasonably unique key names to avoid conflicts across clients.
- MAY include `allowed-tools` (experimental) as a space-separated string of pre-approved tools. Support varies between agent implementations — treat as advisory.

## Host-Project Harness Fields

The agentskills.io spec defines a fixed set of frontmatter fields (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`). Host projects MAY layer additional non-spec keys that the local agent runtime enforces — these are *harness fields*, distinct from spec fields. A common example is `user-invocable: false` for the Claude Code harness; other harnesses use other keys, and some use none at all.

- A skill MUST preserve every harness field already present when the skill is refined — the local runtime depends on it, even if the field looks unfamiliar.
- A new harness field MUST be applied to every existing skill in the same change, never to one skill in isolation, so the skill set stays uniform.
- A skill MUST NOT add a harness field unilaterally to support an experimental feature; treat new harness keys as a project-wide policy decision.
- When porting this skill set to a different host project, MAY remove or replace harness fields that no longer apply; document the substitution in the new project's master skill index.

## Naming Rules

- MUST use kebab-case (`code-review`, `pdf-processing`, `web3-utils`).
- MUST NOT use uppercase, underscores, dots, or spaces in the directory or `name` field.
- The name SHOULD describe the *responsibility* (`application-security`), not the *actor* (`security-reviewer`) or the *file type* (`security-skill`).
- The name SHOULD be unambiguous within the existing skill set — avoid names that overlap conceptually with siblings (e.g., adding `pdf-extraction` next to an existing `pdf-processing` invites confusion).

## Naming for Discoverability

- A name that already implies its trigger (`e2e-testing`, `error-monitoring`) reduces the work the `description` field has to do during discovery.
- SHOULD adopt a consistent naming convention across the skill set — same noun form, same suffix shape — so adjacent skills feel like a coherent group. Pick a convention that fits the host project's voice (e.g., noun-form-with-purpose suffixes such as `-guidelines`, `-requirements`, `-principles`, `-best-practices`); the *consistency* is the rule, the specific suffix is a taste call.
- When uncertain between two candidate names, pick the one that a future contributor unfamiliar with the repo would map to the right skill on the first try.
