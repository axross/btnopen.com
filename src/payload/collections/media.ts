import type { CollectionConfig } from "payload";
import { v7 as uuidV7 } from "uuid";
import { getStaticDir } from "@/payload/helpers/image";

export const mediaCollection: CollectionConfig = {
	slug: "media",
	upload: {
		staticDir: getStaticDir("media"),
	},
	fields: [],
	hooks: {
		beforeOperation: [
			({ req, operation }) => {
				if ((operation === "create" || operation === "update") && req.file) {
					const parts = req.file.name.split(".");
					const extention = parts.at(-1);

					req.file.name = `${uuidV7()}.${extention}`;
				}
			},
		],
	},
};
