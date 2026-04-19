---
name: Subagent file template — no agent-memory preamble
description: Subagent .md files should not carry "Update your agent memory" / Examples / Remember tagline between Output Format and the Persistent Agent Memory section
type: feedback
---

Subagent definition files under `.claude/agents/` should end at the **Output Format** section, then transition directly to the `# Persistent Agent Memory` heading with two blank lines between them. Do NOT author an "**Update your agent memory** ..." paragraph, an "Examples of what to record:" list, or a "Remember: You are the ..." tagline between Output Format and Persistent Agent Memory.

**Why:** User explicitly rejected restoring that block to `orchestrator.md`, directing me to "refer other subagents file to follow the pattern." The dominant pattern across `nextjs-developer.md`, `ui-ux-designer.md`, and `agent-skill-architect.md` already omits those paragraphs — only `code-reviewer.md` still carries them (legacy/outlier). The Persistent Agent Memory section itself carries sufficient instructions for the agent about its memory system; the preamble is redundant.

**How to apply:** When authoring or refining any `.claude/agents/*.md`, end the main body at "## Output Format" (or whichever section comes last), then insert two blank lines and `# Persistent Agent Memory`. If an existing subagent file still has the legacy preamble block, propose removal during polish passes. When checking "structure and format" compliance, treat the absence of that block as a feature, not a gap.
