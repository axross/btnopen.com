import {
	BlocksFeature,
	CodeBlock,
	lexicalEditor,
	UploadFeature,
} from "@payloadcms/richtext-lexical";

export const editor = lexicalEditor({
	features: ({ defaultFeatures }) => [
		...defaultFeatures,
		UploadFeature({
			collections: {
				media: {
					fields: [
						{
							name: "caption",
							type: "text",
						},
					],
				},
			},
			enabledCollections: ["media"],
		}),
		BlocksFeature({
			blocks: [
				CodeBlock({
					slug: "code",
					defaultLanguage: "ts",
					languages: {
						plaintext: "Plain Text",
						js: "JavaScript",
						ts: "TypeScript",
						tsx: "TSX",
						jsx: "JSX",
						html: "HTML",
						css: "CSS",
					},
				}),
			],
		}),
	],
});
