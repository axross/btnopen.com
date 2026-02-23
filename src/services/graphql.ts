import { ApolloLink, HttpLink } from "@apollo/client";
import {
	CombinedGraphQLErrors,
	CombinedProtocolErrors,
} from "@apollo/client/errors";
import { ErrorLink } from "@apollo/client/link/error";
import {
	ApolloClient,
	InMemoryCache,
	registerApolloClient,
} from "@apollo/client-integration-nextjs";
import { map } from "rxjs";
import { rootLogger } from "@/logger";

const hashnodeGraphqlEndpoint = "https://gql.hashnode.com";

const logger = rootLogger.getChild("gql");

export const { getClient, query, PreloadQuery } = registerApolloClient(
	() =>
		new ApolloClient({
			cache: new InMemoryCache(),
			link: ApolloLink.from([
				new ApolloLink((operation, forward) => {
					logger.debug(
						`Requested a GraphQL operation (name: ${operation.operationName}).`,
					);

					const startedAt = performance.now();

					return forward(operation).pipe(
						map((result) => {
							logger.debug(
								`Received the result for a GraphQL operation (name: ${operation.operationName})}) in ${(performance.now() - startedAt).toFixed(2)} ms.`,
							);

							return result;
						}),
					);
				}),
				new ErrorLink(({ error, operation }) => {
					if (CombinedGraphQLErrors.is(error)) {
						for (const { message, locations, path } of error.errors) {
							logger.error(
								`Failed to perform GraphQL operation ${operation.operationName} due to GraphQL errors. Message: ${message}, Location: ${locations}, Path: ${path}`,
							);
						}

						return;
					}

					if (CombinedProtocolErrors.is(error)) {
						logger.error(
							`Failed to perform GraphQL operation ${operation.operationName} due to protocol errors.`,
						);

						for (const { message, extensions } of error.errors) {
							logger.error(
								`Failed to perform GraphQL operation ${operation.operationName} due to protocol errors. Message: ${message}, Extensions: ${JSON.stringify(
									extensions,
								)}`,
							);
						}

						return;
					}

					logger.error(`[Network error]: ${error}`);
				}),
				new HttpLink({
					uri: hashnodeGraphqlEndpoint,
				}),
			]),
		}),
);

// biome-ignore lint/performance/noBarrelFile: generated file; cannot change the structure to avoid barrel file
export { gql } from "./graphql/generated";
