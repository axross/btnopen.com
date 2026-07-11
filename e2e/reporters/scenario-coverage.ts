import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
	FullResult,
	Reporter,
	TestCase,
	TestResult,
} from "@playwright/test/reporter";

/**
 * Custom Playwright reporter that measures **scenario coverage**: which authored
 * user journeys the suite exercises with a passing test tagged `@scenario:<id>`.
 * It adds no application instrumentation and costs nothing beyond bookkeeping, so
 * it runs on the default `npm run test:e2e`.
 *
 * The catalog (the coverage *denominator*) is authored as a markdown table in
 * `e2e/scenarios.md`; this reporter parses it — there is no scenario list in
 * code. On `onEnd` it prints an overall + per-priority + per-area summary and a
 * grouped list of uncovered scenarios, writes a machine artifact for the gate
 * check script, and fails the run on any structural error (always, every phase):
 *
 * - a malformed catalog (bad header, duplicate id, or a priority outside
 *   must/should/may),
 * - an `@scenario:` tag whose id is not in the catalog (a stale/typo tag), or
 * - a `@area:` / `@priority:` facet tag that disagrees with the catalog for the
 *   scenario(s) the test covers (missing or stray) — this keeps the greppable
 *   facet tags trustworthy for `--grep @priority:must` / `--grep @area:x`.
 */

// Playwright runs from the project root (where playwright.config.ts lives), so
// resolve paths relative to cwd. The reporter is transpiled to CommonJS by
// Playwright's loader, where import.meta is unavailable.
const CATALOG_FILE = join(process.cwd(), "e2e", "scenarios.md");
const ARTIFACT_DIR = join(process.cwd(), "e2e", ".scenario-coverage");
const ARTIFACT_FILE = join(ARTIFACT_DIR, "summary.json");

const SCENARIO_TAG_PREFIX = "@scenario:";
const AREA_TAG_PREFIX = "@area:";
const PRIORITY_TAG_PREFIX = "@priority:";

const PRIORITIES = ["must", "should", "may"] as const;
type Priority = (typeof PRIORITIES)[number];
const isPriority = (value: string): value is Priority =>
	(PRIORITIES as readonly string[]).includes(value);

interface Scenario {
	id: string;
	title: string;
	area: string;
	priority: Priority;
}

interface Tally {
	covered: number;
	total: number;
}

interface Summary {
	generatedBy: string;
	overall: Tally & { pct: number };
	byPriority: Record<Priority, Tally>;
	byArea: Record<string, Tally>;
	covered: string[];
	uncovered: Scenario[];
	unknownScenarioTags: string[];
	facetErrors: string[];
	catalogErrors: string[];
}

const pct = (t: Tally): number =>
	t.total === 0 ? 100 : Math.round((t.covered / t.total) * 1000) / 10;

/** Collect the payloads of a test's tags that carry a given `@prefix:`. */
const tagValues = (tags: readonly string[], prefix: string): string[] =>
	tags.filter((t) => t.startsWith(prefix)).map((t) => t.slice(prefix.length));

// hoisted so the once-per-run catalog parser reuses one compiled instance.
const LEADING_PIPE = /^\|/;
const TRAILING_PIPE = /\|$/;
const UNESCAPED_PIPE = /(?<!\\)\|/;
const ESCAPED_PIPE = /\\\|/g;
const SEPARATOR_CELL = /^:?-{2,}:?$/;

/**
 * Split a markdown table row `| a | b |` into trimmed cells, honouring the
 * markdown escape for a literal pipe (`\|`) so a title may contain one.
 */
const cells = (row: string): string[] =>
	row
		.trim()
		.replace(LEADING_PIPE, "")
		.replace(TRAILING_PIPE, "")
		// split on unescaped pipes only, then unescape `\|` back to `|`.
		.split(UNESCAPED_PIPE)
		.map((c) => c.replace(ESCAPED_PIPE, "|").trim());

const isSeparatorRow = (row: string[]): boolean =>
	row.every((c) => SEPARATOR_CELL.test(c));

/**
 * Parse the first markdown table in `e2e/scenarios.md` into the scenario catalog.
 * Only the first contiguous block of `|`-prefixed lines is read, so unrelated
 * prose or a second table elsewhere in the file cannot pollute the catalog.
 * Column order is read from the header, so the table can be reordered freely.
 */
