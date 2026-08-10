import { describe, expect, it } from "@jest/globals";
import enUS from "../translations/en-US.json" with { type: "json" };
import jaJP from "../translations/ja-JP.json" with { type: "json" };
import { resolveRenderFailure } from "./render-failure";

const failures: unknown[] = [
	new Error("The blog post list could not be read."),
	Object.assign(new Error("Digested on the server."), { digest: "2094321147" }),
	"a thrown string rather than an error",
	null,
];

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
