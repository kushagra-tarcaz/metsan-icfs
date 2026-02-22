import { fetchConfigFromDb, getConfig } from "../../../data/fetchConfig";
import { ensureBasicAuth } from "../../../utils/auth";
import { requireDb } from "../../../utils/db";

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = ensureBasicAuth(request, env as Record<string, unknown>);
  if (auth) return auth;

  const db = (env as { DB?: D1Database }).DB;
  const config = await getConfig(db);
  return json(config.constants);
};

export const onRequestPut: PagesFunction = async ({ request, env }) => {
  const auth = ensureBasicAuth(request, env as Record<string, unknown>);
  if (auth) return auth;

  let payload: {
    key?: string;
    value?: number;
    description?: string;
  };

  try {
    payload = await request.clone().json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const key = payload.key?.trim();
  const value = typeof payload.value === "number" ? payload.value : Number(payload.value);
  const description = payload.description?.trim();

  if (!key || Number.isNaN(value)) {
    return json({ error: "key and numeric value are required." }, 400);
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    await db
      .prepare(
        `INSERT INTO formula_constants (key, value, description)
         VALUES (?, ?, COALESCE(?, (SELECT description FROM formula_constants WHERE key = ?)))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value,
           description = COALESCE(excluded.description, formula_constants.description)`
      )
      .bind(key, value, description ?? null, key)
      .run();

    const config = await fetchConfigFromDb(db);
    return json({ ok: true, config });
  } catch (error) {
    console.error("Failed to update constant", error);
    return json({ error: "Unable to update constant." }, 400);
  }
};
