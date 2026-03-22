import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog_posts\` ADD \`published_at_override\` text;`)
  await db.run(sql`CREATE INDEX \`blog_posts_published_at_override_idx\` ON \`blog_posts\` (\`published_at_override\`);`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` ADD \`version_published_at_override\` text;`)
  await db.run(sql`CREATE INDEX \`_blog_posts_v_version_version_published_at_override_idx\` ON \`_blog_posts_v\` (\`version_published_at_override\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`blog_posts_published_at_override_idx\`;`)
  await db.run(sql`ALTER TABLE \`blog_posts\` DROP COLUMN \`published_at_override\`;`)
  await db.run(sql`DROP INDEX \`_blog_posts_v_version_version_published_at_override_idx\`;`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` DROP COLUMN \`version_published_at_override\`;`)
}
