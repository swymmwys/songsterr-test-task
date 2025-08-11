import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Migrator, FileMigrationProvider } from 'kysely';

async function migrate() {
  // 1. Create DB connection
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'mydb',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      }),
    }),
  });

  // 2. Run migrations
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  // 3. Log results
  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✅ Migration "${it.migrationName}" executed`);
    } else if (it.status === 'Error') {
      console.error(`❌ Migration "${it.migrationName}" failed`);
    }
  });

  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  await db.destroy();
}

migrate();
