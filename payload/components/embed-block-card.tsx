"use client";

import { BlockCollapsible } from "@payloadcms/richtext-lexical/client";
import { useFormFields } from "@payloadcms/ui";
import type { JSX } from "react";
import { defaultEmbedType } from "../helpers/embed-block";

/**
 * Card-preview admin component for the `embed` rich-text block. Instead of the
 * default block form, the block reads as a compact card — glyph, host, type
 * chip, and the full URL — while editing happens in the standard block drawer
 * opened by the collapsible header's edit button.
 */
export function EmbedBlockCard(): JSX.Element {
	const url = useFormFields(([fields]) => {
		const value = fields?.url?.value;

		return typeof value === "string" ? value : "";
	});
	const type = useFormFields(([fields]) => {
		const value = fields?.type?.value;

		return typeof value === "string" && value.length > 0
			? value
			: defaultEmbedType;
	});

	const host = URL.canParse(url) ? new URL(url).host : null;

	return (
		<BlockCollapsible
			disableBlockName={true}
			Label={
				<div className="embed-block-card">
					<div aria-hidden="true" className="embed-block-card__glyph">
						<LinkGlyph />
					</div>

					<div className="embed-block-card__meta">
						<span className="embed-block-card__headline">
							{host === null ? (
								<span className="embed-block-card__no-url">{"No URL"}</span>
							) : (
								<span className="embed-block-card__host">{host}</span>
							)}

							<span className="embed-block-card__type">{type}</span>
						</span>

						{url.length > 0 ? (
							<span className="embed-block-card__url">{url}</span>
						) : null}
					</div>
				</div>
			}
		/>
	);
}

function LinkGlyph(): JSX.Element {
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
			width="20"
			height="20"
		>
			<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
			<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
		</svg>
	);
}
