import type { FormattedExecutionResult } from "graphql";
import type { TypedDocumentString } from "./graphql/generated/graphql";

interface HashnodeGraphQlErrorExtensions {
	field: string;
	context: unknown[];
	code: string;
}

export async function execute<Result, Variables>(
	query: TypedDocumentString<Result, Variables>,
	...[variables]: Variables extends Record<string, never> ? [] : [Variables]
): Promise<FormattedExecutionResult<Result, HashnodeGraphQlErrorExtensions>> {
	const response = await fetch("https://gql.hashnode.com", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			accept: "application/graphql-response+json",
		},
		body: JSON.stringify({ query, variables }),
	});

	return await response.json();
}

// biome-ignore lint/performance/noBarrelFile: generated file; cannot change the structure to avoid barrel file
export { graphql } from "./graphql/generated";
