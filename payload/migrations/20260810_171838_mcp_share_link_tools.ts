import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`payload_mcp_tool_get_blog_post_share_link\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` ADD \`payload_mcp_tool_rotate_blog_post_share_link\` integer DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`payload_mcp_tool_get_blog_post_share_link\`;`)
  await db.run(sql`ALTER TABLE \`payload_mcp_api_keys\` DROP COLUMN \`payload_mcp_tool_rotate_blog_post_share_link\`;`)
}
