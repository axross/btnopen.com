import { describe, expect, it } from "vitest";
import {
	assertFetchableUrl,
	BlockedHostError,
	type HostResolver,
} from "./webembed-host";

// every case supplies this explicitly rather than leaning on the default, which
// is the deployment's own origin and therefore differs between a developer's
// machine and CI. a loopback URL must be refused here because it is foreign to
// this origin, not because of where the suite happens to run.
const foreignOrigin = "https://www.btnopen.com";

/** A resolver that answers every hostname with the same fixed addresses. */
function resolvingTo(...addresses: string[]): HostResolver {
	return async () => addresses;
}

// each address stands for one reserved range, written as a URL so the real
// resolver handles it — dns.lookup returns an IP literal unchanged without
// querying anything, so this reaches no network.
const reservedAddressCases = [
	["http://0.0.0.0/", "the unspecified address"],
	["http://10.1.2.3/", "an RFC 1918 private address"],
	["http://100.64.0.1/", "a carrier-grade NAT address"],
	["http://127.0.0.1/", "a loopback address"],
	["http://169.254.169.254/latest/meta-data/", "the cloud metadata endpoint"],
	["http://172.16.5.4/", "an RFC 1918 private address in the /12"],
	["http://192.0.0.1/", "an IETF protocol assignment"],
	["http://192.168.1.1/", "an RFC 1918 private address in the /16"],
	["http://198.18.0.1/", "a benchmarking address"],
	["http://224.0.0.1/", "a multicast address"],
	["http://255.255.255.255/", "the broadcast address"],
	["http://[::]/", "the unspecified IPv6 address"],
	["http://[::1]/", "the IPv6 loopback address"],
	["http://[::ffff:127.0.0.1]/", "an IPv4-mapped loopback address"],
	["http://[64:ff9b::7f00:1]/", "a NAT64-embedded loopback address"],
	["http://[2002:7f00:1::]/", "a 6to4-embedded loopback address"],
	["http://[fd00:ec2::254]/", "the IPv6 cloud metadata endpoint"],
	["http://[fe80::1]/", "an IPv6 link-local address"],
	["http://[ff02::1]/", "an IPv6 multicast address"],
] as const;