function parseCatalog(text: string): {
	scenarios: Scenario[];
	errors: string[];
} {
	const errors: string[] = [];
	const lines = text.split("\n").map((l) => l.trim());
	const start = lines.findIndex((l) => l.startsWith("|"));
	if (start < 0) {
		return { scenarios: [], errors: ["catalog has no table rows"] };
	}
	let end = start;
	while (end < lines.length && lines[end].startsWith("|")) {
		end += 1;
	}
	const rows = lines
		.slice(start, end)
		.map(cells)
		.filter((row) => !isSeparatorRow(row));

	if (rows.length === 0) {
		return { scenarios: [], errors: ["catalog has no table rows"] };
	}

	const header = rows[0].map((h) => h.toLowerCase());
	const col = {
		id: header.indexOf("id"),
		title: header.indexOf("title"),
		area: header.indexOf("area"),
		priority: header.indexOf("priority"),
	};
	for (const [name, index] of Object.entries(col)) {
		if (index < 0) {
			errors.push(`catalog header is missing an "${name}" column`);
		}
	}
	if (errors.length > 0) {
		return { scenarios: [], errors };
	}

	const scenarios: Scenario[] = [];
	const seen = new Set<string>();
	for (const row of rows.slice(1)) {
		const id = row[col.id] ?? "";
		const title = row[col.title] ?? "";
		const area = row[col.area] ?? "";
		const priority = row[col.priority] ?? "";
		if (!id || !title || !area || !priority) {
			errors.push(`catalog row has an empty cell: ${row.join(" | ")}`);
			continue;
		}
		if (seen.has(id)) {
			errors.push(`catalog has a duplicate id: ${id}`);
			continue;
		}
		if (!isPriority(priority)) {
			errors.push(
				`catalog id "${id}" has priority "${priority}" (must be must/should/may)`,
			);
			continue;
		}
		seen.add(id);
		scenarios.push({ id, title, area, priority });
	}
	return { scenarios, errors };
}

export default class ScenarioCoverageReporter implements Reporter {
	private readonly scenarios: Scenario[];
	private readonly catalogErrors: string[];
	private readonly byId: Map<string, Scenario>;
	private readonly areas: string[];
	private readonly coveredIds = new Set<string>();
	private readonly unknownScenarioTags = new Set<string>();
	private readonly facetErrors = new Set<string>();

	constructor() {
		let text = "";
		try {
			text = readFileSync(CATALOG_FILE, "utf8");
		} catch (error) {
			this.scenarios = [];
			this.catalogErrors = [
				`could not read ${CATALOG_FILE}: ${error instanceof Error ? error.message : error}`,
			];
			this.byId = new Map();
			this.areas = [];
			return;
		}
		const { scenarios, errors } = parseCatalog(text);
		this.scenarios = scenarios;
		this.catalogErrors = errors;
		this.byId = new Map(scenarios.map((s) => [s.id, s]));
		this.areas = [...new Set(scenarios.map((s) => s.area))];
	}

	onTestEnd(test: TestCase, result: TestResult): void {
		// validate tag structure on every attempt (independent of pass/fail); only
		// a passing test proves a journey works, so coverage is marked only then.
		const scenarioIds = tagValues(test.tags, SCENARIO_TAG_PREFIX);
		const known: Scenario[] = [];
		for (const id of scenarioIds) {
			const s = this.byId.get(id);
			if (s) {
				known.push(s);
				if (result.status === "passed") {
					this.coveredIds.add(id);
				}
			} else {
				this.unknownScenarioTags.add(`${SCENARIO_TAG_PREFIX}${id}`);
			}
		}
		this.validateFacets(test, known);
	}

	/**
	 * The `@area:` / `@priority:` tags on a test must be exactly the set implied by
	 * the scenarios it covers — no missing facet (else `--grep` misses the test)
	 * and no stray facet (else `--grep` over-selects it).
	 */
	private validateFacets(test: TestCase, known: Scenario[]): void {
		// unknown scenario tags already fail the run; skip facet noise for them.
		if (
			known.length === 0 &&
			tagValues(test.tags, SCENARIO_TAG_PREFIX).length > 0
		) {
			return;
		}
		const label = test.titlePath().slice(1).join(" › ") || test.title;
		const check = (kind: "area" | "priority", prefix: string) => {
			const expected = new Set<string>(known.map((s) => s[kind]));
			const actual = new Set<string>(tagValues(test.tags, prefix));
			for (const value of expected) {
				if (!actual.has(value)) {
					this.facetErrors.add(
						`"${label}" covers a ${kind}:${value} scenario but is missing tag ${prefix}${value}`,
					);
				}
			}
			for (const value of actual) {
				if (!expected.has(value)) {
					this.facetErrors.add(
						`"${label}" has stray tag ${prefix}${value} (no covered scenario is ${kind}:${value})`,
					);
				}
			}
		};
		check("area", AREA_TAG_PREFIX);
		check("priority", PRIORITY_TAG_PREFIX);
	}

