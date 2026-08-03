"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { clsx } from "clsx";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	type ComponentProps,
	type FormEvent,
	type HTMLAttributes,
	type JSX,
	useState,
} from "react";
import { GitHubMarkIcon } from "@/components/social-icon";
import { COMMENT_CSRF_HEADER } from "@/helpers/comment-csrf";
import { MAX_COMMENT_BODY_LENGTH } from "@/shared/comments";
import { CommentAvatar } from "./comment-avatar";
import css from "./comment-composer.module.css";

type SubmitState = "idle" | "submitting" | "submitted" | "error";

/**
 * The reader-facing composer for top-level comments. Signed-out readers get a
 * non-interactive preview of the composer — a placeholder textarea with a
 * "Sign in with GitHub" call (Clerk modal); signed-in readers get a bordered
 * textarea and a neutral submit button. On success the composer swaps to an
 * "awaiting review" acknowledgment, since the comment is pending.
 *
 * Only mounted when Clerk is configured — its Clerk hooks require the provider.
 */
export function CommentComposer({
	slug,
	className,
	...props
	// the composer roots a <div>, a <p>, or a <form> depending on sign-in and
	// submit state, so the pass-through is typed against `HTMLElement` rather than
	// committing to whichever branch happens to render.
}: Omit<HTMLAttributes<HTMLElement>, "children"> & {
	slug: string;
}): JSX.Element {
	const t = useTranslations("comments");
	const { isLoaded, isSignedIn, user } = useUser();
	const [body, setBody] = useState("");
	const [state, setState] = useState<SubmitState>("idle");

	if (!isLoaded) {
		return (
			<div
				className={clsx(css.composer, className)}
				data-testid="composer"
				aria-busy="true"
				{...props}
			/>
		);
	}

	if (!isSignedIn) {
		return <SignedOutComposer className={className} {...props} />;
	}

	if (state === "submitted") {
		return (
			<p
				className={clsx(css.hint, className)}
				role="status"
				data-testid="submitted"
				{...props}
			>
				{t("submitted")}
			</p>
		);
	}

	// fetches a fresh double-submit CSRF token for each submit. The same request
	// re-pins the matching cookie in the browser, so the token and cookie always
	// originate together and neither goes stale between attempts (the cookie has
	// a one-hour lifetime, so a cached token would eventually outlive it).
	async function fetchCsrfToken(): Promise<string | null> {
		const response = await fetch(`/posts/${slug}/comments/token`);

		if (!response.ok) {
			return null;
		}

		const { token } = (await response.json()) as { token?: string };

		return token ?? null;
	}

	async function handleSubmit(
		event: FormEvent<HTMLFormElement>,
	): Promise<void> {
		event.preventDefault();

		const trimmed = body.trim();

		if (trimmed.length === 0 || state === "submitting") {
			return;
		}

		setState("submitting");

		try {
			const csrfToken = await fetchCsrfToken();

			if (!csrfToken) {
				setState("error");

				return;
			}

			const response = await fetch(`/posts/${slug}/comments`, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					[COMMENT_CSRF_HEADER]: csrfToken,
				},
				body: JSON.stringify({ body: trimmed }),
			});

			if (!response.ok) {
				setState("error");

				return;
			}

			setBody("");
			setState("submitted");
		} catch {
			setState("error");
		}
	}

	return (
		<form
			className={clsx(css.composer, className)}
			onSubmit={handleSubmit}
			data-testid="composer"
			{...props}
		>
			<CommentAvatar
				src={user.imageUrl}
				alt={user.fullName ?? user.username ?? ""}
				className={css.avatar}
			/>

			<div className={css.composerField}>
				<textarea
					className={css.textarea}
					value={body}
					onChange={(event) => setBody(event.target.value)}
					maxLength={MAX_COMMENT_BODY_LENGTH}
					placeholder={t("placeholder")}
					aria-label={t("placeholder")}
					disabled={state === "submitting"}
					data-testid="textarea"
				/>

				<div className={css.composerRow}>
					<span className={css.hint}>
						{state === "error" ? t("error") : t("hint")}
					</span>

					<button
						type="submit"
						className={css.submit}
						disabled={state === "submitting" || body.trim().length === 0}
						data-testid="submit"
					>
						{t("submit")}
					</button>
				</div>
			</div>
		</form>
	);
}

/**
 * A non-interactive preview of the composer for signed-out readers: the textarea
 * they would get, with the sign-in button in the same bottom-right slot the
 * submit button occupies once signed in. The textarea is decorative — hidden
 * from assistive tech and the tab order so the sign-in button is the sole
 * control.
 */
function SignedOutComposer({
	className,
	...props
}: Omit<ComponentProps<"div">, "children">): JSX.Element {
	const t = useTranslations("comments");
	// `mode="modal"` opens the sign-in on the current route without navigating to
	// a sign-in page, so Clerk never records a `redirect_url`; after the GitHub
	// OAuth round-trip it would otherwise fall back to its default of `/`. pinning
	// the redirect to the current path returns the reader to the post they were on
	// (`signUp…` covers first-time account creation via the same button).
	const pathname = usePathname();

	return (
		<div
			className={clsx(css.composer, className)}
			data-testid="composer"
			{...props}
		>
			<div className={css.composerField}>
				<textarea
					className={clsx(css.textarea, css.textareaPreview)}
					placeholder={t("placeholder")}
					readOnly
					aria-hidden="true"
					tabIndex={-1}
					data-testid="textarea-preview"
				/>

				<div className={clsx(css.composerRow, css.composerRowEnd)}>
					<SignInButton
						mode="modal"
						forceRedirectUrl={pathname}
						signUpForceRedirectUrl={pathname}
					>
						<button
							type="button"
							className={clsx(css.submit, css.signIn)}
							data-testid="sign-in"
						>
							<GitHubMarkIcon className={css.signInIcon} />
							{t("sign-in")}
						</button>
					</SignInButton>
				</div>
			</div>
		</div>
	);
}
