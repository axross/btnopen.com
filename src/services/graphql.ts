import { HttpLink } from "@apollo/client";
import {
	ApolloClient,
	InMemoryCache,
	registerApolloClient,
} from "@apollo/client-integration-nextjs";

const hashnodeGraphqlEndpoint = "https://gql.hashnode.com";

export const { getClient, query, PreloadQuery } = registerApolloClient(
	() =>
		new ApolloClient({
			cache: new InMemoryCache(),
			link: new HttpLink({
				uri: hashnodeGraphqlEndpoint,
			}),
		}),
);

// biome-ignore lint/performance/noBarrelFile: generated file; cannot change the structure to avoid barrel file
export { gql } from "./graphql/generated";
