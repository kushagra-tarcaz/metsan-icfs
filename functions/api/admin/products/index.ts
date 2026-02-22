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

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const authResponse = ensureBasicAuth(request, env as Record<string, unknown>);
  if (authResponse) return authResponse;

  let payload: {
    code?: string;
    displayName?: string;
    group?: string;
    etaApproved?: boolean;
  };

  try {
    payload = await request.clone().json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const code = payload.code?.trim();
  const displayName = payload.displayName?.trim();
  const group = payload.group?.trim();
  const etaApproved = payload.etaApproved === true;

  if (!code || !displayName || !group) {
    return json(
      { error: "code, displayName and group are required fields." },
      400
    );
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    await db
      .prepare(
        `INSERT INTO products (code, display_name, group_key, eta_approved)
         VALUES (?, ?, ?, ?)`
      )
      .bind(code, displayName, group, etaApproved ? 1 : 0)
      .run();

    await db
      .prepare(
        `INSERT INTO product_eta (product_code, bar_type, anchor_id, eta_enabled)
         SELECT ?, bar_type, id, 0 FROM anchors WHERE group_key = ?
         ON CONFLICT(product_code, bar_type, anchor_id) DO NOTHING`
      )
      .bind(code, group)
      .run();

    const config = await fetchConfigFromDb(db);
    return json({ ok: true, config }, 201);
  } catch (error) {
    console.error("Failed to create product", error);
    return json(
      {
        error:
          "Unable to create product. Ensure the product code is unique and group exists.",
      },
      400
    );
  }
};
