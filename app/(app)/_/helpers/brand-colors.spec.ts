import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	accentHue,
	faviconColorDark,
	faviconColorLight,
	indexThumbnailBackgroundColor,
	oklchToHex,
	postThumbnailBackgroundColor,
	postThumbnailCoverTintColor,
	postThumbnailLogoColor,
	themeColorDark,
	themeColorLight,
	thumbnailForegroundColor,
} from "./brand-colors";

// the hexes these constants replaced. a change here is a change to what ships
// on the favicon, the Open Graph images, or the browser chrome — so this table
// only moves when a recolor is intended, never to make a refactor pass.
const shippedColors = {
	themeColorLight: "#eedfff",
	themeColorDark: "#1c1025",
	faviconColorLight: "#7f00d0",
	faviconColorDark: "#e463ff",
	indexThumbnailBackgroundColor: "#b016ff",
	postThumbnailBackgroundColor: "#16002a",
	postThumbnailLogoColor: "#cf87ff",
	postThumbnailCoverTintColor: "#9070af",
	thumbnailForegroundColor: "#ffffff",
} as const;

const accentHueDeclarationPattern = /--accent-hue:\s*([\d.]+)deg\s*;/;
const hexColorPattern = /^#[0-9a-f]{6}$/;

const QUARTER_TURN = 90;
const FULL_TURN = 360;
const SAMPLE_HUE = 20;
const SAMPLE_LIGHTNESS = 0.6;
const SAMPLE_CHROMA = 0.2;
const BEYOND_GAMUT_CHROMA = 0.5;
const BEYOND_GAMUT_HUE = 145;

describe("brand colors", () => {
	it.each([
		["themeColorLight", themeColorLight],
		["themeColorDark", themeColorDark],
		["faviconColorLight", faviconColorLight],
		["faviconColorDark", faviconColorDark],
		["indexThumbnailBackgroundColor", indexThumbnailBackgroundColor],
		["postThumbnailBackgroundColor", postThumbnailBackgroundColor],
		["postThumbnailLogoColor", postThumbnailLogoColor],
		["postThumbnailCoverTintColor", postThumbnailCoverTintColor],
		["thumbnailForegroundColor", thumbnailForegroundColor],
	] as const)(
		"renders %s as the color it has always shipped",
		(name, color) => {
			expect(color).toBe(shippedColors[name]);
		},
	);

	it("leaves the achromatic foreground white under any brand hue", () => {
		expect(oklchToHex(1, 0, accentHue + QUARTER_TURN)).toBe(
			shippedColors.thumbnailForegroundColor,
		);
	});
});

describe("accentHue", () => {
	// the hue is declared twice — here and as `--accent-hue` in
	// `app/(app)/variables.css` — because a stylesheet cannot import TypeScript.
	// this is what keeps the two a single knob rather than two that agree today.
	it("matches the --accent-hue declared in app/(app)/variables.css", () => {
		const variablesCss = readFileSync(
			join(process.cwd(), "app", "(app)", "variables.css"),
			"utf8",
		);
		const declaration = accentHueDeclarationPattern.exec(variablesCss);

		expect(declaration).not.toBeNull();
		expect(Number(declaration?.[1])).toBe(accentHue);
	});
});

describe("oklchToHex()", () => {
	it("converts the achromatic ends of the lightness axis", () => {
		expect(oklchToHex(1, 0, 0)).toBe("#ffffff");
		expect(oklchToHex(0, 0, 0)).toBe("#000000");
	});

	it("treats hue as periodic, so a rotated brand hue needs no normalization", () => {
		expect(
			oklchToHex(SAMPLE_LIGHTNESS, SAMPLE_CHROMA, FULL_TURN + SAMPLE_HUE),
		).toBe(oklchToHex(SAMPLE_LIGHTNESS, SAMPLE_CHROMA, SAMPLE_HUE));
	});

	it("clips a color that falls outside sRGB rather than emitting garbage", () => {
		expect(
			oklchToHex(SAMPLE_LIGHTNESS, BEYOND_GAMUT_CHROMA, BEYOND_GAMUT_HUE),
		).toMatch(hexColorPattern);
	});
});
