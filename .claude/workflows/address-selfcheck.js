export const meta = {
	name: "address-selfcheck",
	description:
		"Multi-agent self-check for /address Phase 2: scope the working diff, fan out one finder per matching project review lens, adversarially verify every pooled candidate, and return a ranked, capped findings report.",
	whenToUse:
		"Launched by the /address skill after implementation and verification, before the draft pull request opens. Pass args: { baseRef, issueNumber, planConstraints }. Not for ad-hoc review outside an /address run.",
	phases: [
		{
			title: "Scope",
			detail:
				"Pin the diff command, changed files, and matching review lenses from the AGENTS.md skill index",
		},
		{
			title: "Find",
			detail:
				"One finder per matched lens plus fixed correctness and maintainability finders",
		},
		{
			title: "Verify",
			detail: "One adversarial verifier per deduplicated candidate",
		},
		{
			title: "Synthesize",
			detail: "Merge same-location findings, rank by severity, cap the report",
		},
	],
};

// Driver contract: the /address skill passes a small args object; everything
// else is read from the repository by the agents themselves. The workflow
// returns structured data only — the driver owns all GitHub writes and gates.
// Some harness surfaces deliver the args value as a JSON-encoded string, so
// tolerate both shapes before reading fields.
let input = args;
if (typeof input === "string") {
	try {
		input = JSON.parse(input);
	} catch {
		input = null;
	}
}
const BASE_REF =
	(input && typeof input.baseRef === "string" && input.baseRef.trim()) ||
	"origin/main";
const ISSUE_NUMBER =
	input && typeof input.issueNumber === "number" ? input.issueNumber : null;
const PLAN_CONSTRAINTS =
	input && Array.isArray(input.planConstraints)
		? input.planConstraints.filter((c) => typeof c === "string" && c.trim())
		: [];

const MAX_LENSES = 6;
const MAX_CANDIDATES_PER_FINDER = 8;
const MAX_FINDINGS = 10;

const DIFF_CMD = `git diff ${BASE_REF}...HEAD`;
const sevRank = { Critical: 0, Major: 1, Minor: 2 };
const verdictRank = { CONFIRMED: 0, PLAUSIBLE: 1 };

const SCOPE_SCHEMA = {
	type: "object",
	required: ["files", "lenses"],
	properties: {
		files: {
			type: "array",
			maxItems: 100,
			items: {
				type: "object",
				required: ["path"],
				properties: {
					path: { type: "string" },
					surface: { type: "string" },
				},
			},
		},
		lenses: {
			type: "array",
			maxItems: MAX_LENSES,
			items: {
				type: "object",
				required: ["skillDir", "reason"],
				properties: {
					skillDir: { type: "string" },
					reason: { type: "string" },
				},
			},
		},
	},
};

const CANDIDATES_SCHEMA = {
	type: "object",
	required: ["candidates"],
	properties: {
		candidates: {
			type: "array",
			maxItems: MAX_CANDIDATES_PER_FINDER,
			items: {
				type: "object",
				required: ["severity", "file", "line", "summary", "failureScenario"],
				properties: {
					severity: { enum: ["Critical", "Major", "Minor"] },
					file: { type: "string" },
					line: { type: "integer" },
					summary: { type: "string" },
					failureScenario: { type: "string" },
					fixSketch: { type: "string" },
				},
			},
		},
	},
};

const VERDICT_SCHEMA = {
	type: "object",
	required: ["verdict", "evidence"],
	properties: {
		verdict: { enum: ["CONFIRMED", "PLAUSIBLE", "REFUTED"] },
		evidence: { type: "string" },
	},
};

const SUMMARY_SCHEMA = {
	type: "object",
	required: ["summary"],
	properties: { summary: { type: "string" } },
};

