import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
import { CatalogosClient } from './catalogos-client';

export const dynamic = 'force-dynamic';

export default async function CatalogosPage() {
  await requireRol(['gerencia', 'presupuestos', 'comercial', 'administrador']);
  const supabase = createClient();

  const [{ data: lineas }, { data: clientes }, { data: contrapartes }, { data: partidas }, { data: insumos }, { data: plantillas }, { data: medios }] =
    await Promise.all([
      supabase.from('lineas_negocio').select('id, nombre, codigo, color').eq('activo', true).order('nombre'),
      supabase.from('clientes').select('id, razon_social, tipo_doc, ruc_dni, contacto_nombre, contacto_email, contacto_telefono, ubicacion, origen').order('razon_social'),
      supabase.from('contrapartes').select('id, razon_social, tipo, ruc_dni, especialidad, contacto, telefono, banco, cuenta, cci').order('razon_social'),
      supabase.from('catalogo_partidas').select('id, linea_id, codigo, descripcion, unidad, costo_referencial').order('descripcion'),
      supabase.from('catalogo_insumos').select('id, codigo, nombre, unidad, precio, tipo').order('nombre'),
      supabase.from('plantillas_cotizacion').select('id, linea_id, nombre, condiciones, servicios_incluidos, servicios_omitidos, garantia').order('nombre'),
      supabase.from('medios_pago_empresa').select('id, banco, titular, cuenta_soles, cci_soles, cuenta_dolares, cci_dolares, es_detraccion').order('orden'),
    ]);

  return (
    <CatalogosClient
      data={{
        lineas: lineas ?? [],
        clientes: clientes ?? [],
        contrapartes: contrapartes ?? [],
        partidas: partidas ?? [],
        insumos: insumos ?? [],
        plantillas: plantillas ?? [],
        medios: medios ?? [],
      }}
    />
  );
}
