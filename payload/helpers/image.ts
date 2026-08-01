import type { ImageSize, ImageUploadFormatOptions } from "payload";
import { vercelBlobToken } from "./runtime";

export function getStaticDir(collection: string) {
	if (vercelBlobToken) {
		return collection;
	}

	return `.data/${collection}`;
}

export const webpFormatOptions: ImageUploadFormatOptions = {
	format: "webp",
	options: {
		quality: 90,
		smartSubsample: true,
		smartDeblock: true,
		effort: 4,
	},
};

export function createPngImageSize({
	name,
	width,
	height,
}: (
	| {
			name?: never;
			width: number;
	  }
	| {
			name: string;
			width?: number;
	  }
) & { height?: number }): ImageSize {
	return {
		name: typeof name === "string" ? name : `${width}w`,
		width,
		height,
		fit: "cover",
		position: "center",
		// if the image is smaller than the image size, return the original image
		withoutEnlargement: true,
		formatOptions: {
			format: "png",
			options: {
				quality: 100,
				smartSubsample: true,
				smartDeblock: true,
				effort: 4,
			},
		},
		generateImageName: ({ originalName, sizeName, extension }) =>
			`${originalName}-${sizeName}.${extension}`,
	};
}
