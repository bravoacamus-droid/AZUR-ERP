import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
import { CajaDetalle } from './caja-detalle';

export const dynamic = 'force-dynamic';

export default async function CajaPage({ params }: { params: { id: string } }) {
  const session = await requireRol(['gerencia', 'jefe_proyectos', 'administrador']);
  const supabase = createClient();

  const { data: caja } = await supabase.from('v_cajas_saldos').select('*').eq('caja_id', params.id).single();
  if (!caja) notFound();

  const [{ data: movimientos }, { data: cajas }] = await Promise.all([
    supabase
      .from('movimientos_caja')
      .select('*, autor:profiles!movimientos_caja_created_by_fkey(nombre)')
      .eq('caja_id', params.id)
      .order('created_at', { ascending: false }),
    supabase.from('v_cajas_saldos').select('caja_id, nombre, tipo').neq('caja_id', params.id),
  ]);

  return (
    <div className="space-y-4">
      <Link href="/finanzas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a Finanzas
      </Link>
      <CajaDetalle
        caja={caja}
        movimientos={movimientos ?? []}
        otrasCajas={cajas ?? []}
        canManage={['gerencia', 'administrador'].includes(session.rol)}
      />
    </div>
  );
}
