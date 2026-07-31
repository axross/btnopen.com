#!/usr/bin/env node
// check-component-styles.mjs — a floor check for React component styles.
//
// This validates the subset of the react-component-styling rules that is
// decidable from a file alone. It is deliberately narrow: every check below
// corresponds to a rule with no documented exception, so a report is always a
// real violation rather than a judgment call to argue with.
//
// What it checks
//   CSS Modules (*.module.css)
//     - the file places its rules in the `components` cascade layer
//     - the file scopes its rules with `@scope (...)`
//     - the scope root is declared through `:where(:scope)`, never bare `:scope`
//     - no raw colour literal (hex, rgb/rgba, hsl/hsla, or a non-relative
//       oklch) where a token belongs
//     - no raw length literal on a token-required property (margin, padding,
//       gap, border-radius, font-size)
//     - no inline easing keyword or `cubic-bezier()` literal
//     - no sub-second duration literal in a transition or animation
//   Components (*.ts, *.tsx)
//     - a component imports only its own same-named `*.module.css`
//     - inside a `StyleSheet.create(...)` call, no hex colour literal and no
//       raw numeric literal on a token-required style key
//
// What it does NOT check
//   Everything the skill actually turns on: whether the chosen colour role is
//   the right one, whether a hover rule gates on the correct pointer feature,
//   whether an interactive target meets its minimum on both axes, whether a
//   per-scheme override was warranted, whether the property order is right.
//   A passing run is a floor, not a conformance claim.
//
// Token sources (theme files) are skipped, since defining the scales is
// exactly where the literals belong. A file is treated as a token source when
// its basename is `variables.css`, `tokens.css`, or `theme.<ext>`, when it sits
// at `constants/style.<ext>`, or when its path contains a `--token-source`
// substring given on the command line.
//
// Usage:
//   node check-component-styles.mjs <path> [<path> ...]
//   node check-component-styles.mjs src --token-source=design-system/
//
//     <path>  a file, or a directory walked recursively for *.module.css,
//             *.ts, and *.tsx. `node_modules`, `.git`, `.next`, `dist`, and
//             `build` are skipped.
//
// Exit codes:
//   0  every checked file passed
//   1  one or more violations, or a path could not be read
//   2  bad invocation (no paths given)

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

const DEFAULT_TOKEN_SOURCE_BASENAMES = new Set([
  "variables.css",
  "tokens.css",
  "theme.ts",
  "theme.tsx",
  "theme.js",
  "theme.mjs",
]);

/** Style properties whose value must always resolve to a token. */
const CSS_TOKEN_REQUIRED = String.raw`margin|margin-block|margin-block-start|margin-block-end|margin-inline|margin-inline-start|margin-inline-end|margin-top|margin-right|margin-bottom|margin-left|padding|padding-block|padding-block-start|padding-block-end|padding-inline|padding-inline-start|padding-inline-end|padding-top|padding-right|padding-bottom|padding-left|gap|row-gap|column-gap|border-radius|font-size`;

/** The mobile-native counterparts of the same set. */
const NATIVE_TOKEN_REQUIRED = new Set([
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginStart",
  "marginEnd",
  "marginHorizontal",
  "marginVertical",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingStart",
  "paddingEnd",
  "paddingHorizontal",
  "paddingVertical",
  "gap",
  "rowGap",
  "columnGap",
  "borderRadius",
  "fontSize",
]);

const EASING_KEYWORDS = ["ease-in-out", "ease-in", "ease-out", "cubic-bezier("];

/**
 * Strips CSS comments and, separately, `//` line comments for JS-like files,
 * so a rule illustrated inside a comment is never reported.
 * @param {string} source
 * @param {boolean} stripLineComments
 * @returns {string[]} the source's lines, with comment spans blanked out
 */
function blankComments(source, stripLineComments) {
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, " "),
  );
  const lines = withoutBlocks.split("\n");

  if (!stripLineComments) return lines;

  return lines.map((line) => line.replace(/\/\/.*$/, ""));
}

/**
 * True when the declaration value has no token reference and carries a real
 * length. `0`, bare ratios, and anything routed through `var()` are fine.
 * @param {string} value
 * @returns {boolean}
 */
