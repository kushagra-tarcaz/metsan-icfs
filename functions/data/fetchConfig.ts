import { staticConfig, type StaticConfig } from "./staticConfig";

type ProductRow = {
  code: string;
  display_name: string;
  group_key: string;
  eta_approved: number;
};

type GroupRow = { key: string };

type AnchorRow = {
  group_key: string;
  bar_type: "threaded" | "rebar";
  id: string;
  d0: number;
  da: number | null;
  hef: number;
  hmin: number | null;
  hmax: number | null;
  is_active: number | null;
};

type CartridgeRow = {
  group_key: string;
  nominal: number;
  net: number;
};

type ConstantRow = {
  key: string;
  value: number;
  description: string;
};

type UsageFactorRow = {
  code: string;
  label_tr: string;
  label_en: string;
  percentage: number;
  sort_order: number;
  is_default: number;
};

type ThemeRow = {
  key: string;
  value: string;
};

type EtaRow = {
  product_code: string;
  bar_type: "threaded" | "rebar";
  anchor_id: string;
  eta_enabled: number;
};

export async function fetchConfigFromDb(
  db: D1Database
): Promise<StaticConfig> {
  const productRows = await db
    .prepare(
      `SELECT code, display_name, group_key, eta_approved
       FROM products
       ORDER BY display_name`
    )
    .all<ProductRow>();

  const groupRows = await db
    .prepare(`SELECT key FROM groups ORDER BY key`)
    .all<GroupRow>();

  const anchorRows = await db
    .prepare(
      `SELECT group_key, bar_type, id, d0, da, hef, hmin, hmax, is_active
       FROM anchors
       ORDER BY group_key, bar_type, hef, id`
    )
    .all<AnchorRow>();

  const cartridgeRows = await db
    .prepare(
      `SELECT group_key, nominal, net
       FROM cartridges
       ORDER BY group_key, nominal`
    )
    .all<CartridgeRow>();

  const constantRows = await db
    .prepare(
      `SELECT key, value, description
       FROM formula_constants`
    )
    .all<ConstantRow>();

  const usageFactorRows = await db
    .prepare(
      `SELECT code, label_tr, label_en, percentage, sort_order, is_default
       FROM usage_factors
       ORDER BY sort_order`
    )
    .all<UsageFactorRow>();

  let themeRows: { results: ThemeRow[] } | null = null;
  try {
    themeRows = await db
      .prepare(`SELECT key, value FROM theme_settings`)
      .all<ThemeRow>();
  } catch (error) {
    console.warn("Unable to load theme settings, using defaults.", error);
  }

  const etaRows = await db
    .prepare(
      `SELECT product_code, bar_type, anchor_id, eta_enabled
       FROM product_eta`
    )
    .all<EtaRow>();

  type Anchor = {
    id: string;
    d0: number;
    da?: number;
    hef: number;
    hmin?: number;
    hmax?: number;
    active?: boolean;
  };

  const groups: StaticConfig["groups"] = {};

  for (const { key } of groupRows.results) {
    groups[key] = {
      anchors: { threaded: [], rebar: [] },
      cartridges: [],
    };
  }

  for (const row of anchorRows.results) {
    const targetGroup = groups[row.group_key];
    if (!targetGroup) continue;
    const anchor: Anchor = {
      id: row.id,
      d0: row.d0,
      hef: row.hef,
    };
    if (row.da != null) anchor.da = row.da;
    if (row.hmin != null) anchor.hmin = row.hmin;
    if (row.hmax != null) anchor.hmax = row.hmax;
    if (row.is_active != null) anchor.active = row.is_active === 1;
    targetGroup.anchors[row.bar_type].push(anchor);
  }

  for (const row of cartridgeRows.results) {
    const targetGroup = groups[row.group_key];
    if (!targetGroup) continue;
    targetGroup.cartridges.push({
      nominal: row.nominal,
      net: row.net,
    });
  }

  const products = productRows.results.map((row) => ({
    code: row.code,
    displayName: row.display_name,
    group: row.group_key,
    etaApproved: row.eta_approved === 1,
  }));

  const constants: StaticConfig["constants"] =
    constantRows.results.length > 0
      ? constantRows.results.reduce((acc, row) => {
          acc[row.key] = {
            value: row.value,
            description: row.description,
          };
          return acc;
        }, {} as StaticConfig["constants"])
      : staticConfig.constants;

  const usageFactors =
    usageFactorRows.results.length > 0
      ? usageFactorRows.results.map((row) => ({
          code: row.code,
          labelTr: row.label_tr,
          labelEn: row.label_en,
          percentage: row.percentage,
          sortOrder: row.sort_order,
          isDefault: row.is_default === 1,
        }))
      : staticConfig.usageFactors;

  const theme =
    themeRows && themeRows.results.length > 0
      ? themeRows.results.reduce(
          (acc, row) => {
            acc[row.key] = row.value;
            return acc;
          },
          { ...staticConfig.theme }
        )
      : staticConfig.theme;

  const etaAssignments: StaticConfig["etaAssignments"] = {};

  // Ensure every product has an entry.
  products.forEach((product) => {
    etaAssignments[product.code] = {
      threaded: {},
      rebar: {},
    };
  });

  etaRows.results.forEach((row) => {
    if (!etaAssignments[row.product_code]) {
      etaAssignments[row.product_code] = { threaded: {}, rebar: {} };
    }
    etaAssignments[row.product_code][row.bar_type][row.anchor_id] = row.eta_enabled === 1;
  });

  // If no data returned, fall back to static defaults.
  const etaData = etaRows.results.length > 0 ? etaAssignments : staticConfig.etaAssignments;

  return { products, groups, constants, usageFactors, etaAssignments: etaData, theme };
}

export async function getConfig(
  db?: D1Database
): Promise<StaticConfig> {
  if (!db) {
    return staticConfig;
  }
  try {
    return await fetchConfigFromDb(db);
  } catch (error) {
    console.error("Failed to load config from D1", error);
    return staticConfig;
  }
}
