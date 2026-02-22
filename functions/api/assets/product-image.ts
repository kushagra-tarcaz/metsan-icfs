const buildFallbackUrl = (product: string, nominal: string, origin: string) =>
  new URL(`/assets/${product}-${nominal}-min.png`, origin).toString();

const decodeBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const product = url.searchParams.get("product");
    const nominal = url.searchParams.get("nominal");

    if (!product || !nominal) {
      return new Response("Missing product or nominal.", { status: 400 });
    }

    const fallbackUrl = buildFallbackUrl(product, nominal, url.origin);
    const db = (env as { DB?: D1Database }).DB;
    if (!db) {
      return Response.redirect(fallbackUrl, 302);
    }

    const result = await db
      .prepare(
        `SELECT content_type, data
         FROM product_images
         WHERE product_code = ? AND nominal = ?`
      )
      .bind(product, Number(nominal))
      .first<{ content_type: string; data: string }>();

    if (!result?.data) {
      return Response.redirect(fallbackUrl, 302);
    }

    const bytes = decodeBase64(result.data);
    return new Response(bytes, {
      headers: {
        "content-type": result.content_type || "application/octet-stream",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Failed to load product image", error);
    try {
      const url = new URL(request.url);
      const product = url.searchParams.get("product") || "logo";
      const nominal = url.searchParams.get("nominal") || "";
      const fallback =
        nominal !== ""
          ? buildFallbackUrl(product, nominal, url.origin)
          : new URL("/assets/logo.png", url.origin).toString();
      return Response.redirect(fallback, 302);
    } catch {
      return new Response("Unable to load image.", { status: 500 });
    }
  }
};
