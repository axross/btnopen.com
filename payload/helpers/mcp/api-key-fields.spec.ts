import { describe, expect, it } from "@jest/globals";
import type { Field } from "payload";
import {
	configureMcpApiKeyField,
	disableCustomToolDefault,
	makeMcpApiKeyUserOptional,
} from "./api-key-fields";

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

describe("makeMcpApiKeyUserOptional()", () => {
	it("makes the generated user relationship nullable", () => {
		const field = {
			name: "user",
			type: "relationship",
			relationTo: "users",
			required: true,
		} as unknown as Field;

		const nextField = makeMcpApiKeyUserOptional(field) as {
			relationTo: string;
			required: boolean;
		};

		expect(nextField.required).toBe(false);
		expect(nextField.relationTo).toBe("users");
		expect(nextField).not.toBe(field);
	});

	it("preserves unrelated required fields", () => {
		const field = {
			name: "label",
			type: "text",
			required: true,
		} as unknown as Field;

		const nextField = makeMcpApiKeyUserOptional(field) as {
			required: boolean;
		};

		expect(nextField.required).toBe(true);
		expect(nextField).toBe(field);
	});
});

describe("configureMcpApiKeyField()", () => {
	it("applies both MCP API key field overrides", () => {
		const field = {
			name: "payload-mcp-tool",
			type: "group",
			fields: [
				{
					name: "appendNodeInBlogPostBody",
					type: "checkbox",
					defaultValue: true,
				},
			],
		} as unknown as Field;

		const nextField = configureMcpApiKeyField(field) as {
			fields: Array<{ defaultValue: boolean; name: string }>;
		};

		expect(nextField.fields[0]?.defaultValue).toBe(false);
	});
});