// ─── Scope ───
phase("Scope");
const scope = await agent(
	"## Self-check scope for an /address run" +
		(ISSUE_NUMBER ? ` (issue #${ISSUE_NUMBER})` : "") +
		"\n\n" +
		"You are scoping a code self-review inside this repository checkout.\n\n" +
		"1. Run `" +
		DIFF_CMD +
		" --stat` (and `git status --porcelain` for untracked files) to list every changed file.\n" +
		"2. Read the skill index table in `AGENTS.md` at the repository root. Select the guideline skills whose routing condition matches the changed files or surfaces — at most " +
		MAX_LENSES +
		", most relevant first. Use each skill's directory name under `.claude/skills/` as `skillDir`.\n" +
		"3. Exclude workflow entry-point skills (address, handoff, author), the development-guidelines baseline, and maintainable-code-guidelines (a fixed finder already covers it).\n\n" +
		"Return every changed file (with a one-word surface tag where obvious) and the selected lenses with a one-line reason each. Structured output only.",
	{ label: "scope", phase: "Scope", schema: SCOPE_SCHEMA },
);
if (!scope) {
	return {
		error:
			"Scope agent returned no result; the driver must fall back to the inline reviewer-mode reset.",
	};
}
if (scope.files.length === 0) {
	return {
		summary: `The diff against ${BASE_REF} is empty; nothing to review.`,
		findings: [],
		refuted: [],
		stats: { lenses: 0, finders: 0, candidates: 0, verified: 0 },
	};
}
log(
	scope.files.length +
		" changed files; lenses: " +
		(scope.lenses.map((l) => l.skillDir).join(", ") || "(none)"),
);

// ─── Find ───
phase("Find");
const constraintsBlock =
	PLAN_CONSTRAINTS.length > 0
		? "\n\nPlan constraints to hold the diff against:\n" +
			PLAN_CONSTRAINTS.map((c) => `- ${c}`).join("\n")
		: "";
const commonFinderText =
	"\n\n## Task\n" +
	"1. Read the lens material named above (when a skill directory is named, read its `SKILL.md` and any referenced files matching the changed surfaces) BEFORE looking at the diff.\n" +
	"2. Run `" +
	DIFF_CMD +
	"` and review ONLY the changed lines and their immediate context, strictly through your lens.\n" +
	"3. Report up to " +
	MAX_CANDIDATES_PER_FINDER +
	" defect candidates. Severity per the project's code-review vocabulary: Critical (must fix — broken behavior, security, data loss), Major (should fix before merge), Minor (worth noting). Each candidate needs the file path, a 1-indexed line in the new version (0 for file-level), a one-sentence summary, a concrete failure scenario, and optionally a fix sketch.\n" +
	"4. An empty candidate list is a valid result — do not pad." +
	constraintsBlock +
	"\n\nJudge the actual diff, not the intent behind it. Structured output only.";

const lensFinders = scope.lenses.map((l) => ({
	key: l.skillDir,
	prompt:
		"## Review finder — lens: " +
		l.skillDir +
		"\n\nLens material: the project skill at `.claude/skills/" +
		l.skillDir +
		"/SKILL.md` (selected because: " +
		l.reason +
		")." +
		commonFinderText,
}));
const fixedFinders = [
	{
		key: "correctness",
		prompt:
			"## Review finder — lens: correctness\n\nLens material: none — you are the general correctness finder. Hunt for logic errors, broken edge cases, wrong conditions, unhandled failure paths, and contract violations the diff introduces." +
			commonFinderText,
	},
	{
		key: "maintainability",
		prompt:
			"## Review finder — lens: maintainability\n\nLens material: the project skill at `.claude/skills/maintainable-code-guidelines/SKILL.md`." +
			commonFinderText,
	},
];
const finders = lensFinders.concat(fixedFinders);

// Barrier is intentional: candidates must be pooled and deduplicated across
// all finders before any verifier tokens are spent.
const finderOuts = await parallel(
	finders.map(
		(f) => () =>
			agent(f.prompt, {
				label: `find:${f.key}`,
				phase: "Find",
				schema: CANDIDATES_SCHEMA,
			}).then((r) => {
				if (!r) {
					return null;
				}
				log(`find:${f.key} → ${r.candidates.length} candidates`);
				return r.candidates.map((c) => ({ ...c, lens: f.key }));
			}),
	),
);
const findersErrored = finderOuts.filter((o) => o === null).length;
if (findersErrored === finders.length) {
	return {
		error:
			"Every finder agent failed; the driver must fall back to the inline reviewer-mode reset.",
	};
}

