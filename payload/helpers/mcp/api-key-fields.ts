import type { Field } from "payload";

type MutableField = Record<string, unknown> & {
	defaultValue?: unknown;
	fields?: MutableField[];
	name?: string;
	type?: string;
};

export function disableCustomToolDefault(field: Field): Field {
	const mutableField = field as MutableField;
	const nextField: MutableField = {
		...mutableField,
	};

	if (Array.isArray(nextField.fields)) {
		nextField.fields = nextField.fields.map((childField) =>
			disableCustomToolDefault(childField as Field),
		) as MutableField[];
	}

	if (
		mutableField.name === "payload-mcp-tool" &&
		Array.isArray(nextField.fields)
	) {
		nextField.fields = nextField.fields.map((childField) => ({
			...childField,
			defaultValue: false,
		}));
	}

	return nextField as Field;
}
