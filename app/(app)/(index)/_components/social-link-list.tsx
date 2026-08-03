"use client";

import clsx from "clsx";
import type { ComponentProps, JSX, SVGProps } from "react";
import { GitHubIcon, LinkedInIcon, XcomIcon } from "@/components/social-icon";
import { trackAction } from "@/helpers/analytics";
import css from "./social-link-list.module.css";

// the author's three profiles, in the order they render. they live here rather
// than in the `website` global because three URLs that change about never do not
// earn a schema field, a migration, and an empty-until-filled production state
// (decided on #175).
const socialLinks = [
	{
		href: "https://github.com/axross",
		action: "github link click",
		testId: "github",
		icon: GitHubIcon,
	},
	{
		href: "https://x.com/axross",
		action: "x link click",
		testId: "xcom",
		icon: XcomIcon,
	},
	{
		href: "https://www.linkedin.com/in/axross",
		action: "linkedin link click",
		testId: "linkedin",
		icon: LinkedInIcon,
	},
] as const satisfies readonly {
	href: string;
	action: Parameters<typeof trackAction>[0];
	testId: string;
	icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}[];

export function SocialLinkList({
	className,
	...props
}: ComponentProps<"ul">): JSX.Element {
	return (
		<ul className={clsx(css.socialLinkList, className)} {...props}>
			{socialLinks.map(({ href, action, testId, icon: Icon }) => (
				<li key={href} className={css.listItem}>
					<a
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						onClick={() => trackAction(action)}
						className={css.item}
						data-testid={testId}
					>
						<Icon />
					</a>
				</li>
			))}
		</ul>
	);
}
