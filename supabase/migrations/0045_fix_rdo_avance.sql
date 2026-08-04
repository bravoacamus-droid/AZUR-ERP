-- Corrige avances de RDO guardados como 0–100 (deberían ser fracción 0–1).
-- Los valores > 1 provienen del bug de doble escala (se ingresó 50 y se guardó 50).
update rdo_actividades set avance_pct = avance_pct / 100 where avance_pct is not null and avance_pct > 1;
