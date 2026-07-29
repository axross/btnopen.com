---
name: agent-skill-management
description: The ability to store, install, and maintain a project's agent skills across two tiers — repository-local skills committed directly under the skill root (e.g. `.claude/skills/`) and hand-edited in place, and distributable skills authored in a source directory (e.g. `skills/`) and installed into the skill root with the vercel-labs/skills CLI (`npx skills`) plus a `skills-lock.json` lockfile — the decision rule for which tier a new skill belongs to, and how to propose a change to an installed skill depending on whether you own its source (edit-and-reinstall locally vs. an upstream feature-request issue when it was installed from outside).
when_to_use: Apply when adding, editing, renaming, moving, or removing an agent skill in a project that manages skills across the two tiers, when deciding whether a new skill belongs in the distributable source directory or directly under the skill root, when the installed copies or `skills-lock.json` need regenerating, or when you want to change a skill that was installed from an upstream you do not own — for example after changing a `SKILL.md` or reference file, when `git status` shows the installed copies out of sync with their source, or when the installed copy comes from a third-party source.
user-invocable: false
---

# Agent Skill Management

Use this capability whenever you add, edit, rename, move, or remove an agent skill in a project that holds its skills in two tiers. **Distributable** skills — portable capabilities other projects can install — are authored in a source directory (conventionally `skills/`, the source of truth) and **installed** into the skill root (the directory the agent actually loads, conventionally `.claude/skills/`) with the [vercel-labs/skills](https://github.com/vercel-labs/skills) CLI (`npx skills`); a `skills-lock.json` file records what was installed. **Repository-local** skills — the ones that encode a single project's own conventions — are committed directly under the skill root and are never touched by the CLI.

One index — the host project's master skill index — routes to every skill regardless of tier.

This skill is **self-contained**: it names no repository-specific file or layout and references no repository-root index, so it works installed on its own. The directory names `skills/` and `.claude/skills/` and the tooling below are the conventional defaults; substitute the host project's chosen paths where they differ.

**Guidelines:**

- MUST keep the host project's master skill index in sync whenever a skill in either tier is added, renamed, moved, or removed, per your project's skill-authoring conventions.

## Choosing a Tier

Every skill lives in exactly one tier, decided by one question: **would the skill work, unchanged, installed into another project?**

- A skill that is self-contained and portable — it names no repository-specific file, workflow, or layout — is **distributable**: author it under the source directory (`skills/<name>/`) and install it with the CLI.
- A skill that encodes one project's own structure or process — a repository-layout skill, a project-specific development baseline, the skill-authoring rules a project tailors to itself — is **repository-local**: commit it directly under the skill root (`.claude/skills/<name>/`).

**Guidelines:**

- MUST place every new skill in exactly one tier using the portability question above, before writing its `SKILL.md`.
- MUST NOT store a repository-local skill under the source directory or manage it with `npx skills`; it never appears in `skills-lock.json`.
- MUST move a skill between tiers deliberately when its scope changes — a repository-local skill later generalized for sharing moves its source to `skills/<name>/` and is reinstalled with the CLI — never by keeping a copy in both.
- MAY read a skill's tier off `skills-lock.json`: a skill listed there is distributable and installed; one absent from it is repository-local.

## Repository-Local Skills

A repository-local skill's committed copy under the skill root **is** its source of truth. The prohibition on hand-editing installed copies does not apply here — editing these files in place is the correct workflow.

**Guidelines:**

- MUST edit a repository-local skill directly under the skill root (`.claude/skills/<name>/`) — its `SKILL.md`, `references/`, and any `scripts/` — and commit those files; there is no separate source directory and no install step.
- MUST author it to the same standard as any other skill — frontmatter, naming, discovery metadata, progressive disclosure — per your project's skill-authoring conventions.
- MUST rename a repository-local skill with a `git mv` of its directory plus a matching frontmatter `name` update, and update every reference to the old name in the same change.

## Distributable Skills: Install and Refresh

A distributable skill is authored under `skills/<name>/SKILL.md` (with its `references/` beside it) and installed with the CLI. The CLI is run through `npx`; when the environment does not support symlinks, installs use `--copy` (the copy lands as a real directory under the skill root).

**Commands:**

- Install or refresh every managed skill:

  ```bash
  npx skills add ./skills --agent claude-code --skill '*' --yes --copy
  ```

- Refresh a single skill by name:

  ```bash
  npx skills add ./skills --agent claude-code --skill <name> --yes --copy
  ```

- List installed skills: `npx skills list`
- Remove an installed skill: `npx skills remove <name>` (then delete its `skills/<name>/` source and update the master skill index).

**Guidelines:**

- MUST author a distributable skill under the source directory (`skills/<name>/`), never directly under the skill root.
- MUST NOT hand-edit an installed copy under the skill root when you own its source; edit the source and reinstall.
- MUST re-run the install after editing any source skill so the committed installed copy and `skills-lock.json` match the source.
- MUST commit the installed `.claude/skills/<name>/` copies and `skills-lock.json` alongside the `skills/` source; they are tracked artifacts, not gitignored.
- MUST pass `--copy` when symlinks are unsupported; a symlink install leaves the skill root empty or broken there.
- MUST use `--skill '*'` to refresh all managed skills after a broad change, or `--skill <name>` for a targeted one.
- SHOULD run `npx skills add` from the repository root so `./skills` resolves and `skills-lock.json` is written there.
- SHOULD confirm the install summary lists every expected skill as `copied` before committing.
- SHOULD retry with an explicit version specifier (`npx --yes skills@latest …`) when `npx skills` aborts with `could not determine executable to run`; the plain form above stays canonical, and the specifier is a fallback for environments where `npx` cannot resolve the bare package name.

## Proposing a Change to an Installed Skill

A distributable skill's installed copy under the skill root is a **generated artifact**: the next install or `npx skills` upgrade regenerates it from its source and silently discards anything you typed into it. How you change such a skill therefore depends on **whether you own its source**.

Determine which case you are in from the skill's `source` in `skills-lock.json`:

- The `source` points inside a repository you control (a local path or your own repo) → **you own the source** (first-party); change it locally.
- The `source` points at an upstream repository or registry you do not control → the skill was **installed from outside** (third-party); route the change upstream.

**Guidelines:**

- MUST, when you own the source, make the change locally: edit the source under `skills/<name>/`, reinstall with the CLI, and commit the regenerated installed copy and `skills-lock.json` (see [Distributable Skills: Install and Refresh](#distributable-skills-install-and-refresh)). Never hand-edit the installed copy.
- MUST NOT hand-edit the installed copy of a skill installed from an upstream you do not own — a reinstall or `npx skills` upgrade overwrites it from upstream, so the edit is lost and, until then, masquerades as source.
- MUST, to change a skill installed from outside, propose the change **upstream**: open a feature request or bug report as an issue on the skill's upstream repository describing the desired behavior, and optionally open a pull request there. The upstream repository is the source of truth for a third-party skill.
- MUST pull an accepted upstream change by re-running the install/upgrade against the upstream source, not by editing files under the skill root.
- SHOULD, when you need a local-only deviation you cannot wait on upstream for, fork the skill into your own distributable source deliberately — copy it under your `skills/<name>/`, repoint its `skills-lock.json` `source`, and manage it first-party from then on — rather than hiding the change as an edit to the installed copy. Record that you have diverged from upstream.

## The Lockfile

`skills-lock.json` is the install lockfile — analogous to `package-lock.json`. It records each distributable skill's `source`, `sourceType`, and a `computedHash` of the installed content, and is committed so the installed state is reproducible and drift is detectable. Repository-local skills never appear in it.

**Guidelines:**

- MUST commit `skills-lock.json` and regenerate it by running the install command, never by hand-editing.
- MUST treat a `computedHash` change with no corresponding source edit as install drift to investigate, not to blindly commit.
- SHOULD be aware that a `local` `source` is an absolute path, so it can differ between machines; regenerate the lock with the install command in your own checkout rather than expecting a foreign checkout's lock to be byte-identical.

## Verification

Skill changes are documentation changes: they gate on format, lint, and relative-link integrity, plus a skill structure validator where the project ships one.

**Guidelines:**

- MUST run the project's documentation checks (format, lint, relative-link integrity) after any skill change — a direct edit or a reinstall — and fix any failure before committing.
- MUST run the relative-link check whenever a skill's files or links moved, since a stale link inside an installed copy fails the same check as the source.
- MUST confirm, after adding, renaming, moving, or removing a skill or a reference file, that discovery metadata and parent routing still resolve to the change — per your skill-authoring conventions, which own those rules — because a tier move changes paths that discovery and routing depend on.
- SHOULD validate a changed skill with the structure validator your skill-authoring conventions ship, if any.
- SHOULD diff a reinstalled copy against its source (`git diff --stat`) to confirm the reinstall changed exactly the expected files.
