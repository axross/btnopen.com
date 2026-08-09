import "server-only";

// an embed URL is authored in the CMS, so it names a destination this server
// will connect to on a reader's behalf and then reflect back into the post.
// nothing upstream constrains where it points, which makes this module — not
// the render path — the place that decides whether a fetch may leave at all.

// biome-ignore-start lint/correctness/noNodejsModules: resolving a host and classifying an address are server-side by definition
import { lookup } from "node:dns/promises";
import { BlockList, isIP, isIPv6 } from "node:net";
// biome-ignore-end lint/correctness/noNodejsModules: resolving a host and classifying an address are server-side by definition
import { urlOrigin } from "@/runtime";

/**
 * Resolves a hostname to every address it maps to. The default reaches the
 * operating system's resolver; a caller (in practice, a spec) may substitute
 * its own so a test can decide what a name resolves to.
 */
export type HostResolver = (hostname: string) => Promise<readonly string[]>;

export interface FetchableUrlOptions {
	/** Overrides how a hostname is resolved. Defaults to the OS resolver. */
	resolveHost?: HostResolver;
	/**
	 * The one origin exempt from the reserved-range check. Defaults to this
	 * deployment's own origin.
	 */
	permittedOrigin?: string;
}

/** Thrown when a URL names a destination this server must not fetch. */
export class BlockedHostError extends Error {
	/**
	 * Why the destination was refused, as an own property rather than only inside
	 * {@link Error.message} — a logger serializing this error records enumerable
	 * properties, and `message` is not one, so an author chasing a refused embed
	 * would otherwise see the class name and nothing actionable.
	 */
	readonly reason: string;

	constructor(url: string, reason: string) {
		super(`Refused to fetch ${url} because ${reason}.`);

		this.name = "BlockedHostError";
		this.reason = reason;
	}
}

// biome-ignore-start lint/style/noMagicNumbers: a CIDR prefix length is part of the range's name, not a quantity
// every range here is either unroutable on the public internet or names a host
// on this machine or its network, so an authored URL resolving into one is an
// authoring mistake at best and an attempt to read something the server can see
// and the reader cannot at worst. taken from IANA's IPv4 and IPv6
// special-purpose address registries.
const reservedSubnets = [
	["0.0.0.0", 8, "ipv4"], // "this network" / unspecified
	["10.0.0.0", 8, "ipv4"], // private
	["100.64.0.0", 10, "ipv4"], // carrier-grade NAT
	["127.0.0.0", 8, "ipv4"], // loopback
	["169.254.0.0", 16, "ipv4"], // link-local, including the 169.254.169.254 cloud metadata endpoint
	["172.16.0.0", 12, "ipv4"], // private
	["192.0.0.0", 24, "ipv4"], // IETF protocol assignments
	["192.168.0.0", 16, "ipv4"], // private
	["198.18.0.0", 15, "ipv4"], // benchmarking
	["224.0.0.0", 4, "ipv4"], // multicast
	["240.0.0.0", 4, "ipv4"], // reserved, including the 255.255.255.255 broadcast address
	["::", 128, "ipv6"], // unspecified
	["::1", 128, "ipv6"], // loopback
	// NAT64 and 6to4 each embed an IPv4 address that BlockList does not unwrap,
	// so 64:ff9b::7f00:1 would otherwise reach 127.0.0.1. the IPv4-mapped range
	// (::ffff:0:0/96) needs no entry — BlockList checks those against the IPv4
	// rules above on its own.
	["64:ff9b::", 96, "ipv6"], // NAT64
	["2002::", 16, "ipv6"], // 6to4
	["fc00::", 7, "ipv6"], // unique local, including the fd00:ec2::254 metadata endpoint
	["fe80::", 10, "ipv6"], // link-local
	["ff00::", 8, "ipv6"], // multicast
] as const satisfies readonly (readonly [string, number, "ipv4" | "ipv6"])[];
// biome-ignore-end lint/style/noMagicNumbers: a CIDR prefix length is part of the range's name, not a quantity

const reservedAddresses = new BlockList();

for (const [address, prefix, family] of reservedSubnets) {
	reservedAddresses.addSubnet(address, prefix, family);
}

/**
 * Resolves `url`'s host and rejects when this server must not fetch it.
 *
 * Resolution happens here, immediately before the caller's request, rather than
 * anywhere earlier: a host checked at render time and fetched later is a
 * time-of-check/time-of-use gap, and only the resolved address — never the URL
 * string — says where a request actually goes.
 *
 * @throws {BlockedHostError} when the URL is malformed, carries a scheme other
 * than `http:`/`https:`, names an internal namespace, or resolves to any
 * reserved address.
 */
export async function assertFetchableUrl(
	url: string,
	{
		resolveHost = resolveHostThroughSystem,
		permittedOrigin = urlOrigin,
	}: FetchableUrlOptions = {},
): Promise<void> {
	if (!URL.canParse(url)) {
		throw new BlockedHostError(url, "it is not a well-formed URL");
	}

	const { protocol, hostname, origin } = new URL(url);

	// the scheme allowlist that keeps a dangerous protocol out of a rendered
	// anchor has to hold for the outbound request too, and a redirect can name a
	// scheme no authored URL ever passed through that check.
	if (protocol !== "http:" && protocol !== "https:") {
		throw new BlockedHostError(url, `the ${protocol} scheme is not fetchable`);
	}

	// the deployment's own origin is the single exception, with no environment
	// branch: locally it is a loopback origin the check below would reject, and
	// on preview and production it is a public host that passes on its own.
	if (origin === permittedOrigin) {
		return;
	}

	if (isInternalHostname(hostname)) {
		throw new BlockedHostError(
			url,
			`the host ${hostname} is in a private namespace`,
		);
	}

	const addresses = await resolveHost(unbracketIpv6Hostname(hostname));

	if (addresses.length === 0) {
		throw new BlockedHostError(
			url,
			`the host ${hostname} resolves to no address`,
		);
	}

	for (const address of addresses) {
		if (isReservedAddress(address)) {
			throw new BlockedHostError(
				url,
				`the host ${hostname} resolves to the reserved address ${address}`,
			);
		}
	}
}

async function resolveHostThroughSystem(
	hostname: string,
): Promise<readonly string[]> {
	// the OS resolver is the one fetch itself uses, so it agrees with /etc/hosts
	// and the search domains where dns.resolve4/6 would not — and it returns an
	// IP literal unchanged rather than querying for it.
	const addresses = await lookup(hostname, { all: true, verbatim: true });

	return addresses.map(({ address }) => address);
}

function isReservedAddress(address: string): boolean {
	if (isIP(address) === 0) {
		// a resolver that answered with something Node cannot parse as an address
		// is not evidence that the destination is safe; "it matched no rule" is
		// the wrong reason to hand it to fetch.
		return true;
	}

	return reservedAddresses.check(address, isIPv6(address) ? "ipv6" : "ipv4");
}

function isInternalHostname(hostname: string): boolean {
	// defense in depth behind the resolved-address check: `*.internal` is private
	// by definition — it is where GCP's metadata endpoint lives — so there is no
	// reason to resolve one at all.
	return hostname.endsWith(".internal");
}

function unbracketIpv6Hostname(hostname: string): string {
	// URL keeps an IPv6 host in its bracketed form, which no resolver accepts.
	return hostname.startsWith("[") && hostname.endsWith("]")
		? hostname.slice(1, -1)
		: hostname;
}
