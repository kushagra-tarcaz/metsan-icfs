type Anchor = {
  id: string;
  d0: number;
  da?: number;
  hef: number;
  hmin?: number;
  hmax?: number;
  active?: boolean;
};

type Cartridge = {
  nominal: number;
  net: number;
};

type ProductGroupKey = "A" | "B";

type Product = {
  code: string;
  displayName: string;
  group: ProductGroupKey;
  etaApproved: boolean;
};

type GroupConfig = {
  anchors: {
    threaded: Anchor[];
    rebar: Anchor[];
  };
  cartridges: Cartridge[];
};

type FormulaConstant = {
  value: number;
  description: string;
};

type UsageFactor = {
  code: string;
  labelTr: string;
  labelEn: string;
  percentage: number;
  sortOrder: number;
  isDefault: boolean;
};

type EtaAssignments = {
  threaded: Record<string, boolean>;
  rebar: Record<string, boolean>;
};

export type StaticConfig = {
  products: Product[];
  groups: Record<ProductGroupKey, GroupConfig>;
  constants: Record<string, FormulaConstant>;
  usageFactors: UsageFactor[];
  etaAssignments: Record<string, EtaAssignments>;
  theme: {
    brandColor: string;
    pageBackground: string;
    cardBackground: string;
  };
};

