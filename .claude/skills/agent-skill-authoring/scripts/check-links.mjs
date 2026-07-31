#!/usr/bin/env node
// check-links.mjs — relative-link integrity check for a skill tree's Markdown links.
//
// Walks every Markdown file under the given roots — including dot-directories
// such as `.claude/`, which a `glob('**/*.md')` sweep silently skips unless it
// is asked for them — and reports relative links whose target file does not
// exist.
//
// Ships with the agent-skill-authoring skill (see
// ../references/cross-referencing.md) so link verification survives template
// adaptation and stays runnable in any project that keeps the skill. It is
// dependency-light (Node standard library only), and shares the CommonMark
// fenced-block rule with check-skill.mjs through commonmark.mjs beside it —
// one implementation, so the two can never disagree about what is example text.
//
// Usage:
//   node check-links.mjs           # check the whole tree
//   node check-links.mjs PATH ...  # check specific roots
//   node check-links.mjs --help
//
// Only links to `.md` targets are checked; `http(s)://`, `mailto:`, and pure
// `#anchor` links are ignored. Illustrative example links inside fenced code
// blocks, inline code spans, and HTML comments are skipped so the
// skill-authoring docs can show `[file.md](./references/file.md)` without
// tripping the check.
//
// A path argument that does not exist is skipped rather than reported: the
// check answers "do the links under these roots resolve", and a root that is
// not there contributes no links.
//
// Exit codes:
//   0  all relative links resolve
//   1  one or more broken links
//   2  bad invocation

import { readFile, readdir, stat } from "node:fs/promises";

import { scanLines, unterminatedFenceLine } from "./commonmark.mjs";

const USAGE = `Usage: check-links.mjs [<path> ...]

Check that every relative Markdown link under <path> resolves on disk.
With no <path>, the whole tree below the working directory is checked.

Exit codes: 0 all links resolve, 1 broken links found, 2 bad invocation.`;

/**
 * Directory names never worth walking: version control, dependency trees, and
 * build output. A generated `.md` under one of these is not authored content,
 * and node_modules alone would dominate the run.
 */
const PRUNED_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  ".venv",
]);

/** An absolute URI (http:, https:, mailto:, …), which resolves to no file. */
const EXTERNAL_TARGET_RE = /^(https?:\/\/|mailto:)/;

/**
 * A Markdown inline link whose target names a `.md` file, optionally with an
 * `#anchor`. `[^)]*` cannot cross the closing paren, so the match ends at the
 * first `)` following the `.md`.
 */
