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
  return json(config.theme);
};

export const onRequestPut: PagesFunction = async ({ request, env }) => {
  const auth = ensureBasicAuth(request, env as Record<string, unknown>);
  if (auth) return auth;

  let payload: Record<string, unknown>;
  try {
    payload = await request.clone().json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const updates = ["brandColor", "pageBackground", "cardBackground"].reduce(
    (acc, key) => {
      const value = payload[key];
      if (typeof value === "string" && value.trim()) {
        acc[key] = value.trim();
      }
      return acc;
    },
    {} as Record<string, string>
  );

  if (!Object.keys(updates).length) {
    return json({ error: "At least one theme value is required." }, 400);
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    for (const [key, value] of Object.entries(updates)) {
      await db
        .prepare(
          `INSERT INTO theme_settings (key, value)
           VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`
        )
        .bind(key, value)
        .run();
    }

    const config = await fetchConfigFromDb(db);
    return json({ ok: true, config });
  } catch (error) {
    console.error("Failed to update theme settings", error);
    return json({ error: "Unable to update theme settings." }, 400);
  }
};
