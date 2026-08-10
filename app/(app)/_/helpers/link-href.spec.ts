import { describe, expect, it } from "@jest/globals";
import { classifyLinkHref } from "./link-href";

describe("classifyLinkHref()", () => {
	it("classifies a root-relative path as internal", () => {
		expect(classifyLinkHref("/posts/declarative-ui")).toBe("internal");
	});

	it("classifies a relative path as internal", () => {
		expect(classifyLinkHref("./sibling")).toBe("internal");
	});

	it("classifies a bare anchor as internal", () => {
		expect(classifyLinkHref("#section")).toBe("internal");
	});

	it("classifies a query-only destination as internal", () => {
		expect(classifyLinkHref("?draft=true")).toBe("internal");
	});

	it("classifies a path whose query carries a colon as internal", () => {
		expect(classifyLinkHref("/posts?q=a:b")).toBe("internal");
	});

	it("classifies a path whose anchor carries a colon as internal", () => {
		expect(classifyLinkHref("/posts#a:b")).toBe("internal");
	});

	it("classifies an https destination as external", () => {
		expect(classifyLinkHref("https://example.com/?a=1&b=2")).toBe("external");
	});

	it("classifies an http destination as external", () => {
		expect(classifyLinkHref("http://example.com/")).toBe("external");
	});

	it("classifies a protocol-relative destination as external", () => {
		expect(classifyLinkHref("//example.com/path")).toBe("external");
	});

	it("classifies a mailto destination as contact", () => {
		expect(classifyLinkHref("mailto:yo@axross.dev")).toBe("contact");
	});

	it("classifies a tel destination as contact", () => {
		expect(classifyLinkHref("tel:+81-3-0000-0000")).toBe("contact");
	});

	it("blocks a javascript destination", () => {
		expect(classifyLinkHref("javascript:alert(1)")).toBe("blocked");
	});

	it("blocks a javascript destination whatever its casing", () => {
		expect(classifyLinkHref("JaVaScRiPt:alert(1)")).toBe("blocked");
	});

	it("blocks a javascript destination whose leading space was percent-encoded upstream", () => {
		expect(classifyLinkHref("%20javascript:alert(1)")).toBe("blocked");
	});

	it("blocks a data destination", () => {
		expect(classifyLinkHref("data:text/html;base64,PHNjcmlwdD4=")).toBe(
			"blocked",
		);
	});

	it("blocks a vbscript destination", () => {
		expect(classifyLinkHref("vbscript:msgbox(1)")).toBe("blocked");
	});

	it("blocks a file destination", () => {
		expect(classifyLinkHref("file:///etc/passwd")).toBe("blocked");
	});

	// browsers read `foo:bar` as the scheme `foo:` too, so treating it as a
	// relative path would disagree with what the anchor would actually do.
	it("blocks an unknown scheme that looks like a relative path", () => {
		expect(classifyLinkHref("foo:bar")).toBe("blocked");
	});

	it("blocks a destination whose scheme is empty", () => {
		expect(classifyLinkHref(":alert(1)")).toBe("blocked");
	});

	// `https://` is what `@payloadcms/richtext-lexical` substitutes for a
	// destination its own markdown export refuses, so this is the shape a
	// CMS-authored `javascript:` link now arrives in.
	it("blocks an https destination carrying no host", () => {
		expect(classifyLinkHref("https://")).toBe("blocked");
	});

	it("blocks an http destination carrying no host", () => {
		expect(classifyLinkHref("http://")).toBe("blocked");
	});

	it("blocks an empty destination", () => {
		expect(classifyLinkHref("")).toBe("blocked");
	});
});
