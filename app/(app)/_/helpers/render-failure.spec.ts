import { describe, expect, it } from "vitest";
import enUS from "../translations/en-US.json" with { type: "json" };
import jaJP from "../translations/ja-JP.json" with { type: "json" };
import { resolveRenderFailure } from "./render-failure";

/**
 * The failure shapes a route error boundary can hand the mapping: an ordinary
 * error, a server-digested one, and the two non-`Error` values a `throw` can
 * still produce.
 */
const failures: unknown[] = [
	new Error("The blog post list could not be read."),
	Object.assign(new Error("Digested on the server."), { digest: "2094321147" }),
	"a thrown string rather than an error",
	null,
];

/**
 * `resolveRenderFailure()` returns a constant today — every failure that reaches
 * a route error boundary here is transient, and the terminal branch is
 * deliberately unmapped until a permanent one exists.
 *
 * Two of the cases below are therefore invariant guards rather than behaviour
 * coverage: over a constant function, "maps every failure the same way" and
 * "names a retry label exactly when the failure is retryable" would pass for
 * any constant return at all, so neither can fail as the code stands. They are
 * kept because each pins a contract the day the mapping stops being constant —
 * that
 * the error's shape is not read, and that `retryLabelKey` is null exactly on a
 * terminal failure — and both would then have to be satisfied deliberately
 * rather than rediscovered. Read the suite as two live checks plus two guards,
 * not as four live checks.
 */
describe("resolveRenderFailure()", () => {
	it("maps a render failure to the retryable copy", () => {
		expect(resolveRenderFailure(new Error("boom"))).toEqual({
			kind: "retryable",
			messageKey: "message",
			retryLabelKey: "retry",
		});
	});

	it("maps every failure the same way, whatever shape it arrives in", () => {
		for (const failure of failures) {
			expect(resolveRenderFailure(failure)).toEqual(
				resolveRenderFailure(new Error("boom")),
			);
		}
	});

	it("names a retry label exactly when the failure is retryable", () => {
		for (const failure of failures) {
			const { kind, retryLabelKey } = resolveRenderFailure(failure);

			expect(retryLabelKey === null).toBe(kind === "terminal");
		}
	});

	it("names keys the error catalog carries in every locale", () => {
		const { messageKey, retryLabelKey } = resolveRenderFailure(
			new Error("boom"),
		);

		for (const catalog of [enUS, jaJP]) {
			expect(catalog.error).toHaveProperty(messageKey);
			expect(catalog.error).toHaveProperty(retryLabelKey as string);
		}
	});
});
