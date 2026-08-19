/**
 * Preloaded into every documentation validator, so one that throws ends
 * distinguishably from one that reported findings.
 *
 * Node exits 1 on an uncaught exception, and 1 is also how a validator says it
 * found something under `docs/`. Left alone, a bug inside a validator reads as a
 * documentation defect and the Documentation job blames `docs/` for a failure
 * `docs/` did not cause. The validators ship with an installed skill and MUST
 * NOT be edited here (see `docs/operations/agent-skills.md`), so the two cases
 * are separated from outside: this replaces Node's default handling with an exit
 * code no validator uses — their whole vocabulary is 0, 1, and 2.
 *
 * Not run directly. `scripts/check-docs.mjs` passes it to `node --import`, and
 * carries the same exit code on its side.
 */

// sysexits.h's EX_SOFTWARE: an internal error rather than a verdict about input.
const EXIT_VALIDATOR_CRASHED = 70;

/**
 * Print what escaped the validator and end with the code that says so.
 *
 * @param {unknown} error
 */
function reportAndExit(error) {
	console.error(error);
	process.exit(EXIT_VALIDATOR_CRASHED);
}

process.on("uncaughtException", reportAndExit);
process.on("unhandledRejection", reportAndExit);
