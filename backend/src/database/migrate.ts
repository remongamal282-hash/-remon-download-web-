import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool, closePool } from './pool';

async function migrate(): Promise<void> {
  const migrationsDirectory = path.join(__dirname, 'migrations');
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();

  const client = await pool.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');

    for (const name of migrationFiles) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
      if (applied.rowCount) continue;

      const sql = await readFile(path.join(migrationsDirectory, name), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
        console.log(`Applied migration ${name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${name} failed`, { cause: error });
      }
    }
  } finally {
    client.release();
    await closePool();
  }
}

migrate().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});