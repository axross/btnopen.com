import { HttpLink } from "@apollo/client";
import {
	ApolloClient,
	InMemoryCache,
	registerApolloClient,
} from "@apollo/client-integration-nextjs";

const hashnodeGraphqlEndpoint = "https://gql.hashnode.com";

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
	return new ApolloClient({
		cache: new InMemoryCache(),
		link: new HttpLink({
			uri: hashnodeGraphqlEndpoint,
			fetchOptions: {
				// you can pass additional options that should be passed to `fetch` here,
				// e.g. Next.js-related `fetch` options regarding caching and revalidation
				// see https://nextjs.org/docs/app/api-reference/functions/fetch#fetchurl-options
			},
		}),
	});
});

// interface HashnodeGraphQlErrorExtensions {
// 	field: string;
// 	context: unknown[];
// 	code: string;
// }

// export async function execute<Result, Variables>(
// 	query: TypedDocumentString<Result, Variables>,
// 	...[variables]: Variables extends Record<string, never> ? [] : [Variables]
// ): Promise<FormattedExecutionResult<Result, HashnodeGraphQlErrorExtensions>> {
// 	const response = await fetch("https://gql.hashnode.com", {
// 		method: "POST",
// 		headers: {
// 			"content-type": "application/json",
// 			accept: "application/graphql-response+json",
// 		},
// 		body: JSON.stringify({ query, variables }),
// 	});

// 	return await response.json();
// }

// biome-ignore lint/performance/noBarrelFile: generated file; cannot change the structure to avoid barrel file
export { gql } from "./graphql/generated";
