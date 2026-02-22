PRAGMA foreign_keys = ON;

DELETE FROM usage_factors
WHERE code NOT IN ('standard', 'optimized');

INSERT INTO usage_factors (code, label_tr, label_en, percentage, sort_order, is_default) VALUES
  ('standard', 'Standart', 'Standard', 1.0, 1, 1),
  ('optimized', 'Optimize', 'Optimized', 1.2, 2, 0)
ON CONFLICT(code) DO UPDATE SET
  label_tr = excluded.label_tr,
  label_en = excluded.label_en,
  percentage = excluded.percentage,
  sort_order = excluded.sort_order;

UPDATE usage_factors
SET is_default = CASE WHEN code = 'standard' THEN 1 ELSE 0 END;
