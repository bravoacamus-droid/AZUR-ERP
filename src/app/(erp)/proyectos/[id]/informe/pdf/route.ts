import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fmtDate } from '@/lib/format';
import { armarArbol, calcularValorizacion, type ItemValor, type NodoArbol } from '@/lib/calc';
import { InformePDF, type InformePdfData, type InformeRow, type InformeGaleria } from './informe-pdf';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: proy } = await supabase
    .from('proyectos')
    .select('*, cliente:clientes(razon_social, ubicacion)')
    .eq('id', params.id)
    .single();
  if (!proy) return new Response('No encontrado', { status: 404 });

  const [{ data: items }, { data: vals }, { data: evidencias }, { data: adicionales }, { data: partes }] = await Promise.all([
    supabase.from('proyecto_items').select('*').eq('proyecto_id', params.id).order('orden'),
    supabase.from('valorizaciones').select('*, valorizacion_items(*)').eq('proyecto_id', params.id).order('numero'),
    supabase.from('evidencias').select('*, partida:proyecto_items(titulo, item_codigo)').eq('proyecto_id', params.id).order('tomada_en', { ascending: false }),
    supabase.from('adicionales_deductivos').select('*').eq('proyecto_id', params.id).eq('estado', 'aprobado'),
    supabase.from('partes_diarios').select('fecha, observaciones').eq('proyecto_id', params.id).not('observaciones', 'is', null).order('fecha', { ascending: false }).limit(5),
  ]);

  const proyItems = (items ?? []) as any[];
  const valsSorted = [...((vals ?? []) as any[])].sort((a, b) => a.numero - b.numero);

  // Árbol de partidas y avances acumulados por hoja (pct por valorización en orden).
  const arbol = armarArbol(proyItems as unknown as ItemValor[]);
  const avances = new Map<string, number[]>();
  proyItems.forEach((it) => { if (it.es_hoja) avances.set(it.id, Array(valsSorted.length).fill(0)); });
  valsSorted.forEach((v, idx) => {
    ((v.valorizacion_items as any[]) ?? []).forEach((vi) => {
      const arr = avances.get(vi.proyecto_item_id);
      if (arr) arr[idx] = Number(vi.pct_avance);
    });
  });
  const calc = calcularValorizacion(arbol, avances, valsSorted.length);

  // Filas del resumen: raíces (partidas generales, en negrita) + sus hojas.
  const rows: InformeRow[] = [];
  function walk(nodo: NodoArbol<ItemValor>) {
    const c = calc.get(nodo.data.id);
    const esGeneral = !nodo.esHoja;
    rows.push({
      titulo: nodo.data.titulo,
      codigo: nodo.data.item_codigo ?? undefined,
      esGeneral,
      pctAcum: c?.pct_acumulado ?? 0,
      valorizado: c?.valorizado_acum ?? 0,
      saldo: c?.saldo ?? 0,
    });
    nodo.hijos.forEach(walk);
  }
  arbol.forEach(walk);

  // Resumen económico.
  const contrato = Number(proy.contrato_total ?? 0);
  const valorizadoAcum = valsSorted.reduce((a, v) => a + Number(v.monto_valorizado ?? 0), 0);
  const ads = (adicionales ?? []) as any[];
  const adicionalesAprob = ads.filter((a) => a.tipo === 'adicional').reduce((a, x) => a + Number(x.monto ?? 0), 0);
  const deductivosAprob = ads.filter((a) => a.tipo === 'deductivo').reduce((a, x) => a + Number(x.monto ?? 0), 0);

  // Galería de evidencias agrupada por partida.
  const grupos = new Map<string, InformeGaleria>();
  ((evidencias ?? []) as any[]).forEach((e) => {
    const part = e.partida as { titulo?: string; item_codigo?: string } | null;
    const key = part?.titulo ?? 'General';
    const label = part?.titulo ? `${part.item_codigo ? `${part.item_codigo} · ` : ''}${part.titulo}` : 'General';
    if (!grupos.has(key)) grupos.set(key, { partida: label, fotos: [] });
    grupos.get(key)!.fotos.push({
      url: e.url,
      fecha: fmtDate(e.tomada_en ?? e.created_at),
      descripcion: e.descripcion,
    });
  });
  const galeria = [...grupos.values()];

  // Notas: observaciones de los últimos partes diarios.
  const notas = ((partes ?? []) as any[])
    .filter((p) => p.observaciones && String(p.observaciones).trim())
    .map((p) => ({ fecha: fmtDate(p.fecha), texto: String(p.observaciones).trim() }));

  const cliente = proy.cliente as { razon_social?: string; ubicacion?: string } | null;

  const d: InformePdfData = {
    proyecto: proy.nombre,
    codigo: proy.codigo ?? '',
    cliente: cliente?.razon_social ?? '',
    direccion: proy.direccion ?? cliente?.ubicacion ?? '',
    fechaInforme: fmtDate(new Date()),
    periodo: valsSorted.length
      ? `Al corte ${fmtDate(valsSorted[valsSorted.length - 1].fecha_corte)} · ${valsSorted.length} valorización(es)`
      : 'Sin valorizaciones registradas',
    rows,
    contrato,
    valorizadoAcum,
    porCobrar: contrato - valorizadoAcum,
    adicionales: adicionalesAprob,
    deductivos: deductivosAprob,
    galeria,
    notas,
  };

  const buffer = await renderToBuffer(createElement(InformePDF as any, { d }) as any);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Informe-${proy.codigo ?? params.id}.pdf"`,
    },
  });
}
