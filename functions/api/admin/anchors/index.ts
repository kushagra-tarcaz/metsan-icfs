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

type AnchorPayload = {
  group?: string;
  barType?: string;
  id?: string;
  d0?: number;
  da?: number;
  hef?: number;
  hmin?: number | null;
  hmax?: number | null;
  active?: boolean;
};

const parseOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? NaN : parsed;
};

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = ensureBasicAuth(request, env as Record<string, unknown>);
  if (auth) return auth;

  const db = (env as { DB?: D1Database }).DB;
  const config = await getConfig(db);
  return json(config);
};

export const onRequestPut: PagesFunction = async ({ request, env }) => {
  const auth = ensureBasicAuth(request, env as Record<string, unknown>);
  if (auth) return auth;

  let payload: AnchorPayload;

  try {
    payload = await request.clone().json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const groupKey = payload.group?.trim();
  const barType =
    payload.barType === "threaded"
      ? "threaded"
      : payload.barType === "rebar"
      ? "rebar"
      : null;
  const id = payload.id?.trim();
  const d0 = Number(payload.d0);
  const da = parseOptionalNumber(payload.da);
  const hef = Number(payload.hef);
  const hmin = parseOptionalNumber(payload.hmin);
  const hmax = parseOptionalNumber(payload.hmax);
  const active = payload.active === false ? 0 : 1;

  if (!groupKey || !barType || !id || Number.isNaN(d0) || Number.isNaN(hef)) {
    return json(
      { error: "group, barType, id, d0 and hef are required fields." },
      400
    );
  }

  if (d0 <= 0 || hef <= 0) {
    return json({ error: "d0 and hef must be positive numbers." }, 400);
  }

  if (da != null && Number.isNaN(da)) {
    return json({ error: "da must be numeric when provided." }, 400);
  }

  if (da != null && da <= 0) {
    return json({ error: "da must be a positive number." }, 400);
  }

  if ((hmin != null && Number.isNaN(hmin)) || (hmax != null && Number.isNaN(hmax))) {
    return json({ error: "hmin and hmax must be numeric when provided." }, 400);
  }

  if ((hmin != null && hmin < 0) || (hmax != null && hmax < 0)) {
    return json({ error: "hmin and hmax cannot be negative." }, 400);
  }

  if (hmin != null && hmax != null && hmin > hmax) {
    return json({ error: "hmin must be less than or equal to hmax." }, 400);
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    await db
      .prepare(
        `INSERT INTO anchors (group_key, bar_type, id, d0, da, hef, hmin, hmax, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_key, bar_type, id) DO UPDATE SET
           d0 = excluded.d0,
           da = excluded.da,
           hef = excluded.hef,
           hmin = excluded.hmin,
           hmax = excluded.hmax,
           is_active = excluded.is_active`
      )
      .bind(groupKey, barType, id, d0, da, hef, hmin, hmax, active)
      .run();

    await db
      .prepare(
        `INSERT INTO product_eta (product_code, bar_type, anchor_id, eta_enabled)
         SELECT code, ?, ?, 0 FROM products WHERE group_key = ?
         ON CONFLICT(product_code, bar_type, anchor_id) DO NOTHING`
      )
      .bind(barType, id, groupKey)
      .run();

    const config = await fetchConfigFromDb(db);
    return json({ ok: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to upsert anchor", error);
    return json({ error: "Unable to update anchor.", detail: message }, 400);
  }
};
