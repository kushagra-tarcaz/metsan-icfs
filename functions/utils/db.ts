export function requireDb(env: Record<string, unknown>): D1Database {
  const db = (env as { DB?: D1Database }).DB;
  if (!db) {
    throw new Error("Database binding DB is not configured.");
  }
  return db;
}
