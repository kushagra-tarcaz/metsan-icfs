PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_images (
  product_code TEXT NOT NULL REFERENCES products(code) ON DELETE CASCADE,
  nominal REAL NOT NULL,
  content_type TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_code, nominal)
);
