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
  return json(config.etaAssignments);
};

export const onRequestPut: PagesFunction = async ({ request, env }) => {
  const auth = ensureBasicAuth(request, env as Record<string, unknown>);
  if (auth) return auth;

  let payload: {
    productCode?: string;
    barType?: string;
    anchorId?: string;
    enabled?: boolean;
  };

  try {
    payload = await request.clone().json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const productCode = payload.productCode?.trim();
  const barType = payload.barType === "rebar" ? "rebar" : payload.barType === "threaded" ? "threaded" : null;
  const anchorId = payload.anchorId?.trim();
  const enabled = payload.enabled === true;

  if (!productCode || !barType || !anchorId) {
    return json({ error: "productCode, barType and anchorId are required." }, 400);
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    await db
      .prepare(
        `INSERT INTO product_eta (product_code, bar_type, anchor_id, eta_enabled)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(product_code, bar_type, anchor_id)
         DO UPDATE SET eta_enabled = excluded.eta_enabled`
      )
      .bind(productCode, barType, anchorId, enabled ? 1 : 0)
      .run();

    const config = await fetchConfigFromDb(db);
    return json({ ok: true, config });
  } catch (error) {
    console.error("Failed to update ETA assignment", error);
    return json({ error: "Unable to update ETA assignment." }, 400);
  }
};
