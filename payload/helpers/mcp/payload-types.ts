import z from "zod";
import {
	PayloadNonEmptyString,
	PayloadUpload,
} from "@/repositories/payload-types";

interface PayloadRichTextNodeValue {
	children?: PayloadRichTextNodeValue[];
	type: string;
	[key: string]: unknown;
}

const PayloadRichTextUploadId = PayloadUpload.shape.id
	.unwrap()
	.describe("Payload media document ID used by a Lexical upload node.");

const PayloadRichTextUploadValueInput = z
	.union([
		PayloadRichTextUploadId,
		z
			.object({
				id: PayloadRichTextUploadId,
			})
			.catchall(z.unknown()),
	])
	.describe(
		"Upload node relation value, either a media ID or a populated media document with an ID.",
	);

const PayloadRichTextUploadValueOutput = PayloadRichTextUploadId.describe(
	"Upload node relation value normalized to a media ID.",
);

const PayloadRichTextChildrenInput: z.ZodType<PayloadRichTextNodeValue[]> =
	z.lazy(() => z.array(PayloadRichTextNodeInput));

const PayloadRichTextChildrenOutput: z.ZodType<PayloadRichTextNodeValue[]> =
	z.lazy(() => z.array(PayloadRichTextNodeOutput));

const PayloadRichTextGenericNodeInput = z
	.object({
		type: PayloadNonEmptyString.describe("Serialized Lexical node type."),
		children: PayloadRichTextChildrenInput.optional().describe(
			"Nested Lexical child nodes.",
		),
	})
	.catchall(z.unknown())
	.superRefine((node, context) => {
		if (node.type === "upload") {
			context.addIssue({
				code: "custom",
				message:
					"Upload nodes must use relationTo='media' and value set to a media ID or populated media document.",
				path: ["type"],
			});
		}
	})
	.describe("Non-upload serialized Lexical node.");

const PayloadRichTextGenericNodeOutput = z
	.object({
		type: PayloadNonEmptyString.describe("Serialized Lexical node type."),
		children: PayloadRichTextChildrenOutput.optional().describe(
			"Nested Lexical child nodes.",
		),
	})
	.catchall(z.unknown())
	.superRefine((node, context) => {
		if (node.type === "upload") {
			context.addIssue({
				code: "custom",
				message:
					"Upload nodes must use relationTo='media' and value set to a media ID.",
				path: ["type"],
			});
		}
	})
	.describe("Canonical non-upload serialized Lexical node.");

const PayloadRichTextUploadNodeInput = z
	.object({
		type: z.literal("upload").describe("Serialized Lexical upload node type."),
		relationTo: z
			.literal("media")
			.describe("Upload nodes in blog post bodies may only reference media."),
		value: PayloadRichTextUploadValueInput,
		children: PayloadRichTextChildrenInput.optional().describe(
			"Nested Lexical child nodes.",
		),
	})
	.catchall(z.unknown())
	.describe("Serialized Lexical upload node input.");

const PayloadRichTextUploadNodeOutput = z
	.object({
		type: z.literal("upload").describe("Serialized Lexical upload node type."),
		relationTo: z
			.literal("media")
			.describe("Upload nodes in blog post bodies may only reference media."),
		value: PayloadRichTextUploadValueOutput,
		children: PayloadRichTextChildrenOutput.optional().describe(
			"Nested Lexical child nodes.",
		),
	})
	.catchall(z.unknown())
	.describe("Canonical serialized Lexical upload node.");

const PayloadRichTextNodeInput: z.ZodType<PayloadRichTextNodeValue> = z.lazy(
	() =>
		z.union([PayloadRichTextUploadNodeInput, PayloadRichTextGenericNodeInput]),
);

const PayloadRichTextNodeOutput: z.ZodType<PayloadRichTextNodeValue> = z.lazy(
	() =>
		z.union([
			PayloadRichTextUploadNodeOutput,
			PayloadRichTextGenericNodeOutput,
		]),
);

const PayloadRichTextRootInput = z
	.object({
		type: z.literal("root").describe("Serialized Lexical root node type."),
		children: PayloadRichTextChildrenInput.describe(
			"Top-level Lexical child nodes.",
		),
		direction: z.enum(["ltr", "rtl"]).nullable().describe("Text direction."),
		format: z
			.enum(["left", "start", "center", "right", "end", "justify", ""])
			.describe("Root text alignment format."),
		indent: z.number().int().nonnegative().describe("Root indentation level."),
		version: z
			.number()
			.int()
			.nonnegative()
			.describe("Serialized node version."),
	})
	.catchall(z.unknown())
	.describe("Serialized Lexical root node input.");

const PayloadRichTextRootOutput = z
	.object({
		type: z.literal("root").describe("Serialized Lexical root node type."),
		children: PayloadRichTextChildrenOutput.describe(
			"Top-level Lexical child nodes.",
		),
		direction: z.enum(["ltr", "rtl"]).nullable().describe("Text direction."),
		format: z
			.enum(["left", "start", "center", "right", "end", "justify", ""])
			.describe("Root text alignment format."),
		indent: z.number().int().nonnegative().describe("Root indentation level."),
		version: z
			.number()
			.int()
			.nonnegative()
			.describe("Serialized node version."),
	})
	.catchall(z.unknown())
	.describe("Canonical serialized Lexical root node.");

const PayloadRichTextEditorStateInput = z
	.object({
		root: PayloadRichTextRootInput,
	})
	.catchall(z.unknown())
	.describe(
		"Payload Lexical editor state input. Upload node values may be media IDs or populated media documents.",
	);

const PayloadRichTextEditorStateOutput = z
	.object({
		root: PayloadRichTextRootOutput,
	})
	.catchall(z.unknown())
	.describe(
		"Canonical Payload Lexical editor state for writing to Payload. Upload node values are media IDs.",
	);

export const PayloadRichTextEditorStateCodec = z
	.codec(PayloadRichTextEditorStateInput, PayloadRichTextEditorStateOutput, {
		decode: (body) =>
			PayloadRichTextEditorStateOutput.parse({
				...body,
				root: normalizePayloadRichTextRoot(body.root),
			}),
		encode: (body) => body as z.infer<typeof PayloadRichTextEditorStateInput>,
	})
	.describe(
		"Codec that accepts safe Payload Lexical read-shapes and decodes them to the canonical write-shape.",
	);

export type PayloadRichTextEditorStateCodec = z.infer<
	typeof PayloadRichTextEditorStateCodec
>;

function normalizePayloadRichTextRoot(
	root: z.infer<typeof PayloadRichTextRootInput>,
): z.infer<typeof PayloadRichTextRootOutput> {
	return {
		...root,
		children: root.children.map(normalizePayloadRichTextNode),
	};
}

function normalizePayloadRichTextNode(
	node: z.infer<typeof PayloadRichTextNodeInput>,
): z.infer<typeof PayloadRichTextNodeOutput> {
	const children =
		node.children === undefined
			? undefined
			: node.children.map(normalizePayloadRichTextNode);

	if (node.type === "upload") {
		const uploadNode = node as z.infer<typeof PayloadRichTextUploadNodeInput>;

		return {
			...uploadNode,
			value: normalizePayloadRichTextUploadValue(uploadNode.value),
			...(children === undefined ? {} : { children }),
		};
	}

	return {
		...node,
		...(children === undefined ? {} : { children }),
	};
}

function normalizePayloadRichTextUploadValue(
	value: z.infer<typeof PayloadRichTextUploadValueInput>,
): z.infer<typeof PayloadRichTextUploadValueOutput> {
	return typeof value === "string" ? value : value.id;
}
