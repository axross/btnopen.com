import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
	schema: "https://gql.hashnode.com",
	documents: "src/**/*.ts?(x)",
	generates: {
		"./src/services/graphql/generated/": {
			preset: "client",
			config: {
				documentMode: "string",
			},
		},
		"./src/services/graphql/schema.graphql": {
			plugins: ["schema-ast"],
			config: {
				includeDirectives: true,
			},
		},
	},
};

export default config;
