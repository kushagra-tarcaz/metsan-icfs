type AuthEnv = {
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
};

const UNAUTHORIZED_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "www-authenticate": 'Basic realm="Calculator Admin"',
};

export function ensureBasicAuth(
  request: Request,
  env: AuthEnv
): Response | null {
  const expectedUser = env.ADMIN_USERNAME ?? "";
  const expectedPass = env.ADMIN_PASSWORD ?? "";

  if (!expectedUser && !expectedPass) {
    // If credentials are not set we treat it as open access.
    // Production should always set both values.
    return null;
  }

  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) {
    return new Response(
      JSON.stringify({ error: "Authentication required." }),
      { status: 401, headers: UNAUTHORIZED_HEADERS }
    );
  }

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid authorization header." }),
      { status: 401, headers: UNAUTHORIZED_HEADERS }
    );
  }

  const separatorIndex = decoded.indexOf(":");
  const username =
    separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded;
  const password =
    separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";

  if (username !== expectedUser || password !== expectedPass) {
    return new Response(JSON.stringify({ error: "Invalid credentials." }), {
      status: 401,
      headers: UNAUTHORIZED_HEADERS,
    });
  }

  return null;
}
