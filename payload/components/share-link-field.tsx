"use client";

import {
	Button,
	ConfirmationModal,
	FieldLabel,
	toast,
	useConfig,
	useDocumentInfo,
	useField,
	useFormFields,
	useModal,
} from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";
import { type JSX, useCallback, useEffect, useState } from "react";

const baseClass = "share-link-field";

/**
 * Slug of the confirmation modal Rotate opens. One edit view renders one share
 * link, so a constant slug is unambiguous.
 */
const rotateModalSlug = "rotate-blog-post-share-link";

/**
 * The `shareToken` field's admin control: the draft's share link, a copy
 * action, and a rotate action, rendered inline among the post's Metadata
 * fields.
 *
 * Three things about it are deliberate rather than incidental:
 *
 * - **Rotation persists by itself.** Rotate posts to the collection's rotation
 *   endpoint, which writes the replacement server-side, and the new value is
 *   written into form state with the form left unmodified — so there is no save
 *   step to forget, and the control shows the new link as soon as it lands.
 *   Rotation is the only revocation this design has, so the action carries the
 *   danger treatment, a rotation glyph, and a confirmation.
 * - **The origin comes from the browser.** The admin is served from the same
 *   origin as the site, so the link is built from `window.location` rather than
 *   by plumbing a server-side origin into the client bundle. It is read after
 *   mount, because there is no location during the server render.
 * - **There is no signed-out branch.** `shareToken` is unreadable without a
 *   session, so this renders only for a signed-in author; a visitor state would
 *   be dead code describing a case that cannot happen.
 */
export const ShareLinkField: TextFieldClientComponent = ({ field, path }) => {
	const { setValue, value } = useField<string>({ path });
	const { id } = useDocumentInfo();
	const { config } = useConfig();
	const { openModal } = useModal();
	const slug = useFormFields(([fields]) => {
		const slugValue = fields?.slug?.value;

		return typeof slugValue === "string" ? slugValue : "";
	});
	const [origin, setOrigin] = useState("");
	const [isRotating, setIsRotating] = useState(false);

	useEffect(() => {
		setOrigin(window.location.origin);
	}, []);

	// the post's own preview URL with the secret appended — the route the author
	// already knows from live preview, not a second address to reason about.
	const shareUrl =
		origin && slug && value
			? `${origin}/posts/${slug}?draft=true&token=${encodeURIComponent(value)}`
			: "";

	const copyShareUrl = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);

			toast.success("Copied the share link.");
		} catch {
			toast.error("Could not copy the share link.");
		}
	}, [shareUrl]);

	const rotateShareToken = useCallback(async () => {
		setIsRotating(true);

		try {
			const response = await fetch(
				`${config.serverURL}${config.routes.api}/blog-posts/${id}/rotate-share-token`,
				{ credentials: "include", method: "POST" },
			);

			if (!response.ok) {
				throw new Error(`Rotation responded with ${response.status}.`);
			}

			const body: unknown = await response.json();
			const rotated =
				typeof body === "object" && body !== null && "shareToken" in body
					? body.shareToken
					: null;

			if (typeof rotated !== "string" || rotated.length === 0) {
				throw new Error("Rotation returned no token.");
			}

			// `true` leaves the form unmodified: the endpoint has already persisted
			// the replacement, so showing it must not turn the document dirty and ask
			// the author to save something that is already saved.
			setValue(rotated, true);

			toast.success(
				"Rotated the share link. Every link shared before now has stopped working.",
			);
		} catch {
			toast.error("Could not rotate the share link.");
		} finally {
			setIsRotating(false);
		}
	}, [config.routes.api, config.serverURL, id, setValue]);

	// Payload's own text field derives its input id from the field path this way,
	// so the label and the warning line associate with the input the same way
	// every other field on the tab does.
	const inputId = `field-${path.replaceAll(".", "__")}`;
	const warningId = `${inputId}-warning`;

	return (
		<div className={baseClass} data-testid="share-link-field">
			<FieldLabel htmlFor={inputId} label={field?.label} path={path} />

			{id && value ? (
				<div className={`${baseClass}__row`}>
					<input
						aria-describedby={warningId}
						className={`${baseClass}__url`}
						data-testid="share-link-url"
						id={inputId}
						readOnly={true}
						value={shareUrl}
					/>

					<Button
						buttonStyle="secondary"
						disabled={shareUrl === ""}
						extraButtonProps={{ "data-testid": "share-link-copy" }}
						margin={false}
						onClick={copyShareUrl}
						size="small"
					>
						{"Copy"}
					</Button>

					{/* `buttonStyle="error"` is in Payload's type union but has no rule in
					    its stylesheet, so the danger treatment comes from
					    `share-link-field__rotate` in `app/(payload)/custom.scss`. The
					    glyph carries the same signal in shape, so the action does not
					    rely on colour alone. */}
					<Button
						buttonStyle="error"
						className={`${baseClass}__rotate`}
						disabled={isRotating}
						extraButtonProps={{ "data-testid": "share-link-rotate" }}
						icon={<RotateGlyph />}
						iconPosition="left"
						margin={false}
						onClick={() => openModal(rotateModalSlug)}
						size="small"
					>
						{isRotating ? "Rotating…" : "Rotate"}
					</Button>
				</div>
			) : (
				<p className={`${baseClass}__pending`}>
					{"This post gets its share link once it is saved."}
				</p>
			)}

			<p
				className={`${baseClass}__warning`}
				data-testid="share-link-warning"
				id={warningId}
			>
				{
					"Anyone holding this link can read the draft, with no sign-in. It never expires — rotating is the only way to revoke it, and rotating revokes every copy at once."
				}
			</p>

			<ConfirmationModal
				body={
					"Every link shared under the current secret stops working immediately, including the one you sent five minutes ago. This cannot be undone."
				}
				confirmLabel="Rotate"
				confirmingLabel="Rotating…"
				heading="Rotate this post's share link?"
				modalSlug={rotateModalSlug}
				onConfirm={rotateShareToken}
			/>
		</div>
	);
};

/**
 * Circular-arrow glyph on the Rotate action, so the action reads as destructive
 * through shape as well as colour.
 */
function RotateGlyph(): JSX.Element {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height="16"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
			width="16"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M21 12a9 9 0 1 1-3.36-7" />
			<path d="M21 3v6h-6" />
		</svg>
	);
}
