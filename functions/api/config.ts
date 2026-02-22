import { getConfig } from "../data/fetchConfig";

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
});

export const onRequestGet: PagesFunction = async ({ env }) => {
  const database = (env as { DB?: D1Database }).DB;
  const config = await getConfig(database);
  return jsonResponse(config);
};
