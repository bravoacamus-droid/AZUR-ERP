-- 0063 · Tipo de egreso "jornales" (mano de obra del tareo).
-- Los jornales se marcaban como pagados pero no generaban ningún registro de
-- gasto, así que la mano de obra no entraba al EEFF ni al costo del proyecto.
-- Al pagarlos ahora se registra el egreso con este tipo.
alter type tipo_solicitud add value if not exists 'jornales';
