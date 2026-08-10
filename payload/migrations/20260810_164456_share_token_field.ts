import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'
import { createShareToken } from '../helpers/share-token'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog_posts\` ADD \`share_token\` text;`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` ADD \`version_share_token\` text;`)

  // backfill so every post that predates the column has a usable share link at
  // once, rather than waiting for its next write to heal it through the
  // collection's beforeChange hook. The values are minted in TypeScript with
  // the same CSPRNG helper the hook uses — SQLite has no random-bytes function
  // worth trusting for a bearer credential.
  //
  // one token per post, written to the post row and to every version row it
  // owns: the draft gate reads the latest version, while the published row is
  // what a collection read returns, so a per-row token would leave those two
  // answers disagreeing and the link would work for neither reliably.
  //
  // the column stays nullable. Nothing here is destructive, so the
  // expand-then-contract split does not apply.
  const { rows } = await db.run(sql`SELECT \`id\` FROM \`blog_posts\`;`)

  for (const row of rows) {
    const id = Number(row.id)
    const shareToken = createShareToken()

    await db.run(
      sql`UPDATE \`blog_posts\` SET \`share_token\` = ${shareToken} WHERE \`id\` = ${id};`,
    )
    await db.run(
      sql`UPDATE \`_blog_posts_v\` SET \`version_share_token\` = ${shareToken} WHERE \`parent_id\` = ${id};`,
    )
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog_posts\` DROP COLUMN \`share_token\`;`)
  await db.run(sql`ALTER TABLE \`_blog_posts_v\` DROP COLUMN \`version_share_token\`;`)
}
