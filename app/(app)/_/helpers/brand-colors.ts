// the brand hue and every color derived from it that a surface outside CSS
// needs. `app/(app)/variables.css` owns the same hue as `--accent-hue` for
// everything that renders through a stylesheet, but the `ImageResponse` and
// metadata surfaces cannot read a custom property at render time, so they read
// the constants at the bottom of this file instead. rotating the hue in both
// places — which `brand-colors.spec.ts` keeps in step — recolors the favicon,
// both Open Graph images, and both `theme-color` values along with the rest of
// the site.
//
// each color states only its *hue* relative to `accentHue` and keeps the
// lightness and chroma it has always had, so a rotation moves every branded
// surface together while today's rendered values stay byte-identical. the
// offsets are measured from the hexes these constants replaced; four of them
// sit off the accent ramp entirely and are recorded as such rather than snapped
// onto a numbered step, which would have changed what ships.

/**
 * the brand hue in degrees. mirrors `--accent-hue` in
 * `app/(app)/variables.css`; the two are separate declarations only because a
 * stylesheet cannot import TypeScript, and a unit test fails if they drift.
 */
export const accentHue = 307;

// the OKLab → linear-sRGB chain CSS Color 4 defines, so a value authored here
// lands on the same color an `oklch()` declaration would.
//
// biome-ignore-start lint/style/noMagicNumbers: these are the conversion's
// published coefficients — the number is its own meaning, and a name per
// coefficient would hide which specification they came from.
// biome-ignore-start lint/style/useNumericSeparators: grouping the digits would
// stop these reading as the specification prints them, which is how they get
// checked.
const OKLAB_TO_LMS = [
	[1, 0.3963377774, 0.2158037573],
	[1, -0.1055613458, -0.0638541728],
	[1, -0.0894841775, -1.291485548],
] as const;

const LMS_TO_LINEAR_SRGB = [
	[4.0767416621, -3.3077115913, 0.2309699292],
	[-1.2684380046, 2.6097574011, -0.3413193965],
	[-0.0041960863, -0.7034186147, 1.707614701],
] as const;

const LMS_EXPONENT = 3;
const DEGREES_PER_HALF_TURN = 180;
const RADIANS_PER_DEGREE = Math.PI / DEGREES_PER_HALF_TURN;
const SRGB_LINEAR_LIMIT = 0.0031308;
const SRGB_LINEAR_SLOPE = 12.92;
const SRGB_GAMMA_SCALE = 1.055;
const SRGB_GAMMA_OFFSET = 0.055;
const SRGB_GAMMA_DENOMINATOR = 2.4;
const SRGB_CHANNEL_MAX = 255;
const HEX_RADIX = 16;
const HEX_CHANNEL_LENGTH = 2;
// biome-ignore-end lint/style/useNumericSeparators: see above.
// biome-ignore-end lint/style/noMagicNumbers: see above.

/** gamma-encodes one linear-sRGB component and formats it as two hex digits. */
function toHexChannel(linear: number): string {
	const clipped = Math.min(1, Math.max(0, linear));
	const encoded =
		clipped <= SRGB_LINEAR_LIMIT
			? SRGB_LINEAR_SLOPE * clipped
			: SRGB_GAMMA_SCALE * clipped ** (1 / SRGB_GAMMA_DENOMINATOR) -
				SRGB_GAMMA_OFFSET;

	return Math.round(encoded * SRGB_CHANNEL_MAX)
		.toString(HEX_RADIX)
		.padStart(HEX_CHANNEL_LENGTH, "0");
}

/**
 * converts an OKLCH color to a `#rrggbb` string. lightness is 0–1, chroma is on
 * OKLCH's own scale, and hue is in degrees — values outside 0–360 wrap, so a
 * rotated `accentHue` plus an offset needs no normalization. components outside
 * sRGB are clipped per channel; every color in this module is inside the gamut,
 * so no clipping happens today.
 */
export function oklchToHex(
	lightness: number,
	chroma: number,
	hue: number,
): string {
	const radians = hue * RADIANS_PER_DEGREE;
	const oklab = [
		lightness,
		chroma * Math.cos(radians),
		chroma * Math.sin(radians),
	] as const;
	const lms = OKLAB_TO_LMS.map(
		(row) =>
			(row[0] * oklab[0] + row[1] * oklab[1] + row[2] * oklab[2]) **
			LMS_EXPONENT,
	);
	const channels = LMS_TO_LINEAR_SRGB.map(
		(row) => row[0] * lms[0] + row[1] * lms[1] + row[2] * lms[2],
	);

	return `#${channels.map(toHexChannel).join("")}`;
}

/** builds a color from the brand hue plus an offset, in degrees. */
function brandColor(
	lightness: number,
	chroma: number,
	hueOffset: number,
): string {
	return oklchToHex(lightness, chroma, accentHue + hueOffset);
}

// each call below reads (lightness, chroma, hue offset from `accentHue`),
// measured from the hex it replaced.
//
// biome-ignore-start lint/style/noMagicNumbers: naming these would mean a
// constant per channel per color, which says nothing the argument order and the
// doc comment above each one do not already say.

/**
 * the light-scheme `theme-color`. effectively `--accent-2` in the light scheme,
 * one 1/255 step apart in blue.
 */
export const themeColorLight = brandColor(0.9253, 0.0458, -0.51);

/**
 * the dark-scheme `theme-color`. effectively `--accent-2` in the dark scheme,
 * one 1/255 step apart in red and blue.
 */
export const themeColorDark = brandColor(0.2006, 0.0438, 2.26);

/**
 * the favicon glyph under a light color scheme. sits off the accent ramp — 3.9°
 * below the brand hue and 3.4 lightness points above `--accent-11`.
 */
export const faviconColorLight = brandColor(0.4841, 0.2541, -3.91);

/**
 * the favicon glyph under a dark color scheme. the furthest of these colors
 * from the ramp: 13.3° above the brand hue, where `--accent-11` sits on it.
 */
export const faviconColorDark = brandColor(0.719, 0.2422, 13.32);

/** the flat accent field behind the index Open Graph image — the accent-9 solid. */
export const indexThumbnailBackgroundColor = brandColor(0.5941, 0.2942, 1.43);

/**
 * the dark base of the post Open Graph image, behind the blurred cover photo
 * and under the title's shadow. darker and more chromatic than any dark step.
 */
export const postThumbnailBackgroundColor = brandColor(0.1616, 0.0846, -3.27);

/**
 * the wordmark on the post Open Graph image. tinted rather than white because
 * it sits on a dark photo field; near `--accent-8` but not on it.
 */
export const postThumbnailLogoColor = brandColor(0.7431, 0.1802, 3.36);

/**
 * the tint the post Open Graph image's cover photo is graded through. its hue
 * is exactly the brand hue and its lightness exactly `--lightness-9`, but its
 * chroma sits between the accent and neutral ramps, so it is no numbered step.
 */
export const postThumbnailCoverTintColor = brandColor(0.6007, 0.0997, -0.1);

/**
 * the legible foreground on both Open Graph images — the index wordmark and the
 * post title. deliberately achromatic, so it stays white under any brand hue.
 */
export const thumbnailForegroundColor = brandColor(1, 0, 0);
// biome-ignore-end lint/style/noMagicNumbers: see above.
