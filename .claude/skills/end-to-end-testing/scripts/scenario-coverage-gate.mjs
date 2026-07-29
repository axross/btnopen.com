#!/usr/bin/env node
// scenario-coverage-gate.mjs — reference reporter/gate for E2E scenario coverage.
//
// Scenario coverage measures which real user or client JOURNEYS the suite asserts,
// not lines of application code executed. This script joins a human-authored journey
// CATALOG against the scenario TAGS carried by PASSING tests, reports covered/total
// overall and per priority, lists the gaps, and fails the process on the phased gate:
//
//   1. any `must`-priority journey with no passing asserting test, or
//   2. any structural tag error — a `@scenario:<id>` tag with no catalog row, or an
//      `@area:` / `@priority:` facet tag that disagrees with its scenario's catalog row.
//
// It is dependency-light (Node standard library only) and runner-agnostic: the
// join/report/gate logic is the reusable core, and results arrive as a small
// NORMALIZED shape so any runner can feed it through a thin adapter. Adapt or extend
// it for the project — it is a starting point, not a fixed contract.
//
// Usage:
//   node scenario-coverage-gate.mjs --catalog e2e/scenarios.md --results e2e/.scenario-results.json
//
// Inputs:
//   --catalog  Markdown file containing a table with columns Id | Title | Area | Priority
//              (case-insensitive header, any column order). See assets/scenarios.example.md.
//   --results  JSON file: an array of test results, each
//                { "title": string, "tags"?: string[], "status": "passed" | "failed" | "skipped" }
//              where `tags` holds entries like "@scenario:cards.browse", "@area:cards",
//              "@priority:must". Tags may instead be embedded in `title` (e.g. Vitest/Jest
//              title suffixes); @-tokens are read from BOTH `tags` and `title`.
//
// Producing --results from a runner (thin adapter, pick one):
//   • Playwright  — read the JSON reporter output and map each test to
//                   { title, tags: test.tags, status: result.status }.
//   • Vitest/Jest — read the JSON reporter output; scenario tags live in the test title.
//   • Maestro     — collect each flow's `tags:` list and its pass/fail into this shape.
//
// Exit codes:
//   0  gate passed
//   1  gate failed (an uncovered `must` journey, or a structural tag/catalog error)
//   2  bad invocation or unreadable/unparseable inputs

import { readFile } from "node:fs/promises";

const PRIORITIES = ["must", "should", "may"];

/** Parse `--flag value` pairs; returns { catalog, results }. */
const USAGE = `Usage: scenario-coverage-gate.mjs --catalog <file.md> --results <file.json>

Join a human-authored journey catalog against the scenario tags carried by
passing tests, report covered/total overall and per priority, and fail on the
phased gate.

  --catalog  Markdown file with a table of Id | Title | Area | Priority
  --results  JSON array of { title, tags?, status }

Exit codes: 0 gate passed, 1 gate failed, 2 bad invocation or unreadable input.`;

function parseArgs(argv) {
  const args = {};
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(`${USAGE}\n`);
    process.exit(0);
  }
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--catalog" || flag === "--results") {
      const value = argv[i + 1];
      if (value === undefined) fail2(`Missing value for ${flag}.`);
      args[flag.slice(2)] = value;
      i += 1;
    } else {
      fail2(`Unknown argument: ${flag}`);
    }
  }
  if (!args.catalog || !args.results) fail2(USAGE);
  return args;
}

/** Split one Markdown table row into trimmed cell strings. */
function tableCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

const isTableRow = (line) => line.trim().startsWith("|");
const isDelimiterRow = (line) =>
  tableCells(line).every((cell) => /^:?-{1,}:?$/.test(cell));

/**
 * Parse the journey catalog from Markdown. Finds the first table whose header
 * carries at least an `id` and a `priority` column, then reads its data rows.
 * Returns { rows: Map<id, {title, area, priority}>, errors: string[] }.
 */
function parseCatalog(markdown) {
  const lines = markdown.split(/\r?\n/);
  const errors = [];
  const rows = new Map();

  let header = null;
  let index = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!isTableRow(line)) {
      if (header) break; // table ended
      continue;
    }
    const cells = tableCells(line);
    if (!header) {
      const lower = cells.map((cell) => cell.toLowerCase());
      const idAt = lower.indexOf("id");
      const priorityAt = lower.indexOf("priority");
      if (idAt === -1 || priorityAt === -1) continue; // not the catalog header
      header = cells;
      index = {
        id: idAt,
        title: lower.indexOf("title"),
        area: lower.indexOf("area"),
        priority: priorityAt,
      };
      continue;
    }
    if (isDelimiterRow(line)) continue;

    const id = cells[index.id] ?? "";
    if (!id) continue;
    const priority = (cells[index.priority] ?? "").toLowerCase();
    const area = index.area === -1 ? "" : (cells[index.area] ?? "");
    const title = index.title === -1 ? "" : (cells[index.title] ?? "");
    if (!PRIORITIES.includes(priority)) {
      errors.push(`Catalog row "${id}" has priority "${cells[index.priority]}", expected one of ${PRIORITIES.join(" | ")}.`);
    }
    if (rows.has(id)) {
      errors.push(`Catalog has a duplicate id "${id}".`);
    }
    rows.set(id, { title, area, priority });
  }

  return { rows, errors };
}

