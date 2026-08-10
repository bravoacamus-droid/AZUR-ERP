import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fmtDate, fmtMoney } from '@/lib/format';
import { montoDia } from '@/lib/tareo';
import { TareoPDF, type TareoPdfData, type TareoSemana, type TareoFila } from './tareo-pdf';

export const runtime = 'nodejs';

const isoHoy = () => new Date().toISOString().slice(0, 10);
const isoMenos = (dias: number) => new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);

// Lunes (ISO) de la fecha dada, como 'YYYY-MM-DD'.
function lunesDe(s: string): string {
  const d = new Date(s.slice(0, 10) + 'T00:00:00');
  const g = d.getDay();
  d.setDate(d.getDate() + (g === 0 ? -6 : 1 - g));
  return d.toISOString().slice(0, 10);
}
// Índice 0..6 (Lun..Dom) de una fecha.
function idxDia(s: string): number {
  const g = new Date(s.slice(0, 10) + 'T00:00:00').getDay();
  return g === 0 ? 6 : g - 1;
}
const sumaISO = (iso: string, dias: number) => new Date(new Date(iso + 'T00:00:00').getTime() + dias * 86400000).toISOString().slice(0, 10);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient() as any; // columnas de tareo aún no tipadas
  const url = new URL(req.url);
  const desde = url.searchParams.get('desde') || isoMenos(6);
  const hasta = url.searchParams.get('hasta') || isoHoy();
  const dl = url.searchParams.get('dl') === '1';

  const { data: proy } = await supabase.from('proyectos').select('nombre, codigo, direccion').eq('id', params.id).single();
  if (!proy) return new Response('No encontrado', { status: 404 });

  const { data: equipo } = await supabase.from('proyecto_equipo').select('profile:profiles(nombre, rol)').eq('proyecto_id', params.id);
  const supervisor = (equipo ?? []).map((e: any) => e.profile).find((p: any) => p?.rol === 'jefe_proyectos')?.nombre as string | undefined;

  const { data: filas } = await supabase.from('tareo')
    .select('fecha, trabajador_id, trabajador_nombre, presente, horas, horas_extra, jornal_semana')
    .eq('proyecto_id', params.id).gte('fecha', desde).lte('fecha', hasta).order('fecha');

  // Agrupa: semana (lunes) → trabajador → matriz Lun..Dom.
  const semMap = new Map<string, Map<string, TareoFila>>();
  (filas ?? []).forEach((r: any) => {
    if (!r.presente) return;
    const lun = lunesDe(r.fecha);
    const di = idxDia(r.fecha);
    const key = r.trabajador_id || `n:${r.trabajador_nombre}`;
    const trabMap = semMap.get(lun) ?? new Map<string, TareoFila>();
    const fila = trabMap.get(key) ?? { nombre: r.trabajador_nombre, dias: Array(7).fill(null), extra: Array(7).fill(null), totalH: 0, totalExtra: 0, monto: 0 };
    const h = Number(r.horas ?? 0);
    const e = Number(r.horas_extra ?? 0);
    fila.dias[di] = (fila.dias[di] ?? 0) + h;
    if (e) fila.extra[di] = (fila.extra[di] ?? 0) + e;
    fila.totalH += h;
    fila.totalExtra += e;
    fila.monto += montoDia(Number(r.jornal_semana ?? 0), h, e);
    trabMap.set(key, fila);
    semMap.set(lun, trabMap);
  });

  const semanas: TareoSemana[] = [...semMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lun, trabMap]) => {
      const flist = [...trabMap.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
      return {
        label: `Semana del ${fmtDate(lun)} al ${fmtDate(sumaISO(lun, 6))}`,
        filas: flist,
        totalMonto: flist.reduce((s, f) => s + f.monto, 0),
      };
    });

  const d: TareoPdfData = {
    proyecto: proy.nombre,
    codigo: proy.codigo ?? '',
    ubicacion: proy.direccion ?? undefined,
    supervisor,
    desde: fmtDate(desde),
    hasta: fmtDate(hasta),
    semanas,
    totalMonto: semanas.reduce((s, w) => s + w.totalMonto, 0),
    fmtMoney,
  };

  const buffer = await renderToBuffer(createElement(TareoPDF as never, { d }) as never);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${dl ? 'attachment' : 'inline'}; filename="Tareo-${proy.codigo ?? ''}-${desde}_a_${hasta}.pdf"`,
    },
  });
}
