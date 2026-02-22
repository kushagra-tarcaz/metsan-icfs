PRAGMA foreign_keys = ON;

-- Formula constants allow tuning of the effective volume calculation.
CREATE TABLE IF NOT EXISTS formula_constants (
  key TEXT PRIMARY KEY,
  value REAL NOT NULL,
  description TEXT NOT NULL
);

INSERT INTO formula_constants (key, value, description) VALUES
  ('circular_area_factor', 0.25, 'Area factor applied to π·d² to obtain hole cross-section.'),
  ('ml_conversion', 0.001, 'Conversion from mm³ to ml.'),
  ('fill_ratio', 0.6666667, 'Fill ratio representing resin occupation of the hole (2/3).')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  description = excluded.description;

-- Usage factors (good/standard/poor) are editable.
CREATE TABLE IF NOT EXISTS usage_factors (
  code TEXT PRIMARY KEY,
  label_tr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  percentage REAL NOT NULL,
  sort_order INTEGER NOT NULL,
  is_default INTEGER NOT NULL CHECK (is_default IN (0,1))
);

INSERT INTO usage_factors (code, label_tr, label_en, percentage, sort_order, is_default) VALUES
  ('good', 'İyi (%5)', 'Good (5%)', 0.05, 1, 0),
  ('standard', 'Standart (%10)', 'Standard (10%)', 0.10, 2, 1),
  ('poor', 'Kötü (%20)', 'Poor (20%)', 0.20, 3, 0)
ON CONFLICT(code) DO UPDATE SET
  label_tr = excluded.label_tr,
  label_en = excluded.label_en,
  percentage = excluded.percentage,
  sort_order = excluded.sort_order,
  is_default = excluded.is_default;
