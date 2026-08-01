import type { CollectionBeforeOperationHook } from "payload";

/**
 * builds the `beforeOperation` hook that rewrites an uploaded file's name to
 * `<document id>.<extension>`.
 *
 * the uploaded filename is attacker-controlled, so it never reaches storage:
 * only the extension survives, and the stem becomes the document's own id. Every
 * upload collection shares this one hook so the sanitization has a single
 * definition to audit.
 *
 * @param label - the collection this hook guards, named in the thrown message
 *   so a failure points at the collection it actually fired for.
 * @throws when the incoming document carries no id, which would otherwise store
 *   the caller's filename verbatim.
 */
export function createUploadFilenameHook(
	label: string,
): CollectionBeforeOperationHook {
	return ({ req, operation, args }) => {
		if ((operation === "create" || operation === "update") && req.file) {
			const id = args.data.id;

			if (!id) {
				throw new Error(`No id is set for the ${label}.`);
			}

			const parts = req.file.name.split(".");
			const extension = parts.at(-1);

			req.file.name = `${id}.${extension}`;
		}
	};
}
