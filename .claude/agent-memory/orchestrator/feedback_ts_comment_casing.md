---
name: TS/JS comment casing
description: In TypeScript/JavaScript files, comment lines must start with a lowercase letter (no sentence-case first word).
type: feedback
---

In TypeScript and JavaScript source files, comment lines MUST start with a lowercase letter. This applies to `//` single-line comments, `/* */` block comments, multi-line comment runs (first line lowercase; continuation lines are already mid-sentence), and JSDoc. Proper nouns and acronyms keep their natural casing (e.g., "Chromium", "GFM", "API", "React").

**Why:** Project-wide style preference, applied consistently across existing `.ts` / `.tsx` / `.js` files — the user flagged that the GFM-tables workflow had introduced sentence-cased comment openings that needed correcting.

**How to apply:** When any subagent writes or edits TypeScript/JavaScript code, instruct them to write comment first words in lowercase. Scope is TS/JS source only — does NOT apply to CSS (`/* */`), Markdown (prose headings), skill files, or commit messages. `biome-ignore` and `eslint-disable` directive comments follow the tool's required casing (lowercase); their "reason" suffix also follows lowercase-first.
