/// <reference types="node" />

import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const db_name = process.env.DATABASE_NAME!;
const db_user = process.env.DATABASE_USER!;
const db_password = process.env.DATABASE_PASSWORD!;
const db_host = process.env.DATABASE_HOST!;

const db_url = `postgres://${db_user}:${db_password}@${db_host}:5432/${db_name}`;

export default defineConfig({
  out: './drizzle',
  schema: './src/lib/server/schema',
  dialect: 'postgresql',
  // Only manage the app's own schema — leave pg_cron's `cron` schema (and anything else
  // outside our tables) alone. Without this, `db:push` diffs the whole database and will
  // offer to drop the cron extension's schema/jobs since they aren't declared here.
  schemaFilter: ['public'],
  dbCredentials: {
    url: db_url,
  },
});