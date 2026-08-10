import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { puedeEditar } from '@/lib/permisos';
import { ProveedoresClient } from './proveedores-client';

export const dynamic = 'force-dynamic';

// Roles que pueden VER + SOLICITAR alta/edición (la aplican finanzas/gerencia).
const ROLES_SOLICITAN = ['jefe_proyectos', 'residente', 'presupuestos', 'comercial'];

export default async function ProveedoresPage() {
  const session = await requireModulo('proveedores', 'ver');
  const supabase = createClient() as any;

  const editaDirecto = puedeEditar(session.permisos, 'proveedores'); // gerencia / administración
  const puedeSolicitar = ROLES_SOLICITAN.includes(session.rol);
  const modo: 'editar' | 'solicitar' | 'lectura' = editaDirecto ? 'editar' : puedeSolicitar ? 'solicitar' : 'lectura';

  const [{ data: proveedores }, { data: misCambios }, { data: misAltas }] = await Promise.all([
    supabase.from('contrapartes')
      .select('id, razon_social, tipo, ruc_dni, especialidad, contacto, telefono, banco, cuenta, cci, cuenta_detraccion, validado')
      .eq('validado', true).order('razon_social'),
    // Mis solicitudes de cambio en revisión (para avisar al usuario).
    supabase.from('contraparte_cambios').select('id').eq('solicitado_por', session.id).eq('estado', 'pendiente'),
    // Mis altas por validar.
    supabase.from('contrapartes').select('id').eq('validado', false).eq('created_by', session.id),
  ]);

  return (
    <ProveedoresClient
      proveedores={proveedores ?? []}
      modo={modo}
      pendientes={(misCambios?.length ?? 0) + (misAltas?.length ?? 0)}
    />
  );
}