describe("assertFetchableUrl()", () => {
	it("permits a host that resolves to a public address", async () => {
		await expect(
			assertFetchableUrl("https://zenn.dev/some/article", {
				resolveHost: resolvingTo("93.184.216.34"),
				permittedOrigin: foreignOrigin,
			}),
		).resolves.toBeUndefined();
	});

	it("permits a host that resolves to several public addresses", async () => {
		await expect(
			assertFetchableUrl("https://zenn.dev/some/article", {
				resolveHost: resolvingTo("93.184.216.34", "2606:2800:220:1::1"),
				permittedOrigin: foreignOrigin,
			}),
		).resolves.toBeUndefined();
	});

	it("rejects a URL that is not well-formed", async () => {
		await expect(
			assertFetchableUrl("not a url", { permittedOrigin: foreignOrigin }),
		).rejects.toThrow(BlockedHostError);
	});

	describe("when the URL carries a scheme other than http(s)", () => {
		for (const url of [
			"javascript:alert(1)",
			"file:///etc/passwd",
			"gopher://example.com/",
			"data:text/html,<script></script>",
		]) {
			it(`rejects ${url}`, async () => {
				await expect(
					assertFetchableUrl(url, { permittedOrigin: foreignOrigin }),
				).rejects.toThrow(BlockedHostError);
			});
		}
	});

	describe("when the host resolves into a reserved range", () => {
		for (const [url, description] of reservedAddressCases) {
			it(`rejects ${description} (${url})`, async () => {
				await expect(
					assertFetchableUrl(url, { permittedOrigin: foreignOrigin }),
				).rejects.toThrow(BlockedHostError);
			});
		}

		it("rejects localhost, which the system resolver maps to loopback", async () => {
			await expect(
				assertFetchableUrl("http://localhost:3000/", {
					permittedOrigin: foreignOrigin,
				}),
			).rejects.toThrow(BlockedHostError);
		});

		it("rejects the decimal form of a loopback literal", async () => {
			await expect(
				assertFetchableUrl("http://2130706433/", {
					permittedOrigin: foreignOrigin,
				}),
			).rejects.toThrow(BlockedHostError);
		});

		it("rejects the octal form of a loopback literal", async () => {
			await expect(
				assertFetchableUrl("http://0177.0.0.1/", {
					permittedOrigin: foreignOrigin,
				}),
			).rejects.toThrow(BlockedHostError);
		});

		it("rejects a public-looking name that resolves to a private address", async () => {
			await expect(
				assertFetchableUrl("https://intranet.example.com/", {
					resolveHost: resolvingTo("10.0.0.1"),
					permittedOrigin: foreignOrigin,
				}),
			).rejects.toThrow(BlockedHostError);
		});

		it("rejects when only one of several resolved addresses is reserved", async () => {
			await expect(
				assertFetchableUrl("https://intranet.example.com/", {
					resolveHost: resolvingTo("93.184.216.34", "169.254.169.254"),
					permittedOrigin: foreignOrigin,
				}),
			).rejects.toThrow(BlockedHostError);
		});

		it("names the offending address so an author can see what went wrong", async () => {
			await expect(
				assertFetchableUrl("https://intranet.example.com/", {
					resolveHost: resolvingTo("169.254.169.254"),
					permittedOrigin: foreignOrigin,
				}),
			).rejects.toThrow("169.254.169.254");
		});
	});

	it("rejects a host that resolves to no address at all", async () => {
		await expect(
			assertFetchableUrl("https://nowhere.example.com/", {
				resolveHost: resolvingTo(),
				permittedOrigin: foreignOrigin,
			}),
		).rejects.toThrow(BlockedHostError);
	});

	it("rejects an answer the resolver gives that is not an IP address", async () => {
		await expect(
			assertFetchableUrl("https://odd.example.com/", {
				resolveHost: resolvingTo("not-an-address"),
				permittedOrigin: foreignOrigin,
			}),
		).rejects.toThrow(BlockedHostError);
	});

	it("rejects a .internal hostname without resolving it", async () => {
		let resolverCalls = 0;

		await expect(
			assertFetchableUrl("http://metadata.google.internal/", {
				resolveHost: async () => {
					resolverCalls += 1;

					return ["93.184.216.34"];
				},
				permittedOrigin: foreignOrigin,
			}),
		).rejects.toThrow(BlockedHostError);
		expect(resolverCalls).toBe(0);
	});

	describe("when the URL is at the deployment's own origin", () => {
		it("permits it even though it resolves to loopback", async () => {
			await expect(
				assertFetchableUrl("http://localhost:3000/posts/some-slug", {
					permittedOrigin: "http://localhost:3000",
				}),
			).resolves.toBeUndefined();
		});

		it("does not extend the exception to another port on the same host", async () => {
			await expect(
				assertFetchableUrl("http://localhost:3001/", {
					permittedOrigin: "http://localhost:3000",
				}),
			).rejects.toThrow(BlockedHostError);
		});

		it("does not extend the exception to another scheme on the same host", async () => {
			await expect(
				assertFetchableUrl("https://localhost:3000/", {
					permittedOrigin: "http://localhost:3000",
				}),
			).rejects.toThrow(BlockedHostError);
		});
	});
});

describe("BlockedHostError", () => {
	it("carries its reason as an enumerable property a logger can serialize", async () => {
		const error = await assertFetchableUrl("https://intranet.example.com/", {
			resolveHost: resolvingTo("169.254.169.254"),
			permittedOrigin: foreignOrigin,
		}).catch((thrown: unknown) => thrown);

		expect(JSON.parse(JSON.stringify(error))).toEqual({
			name: "BlockedHostError",
			reason:
				"the host intranet.example.com resolves to the reserved address 169.254.169.254",
		});
	});
});