const MD_LINK_RE = /\]\([^)]*\.md(#[^)]*)?\)/;

function fail2(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

/** A string of just the newlines in `text`, so a removed span keeps the line numbers after it intact. */
function newlinesOf(text) {
  return "\n".repeat((text.match(/\n/g) ?? []).length);
}

/**
 * Drop every HTML comment, replacing each span with its own newlines so later
 * lines keep their original numbers — which the unterminated-fence warning
 * reports. A dangling unclosed `<!--` is kept: it comments out the rest of the
 * document in a renderer, but treating it as a comment here would silently stop
 * checking at that point.
 *
 * @param {string} content
 * @returns {string}
 */
function stripHtmlComments(content) {
  let stripped = "";
  let rest = content;

  for (;;) {
    const openAt = rest.indexOf("<!--");
    if (openAt === -1) break;
    const closeOffset = rest.slice(openAt + 4).indexOf("-->");
    if (closeOffset === -1) break;

    const spanLength = closeOffset + 7; // "<!--" + body + "-->"
    stripped += rest.slice(0, openAt) + newlinesOf(rest.slice(openAt, openAt + spanLength));
    rest = rest.slice(openAt + spanLength);
  }
  return stripped + rest;
}

/**
 * Split `target#fragment` at the fragment: the target is the prefix up to the
 * first `.md` that is followed by `#` or ends the parenthesised text. Scanning
 * for the FIRST qualifying `.md` rather than the last is what keeps a path like
 * `./a.md.backup.md` resolving against the name it actually links.
 *
 * @param {string} inside the text between `](` and `)`
 * @returns {string}
 */
function linkTarget(inside) {
  let position = inside.indexOf(".md");

  while (position !== -1) {
    const after = inside.slice(position + 3);
    if (after === "" || after.startsWith("#")) return inside.slice(0, position + 3);
    const nextOffset = after.indexOf(".md");
    if (nextOffset === -1) break;
    position = position + 3 + nextOffset;
  }
  return inside;
}

/**
 * Every candidate `.md` link target in a document, plus whether a fence was
 * left open at end of file.
 *
 * HTML comments, fenced code blocks, and inline code spans are removed first —
 * all three carry illustrative links a reader is meant to see and a checker is
 * not meant to resolve.
 *
 * @param {string} source raw file content
 * @returns {{ targets: string[], unterminatedFenceAt: number | null }}
 */
function extractLinkTargets(source) {
  const content = stripHtmlComments(source.replace(/\r/g, ""));
  const targets = [];

  for (const { text, fence } of scanLines(content)) {
    if (fence) continue;

    let line = text.replace(/`+[^`]+`+/g, "");
    for (;;) {
      const match = line.match(MD_LINK_RE);
      if (!match) break;
      line = line.slice(match.index + match[0].length);

      const target = linkTarget(match[0].slice(2, -1));
      if (!EXTERNAL_TARGET_RE.test(target)) targets.push(target);
    }
  }
  return { targets, unterminatedFenceAt: unterminatedFenceLine(content) };
}

/**
 * Markdown files under one root: a file argument is taken as-is when it is
 * Markdown, a directory argument is walked. Dot-directories are included —
 * `.claude/` is exactly where a skill tree lives — while PRUNED_DIRS are not.
 *
 * @param {string} root
 * @returns {Promise<string[]>}
 */
async function listMarkdownFiles(root) {
  let stats;
  try {
    stats = await stat(root);
  } catch {
    return []; // a root that is not there contributes no links
  }
  if (stats.isFile()) return root.endsWith(".md") ? [root] : [];
  if (!stats.isDirectory()) return [];

  const found = [];
  const pending = [root.length > 1 ? root.replace(/\/+$/, "") : root];

  while (pending.length > 0) {
    const dir = pending.pop();
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue; // unreadable directory: nothing to check inside it
    }
    for (const entry of entries) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!PRUNED_DIRS.has(entry.name)) pending.push(path);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        found.push(path);
      }
    }
  }
  return found;
}

/** Byte-wise sorted, deduplicated Markdown files under every root. */
async function collectMarkdownFiles(roots) {
  const files = new Set();
  for (const root of roots) {
    for (const file of await listMarkdownFiles(root)) files.add(file);
  }
  return [...files].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
}

/** File content, or null when it cannot be read. */
async function readFileText(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

/** True when `path` names something that exists (a dangling symlink does not). */
async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${USAGE}\n`);
    process.exit(0);
  }
  for (const arg of args) {
    if (arg.startsWith("--")) fail2(`Unknown option "${arg}".\n${USAGE}`);
  }

  const files = await collectMarkdownFiles(args.length > 0 ? args : ["."]);
  const broken = [];
  let linksChecked = 0;

  for (const file of files) {
    const source = await readFileText(file);
    if (source === null) continue;

    const { targets, unterminatedFenceAt } = extractLinkTargets(source);
    const base = file.includes("/") ? file.slice(0, file.lastIndexOf("/")) : ".";

    for (const target of targets) {
      linksChecked += 1;
      const resolved = target.startsWith("/") ? target : `${base}/${target}`;
      if (!(await exists(resolved))) broken.push(`  ${file} -> ${target}`);
    }

    if (unterminatedFenceAt !== null) {
      process.stderr.write(
        `warning: unterminated fence in ${file} (opened at line ${unterminatedFenceAt}); the rest of the file was not checked\n`,
      );
    }
  }

  if (broken.length > 0) {
    process.stdout.write(
      `BROKEN LINKS (${broken.length}) across ${files.length} files:\n${broken.join("\n")}\n`,
    );
    process.exit(1);
  }
  process.stdout.write(
    `links OK (${linksChecked} links across ${files.length} Markdown files checked)\n`,
  );
}

main();
