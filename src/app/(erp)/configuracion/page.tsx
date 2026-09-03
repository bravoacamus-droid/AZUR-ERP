import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { ConfiguracionClient } from './configuracion-client';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  await requireModulo('configuracion', 'ver');
  const supabase = createClient() as any;

  const [{ data: lineas }, { data: servicios }, { data: medios }, { data: cots }] = await Promise.all([
    supabase.from('lineas_negocio').select('id, nombre, codigo, color, activo').order('nombre'),
    supabase.from('tipos_servicio').select('id, nombre, activo, orden').order('orden'),
    supabase.from('medios_pago_empresa').select('id, banco, titular, cuenta_soles, cci_soles, cuenta_dolares, cci_dolares, es_detraccion, mostrar_cotizacion, mostrar_valorizacion, mostrar_liquidacion').order('orden'),
    // Conteo de uso por línea/servicio, para avisar antes de desactivar/eliminar.
    supabase.from('cotizaciones').select('linea_id, tipo_servicio_id').eq('es_plantilla', false),
  ]);

  const usoLinea: Record<string, number> = {};
  const usoServicio: Record<string, number> = {};
  for (const c of (cots ?? []) as { linea_id: string | null; tipo_servicio_id: string | null }[]) {
    if (c.linea_id) usoLinea[c.linea_id] = (usoLinea[c.linea_id] ?? 0) + 1;
    if (c.tipo_servicio_id) usoServicio[c.tipo_servicio_id] = (usoServicio[c.tipo_servicio_id] ?? 0) + 1;
  }

  return (
    <ConfiguracionClient
      lineas={lineas ?? []}
      servicios={servicios ?? []}
      medios={medios ?? []}
      usoLinea={usoLinea}
      usoServicio={usoServicio}
    />
  );
}
