#!/usr/bin/env node
// check-wireframe.mjs — output validator for low-fidelity wireframe pages.
//
// A wireframe produced from wireframe-kit.html must satisfy two of the skill's
// MUST rules that are mechanically checkable: it must stay self-contained (no
// external resource fetch, so it renders offline and can never leak a request),
// and it must carry no leftover template placeholders (`FILL:` markers or
// `lorem ipsum` filler). This script checks a filled page for both, so an
// author can gate a wireframe before presenting it.
//
// It is dependency-light (Node standard library only). It intentionally does
// NOT judge hierarchy, grouping, or grayscale discipline — those need a human
// eye and the research-grounded rules in the skill; this is a floor, not a
// substitute for the review.
//
// Usage:
//   node check-wireframe.mjs <file.html> [<file.html> ...]
//
// Exit codes:
//   0  every checked file passed
//   1  one or more files failed (each failure is listed per file), or a file
//      could not be read
//   2  bad invocation (no file arguments)
//
// Note: the un-filled kit (wireframe-kit.html) deliberately contains `FILL:`
// markers, so it is EXPECTED to fail here. Run this on your filled copy.

import { readFile } from "node:fs/promises";

/**
 * True when a resource URL points off the page — an absolute http(s) URL or a
 * protocol-relative `//host` reference. In-page anchors (`#…`), inline `data:`
 * payloads, and relative paths are self-contained and pass.
 * @param {string} url
 * @returns {boolean}
 */
function isExternalUrl(url) {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed);
}

/** Turn a byte offset into a 1-indexed line number for reporting. */
function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === "\n") line += 1;
  }
  return line;
}

/**
 * Collect every external-fetch failure in the page. Covers the four ways a
 * self-contained page can be broken: `src`/`srcset` attributes, `<link href>`,
 * CSS `@import`, and CSS `url(...)`. Plain `<a href>` is a navigation link, not
 * a fetch, so it is deliberately not scanned.
 * @param {string} text
 * @returns {string[]} human-readable failure lines
 */
function externalFetchFailures(text) {
  const failures = [];
  const seen = new Set();
  const flag = (kind, url, index) => {
    const key = `${kind}:${url}:${index}`;
    if (seen.has(key)) return;
    seen.add(key);
    failures.push(`self-containment: external ${kind} at line ${lineOf(text, index)} — ${url}`);
  };

  // src="…" (single value) — <img>, <script>, <iframe>, <source>, etc.
  for (const m of text.matchAll(/\bsrc\s*=\s*["']([^"']+)["']/gi)) {
    if (isExternalUrl(m[1])) flag("src", m[1], m.index);
  }
  // srcset="url 1x, url 2x" — each candidate's URL is the token before any descriptor.
  for (const m of text.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
    for (const candidate of m[1].split(",")) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url && isExternalUrl(url)) flag("srcset", url, m.index);
    }
  }
  // <link href="…"> — a stylesheet/font/icon fetch (unlike <a href>).
  for (const m of text.matchAll(/<link\b[^>]*?\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    if (isExternalUrl(m[1])) flag("link href", m[1], m.index);
  }
  // @import "…" or @import url(…)
  for (const m of text.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')]+)/gi)) {
    if (isExternalUrl(m[1])) flag("@import", m[1], m.index);
  }
  // url(…) in CSS (inline styles or <style>) — fonts, background images, etc.
  for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    if (isExternalUrl(m[1])) flag("url()", m[1], m.index);
  }

  return failures;
}

/**
 * Collect leftover-placeholder failures: unfilled `FILL:` markers and any
 * `lorem ipsum` filler text (which the skill forbids in favor of real content).
 * @param {string} text
 * @returns {string[]} human-readable failure lines
 */
function placeholderFailures(text) {
  const failures = [];
  for (const m of text.matchAll(/FILL:/g)) {
    failures.push(`placeholder: leftover "FILL:" marker at line ${lineOf(text, m.index)}`);
  }
  for (const m of text.matchAll(/lorem ipsum/gi)) {
    failures.push(`placeholder: "lorem ipsum" filler at line ${lineOf(text, m.index)}`);
  }
  return failures;
}

/** Run every check for one file; returns failure strings (empty when clean). */
async function checkFile(path) {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    return [`unreadable: ${error.message}`];
  }
  return [...externalFetchFailures(text), ...placeholderFailures(text)];
}

const USAGE = `Usage: check-wireframe.mjs <file.html> [more files…]

Check a filled wireframe page for the two mechanically checkable MUST rules:
it stays self-contained (no external resource fetch) and carries no leftover
template placeholders (FILL: markers or lorem ipsum filler).

The un-filled kit deliberately contains FILL: markers, so it is EXPECTED to
fail here. Run this on your filled copy.

Exit codes: 0 every file passed, 1 one or more failed, 2 bad invocation.`;

/** Entry point: validate every file argument, print a per-file report, and set the exit code. */
async function main() {
  const paths = process.argv.slice(2);
  if (paths.includes("--help") || paths.includes("-h")) {
    process.stdout.write(`${USAGE}\n`);
    process.exit(0);
  }
  if (paths.length === 0) {
    process.stderr.write(`${USAGE}\n`);
    process.exit(2);
  }

  const lines = [];
  let failedCount = 0;
  for (const path of paths) {
    const failures = await checkFile(path);
    if (failures.length === 0) {
      lines.push(`PASS  ${path}`);
    } else {
      failedCount += 1;
      lines.push(`FAIL  ${path}`);
      for (const failure of failures) lines.push(`        - ${failure}`);
    }
  }

  lines.push("");
  lines.push(
    failedCount === 0
      ? `All ${paths.length} file(s) passed wireframe checks.`
      : `${failedCount} of ${paths.length} file(s) failed wireframe checks.`,
  );
  process.stdout.write(`${lines.join("\n")}\n`);
  process.exit(failedCount === 0 ? 0 : 1);
}

main();