/** All `@name:value` (and bare `@name`) tokens from a result's tags and title. */
function tagsOf(result) {
  const fromArray = Array.isArray(result.tags) ? result.tags : [];
  const fromTitle =
    typeof result.title === "string" ? result.title.match(/@[\w:.-]+/g) ?? [] : [];
  return [...new Set([...fromArray, ...fromTitle])];
}

/** Values of every `@<kind>:<value>` tag with the given kind. */
function facetValues(tags, kind) {
  const prefix = `@${kind}:`;
  return tags
    .filter((tag) => tag.startsWith(prefix))
    .map((tag) => tag.slice(prefix.length));
}

/**
 * Join results against the catalog.
 * Returns { covered: Set<id>, errors: string[] }.
 */
function join(catalog, results) {
  const covered = new Set();
  const errors = [];

  for (const result of results) {
    const tags = tagsOf(result);
    const scenarioIds = facetValues(tags, "scenario");
    if (scenarioIds.length === 0) continue;

    const areas = facetValues(tags, "area");
    const priorities = facetValues(tags, "priority");

    for (const id of scenarioIds) {
      const row = catalog.rows.get(id);
      if (!row) {
        errors.push(`Test "${result.title}" tags unknown scenario "@scenario:${id}" (no catalog row).`);
        continue;
      }
      // Facet tags must agree with the scenario's catalog row.
      for (const area of areas) {
        if (row.area && area !== row.area) {
          errors.push(`Test "${result.title}" tags @area:${area} but scenario "${id}" is area "${row.area}".`);
        }
      }
      for (const priority of priorities) {
        if (priority !== row.priority) {
          errors.push(`Test "${result.title}" tags @priority:${priority} but scenario "${id}" is priority "${row.priority}".`);
        }
      }
      if (result.status === "passed") covered.add(id);
    }
  }

  return { covered, errors };
}

/** Build the printable report and decide the gate outcome. */
function report(catalog, covered, errors) {
  const lines = [];
  const byPriority = Object.fromEntries(
    PRIORITIES.map((priority) => [priority, { covered: 0, total: 0, uncovered: [] }]),
  );

  for (const [id, row] of catalog.rows) {
    const bucket = byPriority[row.priority];
    if (!bucket) continue; // invalid priority already reported as an error
    bucket.total += 1;
    if (covered.has(id)) bucket.covered += 1;
    else bucket.uncovered.push({ id, title: row.title, area: row.area });
  }

  // Total and covered are summed from the same per-priority buckets the
  // breakdown prints, so the header can never disagree with it. A row with an
  // invalid priority has no bucket: it is surfaced as a structural error below,
  // not counted here.
  const total = PRIORITIES.reduce((sum, p) => sum + byPriority[p].total, 0);
  const coveredCount = PRIORITIES.reduce((sum, p) => sum + byPriority[p].covered, 0);
  lines.push(`Scenario coverage: ${coveredCount}/${total} journeys asserted`);
  for (const priority of PRIORITIES) {
    const bucket = byPriority[priority];
    lines.push(`  ${priority.padEnd(6)} ${bucket.covered}/${bucket.total}`);
  }

  const uncoveredAll = PRIORITIES.flatMap((priority) =>
    byPriority[priority].uncovered.map((row) => ({ ...row, priority })),
  );
  if (uncoveredAll.length > 0) {
    lines.push("");
    lines.push("Uncovered journeys:");
    for (const row of uncoveredAll) {
      lines.push(`  [${row.priority}] ${row.id} — ${row.title}${row.area ? ` (${row.area})` : ""}`);
    }
  }

  const mustGaps = byPriority.must.uncovered;
  const failed = mustGaps.length > 0 || errors.length > 0;

  if (errors.length > 0) {
    lines.push("");
    lines.push(`Structural errors (${errors.length}):`);
    for (const error of errors) lines.push(`  - ${error}`);
  }

  lines.push("");
  if (mustGaps.length > 0) {
    lines.push(`GATE FAILED: ${mustGaps.length} must-priority journey(s) have no passing asserting test.`);
  } else if (errors.length > 0) {
    lines.push("GATE FAILED: structural tag/catalog errors must be fixed.");
  } else {
    lines.push("GATE PASSED: every must-priority journey is asserted and all tags join cleanly.");
  }

  return { text: lines.join("\n"), failed };
}

function fail2(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

/** Read the results file and return the parsed array; exits 2 on a read error, invalid JSON, or a non-array top level. */
async function readJson(path) {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    fail2(`Cannot read results file "${path}": ${error.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail2(`Results file "${path}" is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed)) {
    fail2(`Results file "${path}" must be a JSON array of { title, tags?, status }.`);
  }
  return parsed;
}

/** Load the catalog and results, run the join, print the report, and exit 0 (gate passed) or 1 (gate failed). */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  let catalogMarkdown;
  try {
    catalogMarkdown = await readFile(args.catalog, "utf8");
  } catch (error) {
    fail2(`Cannot read catalog file "${args.catalog}": ${error.message}`);
  }
  const results = await readJson(args.results);

  const catalog = parseCatalog(catalogMarkdown);
  if (catalog.rows.size === 0) {
    fail2(`No catalog rows found in "${args.catalog}" (expected a table with Id and Priority columns).`);
  }

  const joined = join(catalog, results);
  const errors = [...catalog.errors, ...joined.errors];
  const { text, failed } = report(catalog, joined.covered, errors);

  process.stdout.write(`${text}\n`);
  process.exit(failed ? 1 : 0);
}

main();
