import type { Field } from "payload";

type MutableField = Record<string, unknown> & {
	defaultValue?: unknown;
	fields?: MutableField[];
	name?: string;
	required?: boolean;
	type?: string;
};

export function configureMcpApiKeyField(field: Field): Field {
	return makeMcpApiKeyUserOptional(disableCustomToolDefault(field));
}

/**
 * flips every `payload-mcp-tool` child's `defaultValue` to `false`, so a newly
 * created key grants no custom tools until each is enabled deliberately. The
 * plugin defaults them on, which would make a key broader than whoever created
 * it intended.
 */
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

/**
 * drops the plugin's `required` flag from the API key's `user` relationship, so
 * a key can be created before the account it will act as exists.
 *
 * The consequence is load-bearing and easy to miss: a key saved without a user
 * authenticates with `req.user` undefined, and every collection's `access` rule
 * then sees an unauthenticated request. That is why the rules under
 * `payload/collections/` gate writes on `Boolean(req.user)` rather than assuming
 * an MCP request carries an identity.
 */
export function makeMcpApiKeyUserOptional(field: Field): Field {
	const mutableField = field as MutableField;

	if (mutableField.name !== "user") {
		return field;
	}

	return {
		...mutableField,
		required: false,
	} as Field;
}
