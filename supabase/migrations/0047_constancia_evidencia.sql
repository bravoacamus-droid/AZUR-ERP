-- Agrega "evidencia" como tipo de constancia en solicitudes de pago
-- (para capturas Yape/Plin, notas de venta, recibos sin factura/boleta/RH).
alter type constancia_enum add value if not exists 'evidencia';
