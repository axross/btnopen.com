import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog_posts\` ADD \`summary\` text;`)
  await db.run(sql`ALTER TABLE \`blog_posts\` ADD \`agentic_status\` text;`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` ADD \`version_summary\` text;`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` ADD \`version_agentic_status\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog_posts\` DROP COLUMN \`summary\`;`)
  await db.run(sql`ALTER TABLE \`blog_posts\` DROP COLUMN \`agentic_status\`;`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` DROP COLUMN \`version_summary\`;`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` DROP COLUMN \`version_agentic_status\`;`)
}
