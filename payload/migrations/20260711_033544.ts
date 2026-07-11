import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog_posts\` ADD \`outline\` text;`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` ADD \`version_outline\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog_posts\` DROP COLUMN \`outline\`;`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` DROP COLUMN \`version_outline\`;`)
}
