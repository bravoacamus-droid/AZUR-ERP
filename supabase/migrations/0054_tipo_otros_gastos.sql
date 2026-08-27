-- Nueva categoría de gasto "Otros gastos": el residente reporta lo realmente
-- gastado (p. ej. lo consumido de la caja chica) y SÍ suma al proyecto al pagarse.
alter type tipo_solicitud add value if not exists 'otros_gastos';
