/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n\t\t\tquery GetPostsInPublication(\n\t\t\t\t$host: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tposts(first: 50) {\n\t\t\t\t\t\tedges {\n\t\t\t\t\t\t\tnode {\n\t\t\t\t\t\t\t  id\n\t\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\t\ttitle\n\t\t\t\t\t\t\t\tbrief\n\t\t\t\t\t\t\t\tauthor {\n\t\t\t\t\t\t\t\t\tusername\n\t\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\ttags {\n\t\t\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\t\ttagline\n\t\t\t\t\t\t\t\t\tlogo\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tcoverImage {\n\t\t\t\t\t\t\t\t\turl\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tseo {\n\t\t\t\t\t\t\t\t\tdescription\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tpublishedAt\n\t\t\t\t\t\t\t\tupdatedAt\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\tpageInfo {\n\t\t\t\t\t\t\tendCursor\n\t\t\t\t\t\t\thasNextPage\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t": typeof types.GetPostsInPublicationDocument,
    "\n\t\t\tquery GetPublication(\n\t\t\t\t$host: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t  id\n\t\t\t\t\ttitle\n\t\t\t\t\turl\n\t\t\t\t\tabout {\n\t\t\t\t\t\tmarkdown\n\t\t\t\t\t}\n\t\t\t\t\tdescriptionSEO\n\t\t\t\t\tauthor {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\tsocialMediaLinks {\n\t\t\t\t\t\t\twebsite\n\t\t\t\t\t\t\tgithub\n\t\t\t\t\t\t}\n\t\t\t\t\t\tlocation\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t": typeof types.GetPublicationDocument,
    "\n\t\t\tquery GetPostContentInPublication(\n\t\t\t\t$host: String!\n\t\t\t\t$slug: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tpost(slug: $slug) {\n\t\t\t\t\t  id\n\t\t\t\t\t\tcontent {\n\t\t\t\t\t\t\tmarkdown\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t": typeof types.GetPostContentInPublicationDocument,
    "\n\t\t\tquery GetPostInPublication(\n\t\t\t\t$host: String!\n\t\t\t\t$slug: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tpost(slug: $slug) {\n\t\t\t\t\t  id\n\t\t\t\t\t\tslug\n\t\t\t\t\t\ttitle\n\t\t\t\t\t\tbrief\n\t\t\t\t\t\tauthor {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\t\tsocialMediaLinks {\n\t\t\t\t\t\t\t\twebsite\n\t\t\t\t\t\t\t\tgithub\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tlocation\n\t\t\t\t\t\t}\n\t\t\t\t\t\ttags {\n\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttagline\n\t\t\t\t\t\t\tlogo\n\t\t\t\t\t\t}\n\t\t\t\t\t\tcoverImage {\n\t\t\t\t\t\t\turl\n\t\t\t\t\t\t}\n\t\t\t\t\t\tbannerImage {\n\t\t\t\t\t\t\turl\n\t\t\t\t\t\t}\n\t\t\t\t\t\tseo {\n\t\t\t\t\t\t\tdescription\n\t\t\t\t\t\t}\n\t\t\t\t\t\tpublishedAt\n\t\t\t\t\t\tupdatedAt\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t": typeof types.GetPostInPublicationDocument,
};
const documents: Documents = {
    "\n\t\t\tquery GetPostsInPublication(\n\t\t\t\t$host: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tposts(first: 50) {\n\t\t\t\t\t\tedges {\n\t\t\t\t\t\t\tnode {\n\t\t\t\t\t\t\t  id\n\t\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\t\ttitle\n\t\t\t\t\t\t\t\tbrief\n\t\t\t\t\t\t\t\tauthor {\n\t\t\t\t\t\t\t\t\tusername\n\t\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\ttags {\n\t\t\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\t\ttagline\n\t\t\t\t\t\t\t\t\tlogo\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tcoverImage {\n\t\t\t\t\t\t\t\t\turl\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tseo {\n\t\t\t\t\t\t\t\t\tdescription\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tpublishedAt\n\t\t\t\t\t\t\t\tupdatedAt\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\tpageInfo {\n\t\t\t\t\t\t\tendCursor\n\t\t\t\t\t\t\thasNextPage\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t": types.GetPostsInPublicationDocument,
    "\n\t\t\tquery GetPublication(\n\t\t\t\t$host: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t  id\n\t\t\t\t\ttitle\n\t\t\t\t\turl\n\t\t\t\t\tabout {\n\t\t\t\t\t\tmarkdown\n\t\t\t\t\t}\n\t\t\t\t\tdescriptionSEO\n\t\t\t\t\tauthor {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\tsocialMediaLinks {\n\t\t\t\t\t\t\twebsite\n\t\t\t\t\t\t\tgithub\n\t\t\t\t\t\t}\n\t\t\t\t\t\tlocation\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t": types.GetPublicationDocument,
    "\n\t\t\tquery GetPostContentInPublication(\n\t\t\t\t$host: String!\n\t\t\t\t$slug: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tpost(slug: $slug) {\n\t\t\t\t\t  id\n\t\t\t\t\t\tcontent {\n\t\t\t\t\t\t\tmarkdown\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t": types.GetPostContentInPublicationDocument,
    "\n\t\t\tquery GetPostInPublication(\n\t\t\t\t$host: String!\n\t\t\t\t$slug: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tpost(slug: $slug) {\n\t\t\t\t\t  id\n\t\t\t\t\t\tslug\n\t\t\t\t\t\ttitle\n\t\t\t\t\t\tbrief\n\t\t\t\t\t\tauthor {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\t\tsocialMediaLinks {\n\t\t\t\t\t\t\t\twebsite\n\t\t\t\t\t\t\t\tgithub\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tlocation\n\t\t\t\t\t\t}\n\t\t\t\t\t\ttags {\n\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttagline\n\t\t\t\t\t\t\tlogo\n\t\t\t\t\t\t}\n\t\t\t\t\t\tcoverImage {\n\t\t\t\t\t\t\turl\n\t\t\t\t\t\t}\n\t\t\t\t\t\tbannerImage {\n\t\t\t\t\t\t\turl\n\t\t\t\t\t\t}\n\t\t\t\t\t\tseo {\n\t\t\t\t\t\t\tdescription\n\t\t\t\t\t\t}\n\t\t\t\t\t\tpublishedAt\n\t\t\t\t\t\tupdatedAt\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t": types.GetPostInPublicationDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n\t\t\tquery GetPostsInPublication(\n\t\t\t\t$host: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tposts(first: 50) {\n\t\t\t\t\t\tedges {\n\t\t\t\t\t\t\tnode {\n\t\t\t\t\t\t\t  id\n\t\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\t\ttitle\n\t\t\t\t\t\t\t\tbrief\n\t\t\t\t\t\t\t\tauthor {\n\t\t\t\t\t\t\t\t\tusername\n\t\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\ttags {\n\t\t\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\t\ttagline\n\t\t\t\t\t\t\t\t\tlogo\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tcoverImage {\n\t\t\t\t\t\t\t\t\turl\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tseo {\n\t\t\t\t\t\t\t\t\tdescription\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tpublishedAt\n\t\t\t\t\t\t\t\tupdatedAt\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\tpageInfo {\n\t\t\t\t\t\t\tendCursor\n\t\t\t\t\t\t\thasNextPage\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t"): (typeof documents)["\n\t\t\tquery GetPostsInPublication(\n\t\t\t\t$host: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tposts(first: 50) {\n\t\t\t\t\t\tedges {\n\t\t\t\t\t\t\tnode {\n\t\t\t\t\t\t\t  id\n\t\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\t\ttitle\n\t\t\t\t\t\t\t\tbrief\n\t\t\t\t\t\t\t\tauthor {\n\t\t\t\t\t\t\t\t\tusername\n\t\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\ttags {\n\t\t\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\t\t\ttagline\n\t\t\t\t\t\t\t\t\tlogo\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tcoverImage {\n\t\t\t\t\t\t\t\t\turl\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tseo {\n\t\t\t\t\t\t\t\t\tdescription\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tpublishedAt\n\t\t\t\t\t\t\t\tupdatedAt\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\tpageInfo {\n\t\t\t\t\t\t\tendCursor\n\t\t\t\t\t\t\thasNextPage\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n\t\t\tquery GetPublication(\n\t\t\t\t$host: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t  id\n\t\t\t\t\ttitle\n\t\t\t\t\turl\n\t\t\t\t\tabout {\n\t\t\t\t\t\tmarkdown\n\t\t\t\t\t}\n\t\t\t\t\tdescriptionSEO\n\t\t\t\t\tauthor {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\tsocialMediaLinks {\n\t\t\t\t\t\t\twebsite\n\t\t\t\t\t\t\tgithub\n\t\t\t\t\t\t}\n\t\t\t\t\t\tlocation\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t"): (typeof documents)["\n\t\t\tquery GetPublication(\n\t\t\t\t$host: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t  id\n\t\t\t\t\ttitle\n\t\t\t\t\turl\n\t\t\t\t\tabout {\n\t\t\t\t\t\tmarkdown\n\t\t\t\t\t}\n\t\t\t\t\tdescriptionSEO\n\t\t\t\t\tauthor {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\tsocialMediaLinks {\n\t\t\t\t\t\t\twebsite\n\t\t\t\t\t\t\tgithub\n\t\t\t\t\t\t}\n\t\t\t\t\t\tlocation\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n\t\t\tquery GetPostContentInPublication(\n\t\t\t\t$host: String!\n\t\t\t\t$slug: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tpost(slug: $slug) {\n\t\t\t\t\t  id\n\t\t\t\t\t\tcontent {\n\t\t\t\t\t\t\tmarkdown\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t"): (typeof documents)["\n\t\t\tquery GetPostContentInPublication(\n\t\t\t\t$host: String!\n\t\t\t\t$slug: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tpost(slug: $slug) {\n\t\t\t\t\t  id\n\t\t\t\t\t\tcontent {\n\t\t\t\t\t\t\tmarkdown\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n\t\t\tquery GetPostInPublication(\n\t\t\t\t$host: String!\n\t\t\t\t$slug: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tpost(slug: $slug) {\n\t\t\t\t\t  id\n\t\t\t\t\t\tslug\n\t\t\t\t\t\ttitle\n\t\t\t\t\t\tbrief\n\t\t\t\t\t\tauthor {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\t\tsocialMediaLinks {\n\t\t\t\t\t\t\t\twebsite\n\t\t\t\t\t\t\t\tgithub\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tlocation\n\t\t\t\t\t\t}\n\t\t\t\t\t\ttags {\n\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttagline\n\t\t\t\t\t\t\tlogo\n\t\t\t\t\t\t}\n\t\t\t\t\t\tcoverImage {\n\t\t\t\t\t\t\turl\n\t\t\t\t\t\t}\n\t\t\t\t\t\tbannerImage {\n\t\t\t\t\t\t\turl\n\t\t\t\t\t\t}\n\t\t\t\t\t\tseo {\n\t\t\t\t\t\t\tdescription\n\t\t\t\t\t\t}\n\t\t\t\t\t\tpublishedAt\n\t\t\t\t\t\tupdatedAt\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t"): (typeof documents)["\n\t\t\tquery GetPostInPublication(\n\t\t\t\t$host: String!\n\t\t\t\t$slug: String!\n\t\t\t) {\n\t\t\t\tpublication(host: $host) {\n\t\t\t\t\tpost(slug: $slug) {\n\t\t\t\t\t  id\n\t\t\t\t\t\tslug\n\t\t\t\t\t\ttitle\n\t\t\t\t\t\tbrief\n\t\t\t\t\t\tauthor {\n\t\t\t\t\t\t\tid\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\tprofilePicture\n\t\t\t\t\t\t\tsocialMediaLinks {\n\t\t\t\t\t\t\t\twebsite\n\t\t\t\t\t\t\t\tgithub\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tlocation\n\t\t\t\t\t\t}\n\t\t\t\t\t\ttags {\n\t\t\t\t\t\t\tslug\n\t\t\t\t\t\t\tname\n\t\t\t\t\t\t\ttagline\n\t\t\t\t\t\t\tlogo\n\t\t\t\t\t\t}\n\t\t\t\t\t\tcoverImage {\n\t\t\t\t\t\t\turl\n\t\t\t\t\t\t}\n\t\t\t\t\t\tbannerImage {\n\t\t\t\t\t\t\turl\n\t\t\t\t\t\t}\n\t\t\t\t\t\tseo {\n\t\t\t\t\t\t\tdescription\n\t\t\t\t\t\t}\n\t\t\t\t\t\tpublishedAt\n\t\t\t\t\t\tupdatedAt\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}  \n\t\t"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;