import { describe, expect, it } from "@jest/globals";
import type { Field } from "payload";
import { disableCustomToolDefault } from "./api-key-fields";

describe("disableCustomToolDefault()", () => {
	it("disables child defaults when the field is a payload-mcp-tool group", () => {
		const field = {
			name: "payload-mcp-tool",
			type: "group",
			fields: [
				{ name: "find", type: "checkbox", defaultValue: true },
				{ name: "create", type: "checkbox", defaultValue: true },
			],
		} as unknown as Field;

		const nextField = disableCustomToolDefault(field) as {
			fields: Array<{ defaultValue: boolean; name: string }>;
		};

		expect(
			nextField.fields.map((childField) => [
				childField.name,
				childField.defaultValue,
			]),
		).toEqual([
			["find", false],
			["create", false],
		]);
	});

	it("disables child defaults when a payload-mcp-tool group is nested", () => {
		const field = {
			name: "wrapper",
			type: "group",
			fields: [
				{
					name: "payload-mcp-tool",
					type: "group",
					fields: [{ name: "update", type: "checkbox", defaultValue: true }],
				},
			],
		} as unknown as Field;

		const nextField = disableCustomToolDefault(field) as {
			fields: Array<{
				fields: Array<{ defaultValue: boolean; name: string }>;
				name: string;
			}>;
		};

		expect(nextField.fields[0]?.fields[0]?.defaultValue).toBe(false);
	});

	it("preserves defaults and avoids mutating input when the field is unrelated", () => {
		const field = {
			name: "unrelated",
			type: "group",
			fields: [{ name: "enabled", type: "checkbox", defaultValue: true }],
		} as unknown as Field;

		const nextField = disableCustomToolDefault(field) as {
			fields: Array<{ defaultValue: boolean; name: string }>;
		};

		expect(nextField.fields[0]?.defaultValue).toBe(true);
		expect(nextField).not.toBe(field);
	});
});
