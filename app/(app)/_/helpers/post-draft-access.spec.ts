import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "./i18n";

/**
 * Holds the fakes across the hoisting boundary: a `vi.mock` factory runs while
 * the subject is being imported, which is before this module's own body, so an
 * ordinary module-level binding would still be in its temporal dead zone when
 * the factory writes to it.
 */
const fakes = vi.hoisted(() => ({
	canReadDrafts: vi.fn<() => Promise<boolean>>(),
	find: vi.fn<(args: unknown) => Promise<{ docs: unknown[] }>>(),
}));

vi.mock("./draft-access", () => ({ canReadDrafts: fakes.canReadDrafts }));

vi.mock("payload", () => ({
	getPayload: async () => ({ find: fakes.find }),
}));

/**
 * The real config builds the whole CMS — every collection, the database
 * adapter, and the admin components — for a value this subject only forwards to
 * `getPayload`, which is itself faked above. Faking it keeps the unit about the
 * gate's own decision instead of about the config's construction.
 */
vi.mock("@/payload/config", () => ({ config: {} }));

const { canReadPostDraft } = await import("./post-draft-access");

const slug = "declarative-ui";
const storedToken = "pnryCl0emXnq8uYvQGiGKTgwg2NYZ_fQf6o3KPhbXSA";
const otherPostToken = "Zq7t4Xh1sVbN9cMkLp2wRyU6eDgA3fJhK0oQiT5nBxE";

describe("canReadPostDraft()", () => {
	beforeEach(() => {
		fakes.canReadDrafts.mockResolvedValue(false);
		fakes.find.mockResolvedValue({ docs: [] });
	});

	it("permits a session allowed to read drafts, without reading the token", async () => {
		fakes.canReadDrafts.mockResolvedValue(true);

		expect(await canReadPostDraft(slug, undefined)).toBe(true);
		expect(fakes.find).not.toHaveBeenCalled();
	});

	// the session is checked first because it is `cache()`-wrapped and one lookup
	// already serves the whole request, so a signed-in author never pays for the
	// token read even when the URL carries one.
	it("permits a session allowed to read drafts even when a token is supplied", async () => {
		fakes.canReadDrafts.mockResolvedValue(true);

		expect(await canReadPostDraft(slug, otherPostToken)).toBe(true);
		expect(fakes.find).not.toHaveBeenCalled();
	});

	// the short-circuit has to run before the database read, not after it: every
	// signed-out reader of a published post reaches this line, and a query per
	// request would be a cost the published path never agreed to pay.
	it("denies a signed-out request carrying no token, without reading the token", async () => {
		expect(await canReadPostDraft(slug, undefined)).toBe(false);
		expect(fakes.find).not.toHaveBeenCalled();
	});

	it("denies a signed-out request carrying an empty token, without reading the token", async () => {
		expect(await canReadPostDraft(slug, "")).toBe(false);
		expect(fakes.find).not.toHaveBeenCalled();
	});

	it("permits a signed-out request carrying this post's stored token", async () => {
		fakes.find.mockResolvedValue({ docs: [{ shareToken: storedToken }] });

		expect(await canReadPostDraft(slug, storedToken)).toBe(true);
	});

	// the wrong-post row: a token is a bearer credential for one post, and the
	// slug filter on the lookup is the single line that stops one post's token
	// from unlocking another.
	it("denies a signed-out request carrying another post's stored token", async () => {
		fakes.find.mockResolvedValue({ docs: [{ shareToken: storedToken }] });

		expect(await canReadPostDraft(slug, otherPostToken)).toBe(false);
	});

	// the rotated-token row: rotation replaces the stored value, so the link
	// handed out under the previous one stops matching on the next request.
	it("denies a signed-out request carrying a rotated token", async () => {
		fakes.find.mockResolvedValue({ docs: [{ shareToken: otherPostToken }] });

		expect(await canReadPostDraft(slug, storedToken)).toBe(false);
	});

	it("denies a signed-out request when the post has no stored token", async () => {
		fakes.find.mockResolvedValue({ docs: [{ shareToken: null }] });

		expect(await canReadPostDraft(slug, storedToken)).toBe(false);
	});

	it("denies a signed-out request when no post matches the slug", async () => {
		fakes.find.mockResolvedValue({ docs: [] });

		expect(await canReadPostDraft(slug, storedToken)).toBe(false);
	});

	// the shape of the read is part of the contract rather than an implementation
	// detail: `draft: true` is what makes a rotation take effect on the next
	// request in every draft state, the slug filter is what scopes a token to one
	// post, and the `select` is what keeps the secret from being read into memory
	// alongside the rest of the row.
	it("reads only this post's share token, from its latest version", async () => {
		fakes.find.mockResolvedValue({ docs: [{ shareToken: storedToken }] });

		await canReadPostDraft(slug, storedToken);

		expect(fakes.find).toHaveBeenCalledTimes(1);
		expect(fakes.find).toHaveBeenCalledWith({
			collection: "blog-posts",
			select: { shareToken: true },
			depth: 0,
			where: { slug: { equals: slug } },
			locale: defaultLocale,
			limit: 1,
			draft: true,
		});
	});
});
