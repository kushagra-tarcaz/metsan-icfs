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
  return json(config.usageFactors);
};

export const onRequestPut: PagesFunction = async ({ request, env }) => {
  const auth = ensureBasicAuth(request, env as Record<string, unknown>);
  if (auth) return auth;

  let payload: {
    code?: string;
    labelTr?: string;
    labelEn?: string;
    percentage?: number;
    sortOrder?: number;
    isDefault?: boolean;
  };

  try {
    payload = await request.clone().json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const code = payload.code?.trim();
  if (!code) {
    return json({ error: "code is required." }, 400);
  }

  const labelTr = payload.labelTr?.trim();
  const labelEn = payload.labelEn?.trim();
  const percentage =
    typeof payload.percentage === "number"
      ? payload.percentage
      : Number(payload.percentage);
  const sortOrder =
    typeof payload.sortOrder === "number"
      ? payload.sortOrder
      : payload.sortOrder != null
      ? Number(payload.sortOrder)
      : undefined;
  const isDefault = payload.isDefault === true;

  if (
    labelTr == null ||
    labelEn == null ||
    Number.isNaN(percentage) ||
    sortOrder == null ||
    Number.isNaN(sortOrder)
  ) {
    return json(
      {
        error:
          "labelTr, labelEn, percentage and sortOrder are required fields.",
      },
      400
    );
  }

  if (percentage <= 0) {
    return json({ error: "percentage must be a positive number." }, 400);
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    await db
      .prepare(
        `INSERT INTO usage_factors (code, label_tr, label_en, percentage, sort_order, is_default)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(code) DO UPDATE SET
           label_tr = excluded.label_tr,
           label_en = excluded.label_en,
           percentage = excluded.percentage,
           sort_order = excluded.sort_order,
           is_default = excluded.is_default`
      )
      .bind(code, labelTr, labelEn, percentage, sortOrder, isDefault ? 1 : 0)
      .run();

    if (isDefault) {
      await db
        .prepare(`UPDATE usage_factors SET is_default = CASE WHEN code = ? THEN 1 ELSE 0 END`)
        .bind(code)
        .run();
    }

    const config = await fetchConfigFromDb(db);
    return json({ ok: true, config });
  } catch (error) {
    console.error("Failed to update usage factor", error);
    return json({ error: "Unable to update usage factor." }, 400);
  }
};
