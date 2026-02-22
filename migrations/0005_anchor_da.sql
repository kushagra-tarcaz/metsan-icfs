ALTER TABLE anchors
ADD COLUMN da REAL;

UPDATE anchors
SET da = CAST(REPLACE(REPLACE(id, 'M', ''), 'Φ', '') AS REAL)
WHERE da IS NULL;
