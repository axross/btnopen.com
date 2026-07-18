import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog_posts\` RENAME COLUMN "comments_enabled" TO "is_comments_enabled";`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` RENAME COLUMN "version_comments_enabled" TO "version_is_comments_enabled";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog_posts\` RENAME COLUMN "is_comments_enabled" TO "comments_enabled";`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` RENAME COLUMN "version_is_comments_enabled" TO "version_comments_enabled";`)
}
