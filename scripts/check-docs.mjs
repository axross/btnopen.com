#!/usr/bin/env node
/**
 * Documentation gate: runs every validator the installed
 * living-project-documentation skill ships, against this repository's `docs/`.
 *
 * That skill deliberately ships no run-all script — the loop is the project's
 * to own — so it lives here, in the shape `scripts/prune-preview-blobs.mjs` and
 * `e2e/check-scenario-coverage.mjs` already establish. Each validator's own
 * PASS/FAIL block is streamed through unaltered, and a tally closes the run.
 *
 * Two silences would let this gate pass while checking nothing, so both are
 * guarded. A skill renamed or removed upstream leaves the validator list empty.
 * And an absent `docs/index.md` makes every validator exit 0 with "Nothing to
 * check", under the two-level opt-in that keeps the skill from turning red a
 * `docs/` directory holding something else entirely — this repository has
 * adopted `docs/`, so here that silence is a failure.
 *
 * Standard library only, so it runs in a checkout with no `node_modules/`,
 * which is why the Documentation job in `.github/workflows/merge-checks.yaml`
 * needs no dependency install.
 *
 * Exit codes: 0 every validator passed.
 *             1 at least one validator reported findings.
 *             2 the gate could not run as intended — no validators discovered,
 *               no `docs/index.md`, or a validator that could not run itself.
 *               The workflow branches on 1 versus 2 to annotate them apart.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

const VALIDATORS_DIR = join(
	repositoryRoot,
	".claude",
	"skills",
	"living-project-documentation",
	"scripts",
);
const DOCS_DIR = join(repositoryRoot, "docs");
const DOCS_MARKER = join(DOCS_DIR, "index.md");

const EXIT_PASS = 0;
const EXIT_FINDINGS = 1;
const EXIT_GATE_BROKEN = 2;

/**
 * Report a gate-level failure and yield the exit code that carries it.
 *
 * @param {string} reason what stopped the gate, naming the path it expected
 * @returns {number}
 */
function brokenGate(reason) {
	console.error(`✗ documentation gate: ${reason}`);
	return EXIT_GATE_BROKEN;
}

/**
 * List the validator file names installed alongside the skill, sorted.
 *
 * @returns {{ names: string[], error: Error | null }} a missing, renamed, or
 *   unreadable directory yields no names — one failure for the caller's guard,
 *   which reports `error` so an unreadable directory is not read as an absent one
 */
function discoverValidators() {
	try {
		const names = readdirSync(VALIDATORS_DIR)
			.filter((name) => name.startsWith("check-") && name.endsWith(".mjs"))
			.sort();
		return { names, error: null };
	} catch (error) {
		return { names: [], error };
	}
}

/**
 * Run every validator against `docs/` and reduce their exit codes to this
 * gate's own.
 *
 * @returns {number}
 */
function main() {
	const { names: validators, error } = discoverValidators();

	if (validators.length === 0) {
		const cause = error === null ? "" : ` (${error.code ?? error.message})`;
		return brokenGate(
			`no check-*.mjs validator found at ${VALIDATORS_DIR}${cause}. The ` +
				"living-project-documentation skill is missing or was renamed " +
				"upstream — reinstall the skills, then repoint this script.",
		);
	}

	if (!existsSync(DOCS_MARKER)) {
		return brokenGate(
			`${DOCS_MARKER} is absent, so every validator would report "Nothing to ` +
				'check" and pass. This repository has adopted docs/, so a missing ' +
				"index is a failure rather than a no-op.",
		);
	}

	let withFindings = 0;
	let couldNotRun = 0;

	for (const validator of validators) {
		console.log(`\n▸ ${validator}`);

		const { status, signal } = spawnSync(
			process.execPath,
			[join(VALIDATORS_DIR, validator), DOCS_DIR],
			{ stdio: "inherit" },
		);

		if (status === EXIT_FINDINGS) {
			withFindings += 1;
		} else if (status !== EXIT_PASS) {
			// a validator's own bad-invocation code, a crash, or a signal: the
			// check did not run, which is this gate's failure rather than docs/'s.
			couldNotRun += 1;
			const outcome = status === null ? `on ${signal}` : `with ${status}`;
			console.error(`✗ ${validator} exited ${outcome} without checking docs/.`);
		}
	}

	const passed = validators.length - withFindings - couldNotRun;
	console.log(
		`\n${passed}/${validators.length} documentation validators passed` +
			(withFindings > 0 ? `, ${withFindings} reported findings` : "") +
			(couldNotRun > 0 ? `, ${couldNotRun} could not run` : "") +
			".",
	);

	if (couldNotRun > 0) {
		return EXIT_GATE_BROKEN;
	}

	return withFindings > 0 ? EXIT_FINDINGS : EXIT_PASS;
}

process.exitCode = main();
