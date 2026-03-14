import {
	convertLexicalToMarkdown,
	editorConfigFactory,
} from "@payloadcms/richtext-lexical";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import type { FieldHook, RichTextField, TypeWithID } from "payload";

export function createMarkdownBeforeChangeHook(
	destination: string,
): FieldHook<TypeWithID, null, { [key: string]: unknown }> {
	return ({ siblingData }) => {
		siblingData[destination] = null;

		return null;
	};
}

export function createMarkdownAfterReadHook(
	source: string,
): FieldHook<TypeWithID, string, { [key: string]: SerializedEditorState }> {
	return ({ siblingData, siblingFields }) => {
		const data = siblingData[source];

		if (!data) {
			return "";
		}

		const field = siblingFields.find(
			(f) => f.type === "richText" && f.name === source,
		) as RichTextField;
		const markdown = convertLexicalToMarkdown({
			data,
			editorConfig: editorConfigFactory.fromField({ field }),
		});

		return markdown;
	};
}
