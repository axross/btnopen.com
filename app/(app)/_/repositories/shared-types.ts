import z from "zod";

export const User = z.object({
	name: z.string().nonempty(),
	avatarImage: z.object({
		url: z.url(),
		width: z.number(),
		height: z.number(),
	}),
	bioMarkdown: z.string().nonempty(),
});

export type User = z.infer<typeof User>;

export const Image = z.object({
	url: z.url(),
	width: z.number().nonnegative(),
	height: z.number().nonnegative(),
});

export type Image = z.infer<typeof Image>;

export const zDateTime = z.string().brand("DateTime");

export type DateTime = z.infer<typeof zDateTime>;
