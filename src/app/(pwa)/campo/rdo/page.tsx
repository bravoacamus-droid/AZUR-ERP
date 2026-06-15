import Link from 'next/link';
import { ChevronLeft, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { fmtDate, fmtDateInput } from '@/lib/format';
import { EmptyState } from '@/components/ui/misc';
import { RdoForm } from './rdo-form';

export const dynamic = 'force-dynamic';

export default async function RdoPage() {
  const session = await requireSession();
  const supabase = createClient();

  const [{ data: proyectos }, { data: partidas }, { data: partesRaw }] = await Promise.all([
    supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
    supabase.from('proyecto_items').select('id, titulo, proyecto_id').eq('es_hoja', true).order('orden'),
    supabase
      .from('partes_diarios')
      .select('id, fecha, clima, personal_count, proyecto_id, proyectos(nombre)')
      .eq('created_by', session.id)
      .order('fecha', { ascending: false })
      .limit(10),
  ]);

  type ParteRow = {
    id: string;
    fecha: string;
    clima: string | null;
    personal_count: number | null;
    proyectos: { nombre: string } | null;
  };
  const partes = (partesRaw ?? []) as unknown as ParteRow[];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/campo" className="mb-1 inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Campo
        </Link>
        <h1 className="text-xl font-bold">Parte diario de obra</h1>
      </div>

      <RdoForm proyectos={proyectos ?? []} partidas={partidas ?? []} hoy={fmtDateInput(new Date())} />

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <ClipboardList className="size-4 text-azur-600" />
          <p className="text-sm font-semibold">Mis últimos partes</p>
        </div>
        {partes.length === 0 ? (
          <EmptyState titulo="Sin partes" descripcion="Aún no has registrado partes diarios." />
        ) : (
          <ul className="divide-y">
            {partes.map((p) => {
              const proy = p.proyectos;
              return (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{proy?.nombre ?? 'Proyecto'}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(p.fecha)}
                      {p.clima ? ` · ${p.clima}` : ''}
                    </p>
                  </div>
                  {p.personal_count != null && (
                    <span className="shrink-0 text-xs text-muted-foreground">{p.personal_count} pers.</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
