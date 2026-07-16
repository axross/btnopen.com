import { captureException } from "@sentry/nextjs";
import clsx from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./banner.module.css";

const bannerLabels = {
	note: "Note",
	warning: "Warning",
} as const;

type BannerVariant = keyof typeof bannerLabels;

/**
 * Renders a `banner` container directive as an admonition-style callout,
 * dispatching on its `type` attribute. "note" and "warning" render their
 * respective presentations; an unknown type degrades to the "note" presentation
 * and is reported to Sentry so authoring faults surface without breaking the
 * post.
 */
export function Banner({
	type = "note",
	className,
	children,
	...props
}: Omit<ComponentProps<"div">, "type"> & {
	type?: string;
}): JSX.Element {
	const variant: BannerVariant = type === "warning" ? "warning" : "note";

	if (type !== "note" && type !== "warning") {
		captureException(
			new Error(`Rendered a banner with an unsupported type (type: ${type}).`),
		);
	}

	return (
		<div
			className={clsx(css.banner, className)}
			data-banner-type={variant}
			data-testid="banner"
			{...props}
		>
			<div aria-hidden="true" className={css.tile}>
				{variant === "warning" ? <WarningGlyph /> : <NoteGlyph />}
			</div>

			<div className={css.content}>
				<span className={css.label}>{bannerLabels[variant]}</span>

				<div className={css.body}>{children}</div>
			</div>
		</div>
	);
}

function NoteGlyph(): JSX.Element {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 16v-4" />
			<path d="M12 8h.01" />
		</svg>
	);
}

function WarningGlyph(): JSX.Element {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
			<path d="M12 9v4" />
			<path d="M12 17h.01" />
		</svg>
	);
}