const pooled = finderOuts.filter(Boolean).flat();
const byLocation = new Map();
for (const c of pooled) {
	const key = `${c.file}:${c.line}`;
	const existing = byLocation.get(key);
	if (existing) {
		existing.duplicateLenses.push(c.lens);
		if (sevRank[c.severity] < sevRank[existing.severity]) {
			existing.severity = c.severity;
		}
	} else {
		byLocation.set(key, { ...c, duplicateLenses: [] });
	}
}
const candidates = Array.from(byLocation.values());
log(
	pooled.length +
		" candidates pooled → " +
		candidates.length +
		" after (file, line) dedup",
);
if (candidates.length === 0) {
	return {
		summary:
			"No defect candidates found by " +
			(finders.length - findersErrored) +
			" finders across " +
			scope.files.length +
			" changed files.",
		findings: [],
		refuted: [],
		stats: {
			lenses: scope.lenses.length,
			finders: finders.length,
			findersErrored,
			candidates: 0,
			verified: 0,
		},
	};
}

// ─── Verify ───
phase("Verify");
const verified = (
	await parallel(
		candidates.map(
			(c) => () =>
				agent(
					"## Adversarial verifier\n\nBe SKEPTICAL. Try to REFUTE this code-review candidate against the actual repository state.\n\n" +
						"**Location:** " +
						c.file +
						":" +
						c.line +
						" (severity claimed: " +
						c.severity +
						", lens: " +
						c.lens +
						")\n**Claim:** " +
						c.summary +
						"\n**Failure scenario:** " +
						c.failureScenario +
						"\n\n## Task\n" +
						"Read the file and the diff (`" +
						DIFF_CMD +
						"`). Check: does the failure scenario actually occur with the code as written? Is it reachable? Is it already handled elsewhere? Is the severity honest?\n\n" +
						"Verdicts: CONFIRMED (reproducible from the code as written, evidence in hand), PLAUSIBLE (credible but not fully demonstrable), REFUTED (does not hold).\n" +
						(sevRank[c.severity] === 2
							? "This is a Minor candidate: default to REFUTED when uncertain.\n"
							: "For Critical/Major candidates keep PLAUSIBLE when the defect is credible but not fully demonstrable.\n") +
						"Evidence MUST cite specific code. Structured output only.",
					{
						label: `verify:${c.file}:${c.line}`,
						phase: "Verify",
						schema: VERDICT_SCHEMA,
						effort: sevRank[c.severity] <= 1 ? "high" : "low",
					},
				).then((v) =>
					v
						? { ...c, ...v }
						: {
								...c,
								verdict: "PLAUSIBLE",
								evidence: "Verifier agent failed; candidate kept unverified.",
							},
				),
		),
	)
).filter(Boolean);

const surviving = verified.filter((c) => c.verdict !== "REFUTED");
const refuted = verified.filter((c) => c.verdict === "REFUTED");
log(`Verify done: ${surviving.length} kept, ${refuted.length} refuted`);

// ─── Synthesize ───
phase("Synthesize");
const ranked = surviving
	.slice()
	.sort(
		(a, b) =>
			sevRank[a.severity] - sevRank[b.severity] ||
			verdictRank[a.verdict] - verdictRank[b.verdict],
	);
const findings = ranked.slice(0, MAX_FINDINGS).map((c) => ({
	severity: c.severity,
	verdict: c.verdict,
	file: c.file,
	line: c.line,
	summary: c.summary,
	failureScenario: c.failureScenario,
	fixSketch: c.fixSketch || "",
	evidence: c.evidence,
	lens: c.lens,
}));
const stats = {
	lenses: scope.lenses.length,
	finders: finders.length,
	findersErrored,
	candidates: candidates.length,
	verified: verified.length,
	refuted: refuted.length,
	reported: findings.length,
	capped: ranked.length > MAX_FINDINGS,
};

const mechanicalSummary =
	findings.length +
	" finding(s) survived adversarial verification (" +
	findings.filter((f) => sevRank[f.severity] <= 1).length +
	" Critical/Major); " +
	refuted.length +
	" refuted.";
const synth =
	findings.length > 0
		? await agent(
				"## Synthesis\n\nWrite a 2-3 sentence summary of this self-check result for the /address driver. Findings (already ranked):\n" +
					findings
						.map(
							(f, i) =>
								"[" +
								i +
								"] " +
								f.severity +
								"/" +
								f.verdict +
								" " +
								f.file +
								":" +
								f.line +
								" — " +
								f.summary,
						)
						.join("\n") +
					"\n\nStructured output only.",
				{ label: "synthesize", schema: SUMMARY_SCHEMA },
			)
		: null;

return {
	summary: (synth?.summary) || mechanicalSummary,
	findings,
	refuted: refuted.map((c) => ({
		file: c.file,
		line: c.line,
		summary: c.summary,
		evidence: c.evidence,
	})),
	stats,
};
