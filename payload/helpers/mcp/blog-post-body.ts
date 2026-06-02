import type { PayloadRequest } from "payload";
import type { BlogPost } from "../../types";
import { isRecord } from "./records";

export const bodyMutationSelect = {
	id: true,
	slug: true,
	body: true,
	_status: true,
	updatedAt: true,
	createdAt: true,
} as const;

export async function findBlogPostBySlug<
	Select extends Record<string, boolean>,
>(
	req: PayloadRequest,
	slug: string,
	options: {
		draft: boolean;
		locale: "en-US" | "ja-JP";
		select: Select;
	},
): Promise<BlogPost | null> {
	const result = await req.payload.find({
		collection: "blog-posts",
		depth: 0,
		draft: options.draft,
		fallbackLocale: false,
		limit: 1,
		locale: options.locale,
		overrideAccess: false,
		pagination: false,
		req,
		select: options.select,
		user: req.user,
		where: {
			slug: {
				equals: slug,
			},
		},
	});

	return (result.docs[0] as BlogPost | undefined) ?? null;
}

export async function updateBlogPostBody(
	req: PayloadRequest,
	blogPost: BlogPost,
	body: BlogPost["body"],
	options: {
		draft: boolean;
		locale: "en-US" | "ja-JP";
	},
): Promise<BlogPost> {
	const status =
		options.draft || blogPost._status !== "published" ? "draft" : "published";

	return (await req.payload.update({
		id: blogPost.id,
		collection: "blog-posts",
		data: {
			body,
			_status: status,
		},
		depth: 0,
		draft: options.draft,
		fallbackLocale: false,
		locale: options.locale,
		overrideAccess: false,
		overrideLock: false,
		req,
		select: bodyMutationSelect,
		user: req.user,
	})) as BlogPost;
}

export function getChildrenAtLocation(
	body: BlogPost["body"],
	location: number[],
): unknown[] {
	let children: unknown[] = body.root.children;

	for (const index of location) {
		if (index < 0) {
			throw new Error("Only the final append location index may be -1.");
		}

		const node = children[index];

		if (!isRecord(node)) {
			throw new Error(
				`No Lexical node exists at location ${formatLocation(location)}.`,
			);
		}

		if (!Array.isArray(node.children)) {
			throw new Error(
				`Lexical node at index ${index} does not have a children array.`,
			);
		}

		children = node.children;
	}

	return children;
}

export function cloneBlogPostBody(
	body: BlogPost["body"] | null | undefined,
): BlogPost["body"] {
	if (!body) {
		throw new Error("Blog post body is empty.");
	}

	return structuredClone(body);
}

export function formatLocation(location: number[]): string {
	return `[${location.join(", ")}]`;
}

export async function validateRichTextReferences(
	req: PayloadRequest,
	body: BlogPost["body"],
): Promise<void> {
	const uploadIds = new Set<string>();

	collectUploadIds(body.root.children, uploadIds);

	await Promise.all(
		Array.from(uploadIds).map(async (mediaId) => {
			await req.payload.findByID({
				id: mediaId,
				collection: "media",
				depth: 0,
				overrideAccess: false,
				req,
				select: {
					id: true,
				},
				user: req.user,
			});
		}),
	);
}

function collectUploadIds(nodes: unknown[], uploadIds: Set<string>): void {
	for (const node of nodes) {
		if (!isRecord(node)) {
			continue;
		}

		if (node.type === "upload") {
			if (node.relationTo !== "media" || typeof node.value !== "string") {
				throw new Error(
					"Blog post body upload nodes must use relationTo='media' and an existing media ID as value.",
				);
			}

			uploadIds.add(node.value);
		}

		if (Array.isArray(node.children)) {
			collectUploadIds(node.children, uploadIds);
		}
	}
}
