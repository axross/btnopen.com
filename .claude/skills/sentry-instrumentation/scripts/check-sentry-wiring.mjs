#!/usr/bin/env node
// check-sentry-wiring.mjs — a floor check for a project's Sentry wiring.
//
// This validates the four Sentry rules that are decidable from a repository
// alone AND whose failure mode is silent — nothing errors, the build passes,
// and the gap surfaces during an incident. Every other rule in the
// sentry-instrumentation skill needs judgment, so it is deliberately not here:
// a report from this script is always a real defect, never an argument.
//
// What it checks, per project root:
//   Secrets (whole tree)
//     - no Sentry auth token behind a bundler's public environment prefix,
//       which inlines the value into the shipped bundle
//     - no committed literal Sentry auth token
//   Wiring (from package.json)
//     - a project depending on @sentry/react-native applies the SDK's bundler
//       wrapper in its Metro config; without it no source map is generated,
//       so every production frame arrives minified
//     - a project depending on @sentry/nextjs exports onRequestError from its
//       instrumentation module; without it server errors go unreported
//
// What it does NOT check
//   Everything the skill actually turns on: whether the data-collection posture
//   is right, whether a sample rate was chosen deliberately, whether release
//   and dist are derived from the build, whether replay masking survived, or
//   whether a bundler-specific option matches the bundler in use. A passing run
//   is a floor, not a conformance claim.
//
// Usage:
//   node check-sentry-wiring.mjs <project-root> [<project-root> ...]

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

// Directories never worth walking: dependencies and build output. Native
// project directories are deliberately NOT skipped — a bare React Native
// project commits its Sentry properties file inside `ios/` and `android/`,
// which is one of the likeliest places for a token to leak. Their own build
// output is skipped instead.
const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  ".expo",
  "dist",
  "build",
  "coverage",
  "vendor",
  "Pods",
  ".gradle",
  "DerivedData",
]);

/** Extensions whose contents are worth scanning for a leaked token. */
const SCANNED_EXTENSIONS = new Set([
  ".js",
  ".cjs",
  ".mjs",
  ".jsx",
  ".ts",
  ".cts",
  ".mts",
  ".tsx",
  ".json",
  ".jsonc",
  ".yaml",
  ".yml",
  ".sh",
  ".bash",
  ".toml",
  ".properties",
]);

/** A bundler's public environment prefix in front of a Sentry auth token. */
const PUBLIC_PREFIXED_TOKEN =
  /\b(?:NEXT_PUBLIC|EXPO_PUBLIC|PUBLIC|VITE|REACT_APP|GATSBY|NUXT_PUBLIC)_[A-Z0-9_]*SENTRY[A-Z0-9_]*AUTH[A-Z0-9_]*TOKEN\b/;

/** A literal Sentry auth token. Both current prefixes, org and user scoped. */
const LITERAL_TOKEN = /\bsntry[su]_[A-Za-z0-9._-]{16,}/;

/** The module every supported Metro wrapper is imported from. */
const METRO_WRAPPER_MODULE = "@sentry/react-native/metro";

/** Metro config filenames, in the order Metro itself resolves them. */
const METRO_CONFIGS = [
  "metro.config.js",
  "metro.config.cjs",
  "metro.config.mjs",
  "metro.config.ts",
];

/** Where an instrumentation module may live, relative to a project root. */
const INSTRUMENTATION_FILES = [
  "instrumentation.ts",
  "instrumentation.js",
  "instrumentation.mjs",
  "instrumentation.tsx",
  "src/instrumentation.ts",
  "src/instrumentation.js",
  "src/instrumentation.mjs",
  "src/instrumentation.tsx",
];

/** `true` when the path exists and is a regular file. */
async function isFile(candidate) {
  try {
    return (await stat(candidate)).isFile();
  } catch {
    return false;
  }
}

/** `true` when the path exists and is a directory. */
async function isDirectory(candidate) {
  try {
    return (await stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}

/** Read a file, or return `null` when it is absent or unreadable. */
async function readIfPresent(candidate) {
  try {
    return await readFile(candidate, "utf8");
  } catch {
    return null;
  }
}

/** Every scannable file under `root`, excluding skipped directories. */
async function collectFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const collected = [];

  for (const entry of entries) {
    const child = path.join(root, entry.name);

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      collected.push(...(await collectFiles(child)));
      continue;
    }

    if (!entry.isFile()) continue;

    // `.env` and its variants carry no extension pattern the set above catches,
    // and are exactly where a leaked token is most likely to sit.
    if (entry.name.startsWith(".env")) {
      collected.push(child);
      continue;
    }

    if (SCANNED_EXTENSIONS.has(path.extname(entry.name))) collected.push(child);
  }

  return collected;
}

