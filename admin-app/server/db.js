// db.js — thin Postgres accessor for the admin app.
//
// PROJECT RULE: read from vw_* views, never base tables. Write to base tables directly.
// This module only exposes a query helper; the route layer decides which view to read.

import pg from 'pg';

const { Pool } = pg;

const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  'postgresql://postgres@localhost:5432/causal_autoimmune';

export const pool = new Pool({ connectionString: CONNECTION_STRING });

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

export async function closePool() {
  await pool.end();
}
