export const meta = {
	name: "address-criteria",
	description:
		"Acceptance-criteria sweep for /address Phase 2: one verifier per criterion checks the working diff and the driver-supplied verification evidence, then a report agent assembles the pull-request-body acceptance-criteria section.",
	whenToUse:
		"Launched by the /address skill at the end of Phase 2, after the driver has run the verification commands. Pass args: { criteria, baseRef, verificationEvidence, issueNumber }. Not for ad-hoc use outside an /address run.",
	phases: [
		{
			title: "Verify",
			detail:
				"One verifier per acceptance criterion — static checks against the diff and driver-supplied evidence",
		},
		{
			title: "Report",
			detail: "Assemble the PR-body acceptance-criteria section",
		},
	],
};

// Driver contract: criteria arrive verbatim from the tracking issue, and the
// driver has already run the verification commands once — verifiers never
// re-run suites, dev servers, or builds. A failed verifier degrades to
// needs-manual-check so a criterion can never be silently claimed as met.
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
const CRITERIA =
	input && Array.isArray(input.criteria)
		? input.criteria.filter((c) => typeof c === "string" && c.trim())
		: [];
if (CRITERIA.length === 0) {
	return {
		error:
			"No acceptance criteria provided. Pass the plan's criteria verbatim: Workflow({ name: 'address-criteria', args: { criteria: [...], baseRef, verificationEvidence, issueNumber } }).",
	};
}
const BASE_REF =
	(input && typeof input.baseRef === "string" && input.baseRef.trim()) ||
	"origin/main";
const ISSUE_NUMBER =
	input && typeof input.issueNumber === "number" ? input.issueNumber : null;
const EVIDENCE =
	input && Array.isArray(input.verificationEvidence)
		? input.verificationEvidence.filter((e) => e && typeof e === "object")
		: [];

const DIFF_CMD = `git diff ${BASE_REF}...HEAD`;
const STATUSES = ["met", "unmet", "partial", "needs-manual-check"];

const CRITERION_SCHEMA = {
	type: "object",
	required: ["status", "evidence"],
	properties: {
		status: { enum: STATUSES },
		evidence: { type: "string" },
		gaps: { type: "string" },
	},
};

const REPORT_SCHEMA = {
	type: "object",
	required: ["markdown"],
	properties: { markdown: { type: "string" } },
};

const evidenceBlock =
	EVIDENCE.length > 0
		? EVIDENCE.map(
				(e) =>
					"- `" +
					(e.command || "(manual check)") +
					"` → " +
					(e.outcome || "unknown") +
					(e.summary ? ` — ${e.summary}` : ""),
			).join("\n")
		: "- (none supplied)";

// ─── Verify ───
phase("Verify");
const results = await parallel(
	CRITERIA.map(
		(criterion, i) => () =>
			agent(
				"## Acceptance-criterion verifier [" +
					i +
					"]" +
					(ISSUE_NUMBER ? ` (issue #${ISSUE_NUMBER})` : "") +
					"\n\n**Criterion:** " +
					criterion +
					"\n\n**Verification evidence the driver already collected:**\n" +
					evidenceBlock +
					"\n\n## Task\n" +
					"Judge whether the working diff satisfies this criterion, using static inspection only:\n" +
					"1. Run `" +
					DIFF_CMD +
					"` and read the changed files relevant to the criterion.\n" +
					"2. Check whether test coverage (unit or e2e) exercises the criterion where it promises behavior.\n" +
					"3. Check whether the supplied evidence covers it.\n\n" +
					"Do NOT run test suites, dev servers, builds, or any state-changing command — read-only inspection and read-only git commands only.\n\n" +
					"Statuses: met (diff satisfies it, evidence in hand), unmet (diff does not satisfy it), partial (some of it holds), needs-manual-check (only a human or a runtime check can tell — say exactly what to check). Cite specific files/lines or evidence entries; name what is missing in gaps. Structured output only.",
				{
					label: `criterion:${i}`,
					phase: "Verify",
					schema: CRITERION_SCHEMA,
				},
			).then((r) => ({
				criterion,
				status: r ? r.status : "needs-manual-check",
				evidence: r
					? r.evidence
					: "Verifier agent failed; verify this criterion manually.",
				gaps: r?.gaps || "",
			})),
	),
);
const counts = {};
for (const s of STATUSES) {
	counts[s] = results.filter((r) => r.status === s).length;
}
log(
	"Criteria: " +
		counts.met +
		" met, " +
		counts.unmet +
		" unmet, " +
		counts.partial +
		" partial, " +
		counts["needs-manual-check"] +
		" need manual check",
);

// ─── Report ───
phase("Report");
const statusIcon = {
	met: "✅",
	unmet: "❌",
	partial: "🟡",
	"needs-manual-check": "👀",
};
const mechanicalReport = results
	.map(
		(r) =>
			"- " +
			statusIcon[r.status] +
			" **" +
			r.status +
			"** — " +
			r.criterion +
			"\n  - " +
			r.evidence +
			(r.gaps ? `\n  - Gaps: ${r.gaps}` : ""),
	)
	.join("\n");

const report = await agent(
	"## Acceptance-criteria report assembler\n\n" +
		"Write the acceptance-criteria section for a pull request body from these per-criterion verdicts. Keep every criterion, its status, and its evidence; keep it concise and reviewer-facing; use the ✅/❌/🟡/👀 icons for met/unmet/partial/needs-manual-check. Markdown only — a `### Acceptance criteria` heading followed by one bullet per criterion.\n\n" +
		results
			.map(
				(r, i) =>
					"[" +
					i +
					"] " +
					r.status +
					" — " +
					r.criterion +
					"\n  evidence: " +
					r.evidence +
					(r.gaps ? `\n  gaps: ${r.gaps}` : ""),
			)
			.join("\n") +
		"\n\nStructured output only.",
	{ label: "report", schema: REPORT_SCHEMA },
);

return {
	criteria: results,
	reportMarkdown:
		(report?.markdown) ||
		`### Acceptance criteria\n\n${mechanicalReport}`,
	stats: {
		total: results.length,
		...counts,
	},
};
