"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { clsx } from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { type FormEvent, type JSX, useState } from "react";
import { COMMENT_CSRF_HEADER } from "@/helpers/comment-csrf";
import { MAX_COMMENT_BODY_LENGTH } from "@/helpers/comments";
import css from "./comments.module.css";

type SubmitState = "idle" | "submitting" | "submitted" | "error";

/**
 * The reader-facing composer for top-level comments. Signed-out readers get a
 * "Sign in with GitHub" affordance (Clerk modal); signed-in readers get a
 * bordered textarea and a neutral submit button. On success the composer swaps
 * to an "awaiting review" acknowledgment, since the comment is pending.
 *
 * Only mounted when Clerk is configured — its Clerk hooks require the provider.
 */
export function CommentComposer({ slug }: { slug: string }): JSX.Element {
	const t = useTranslations("comments");
	const { isLoaded, isSignedIn, user } = useUser();
	const [body, setBody] = useState("");
	const [state, setState] = useState<SubmitState>("idle");

	if (!isLoaded) {
		return (
			<div className={css.composer} data-testid="composer" aria-busy="true" />
		);
	}

	if (!isSignedIn) {
		return (
			<div className={css.composer} data-testid="composer">
				<SignInButton mode="modal">
					<button
						type="button"
						className={clsx(css.submit, css.signIn)}
						data-testid="sign-in"
					>
						<GitHubIcon className={css.signInIcon} />
						{t("sign-in")}
					</button>
				</SignInButton>
			</div>
		);
	}

	if (state === "submitted") {
		return (
			<p className={css.hint} role="status" data-testid="submitted">
				{t("submitted")}
			</p>
		);
	}

	// Fetches a fresh double-submit CSRF token for each submit. The same request
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
			className={css.composer}
			onSubmit={handleSubmit}
			data-testid="composer"
		>
			{user.imageUrl ? (
				<Image
					className={css.avatar}
					src={user.imageUrl}
					alt={user.fullName ?? user.username ?? ""}
					width={40}
					height={40}
				/>
			) : (
				<span className={css.avatarFallback} aria-hidden="true" />
			)}

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

function GitHubIcon({ className }: { className?: string }): JSX.Element {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
			className={className}
		>
			<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
		</svg>
	);
}
