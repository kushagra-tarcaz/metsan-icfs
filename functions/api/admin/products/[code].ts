import { fetchConfigFromDb } from "../../../data/fetchConfig";
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

export const onRequestPut: PagesFunction = async ({
  env,
  request,
  params,
}) => {
  const authResponse = ensureBasicAuth(request, env as Record<string, unknown>);
  if (authResponse) return authResponse;

  const code = (params.code || "").toString().trim();
  if (!code) {
    return json({ error: "Product code is required in the path." }, 400);
  }

  let payload: {
    displayName?: string;
    group?: string;
    etaApproved?: boolean;
  };

  try {
    payload = await request.clone().json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (typeof payload.displayName === "string") {
    const value = payload.displayName.trim();
    if (!value) {
      return json({ error: "displayName cannot be empty." }, 400);
    }
    updates.push("display_name = ?");
    bindings.push(value);
  }

  if (typeof payload.group === "string") {
    const value = payload.group.trim();
    if (!value) {
      return json({ error: "group cannot be empty." }, 400);
    }
    updates.push("group_key = ?");
    bindings.push(value);
  }

  if (typeof payload.etaApproved === "boolean") {
    updates.push("eta_approved = ?");
    bindings.push(payload.etaApproved ? 1 : 0);
  }

  if (updates.length === 0) {
    return json(
      {
        error:
          "At least one of displayName, group, etaApproved must be provided.",
      },
      400
    );
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    const existing = await db
      .prepare(`SELECT group_key FROM products WHERE code = ?`)
      .bind(code)
      .first<{ group_key: string }>();

    if (!existing) {
      return json({ error: `Product ${code} not found.` }, 404);
    }

    const statement = `UPDATE products SET ${updates.join(", ")} WHERE code = ?`;
    const result = await db.prepare(statement).bind(...bindings, code).run();

    if (!result.success) {
      return json({ error: `Unable to update product ${code}.` }, 400);
    }

    if (typeof payload.group === "string") {
      const newGroup = payload.group.trim();
      if (newGroup) {
        await db
          .prepare(`DELETE FROM product_eta WHERE product_code = ?`)
          .bind(code)
          .run();
        await db
          .prepare(
            `INSERT INTO product_eta (product_code, bar_type, anchor_id, eta_enabled)
             SELECT ?, bar_type, id, 0 FROM anchors WHERE group_key = ?
             ON CONFLICT(product_code, bar_type, anchor_id) DO NOTHING`
          )
          .bind(code, newGroup)
          .run();
      }
    }

    const config = await fetchConfigFromDb(db);
    return json({ ok: true, config });
  } catch (error) {
    console.error("Failed to update product", error);
    return json(
      {
        error:
          "Unable to update product. Ensure the provided group exists and try again.",
      },
      400
    );
  }
};

export const onRequestDelete: PagesFunction = async ({
  request,
  env,
  params,
}) => {
  const authResponse = ensureBasicAuth(request, env as Record<string, unknown>);
  if (authResponse) return authResponse;

  const code = (params.code || "").toString().trim();
  if (!code) {
    return json({ error: "Product code is required in the path." }, 400);
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    const result = await db
      .prepare(`DELETE FROM products WHERE code = ?`)
      .bind(code)
      .run();

    if (!result.success || result.changes === 0) {
      return json({ error: `Product ${code} not found.` }, 404);
    }

    const config = await fetchConfigFromDb(db);
    return json({ ok: true, config });
  } catch (error) {
    console.error("Failed to delete product", error);
    return json({ error: "Unable to delete product." }, 400);
  }
};