	async onEnd(
		result: FullResult,
	): Promise<{ status: FullResult["status"] } | undefined> {
		const summary = this.buildSummary();
		this.writeArtifact(summary);
		this.print(summary);

		// structural errors are always failures — they silently corrupt the metric.
		// Fail the run regardless of gate phase (the `must` threshold gate lives in
		// the separate check script so the default run stays report-only for it).
		const hasStructuralError =
			summary.catalogErrors.length > 0 ||
			summary.unknownScenarioTags.length > 0 ||
			summary.facetErrors.length > 0;
		if (hasStructuralError && result.status === "passed") {
			return { status: "failed" };
		}
		return;
	}

	private buildSummary(): Summary {
		const byPriority = Object.fromEntries(
			PRIORITIES.map((p) => [p, { covered: 0, total: 0 }]),
		) as Record<Priority, Tally>;
		const byArea = Object.fromEntries(
			this.areas.map((a) => [a, { covered: 0, total: 0 }]),
		) as Record<string, Tally>;
		const overall: Tally = { covered: 0, total: 0 };
		const uncovered: Scenario[] = [];

		for (const s of this.scenarios) {
			const isCovered = this.coveredIds.has(s.id);
			overall.total += 1;
			byPriority[s.priority].total += 1;
			byArea[s.area].total += 1;
			if (isCovered) {
				overall.covered += 1;
				byPriority[s.priority].covered += 1;
				byArea[s.area].covered += 1;
			} else {
				uncovered.push(s);
			}
		}

		return {
			generatedBy: "scenario-coverage-reporter",
			overall: { ...overall, pct: pct(overall) },
			byPriority,
			byArea,
			covered: [...this.coveredIds].sort(),
			uncovered,
			unknownScenarioTags: [...this.unknownScenarioTags].sort(),
			facetErrors: [...this.facetErrors].sort(),
			catalogErrors: this.catalogErrors,
		};
	}

	private writeArtifact(summary: Summary): void {
		mkdirSync(ARTIFACT_DIR, { recursive: true });
		writeFileSync(ARTIFACT_FILE, `${JSON.stringify(summary, null, 2)}\n`);
	}

	private print(summary: Summary): void {
		const lines: string[] = [];
		lines.push("");
		lines.push("E2E scenario coverage (user journeys, not lines)");
		lines.push("────────────────────────────────────────────────");
		const { overall, byPriority, byArea } = summary;
		lines.push(
			`  overall     ${overall.covered}/${overall.total}  (${overall.pct}%)`,
		);
		for (const p of PRIORITIES) {
			const t = byPriority[p];
			lines.push(`  ${p.padEnd(10)}  ${t.covered}/${t.total}  (${pct(t)}%)`);
		}
		if (this.areas.length > 0) {
			lines.push("  by area:");
			for (const a of this.areas) {
				const t = byArea[a];
				lines.push(`    ${a.padEnd(12)}${t.covered}/${t.total}  (${pct(t)}%)`);
			}
		}

		if (summary.uncovered.length > 0) {
			lines.push("");
			lines.push("  Uncovered scenarios (must first):");
			const ordered = [...summary.uncovered].sort(
				(a, b) =>
					PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
					a.area.localeCompare(b.area) ||
					a.id.localeCompare(b.id),
			);
			for (const s of ordered) {
				lines.push(`    · [${s.priority}] ${s.id} — ${s.title}`);
			}
		}

		if (summary.catalogErrors.length > 0) {
			lines.push("");
			lines.push("  ⚠ Catalog errors in e2e/scenarios.md (failing):");
			for (const err of summary.catalogErrors) {
				lines.push(`    · ${err}`);
			}
		}

		if (summary.unknownScenarioTags.length > 0) {
			lines.push("");
			lines.push("  ⚠ Unknown @scenario: tags (not in the catalog — failing):");
			for (const tag of summary.unknownScenarioTags) {
				lines.push(`    · ${tag}`);
			}
		}

		if (summary.facetErrors.length > 0) {
			lines.push("");
			lines.push(
				"  ⚠ Facet-tag mismatches (not matching the catalog — failing):",
			);
			for (const err of summary.facetErrors) {
				lines.push(`    · ${err}`);
			}
		}

		lines.push("");
		console.log(lines.join("\n"));
	}
}
