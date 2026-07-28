import { drizzle } from 'drizzle-orm/node-postgres';

const db_name = process.env.DATABASE_NAME!;
const db_user = process.env.DATABASE_USER!;
const db_password = process.env.DATABASE_PASSWORD!;
const db_host = process.env.DATABASE_HOST!;

const db_url = `postgres://${db_user}:${db_password}@${db_host}:5432/${db_name}`;
export const db = drizzle(db_url);