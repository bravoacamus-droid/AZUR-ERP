import Link from 'next/link';
import { ClipboardPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { EmptyState } from '@/components/ui/empty-state';
import { NuevaSolicitudForm } from '@/app/(erp)/finanzas/solicitudes/nueva/nueva-form';

export const metadata = { title: 'Nueva solicitud de pago' };
export const dynamic = 'force-dynamic';

export default async function PwaNuevaSolicitudPage() {
  const session = await requireSession();
  const supabase = createClient();

  // Solo proyectos donde el residente está asignado
  let proyectos: Array<{ id: string; codigo: string; nombre: string; moneda: string | null }> = [];

  if (session.rol === 'residente') {
    const { data: asignados } = await supabase
      .from('usuario_proyectos')
      .select('proyecto:proyecto_id(id, codigo, nombre, moneda)')
      .eq('user_id', session.userId)
      .eq('activo', true);
    proyectos = (asignados ?? [])
      .map((a) => (Array.isArray(a.proyecto) ? a.proyecto[0] : a.proyecto))
      .filter(Boolean) as typeof proyectos;
  } else {
    const { data } = await supabase
      .from('proyectos')
      .select('id, codigo, nombre, moneda')
      .neq('estado', 'cancelado')
      .order('codigo', { ascending: false });
    proyectos = data ?? [];
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <Link href="/solicitudes" className="text-xs font-semibold text-muted-foreground hover:text-azur-red">
          ← Mis solicitudes
        </Link>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-azur-ink">
          <ClipboardPlus className="h-6 w-6 text-azur-red" />
          Nueva solicitud de pago
        </h1>
        <p className="text-sm text-muted-foreground">
          Solicita un pago a proveedor, contratista, jornal o caja chica desde tu celular.
        </p>
      </header>

      {proyectos.length === 0 ? (
        <EmptyState
          icon={ClipboardPlus}
          title="No tienes proyectos asignados"
          description="Pide a tu jefe que te asigne a un proyecto activo desde el panel de Usuarios."
        />
      ) : (
        <NuevaSolicitudForm proyectos={proyectos} />
      )}
    </div>
  );
}
