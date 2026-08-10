import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import {
	LoadingPlaceholderRect,
	LoadingPlaceholderText,
} from "@/components/loading-placeholder";
import { BlogPostListLoading } from "./blog-post-list/loading";
import css from "./index-page-main-loading.module.css";

/**
 * The skeleton for the index page's main region, standing in for
 * `<IndexPageMain>` while the website global resolves. It mirrors that
 * region's dimensions and grid — portrait, bio, social links, posts heading —
 * so nothing shifts when the real content arrives, and hands the post list
 * itself to the skeleton that list already owns.
 *
 * `<IndexPageMain>` lives in `page.tsx` rather than in its own file, so this
 * fallback is a standalone component rather than the `loading` half of a triad.
 */
export function IndexPageMainLoading({
	className,
	children,
	...props
}: ComponentProps<"main">): JSX.Element {
	return (
		<main className={clsx(css.indexPageMainLoading, className)} {...props}>
			{/* the loaded region's <h1> is visually hidden and reserves no space, so
			    it gets no placeholder — one would add height the loaded page never
			    occupies, which is the layout shift this skeleton exists to avoid. */}
			<section className={css.intro} data-testid="intro-loading">
				<LoadingPlaceholderRect className={css.portrait} />

				<div className={css.bio}>
					<div className={css.bioContent} data-testid="bio-loading">
						<LoadingPlaceholderText
							sampleText="Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat in id."
							maxLines={3}
						/>

						<LoadingPlaceholderText
							sampleText="Cursus mi pretium tellus duis convallis tempus leo eu aenean."
							maxLines={2}
						/>
					</div>

					<ul className={css.socialLinks} data-testid="social-links-loading">
						<li className={css.socialLink}>
							<LoadingPlaceholderRect className={css.socialIcon} />
						</li>

						<li className={css.socialLink}>
							<LoadingPlaceholderRect className={css.socialIcon} />
						</li>

						<li className={css.socialLink}>
							<LoadingPlaceholderRect className={css.socialIcon} />
						</li>
					</ul>
				</div>
			</section>

			<section className={css.section}>
				<h2 className={css.sectionHeading}>
					<LoadingPlaceholderText sampleText="Lorem" maxLines={1} />
				</h2>

				<BlogPostListLoading
					className={css.blogPosts}
					data-testid="blog-posts-loading"
				/>
			</section>
		</main>
	);
}
