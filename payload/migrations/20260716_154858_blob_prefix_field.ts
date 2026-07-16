import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`prefix\` text DEFAULT '';`)
  await db.run(sql`ALTER TABLE \`cover_images\` ADD \`prefix\` text DEFAULT '';`)
  await db.run(sql`ALTER TABLE \`avatar_images\` ADD \`prefix\` text DEFAULT '';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`prefix\`;`)
  await db.run(sql`ALTER TABLE \`cover_images\` DROP COLUMN \`prefix\`;`)
  await db.run(sql`ALTER TABLE \`avatar_images\` DROP COLUMN \`prefix\`;`)
}