function hasUntokenizedLength(value) {
  if (value.includes("var(")) return false;

  // A value built on line- or character-relative units is typographic rhythm
  // (`calc((1lh - 1em) / 2)`), where the paired font-relative `em` is
  // legitimate. An absolute length in the same expression is not, so the
  // exemption narrows the units checked rather than skipping the value —
  // `calc(1lh - 16px)` is still an untokenized length.
  const isRhythm = /\d(lh|rlh|ch|ex|cap|ic)\b/.test(value);
  const units = isRhythm ? "px|rem" : "px|rem|em";

  return new RegExp(String.raw`(?:^|[\s(,])-?\d*\.?\d+(${units})\b`).test(value);
}

/**
 * True when the value carries a sub-second duration literal. A deliberately
 * multi-second cadence is the skill's one documented literal, so only
 * sub-second values — which are always interaction timing — are reported.
 * @param {string} value
 * @returns {boolean}
 */
function hasShortDurationLiteral(value) {
  if (value.includes("var(")) return false;

  for (const match of value.matchAll(/(?:^|[\s(,])(\d*\.?\d+)(ms|s)\b/g)) {
    const seconds = match[2] === "ms" ? Number(match[1]) / 1000 : Number(match[1]);
    if (seconds < 1) return true;
  }

  return false;
}

/**
 * Reports raw colour literals. A relative-colour `oklch(from …)` derives from a
 * token and is allowed; a bare `oklch(…)` is a literal like any other.
 * @param {string} line
 * @returns {string | null}
 */
function findColorLiteral(line) {
  const hex = line.match(/#[0-9a-fA-F]{3,8}\b/);
  if (hex) return hex[0];

  const functional = line.match(/\b(rgba?|hsla?)\s*\(/);
  if (functional) return `${functional[1]}()`;

  // `\S` keeps a function wrapped across lines (`oklch(` then `from …`) out of
  // the match: the checks are line-based, and under-reporting a wrapped value
  // is the right bias for a floor check.
  const oklch = line.match(/\boklch\s*\(\s*(?!from\b)\S/);
  if (oklch) return "oklch()";

  return null;
}

/**
 * Checks one CSS Module.
 * @param {string} file
 * @param {string} source
 * @returns {{line: number, message: string}[]}
 */
function checkCssModule(file, source) {
  const findings = [];
  const lines = blankComments(source, false);
  const body = lines.join("\n");

  if (!/@layer\s+components\b/.test(body)) {
    findings.push({
      line: 1,
      message: "CSS Module does not place its rules in `@layer components`.",
    });
  }

  if (!/@scope\s*\(/.test(body)) {
    findings.push({
      line: 1,
      message: "CSS Module does not scope its rules with `@scope (...)`.",
    });
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // A bare `:scope` carries specificity and defeats consumer overrides.
    if (/(^|[^)\w-]):scope\b/.test(line) && !/:where\([^)]*:scope/.test(line)) {
      findings.push({
        line: lineNumber,
        message: "Scope root uses bare `:scope`; declare it as `:where(:scope)`.",
      });
    }

    const color = findColorLiteral(line);
    if (color !== null) {
      findings.push({
        line: lineNumber,
        message: `Raw colour literal \`${color}\`; use a semantic colour token.`,
      });
    }

    const declaration = line.match(
      new RegExp(String.raw`(?:^|[;{])\s*(${CSS_TOKEN_REQUIRED})\s*:\s*([^;{}]*)`),
    );
    if (declaration && hasUntokenizedLength(declaration[2])) {
      findings.push({
        line: lineNumber,
        message: `\`${declaration[1]}\` uses a raw length; use a token from the scale.`,
      });
    }

    const motion = line.match(/(?:^|[;{])\s*(transition|animation)[a-z-]*\s*:\s*([^;{}]*)/);
    if (motion) {
      const easing = EASING_KEYWORDS.find((keyword) => motion[2].includes(keyword));
      if (easing !== undefined) {
        findings.push({
          line: lineNumber,
          message: `Inline easing \`${easing}\`; use a role-named easing token.`,
        });
      }
      if (hasShortDurationLiteral(motion[2])) {
        findings.push({
          line: lineNumber,
          message: "Raw duration literal; use a token from the duration scale.",
        });
      }
    }
  });

  return findings;
}

/**
 * Checks one component module for a foreign stylesheet import and for literals
 * inside a `StyleSheet.create(...)` call.
 * @param {string} file
 * @param {string} source
 * @returns {{line: number, message: string}[]}
 */
function checkComponentModule(file, source) {
  const findings = [];
  const lines = blankComments(source, true);
  const own = path.basename(file).replace(/\.[^.]+$/, "");

  let depth = 0;
  let inStyleSheet = false;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    const styleImport = line.match(/from\s+["']([^"']*\.module\.css)["']/);
    if (styleImport) {
      const imported = path.basename(styleImport[1]).replace(/\.module\.css$/, "");
      if (imported !== own) {
        findings.push({
          line: lineNumber,
          message: `Imports \`${styleImport[1]}\`, another component's style module; share a component instead of a stylesheet.`,
        });
      }
    }

    if (!inStyleSheet && /\bStyleSheet\s*\.\s*create\s*\(/.test(line)) {
      inStyleSheet = true;
      depth = 0;
    }

    if (!inStyleSheet) return;

    for (const character of line) {
      if (character === "(" || character === "{") depth += 1;
      if (character === ")" || character === "}") depth -= 1;
    }

    const hex = line.match(/["'`]#[0-9a-fA-F]{3,8}["'`]/);
    if (hex) {
      findings.push({
        line: lineNumber,
        message: `Raw colour literal ${hex[0]}; use a semantic colour token from the theme.`,
      });
    }

    const property = line.match(/(?:^|[\s{,])([A-Za-z]+)\s*:\s*(-?\d*\.?\d+)\s*[,}]/);
    if (property && NATIVE_TOKEN_REQUIRED.has(property[1]) && Number(property[2]) !== 0) {
      findings.push({
        line: lineNumber,
        message: `\`${property[1]}\` uses a raw number; use a token from the scale.`,
      });
    }

    if (depth <= 0) inStyleSheet = false;
  });

  return findings;
}

/**
 * @param {string} file
 * @param {string[]} extraTokenSources
 * @returns {boolean}
 */
function isTokenSource(file, extraTokenSources) {
  const normalized = file.split(path.sep).join("/");
  if (DEFAULT_TOKEN_SOURCE_BASENAMES.has(path.basename(file))) return true;
  if (/\/constants\/style\.[a-z]+$/.test(normalized)) return true;
  return extraTokenSources.some((fragment) => normalized.includes(fragment));
}

/**
 * @param {string} target
 * @returns {Promise<string[]>}
 */
async function collectFiles(target) {
  const info = await stat(target);
  if (!info.isDirectory()) return [target];

  const entries = await readdir(target, { withFileTypes: true });
  const collected = [];

  for (const entry of entries) {
    const child = path.join(target, entry.name);

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      collected.push(...(await collectFiles(child)));
      continue;
    }

    if (/\.module\.css$/.test(entry.name) || /\.tsx?$/.test(entry.name)) {
      collected.push(child);
    }
  }

  return collected;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

const USAGE = `Usage: check-component-styles.mjs <path> [<path> ...] [--token-source=<substring>]

Check the subset of the component-styling rules decidable from a file alone:
cascade layer and @scope usage, raw colour and length literals where a token
belongs, and inline easing or sub-second duration literals.

  --token-source=<substring>  also treat paths containing <substring> as token
                              sources, which are skipped

A passing run is a floor, not a conformance claim.

Exit codes: 0 every file passed, 1 one or more failed, 2 bad invocation.`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${USAGE}\n`);
    process.exit(0);
  }
  const extraTokenSources = args
    .filter((arg) => arg.startsWith("--token-source="))
    .map((arg) => arg.slice("--token-source=".length))
    .filter((value) => value.length > 0);
  const targets = args.filter((arg) => !arg.startsWith("--"));

  if (targets.length === 0) fail(USAGE);

  const files = [];
  let unreadable = 0;

  for (const target of targets) {
    try {
      files.push(...(await collectFiles(target)));
    } catch (error) {
      process.stderr.write(`Cannot read ${target}: ${error.message}\n`);
      unreadable += 1;
    }
  }

  let violations = 0;
  let checked = 0;

  for (const file of files.sort()) {
    if (isTokenSource(file, extraTokenSources)) continue;

    let source;
    try {
      source = await readFile(file, "utf8");
    } catch (error) {
      process.stderr.write(`Cannot read ${file}: ${error.message}\n`);
      unreadable += 1;
      continue;
    }

    checked += 1;

    const findings = file.endsWith(".module.css")
      ? checkCssModule(file, source)
      : checkComponentModule(file, source);

    for (const finding of findings) {
      process.stdout.write(`${file}:${finding.line}  ${finding.message}\n`);
      violations += 1;
    }
  }

  process.stdout.write(
    violations === 0
      ? `All ${checked} file(s) passed the component-style checks.\n`
      : `${violations} violation(s) across ${checked} checked file(s).\n`,
  );

  process.exit(violations > 0 || unreadable > 0 ? 1 : 0);
}

await main();
