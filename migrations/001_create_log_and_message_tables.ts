import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('message')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('date', 'timestamptz', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('log')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('text', 'text', (col) => col.notNull())
    .addColumn('date', 'timestamptz', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('log').execute();
  await db.schema.dropTable('message').execute();
}
