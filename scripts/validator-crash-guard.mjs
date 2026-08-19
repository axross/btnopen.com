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
 * The code and the explanation both live here rather than being shared with
 * `scripts/check-docs.mjs`, which passes this file to `node --import` and needs
 * no copy of either: any exit outside 0 and 1 already counts there as a check
 * that did not reach a verdict. Sharing them by import would be worse than the
 * duplication it removes — importing this module runs it, so the aggregator
 * would install these handlers on *itself* and answer its own crash with a
 * validator's exit code.
 *
 * Not run directly.
 */

import { basename } from "node:path";

// sysexits.h's EX_SOFTWARE: an internal error rather than a verdict about input.
const EXIT_VALIDATOR_CRASHED = 70;

/**
 * Print what escaped the validator, say whose fault it is, and end with the code
 * that says a verdict was never reached.
 *
 * @param {unknown} error
 */
function reportAndExit(error) {
	console.error(error);
	// process.argv[1] is the validator this was preloaded into, not this file.
	console.error(
		`\n✗ ${basename(process.argv[1])} threw the error above instead of checking docs/. The validator is at fault, not docs/.`,
	);
	process.exit(EXIT_VALIDATOR_CRASHED);
}

process.on("uncaughtException", reportAndExit);
process.on("unhandledRejection", reportAndExit);
