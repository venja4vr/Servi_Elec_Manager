BEGIN;

UPDATE plantilla SET dias_minimos         = 1 WHERE dias_minimos IS NULL;
UPDATE plantilla SET horas_minimas        = 1 WHERE horas_minimas IS NULL;
UPDATE plantilla SET dias_default         = 1 WHERE dias_default IS NULL;
UPDATE plantilla SET horas_diarias_default = 8 WHERE horas_diarias_default IS NULL;
UPDATE plantilla SET trabajadores_default  = 1 WHERE trabajadores_default IS NULL;

COMMIT;