export const staticConfig: StaticConfig = {
  products: [
    { code: "PE", displayName: "F.1311 (PE)", group: "A", etaApproved: true },
    { code: "PESF", displayName: "F.1311 (PESF)", group: "A", etaApproved: true },
    { code: "VE", displayName: "F.1511 (VE)", group: "A", etaApproved: false },
    { code: "VESF", displayName: "F.1511 (VESF)", group: "A", etaApproved: false },
    { code: "EASF", displayName: "F.1711 (VINIL PLUS)", group: "A", etaApproved: true },
    { code: "EP100", displayName: "F.1911 (MT103)", group: "B", etaApproved: false },
    { code: "EP1000", displayName: "F.2111 (MT1003)", group: "B", etaApproved: true }
  ],
  constants: {
    circular_area_factor: {
      value: 0.25,
      description: "Area factor applied to π·d² to obtain hole cross-section.",
    },
    ml_conversion: {
      value: 0.001,
      description: "Conversion from mm³ to ml.",
    },
    fill_ratio: {
      value: 0.6666667,
      description: "Fill ratio representing resin occupation of the hole (2/3).",
    },
  },
  usageFactors: [
    {
      code: "standard",
      labelTr: "Standart",
      labelEn: "Standard",
      percentage: 1,
      sortOrder: 1,
      isDefault: true,
    },
    {
      code: "optimized",
      labelTr: "Optimize",
      labelEn: "Optimized",
      percentage: 1.2,
      sortOrder: 2,
      isDefault: false,
    },
  ],
  groups: {
    A: {
      anchors: {
        threaded: [
          { id: "M6", d0: 8, da: 6, hef: 60, hmin: 0, hmax: 0 },
          { id: "M8", d0: 10, da: 8, hef: 80, hmin: 60, hmax: 160 },
          { id: "M10", d0: 12, da: 10, hef: 90, hmin: 60, hmax: 200 },
          { id: "M12", d0: 14, da: 12, hef: 110, hmin: 70, hmax: 240 },
          { id: "M16", d0: 18, da: 16, hef: 125, hmin: 80, hmax: 320 },
          { id: "M20", d0: 24, da: 20, hef: 170, hmin: 90, hmax: 400 },
          { id: "M24", d0: 28, da: 24, hef: 210, hmin: 96, hmax: 480 },
          { id: "M27", d0: 32, da: 27, hef: 240, hmin: 0, hmax: 0 },
          { id: "M30", d0: 35, da: 30, hef: 280, hmin: 0, hmax: 0 }
        ],
        rebar: [
          { id: "Φ8", d0: 12, da: 8, hef: 80, hmin: 60, hmax: 160 },
          { id: "Φ10", d0: 14, da: 10, hef: 90, hmin: 60, hmax: 200 },
          { id: "Φ12", d0: 16, da: 12, hef: 110, hmin: 70, hmax: 240 },
          { id: "Φ14", d0: 18, da: 14, hef: 115, hmin: 75, hmax: 280 },
          { id: "Φ16", d0: 20, da: 16, hef: 125, hmin: 80, hmax: 320 },
          { id: "Φ20", d0: 24, da: 20, hef: 170, hmin: 90, hmax: 400 },
          { id: "Φ25", d0: 32, da: 25, hef: 210, hmin: 100, hmax: 500 },
          { id: "Φ28", d0: 35, da: 28, hef: 250, hmin: 112, hmax: 560 },
          { id: "Φ32", d0: 40, da: 32, hef: 280, hmin: 128, hmax: 640 }
        ]
      },
      cartridges: [
        { nominal: 165, net: 148.5 },
        { nominal: 300, net: 270 },
        { nominal: 345, net: 310.5 },
        { nominal: 410, net: 369 }
      ]
    },
    B: {
      anchors: {
        threaded: [
          { id: "M6", d0: 8, da: 6, hef: 60 },
          { id: "M8", d0: 10, da: 8, hef: 80 },
          { id: "M10", d0: 12, da: 10, hef: 90 },
          { id: "M12", d0: 14, da: 12, hef: 110 },
          { id: "M16", d0: 18, da: 16, hef: 125 },
          { id: "M20", d0: 22, da: 20, hef: 170 },
          { id: "M24", d0: 28, da: 24, hef: 210 },
          { id: "M27", d0: 30, da: 27, hef: 240 },
          { id: "M30", d0: 35, da: 30, hef: 280 },
          { id: "M33", d0: 38, da: 33, hef: 320 },
          { id: "M36", d0: 42, da: 36, hef: 350 },
          { id: "M39", d0: 45, da: 39, hef: 380 },
          { id: "M42", d0: 52, da: 42, hef: 420 },
          { id: "M48", d0: 60, da: 48, hef: 480 }
        ],
        rebar: [
          { id: "Φ8", d0: 12, da: 8, hef: 80 },
          { id: "Φ10", d0: 14, da: 10, hef: 90 },
          { id: "Φ12", d0: 16, da: 12, hef: 110 },
          { id: "Φ14", d0: 18, da: 14, hef: 115 },
          { id: "Φ16", d0: 20, da: 16, hef: 125 },
          { id: "Φ18", d0: 22, da: 18, hef: 150 },
          { id: "Φ20", d0: 25, da: 20, hef: 170 },
          { id: "Φ24", d0: 32, da: 24, hef: 205 },
          { id: "Φ25", d0: 32, da: 25, hef: 210 },
          { id: "Φ28", d0: 35, da: 28, hef: 250 },
          { id: "Φ30", d0: 37, da: 30, hef: 270 },
          { id: "Φ32", d0: 40, da: 32, hef: 330 },
          { id: "Φ36", d0: 45, da: 36, hef: 360 },
          { id: "Φ40", d0: 50, da: 40, hef: 390 }
        ]
      },
      cartridges: [
        { nominal: 385, net: 346.5 },
        { nominal: 585, net: 526.5 }
      ]
    }
  },
  theme: {
    brandColor: "#8CCE41",
    pageBackground: "#f5f9fc",
    cardBackground: "#ffffff",
  },
  etaAssignments: {
    PE: {
      threaded: {
        M6: true, M8: true, M10: true, M12: true, M16: true, M20: true, M24: true, M27: true, M30: true
      },
      rebar: {
        "Φ8": true, "Φ10": true, "Φ12": true, "Φ14": true, "Φ16": true, "Φ20": true, "Φ25": true, "Φ28": true, "Φ32": true
      }
    },
    PESF: {
      threaded: {
        M6: true, M8: true, M10: true, M12: true, M16: true, M20: true, M24: true, M27: true, M30: true
      },
      rebar: {
        "Φ8": true, "Φ10": true, "Φ12": true, "Φ14": true, "Φ16": true, "Φ20": true, "Φ25": true, "Φ28": true, "Φ32": true
      }
    },
    VE: { threaded: {}, rebar: {} },
    VESF: { threaded: {}, rebar: {} },
    EASF: {
      threaded: {
        M6: true, M8: true, M10: true, M12: true, M16: true, M20: true, M24: true, M27: true, M30: true
      },
      rebar: {
        "Φ8": true, "Φ10": true, "Φ12": true, "Φ14": true, "Φ16": true, "Φ20": true, "Φ25": true, "Φ28": true, "Φ32": true
      }
    },
    EP100: { threaded: {}, rebar: {} },
    EP1000: {
      threaded: {
        M6: true, M8: true, M10: true, M12: true, M16: true, M20: true, M24: true, M27: true, M30: true, M33: true, M36: true, M39: true, M42: true, M48: true
      },
      rebar: {
        "Φ8": true, "Φ10": true, "Φ12": true, "Φ14": true, "Φ16": true, "Φ18": true, "Φ20": true, "Φ24": true, "Φ25": true, "Φ28": true, "Φ30": true, "Φ32": true, "Φ36": true, "Φ40": true
      }
    }
  }
};
