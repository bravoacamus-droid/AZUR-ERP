'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Undo2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { fmtDate } from '@/lib/format';
import { revisarTareo } from '@/app/(pwa)/campo/tareo/actions';

type Row = { id: string; fecha: string; trabajador_nombre: string; presente: boolean; horas: number | null; horas_extra: number | null; tarifa_dia: number | null; estado: string };
const EST: Record<string, { label: string; variant: any }> = {
  registrado: { label: 'Registrado', variant: 'muted' },
  enviado: { label: 'Enviado · por aprobar', variant: 'info' },
  aprobado: { label: 'Aprobado', variant: 'success' },
  pagado: { label: 'Pagado', variant: 'secondary' },
};

export function TareoRevision({ tareo, proyectoId, userRol }: { tareo: Row[]; proyectoId: string; userRol: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const puedeAprobar = userRol === 'jefe_proyectos' || userRol === 'gerencia';

  const dias = useMemo(() => {
    const m = new Map<string, Row[]>();
    tareo.forEach((r) => { const a = m.get(r.fecha) ?? []; a.push(r); m.set(r.fecha, a); });
    return [...m.entries()].map(([fecha, filas]) => ({ fecha, filas })).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [tareo]);

  const enviadas = tareo.filter((r) => r.estado === 'enviado');
  const rangoEnviado = enviadas.length ? { desde: enviadas.reduce((m, r) => (r.fecha < m ? r.fecha : m), enviadas[0].fecha), hasta: enviadas.reduce((m, r) => (r.fecha > m ? r.fecha : m), enviadas[0].fecha) } : null;

  async function aprobar(desde: string, hasta: string, aprobado: boolean) {
    setBusy(true);
    const r = await revisarTareo(proyectoId, desde, hasta, aprobado);
    setBusy(false);
    if (!r.ok) alert(r.error); else router.refresh();
  }

  if (tareo.length === 0) return <EmptyState titulo="Sin tareo registrado" descripcion="El residente registra el tareo desde la app de campo." />;

  return (
    <div className="space-y-3">
      {puedeAprobar && rangoEnviado && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
            <p className="text-sm"><strong>{enviadas.length}</strong> registro(s) de tareo por aprobar ({fmtDate(rangoEnviado.desde)} – {fmtDate(rangoEnviado.hasta)}).</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => aprobar(rangoEnviado.desde, rangoEnviado.hasta, false)}><Undo2 className="size-3.5" /> Devolver</Button>
              <Button size="sm" variant="gradient" disabled={busy} onClick={() => aprobar(rangoEnviado.desde, rangoEnviado.hasta, true)}>{busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Aprobar todo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {dias.map(({ fecha, filas }) => {
        const est = EST[filas[0]?.estado] ?? EST.registrado;
        const extras = filas.filter((f) => Number(f.horas_extra) > 0).length;
        return (
          <Card key={fecha}>
            <CardContent className="p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold">{fmtDate(fecha)}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{filas.length} trab.{extras ? ` · ${extras} c/extra` : ''}</span>
                  <Badge variant={est.variant}>{est.label}</Badge>
                </div>
              </div>
              <div className="divide-y">
                {filas.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-1 text-sm">
                    <span className={f.presente ? '' : 'text-azur-600 line-through'}>{f.trabajador_nombre}</span>
                    <span className="text-xs text-muted-foreground">{f.horas ?? 0} h{Number(f.horas_extra) > 0 ? ` + ${f.horas_extra} extra` : ''}</span>
                  </div>
                ))}
              </div>
              {puedeAprobar && filas[0]?.estado === 'enviado' && (
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => aprobar(fecha, fecha, true)}><CheckCircle2 className="size-3.5" /> Aprobar este día</Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
