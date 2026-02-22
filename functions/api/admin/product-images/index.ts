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

const encodeBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
};

export const onRequestPut: PagesFunction = async ({ request, env }) => {
  const auth = ensureBasicAuth(request, env as Record<string, unknown>);
  if (auth) return auth;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid form data." }, 400);
  }

  const productCode = form.get("productCode")?.toString().trim();
  const nominalRaw = form.get("nominal")?.toString().trim();
  const file = form.get("file");

  if (!productCode || !nominalRaw || !file || !(file instanceof File)) {
    return json(
      { error: "productCode, nominal and file are required." },
      400
    );
  }

  const nominal = Number(nominalRaw);
  if (Number.isNaN(nominal) || nominal <= 0) {
    return json({ error: "nominal must be a positive number." }, 400);
  }

  const contentType = file.type || "application/octet-stream";
  try {
    const base64 = encodeBase64(await file.arrayBuffer());
    const db = requireDb(env as Record<string, unknown>);
    await db
      .prepare(
        `INSERT INTO product_images (product_code, nominal, content_type, data)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(product_code, nominal) DO UPDATE SET
           content_type = excluded.content_type,
           data = excluded.data,
           updated_at = CURRENT_TIMESTAMP`
      )
      .bind(productCode, nominal, contentType, base64)
      .run();

    return json({ ok: true });
  } catch (error) {
    console.error("Failed to store product image", error);
    return json({ error: "Unable to store product image." }, 400);
  }
};

export const onRequestDelete: PagesFunction = async ({ request, env }) => {
  const auth = ensureBasicAuth(request, env as Record<string, unknown>);
  if (auth) return auth;

  const url = new URL(request.url);
  const productCode = url.searchParams.get("product");
  const nominalRaw = url.searchParams.get("nominal");

  if (!productCode || !nominalRaw) {
    return json({ error: "product and nominal are required." }, 400);
  }

  const nominal = Number(nominalRaw);
  if (Number.isNaN(nominal) || nominal <= 0) {
    return json({ error: "nominal must be a positive number." }, 400);
  }

  try {
    const db = requireDb(env as Record<string, unknown>);
    await db
      .prepare(
        `DELETE FROM product_images WHERE product_code = ? AND nominal = ?`
      )
      .bind(productCode, nominal)
      .run();
    return json({ ok: true });
  } catch (error) {
    console.error("Failed to delete product image", error);
    return json({ error: "Unable to delete product image." }, 400);
  }
};
