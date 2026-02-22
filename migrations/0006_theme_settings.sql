CREATE TABLE IF NOT EXISTS theme_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO theme_settings (key, value) VALUES
  ('brandColor', '#8CCE41'),
  ('pageBackground', '#f5f9fc'),
  ('cardBackground', '#ffffff')
ON CONFLICT(key) DO NOTHING;
