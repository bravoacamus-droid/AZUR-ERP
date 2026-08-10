import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { puedeEditar, puedeVer } from '@/lib/permisos';
import { ProveedoresCampo } from './proveedores-campo';

export const dynamic = 'force-dynamic';

const ROLES_SOLICITAN = ['jefe_proyectos', 'residente', 'presupuestos', 'comercial'];

export default async function CampoProveedoresPage() {
  const session = await requireSession();
  if (!puedeVer(session.permisos, 'proveedores')) redirect('/campo');
  const supabase = createClient() as any;

  const modo: 'editar' | 'solicitar' | 'lectura' =
    puedeEditar(session.permisos, 'proveedores') ? 'editar'
    : ROLES_SOLICITAN.includes(session.rol) ? 'solicitar'
    : 'lectura';

  const [{ data: proveedores }, { data: misCambios }, { data: misAltas }] = await Promise.all([
    supabase.from('contrapartes')
      .select('id, razon_social, tipo, ruc_dni, especialidad, contacto, telefono, banco, cuenta, cci, cuenta_detraccion, validado')
      .eq('validado', true).order('razon_social'),
    supabase.from('contraparte_cambios').select('id').eq('solicitado_por', session.id).eq('estado', 'pendiente'),
    supabase.from('contrapartes').select('id').eq('validado', false).eq('created_by', session.id),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/campo" className="mb-1 inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Campo
        </Link>
        <h1 className="text-xl font-bold">Proveedores</h1>
      </div>
      <ProveedoresCampo
        proveedores={proveedores ?? []}
        modo={modo}
        pendientes={(misCambios?.length ?? 0) + (misAltas?.length ?? 0)}
      />
    </div>
  );
}
