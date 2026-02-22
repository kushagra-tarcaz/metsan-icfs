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
  const authResponse = ensureBasicAuth(request, env as Record<string, unknown>);
  if (authResponse) return authResponse;

  const db = (env as { DB?: D1Database }).DB;
  const config = await getConfig(db);
  return json(config);
};

export const onRequestPut: PagesFunction = async ({ request, env }) => {
  const authResponse = ensureBasicAuth(request, env as Record<string, unknown>);
  if (authResponse) return authResponse;

  let payload: {
    group?: string;
    nominal?: number;
    net?: number;
  };

  try {
    payload = await request.clone().json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const groupKey = (payload.group ?? "").toString().trim();
  const nominal = Number(payload.nominal);
  const net = Number(payload.net);

  if (!groupKey || Number.isNaN(nominal) || Number.isNaN(net)) {
    return json(
      { error: "group, nominal and net fields are required." },
      400
    );
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    const result = await db
      .prepare(
        `INSERT INTO cartridges (group_key, nominal, net)
         VALUES (?, ?, ?)
         ON CONFLICT(group_key, nominal) DO UPDATE SET
           net = excluded.net`
      )
      .bind(groupKey, nominal, net)
      .run();

    if (!result.success) {
      return json({ error: "Unable to update cartridge." }, 400);
    }

    const config = await fetchConfigFromDb(db);
    return json({ ok: true, config });
  } catch (error) {
    console.error("Failed to update cartridge", error);
    return json({ error: "Unable to update cartridge." }, 400);
  }
};

export const onRequestDelete: PagesFunction = async ({ request, env }) => {
  const authResponse = ensureBasicAuth(request, env as Record<string, unknown>);
  if (authResponse) return authResponse;

  let payload: {
    group?: string;
    nominal?: number;
  };

  try {
    payload = await request.clone().json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const groupKey = (payload.group ?? "").toString().trim();
  const nominal = Number(payload.nominal);

  if (!groupKey || Number.isNaN(nominal)) {
    return json({ error: "group and nominal fields are required." }, 400);
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    const result = await db
      .prepare(`DELETE FROM cartridges WHERE group_key = ? AND nominal = ?`)
      .bind(groupKey, nominal)
      .run();

    if (!result.success || result.changes === 0) {
      return json(
        { error: `Cartridge ${nominal} ml for group ${groupKey} not found.` },
        404
      );
    }

    const config = await fetchConfigFromDb(db);
    return json({ ok: true, config });
  } catch (error) {
    console.error("Failed to delete cartridge", error);
    return json({ error: "Unable to delete cartridge." }, 400);
  }
};
