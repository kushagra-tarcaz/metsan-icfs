PRAGMA foreign_keys = ON;

-- Groups represent logical product families (A / B) used by the calculator UI.
CREATE TABLE IF NOT EXISTS groups (
  key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL
);

INSERT INTO groups (key, display_name) VALUES
  ('A', 'Group A'),
  ('B', 'Group B');

-- Products are the selectable chemical products.
CREATE TABLE IF NOT EXISTS products (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  group_key TEXT NOT NULL REFERENCES groups(key) ON DELETE CASCADE,
  eta_approved INTEGER NOT NULL DEFAULT 0 CHECK (eta_approved IN (0,1))
);

INSERT INTO products (code, display_name, group_key, eta_approved) VALUES
  ('PE', 'F.1311 (PE)', 'A', 1),
  ('PESF', 'F.1311 (PESF)', 'A', 1),
  ('VE', 'F.1511 (VE)', 'A', 0),
  ('VESF', 'F.1511 (VESF)', 'A', 0),
  ('EASF', 'F.1711 (VINIL PLUS)', 'A', 1),
  ('EP100', 'F.1911 (MT103)', 'B', 0),
  ('EP1000', 'F.2111 (MT1003)', 'B', 1);

-- Anchors specify the diameter/depth options per group and bar type.
CREATE TABLE IF NOT EXISTS anchors (
  group_key TEXT NOT NULL REFERENCES groups(key) ON DELETE CASCADE,
  bar_type TEXT NOT NULL CHECK (bar_type IN ('threaded','rebar')),
  id TEXT NOT NULL,
  d0 REAL NOT NULL,
  hef REAL NOT NULL,
  hmin REAL,
  hmax REAL,
  PRIMARY KEY (group_key, bar_type, id)
);

INSERT INTO anchors (group_key, bar_type, id, d0, hef, hmin, hmax) VALUES
  -- Group A threaded
  ('A', 'threaded', 'M6', 8, 60, NULL, NULL),
  ('A', 'threaded', 'M8', 10, 80, 60, 160),
  ('A', 'threaded', 'M10', 12, 90, 60, 200),
  ('A', 'threaded', 'M12', 14, 110, 70, 240),
  ('A', 'threaded', 'M16', 18, 125, 80, 320),
  ('A', 'threaded', 'M20', 24, 170, 90, 400),
  ('A', 'threaded', 'M24', 28, 210, 96, 480),
  ('A', 'threaded', 'M27', 32, 240, NULL, NULL),
  ('A', 'threaded', 'M30', 35, 280, NULL, NULL),
  -- Group A rebar
  ('A', 'rebar', 'Φ8', 12, 80, 60, 160),
  ('A', 'rebar', 'Φ10', 14, 90, 60, 200),
  ('A', 'rebar', 'Φ12', 16, 110, 70, 240),
  ('A', 'rebar', 'Φ14', 18, 115, 75, 280),
  ('A', 'rebar', 'Φ16', 20, 125, 80, 320),
  ('A', 'rebar', 'Φ20', 24, 170, 90, 400),
  ('A', 'rebar', 'Φ25', 32, 210, 100, 500),
  ('A', 'rebar', 'Φ28', 35, 250, 112, 560),
  ('A', 'rebar', 'Φ32', 40, 280, 128, 640),
  -- Group B threaded
  ('B', 'threaded', 'M6', 8, 60, NULL, NULL),
  ('B', 'threaded', 'M8', 10, 80, NULL, NULL),
  ('B', 'threaded', 'M10', 12, 90, NULL, NULL),
  ('B', 'threaded', 'M12', 14, 110, NULL, NULL),
  ('B', 'threaded', 'M16', 18, 125, NULL, NULL),
  ('B', 'threaded', 'M20', 22, 170, NULL, NULL),
  ('B', 'threaded', 'M24', 28, 210, NULL, NULL),
  ('B', 'threaded', 'M27', 30, 240, NULL, NULL),
  ('B', 'threaded', 'M30', 35, 280, NULL, NULL),
  ('B', 'threaded', 'M33', 38, 320, NULL, NULL),
  ('B', 'threaded', 'M36', 42, 350, NULL, NULL),
  ('B', 'threaded', 'M39', 45, 380, NULL, NULL),
  ('B', 'threaded', 'M42', 52, 420, NULL, NULL),
  ('B', 'threaded', 'M48', 60, 480, NULL, NULL),
  -- Group B rebar
  ('B', 'rebar', 'Φ8', 12, 80, NULL, NULL),
  ('B', 'rebar', 'Φ10', 14, 90, NULL, NULL),
  ('B', 'rebar', 'Φ12', 16, 110, NULL, NULL),
  ('B', 'rebar', 'Φ14', 18, 115, NULL, NULL),
  ('B', 'rebar', 'Φ16', 20, 125, NULL, NULL),
  ('B', 'rebar', 'Φ18', 22, 150, NULL, NULL),
  ('B', 'rebar', 'Φ20', 25, 170, NULL, NULL),
  ('B', 'rebar', 'Φ24', 32, 205, NULL, NULL),
  ('B', 'rebar', 'Φ25', 32, 210, NULL, NULL),
  ('B', 'rebar', 'Φ28', 35, 250, NULL, NULL),
  ('B', 'rebar', 'Φ30', 37, 270, NULL, NULL),
  ('B', 'rebar', 'Φ32', 40, 330, NULL, NULL),
  ('B', 'rebar', 'Φ36', 45, 360, NULL, NULL),
  ('B', 'rebar', 'Φ40', 50, 390, NULL, NULL);

-- Cartridges declare nominal sizes per group with net volumes.
CREATE TABLE IF NOT EXISTS cartridges (
  group_key TEXT NOT NULL REFERENCES groups(key) ON DELETE CASCADE,
  nominal REAL NOT NULL,
  net REAL NOT NULL,
  PRIMARY KEY (group_key, nominal)
);

INSERT INTO cartridges (group_key, nominal, net) VALUES
  ('A', 165, 148.5),
  ('A', 300, 270),
  ('A', 345, 310.5),
  ('A', 410, 369),
  ('B', 385, 346.5),
  ('B', 585, 526.5);
