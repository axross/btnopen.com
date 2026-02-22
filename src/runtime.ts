export const runtimeType =
	typeof globalThis.window === "undefined" ? "server" : "client";

export const isDevelopment = process.env.NODE_ENV === "development";
