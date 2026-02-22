PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_eta (
  product_code TEXT NOT NULL REFERENCES products(code) ON DELETE CASCADE,
  bar_type TEXT NOT NULL CHECK (bar_type IN ('threaded','rebar')),
  anchor_id TEXT NOT NULL,
  eta_enabled INTEGER NOT NULL DEFAULT 0 CHECK (eta_enabled IN (0,1)),
  PRIMARY KEY (product_code, bar_type, anchor_id)
);

-- Seed every product/anchor combination as disabled by default.
INSERT INTO product_eta (product_code, bar_type, anchor_id, eta_enabled)
SELECT p.code, a.bar_type, a.id, 0
FROM products p
JOIN anchors a ON a.group_key = p.group_key
ON CONFLICT(product_code, bar_type, anchor_id) DO NOTHING;

-- Enable ETA for legacy products that were globally approved previously.
UPDATE product_eta
SET eta_enabled = 1
WHERE product_code IN ('PE','PESF','EASF','EP1000');
