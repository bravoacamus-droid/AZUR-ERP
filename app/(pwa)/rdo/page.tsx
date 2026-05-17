import Link from 'next/link';
import { Calendar, ClipboardSignature, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { RdoForm } from './rdo-form';

export const metadata = { title: 'RDO · Parte diario' };
export const dynamic = 'force-dynamic';

export default async function RdoPage() {
  const session = await requireSession();
  const supabase = createClient();

  // Proyectos del usuario
  const { data: asignados } = await supabase
    .from('usuario_proyectos')
    .select('proyecto:proyecto_id(id, codigo, nombre)')
    .eq('user_id', session.userId)
    .eq('activo', true);

  let proyectos = (asignados ?? [])
    .map((a) => (Array.isArray(a.proyecto) ? a.proyecto[0] : a.proyecto))
    .filter(Boolean) as Array<{ id: string; codigo: string; nombre: string }>;

  // Si es mando o residente sin asignación, mostrar todos los activos
  if (
    proyectos.length === 0 ||
    ['gerencia_general', 'jefe_proyectos', 'jefe_presupuestos'].includes(session.rol)
  ) {
    const { data: all } = await supabase
      .from('proyectos')
      .select('id, codigo, nombre')
      .neq('estado', 'cancelado')
      .order('codigo', { ascending: false })
      .limit(20);
    if (proyectos.length === 0) proyectos = all ?? [];
  }

  // Últimos 7 partes
  const { data: ultimos } = await supabase
    .from('rdo_partes')
    .select('id, codigo, fecha, resumen, clima, personal_total, proyecto:proyecto_id(codigo, nombre)')
    .order('fecha', { ascending: false })
    .limit(7);

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <Link href="/inicio" className="text-xs font-semibold text-muted-foreground hover:text-azur-red">
          ← Inicio
        </Link>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-azur-ink">
          <ClipboardSignature className="h-6 w-6 text-azur-red" />
          Parte diario de obra
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra resumen, clima, personal y observaciones del día.
        </p>
      </header>

      {proyectos.length === 0 ? (
        <EmptyState icon={ClipboardSignature} title="Sin proyectos disponibles" />
      ) : (
        <RdoForm proyectos={proyectos} />
      )}

      {ultimos && ultimos.length > 0 && (
        <section className="azur-card space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-azur-ink">
            <FileText className="h-4 w-4" />
            Últimos partes
          </h2>
          <ul className="space-y-2">
            {ultimos.map((r) => {
              const p = Array.isArray(r.proyecto) ? r.proyecto[0] : r.proyecto;
              return (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-white p-3"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-azur-coral/20 text-azur-red">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[10px] text-azur-red">{r.codigo}</p>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(r.fecha).toLocaleDateString('es-PE', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    {p && <p className="text-xs text-muted-foreground">{p.codigo} · {p.nombre}</p>}
                    {r.resumen && (
                      <p className="mt-1 line-clamp-2 text-xs text-azur-ink">{r.resumen}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.clima && <Badge variant="coral">{r.clima}</Badge>}
                      {r.personal_total != null && r.personal_total > 0 && (
                        <Badge variant="outline">👷 {r.personal_total}</Badge>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
