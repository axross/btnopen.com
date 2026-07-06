"use client";

import clsx from "clsx";
import { type ComponentProps, type JSX, useCallback } from "react";
import { GitHubIcon, LinkedInIcon, XcomIcon } from "@/components/social-icon";
import { trackAction } from "@/helpers/analytics";
import css from "./social-link-list.module.css";

export function SocialLinkList({
	className,
	...props
}: ComponentProps<"ul">): JSX.Element {
	const onGitHubLinkClick = useCallback(
		() => trackAction("github link click"),
		[],
	);

	const onXcomLinkClick = useCallback(() => trackAction("x link click"), []);

	const onLinkedInLinkClick = useCallback(
		() => trackAction("linkedin link click"),
		[],
	);

	return (
		<ul className={clsx(css.socialLinkList, className)} {...props}>
			<li className={css.listItem}>
				<a
					href="https://github.com/axross"
					target="_blank"
					rel="noopener noreferrer"
					onClick={onGitHubLinkClick}
					className={css.item}
					data-testid="github"
				>
					<GitHubIcon />
				</a>
			</li>

			<li className={css.listItem}>
				<a
					href="https://x.com/axross"
					target="_blank"
					rel="noopener noreferrer"
					onClick={onXcomLinkClick}
					className={css.item}
					data-testid="xcom"
				>
					<XcomIcon />
				</a>
			</li>

			<li className={css.listItem}>
				<a
					href="https://www.linkedin.com/in/axross"
					target="_blank"
					rel="noopener noreferrer"
					onClick={onLinkedInLinkClick}
					className={css.item}
					data-testid="linkedin"
				>
					<LinkedInIcon />
				</a>
			</li>
		</ul>
	);
}
