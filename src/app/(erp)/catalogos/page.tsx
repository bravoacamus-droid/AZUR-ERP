import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { puedeEditar, puedeVer } from '@/lib/permisos';
import { CatalogosClient } from './catalogos-client';
import { ClientesMaestro } from '../clientes/clientes-maestro';
import { ProveedoresClient } from '../proveedores/proveedores-client';

export const dynamic = 'force-dynamic';

// Roles que pueden VER + SOLICITAR alta/edición de proveedores (la aplican finanzas/gerencia).
const ROLES_SOLICITAN = ['jefe_proyectos', 'residente', 'presupuestos', 'comercial'];

/** Libro único de catálogos. Reúne lo que antes eran tres entradas sueltas del
 *  menú (Clientes, Catálogos y Proveedores); cada pestaña respeta el permiso del
 *  módulo que la gobierna. */
export default async function CatalogosPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await requireSession();
  const verCatalogo = puedeVer(session.permisos, 'catalogos');
  const verClientes = puedeVer(session.permisos, 'clientes') || verCatalogo;
  const verProveedores = puedeVer(session.permisos, 'proveedores') || verCatalogo;
  if (!verCatalogo && !verClientes && !verProveedores) redirect('/inicio?error=sin-permiso');

  const canEdit = puedeEditar(session.permisos, 'catalogos');
  const editaClientes = puedeEditar(session.permisos, 'clientes') || canEdit;
  const editaProveedores = puedeEditar(session.permisos, 'proveedores');
  const supabase = createClient();
  const sb = supabase as unknown as { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

  const [
    { data: lineas }, { data: contrapartes }, { data: partidas }, { data: insumos }, { data: plantillas }, { data: medios }, { data: trabajadores },
    { data: clientes }, { data: cots }, { data: proys },
    { data: provValidados }, { data: misCambios }, { data: misAltas },
  ] = await Promise.all([
    supabase.from('lineas_negocio').select('id, nombre, codigo, color').eq('activo', true).order('nombre'),
    supabase.from('contrapartes').select('id, razon_social, tipo, ruc_dni, especialidad, contacto, telefono, banco, cuenta, cci, cuenta_detraccion').order('razon_social'),
    verCatalogo ? supabase.from('catalogo_partidas').select('id, linea_id, codigo, descripcion, unidad, costo_referencial').order('descripcion') : Promise.resolve({ data: [] }),
    verCatalogo ? supabase.from('catalogo_insumos').select('id, codigo, nombre, unidad, precio, tipo').order('nombre') : Promise.resolve({ data: [] }),
    verCatalogo ? supabase.from('plantillas_cotizacion').select('id, linea_id, nombre, condiciones, servicios_incluidos, servicios_omitidos, garantia').order('nombre') : Promise.resolve({ data: [] }),
    supabase.from('medios_pago_empresa').select('id, banco, titular, cuenta_soles, cci_soles, cuenta_dolares, cci_dolares, es_detraccion, mostrar_cotizacion, mostrar_valorizacion, mostrar_liquidacion').order('orden'),
    verCatalogo ? sb.from('trabajadores').select('id, nombre, documento, especialidad, jornal_semana, recurrente').eq('activo', true).order('nombre') : Promise.resolve({ data: [] }),
    verClientes ? supabase.from('clientes').select('*').order('razon_social') : Promise.resolve({ data: [] }),
    verClientes ? supabase.from('cotizaciones').select('cliente_id') : Promise.resolve({ data: [] }),
    verClientes ? supabase.from('proyectos').select('cliente_id') : Promise.resolve({ data: [] }),
    sb.from('contrapartes')
      .select('id, razon_social, tipo, ruc_dni, especialidad, contacto, telefono, banco, cuenta, cci, cuenta_detraccion, validado')
      .eq('validado', true).order('razon_social'),
    sb.from('contraparte_cambios').select('id').eq('solicitado_por', session.id).eq('estado', 'pendiente'),
    sb.from('contrapartes').select('id').eq('validado', false).eq('created_by', session.id),
  ]);

  const countCot: Record<string, number> = {};
  const countProy: Record<string, number> = {};
  ((cots ?? []) as { cliente_id: string | null }[]).forEach((c) => { if (c.cliente_id) countCot[c.cliente_id] = (countCot[c.cliente_id] ?? 0) + 1; });
  ((proys ?? []) as { cliente_id: string | null }[]).forEach((p) => { if (p.cliente_id) countProy[p.cliente_id] = (countProy[p.cliente_id] ?? 0) + 1; });

  const modoProv: 'editar' | 'solicitar' | 'lectura' = editaProveedores ? 'editar' : ROLES_SOLICITAN.includes(session.rol) ? 'solicitar' : 'lectura';

  return (
    <CatalogosClient
      canEdit={canEdit}
      verCatalogo={verCatalogo}
      tabInicial={searchParams.tab}
      puedeTarifa={session.rol === 'jefe_proyectos' || session.rol === 'gerencia'}
      proveedoresEditor={canEdit}
      clientesView={verClientes ? (
        <ClientesMaestro clientes={clientes ?? []} countCot={countCot} countProy={countProy} canEdit={editaClientes} />
      ) : undefined}
      proveedoresView={verProveedores ? (
        <ProveedoresClient
          embedded
          proveedores={provValidados ?? []}
          modo={modoProv}
          pendientes={(misCambios?.length ?? 0) + (misAltas?.length ?? 0)}
        />
      ) : undefined}
      data={{
        lineas: lineas ?? [],
        contrapartes: contrapartes ?? [],
        trabajadores: trabajadores ?? [],
        partidas: partidas ?? [],
        insumos: insumos ?? [],
        plantillas: plantillas ?? [],
        medios: medios ?? [],
      }}
    />
  );
}