/** Findings for the two secret checks, over one file's contents. */
function checkSecrets(file, source) {
  const findings = [];

  source.split("\n").forEach((line, index) => {
    // A commented-out placeholder is documentation, not a leak. Only a line
    // that actually assigns something counts. Both assignment styles are
    // recognized: `KEY=value` in env, shell, and properties files, and
    // `KEY: value` in the YAML and TOML this script also scans — a CI workflow
    // declaring a public-prefixed token is exactly the case worth catching.
    const assigns = /[=:]\s*\S/.test(line);

    if (assigns && PUBLIC_PREFIXED_TOKEN.test(line)) {
      findings.push({
        line: index + 1,
        message:
          "Sentry auth token behind a public environment prefix; the bundler inlines it into the shipped bundle.",
      });
    }

    if (LITERAL_TOKEN.test(line)) {
      findings.push({
        line: index + 1,
        message:
          "literal Sentry auth token committed to the repository; rotate it and move it to build-time secret storage.",
      });
    }
  });

  return findings;
}

/** Dependency names declared by a project's manifest, or `null` if unreadable. */
async function readDependencies(root) {
  const source = await readIfPresent(path.join(root, "package.json"));
  if (source === null) return null;

  let manifest;
  try {
    manifest = JSON.parse(source);
  } catch {
    return null;
  }

  return new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ]);
}

/**
 * The nearest Metro config at or above `root`, or `null`.
 *
 * A monorepo package legitimately inherits its Metro config from the workspace
 * root, so concluding "no Metro config" from the package directory alone
 * reports a defect that is not there. The walk stops at the repository root —
 * the first directory holding `.git` — so it never wanders outside the project.
 */
async function findMetroConfig(root) {
  let directory = path.resolve(root);

  for (;;) {
    for (const name of METRO_CONFIGS) {
      const candidate = path.join(directory, name);
      if (await isFile(candidate)) return candidate;
    }

    // `.git` marks the repository root: check it, then stop.
    if (await isDirectory(path.join(directory, ".git"))) return null;

    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

/** Findings for the React Native Metro-wrapper check. */
async function checkMetroWrapper(root) {
  const found = await findMetroConfig(root);

  if (found === null) {
    return [
      {
        message: `depends on @sentry/react-native and no Metro config was found at or above it; without ${METRO_WRAPPER_MODULE} no source map is generated.`,
      },
    ];
  }

  const source = await readIfPresent(found);
  if (source === null || source.includes(METRO_WRAPPER_MODULE)) return [];

  return [
    {
      file: found,
      message: `Metro config does not apply the Sentry bundler wrapper from ${METRO_WRAPPER_MODULE}; without it no source map is generated.`,
    },
  ];
}

/** Findings for the Next.js server-error-hook check. */
async function checkRequestErrorHook(root) {
  for (const relative of INSTRUMENTATION_FILES) {
    const candidate = path.join(root, relative);
    const source = await readIfPresent(candidate);
    if (source === null) continue;

    if (/\bonRequestError\b/.test(source)) return [];

    return [
      {
        file: candidate,
        message:
          "instrumentation module exports no onRequestError; server errors reach no error tracker.",
      },
    ];
  }

  return [
    {
      message:
        "depends on @sentry/nextjs but has no instrumentation module exporting onRequestError; server errors go unreported.",
    },
  ];
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

const USAGE = `Usage: check-sentry-wiring.mjs <project-root> [<project-root> ...]

Check the four Sentry wiring rules decidable from a repository whose failure is
silent: an auth token behind a public environment prefix, a committed literal
auth token, a React Native project whose Metro config lacks the Sentry bundler
wrapper, and a Next.js project whose instrumentation module lacks onRequestError.

Each <project-root> is a directory holding a package.json. The two secret checks
run over the whole tree; the two wiring checks run only when the matching
@sentry/* dependency is declared.

A passing run is a floor, not a conformance claim.

Exit codes: 0 every project passed, 1 one or more findings, 2 bad invocation.`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${USAGE}\n`);
    process.exit(0);
  }

  const roots = args.filter((arg) => !arg.startsWith("--"));
  if (roots.length === 0) fail(USAGE);

  let findings = 0;
  let unreadable = 0;
  let checked = 0;

  for (const root of roots) {
    const dependencies = await readDependencies(root);

    if (dependencies === null) {
      process.stderr.write(`Cannot read a package.json in ${root}\n`);
      unreadable += 1;
      continue;
    }

    checked += 1;

    let files;
    try {
      files = await collectFiles(root);
    } catch (error) {
      process.stderr.write(`Cannot read ${root}: ${error.message}\n`);
      unreadable += 1;
      continue;
    }

    for (const file of files.sort()) {
      const source = await readIfPresent(file);
      if (source === null) {
        process.stderr.write(`Cannot read ${file}\n`);
        unreadable += 1;
        continue;
      }

      for (const finding of checkSecrets(file, source)) {
        process.stdout.write(`${file}:${finding.line}  ${finding.message}\n`);
        findings += 1;
      }
    }

    const wiring = [
      ...(dependencies.has("@sentry/react-native")
        ? await checkMetroWrapper(root)
        : []),
      ...(dependencies.has("@sentry/nextjs")
        ? await checkRequestErrorHook(root)
        : []),
    ];

    for (const finding of wiring) {
      process.stdout.write(`${finding.file ?? root}  ${finding.message}\n`);
      findings += 1;
    }
  }

  process.stdout.write(
    findings === 0
      ? `All ${checked} project(s) passed the Sentry wiring checks.\n`
      : `${findings} finding(s) across ${checked} checked project(s).\n`,
  );

  process.exit(findings > 0 || unreadable > 0 ? 1 : 0);
}

await main();
