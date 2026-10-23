'use client';

import * as React from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, Cell, LabelList } from 'recharts';
import { ArrowRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fmtMoney, fmtDate } from '@/lib/format';
import { ESTADOS_COMERCIALES, ESTADO_COMERCIAL_META, type EstadoComercial } from '@/lib/estado-comercial';
import type { DashComercial, CotizacionDash } from '@/lib/dashboard-comercial-tipos';
import { C, ChartCard, StatTile, ejeProps, etiquetaDerecha, fmtK, leyendaTexto, pct, tickUnaLinea } from '@/components/dashboard/charts';

type Moneda = 'PEN' | 'USD';
const SERIES = [C.plan, C.real, C.tercera, '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

// "Sin tipo de servicio" (cotizaciones antiguas) siempre al final, para no tapar los servicios reales.
const sinTipoAlFinal = (a: string, b: string) => Number(a === 'Sin tipo de servicio') - Number(b === 'Sin tipo de servicio');

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${activo ? 'border-foreground bg-foreground text-white' : 'bg-white hover:bg-secondary'}`}>
      {children}
    </button>
  );
}

export function DashComercialView({ d }: { d: DashComercial }) {
  const [estado, setEstado] = React.useState<EstadoComercial | 'todos'>('todos');
  const [moneda, setMoneda] = React.useState<Moneda>('PEN');
  const m = (v: number) => fmtMoney(v, moneda);
  const mk = (v: number) => `${moneda === 'USD' ? 'US$' : 'S/'} ${fmtK(v)}`;

  // La moneda filtra todo; el estado filtra todo salvo el propio embudo.
  const enMoneda = d.cotizaciones.filter((c) => c.moneda === moneda);
  const filtradas = estado === 'todos' ? enMoneda : enMoneda.filter((c) => c.estado === estado);
  const total = filtradas.reduce((a, c) => a + c.importe, 0);
  const aceptadas = filtradas.filter((c) => c.estado === 'aceptada');
  const decididas = enMoneda.filter((c) => ['aceptada', 'rechazada', 'vencida'].includes(c.estado));
  const conversion = decididas.length ? enMoneda.filter((c) => c.estado === 'aceptada').length / decididas.length : null;

  // Estados visibles: los 7 del informe + Enviada/Vencida solo si hay cotizaciones.
  const visibles = ESTADOS_COMERCIALES.filter((e) => !e.extra || d.cotizaciones.some((c) => c.estado === e.k));
  const embudo = visibles.map((e) => {
    const cs = enMoneda.filter((c) => c.estado === e.k);
    const imp = cs.reduce((a, c) => a + c.importe, 0);
    return { ...e, n: cs.length, importe: imp, ticket: cs.length ? imp / cs.length : 0 };
  });
  const maxN = Math.max(1, ...embudo.map((e) => e.n));

  // 1 · Por línea de negocio (color fijo por línea, no por ranking)
  const colorLinea = new Map(d.lineas.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map((l, i) => [l.id, SERIES[i % SERIES.length]]));
  const agrupar = (key: 'linea' | 'servicio', rows: CotizacionDash[]) => {
    const mp = new Map<string, { nombre: string; linea_id: string | null; n: number; importe: number }>();
    rows.forEach((c) => {
      const k = key === 'linea' ? (c.linea_id ?? '_') : `${c.linea_id ?? '_'}|${c.servicio_id ?? '_'}`;
      const f = mp.get(k) ?? { nombre: key === 'linea' ? c.linea : c.servicio, linea_id: c.linea_id, n: 0, importe: 0 };
      f.n += 1; f.importe += c.importe; mp.set(k, f);
    });
    return [...mp.values()];
  };
  const porLinea = agrupar('linea', filtradas).sort((a, b) => b.importe - a.importe);
  const porServicio = agrupar('servicio', filtradas);
  const serviciosTotales = (() => {
    const mp = new Map<string, { nombre: string; n: number; importe: number }>();
    filtradas.forEach((c) => { const f = mp.get(c.servicio) ?? { nombre: c.servicio, n: 0, importe: 0 }; f.n += 1; f.importe += c.importe; mp.set(c.servicio, f); });
    return [...mp.values()].sort((a, b) => sinTipoAlFinal(a.nombre, b.nombre) || b.n - a.n || b.importe - a.importe);
  })();
  const maxServ = Math.max(1, ...porServicio.map((s) => s.importe));

  // Evolución mensual (moneda y estado aplicados a "creadas")
  const meses = (() => {
    const mp = new Map<string, { creadas: number; aceptadas: number }>();
    filtradas.forEach((c) => {
      const k = c.fecha.slice(0, 7); if (!k) return;
      const f = mp.get(k) ?? { creadas: 0, aceptadas: 0 };
      f.creadas += 1; if (c.estado === 'aceptada') f.aceptadas += 1; mp.set(k, f);
    });
    return [...mp.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([k, v]) => ({ mes: `${MESES[Number(k.slice(5, 7)) - 1]} ${k.slice(2, 4)}`, ...v }));
  })();

  const lista = estado === 'todos' ? [] : filtradas.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const estadoLabel = estado === 'todos' ? 'Todos' : ESTADO_COMERCIAL_META[estado].label;

  return (
    <div className="space-y-4">
      {/* Filtros generales: afectan todas las vistas */}
      <div className="space-y-2 rounded-xl border bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-xs font-medium text-muted-foreground">Estado</span>
          <Chip activo={estado === 'todos'} onClick={() => setEstado('todos')}>Todos</Chip>
          {visibles.map((e) => <Chip key={e.k} activo={estado === e.k} onClick={() => setEstado(e.k)}>{e.label}</Chip>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-xs font-medium text-muted-foreground">Moneda</span>
          <Chip activo={moneda === 'PEN'} onClick={() => setMoneda('PEN')}>Soles (S/)</Chip>
          <Chip activo={moneda === 'USD'} onClick={() => setMoneda('USD')}>Dólares (US$)</Chip>
          <span className="text-[11px] text-muted-foreground">Cotizaciones emitidas en esa moneda (los importes no se mezclan).</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile etiqueta="Importe cotizado" valor={m(total)} sub={`Estado: ${estadoLabel}`} />
        <StatTile etiqueta="N.º de cotizaciones" valor={String(filtradas.length)} />
        <StatTile etiqueta="Ticket promedio" valor={m(filtradas.length ? total / filtradas.length : 0)} />
        <StatTile etiqueta="Aceptadas (importe)" valor={m(aceptadas.reduce((a, c) => a + c.importe, 0))} sub={`Conversión ${pct(conversion)} de las cerradas`} />
      </div>

      {/* Pipeline / embudo por estado: clic en un estado → filtra todo y lista sus cotizaciones */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Pipeline por estado — {moneda === 'USD' ? 'Dólares (US$)' : 'Soles (S/)'}</CardTitle>
          <p className="text-xs text-muted-foreground">Haz clic en un estado para filtrar todo el dashboard y ver el detalle de sus cotizaciones.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b"><th className="px-4 py-2 text-left">Estado</th><th className="w-[38%] px-2 py-2" /><th className="px-2 py-2 text-right">Cant.</th><th className="px-2 py-2 text-right">Importe</th><th className="px-4 py-2 text-right">Ticket prom.</th></tr>
              </thead>
              <tbody>
                {embudo.map((e) => {
                  const activo = estado === e.k;
                  return (
                    <tr key={e.k} onClick={() => setEstado(activo ? 'todos' : e.k)}
                      className={`cursor-pointer border-b last:border-0 hover:bg-secondary/60 ${activo ? 'bg-azur-50/60' : ''}`} title={`Ver cotizaciones ${e.label}`}>
                      <td className="px-4 py-2 font-medium"><span className={activo ? 'text-azur-700' : ''}>{e.label}</span></td>
                      <td className="px-2 py-2">
                        <div className="h-2.5 w-full rounded-full bg-slate-100">
                          <div className="h-2.5 rounded-full" style={{ width: `${(e.n / maxN) * 100}%`, backgroundColor: e.k === 'rechazada' ? C.critico : C.plan, opacity: estado === 'todos' || activo ? 1 : 0.35 }} />
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{e.n}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{m(e.importe)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{m(e.ticket)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {estado !== 'todos' && (
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">Cotizaciones · {estadoLabel} ({lista.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Link href={`/comercial?estado=${estado}`} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-azur-700 hover:bg-azur-50">Abrir en Comercial <ArrowRight className="size-3.5" /></Link>
              <button type="button" onClick={() => setEstado('todos')} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"><X className="size-3.5" /> Quitar filtro</button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No hay cotizaciones en este estado y moneda.</p> : (
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b"><th className="px-4 py-2 text-left">Código</th><th className="px-2 py-2 text-left">Proyecto</th><th className="px-2 py-2 text-left">Cliente</th><th className="px-2 py-2 text-left">Línea · servicio</th><th className="px-2 py-2 text-left">Fecha</th><th className="px-4 py-2 text-right">Importe</th></tr>
                  </thead>
                  <tbody>
                    {lista.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/40">
                        <td className="px-4 py-2 font-medium"><Link href={`/comercial/${c.id}`} className="text-azur-600 hover:underline">{c.codigo}</Link></td>
                        <td className="px-2 py-2"><Link href={`/comercial/${c.id}`} className="hover:underline">{c.proyecto}</Link></td>
                        <td className="px-2 py-2 text-muted-foreground">{c.cliente}</td>
                        <td className="px-2 py-2 text-xs text-muted-foreground">{c.linea} · {c.servicio}</td>
                        <td className="px-2 py-2 text-muted-foreground">{fmtDate(c.fecha)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{m(c.importe)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 1 · Por línea de negocio */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard titulo="Importe por línea de negocio" descripcion={`Suma de importes cotizados · estado ${estadoLabel.toLowerCase()} · ${moneda === 'USD' ? 'US$' : 'S/'}`}
          filas={porLinea} columnas={[{ k: 'n', label: 'Línea', v: (r) => r.nombre }, { k: 'c', label: 'Cotizaciones', v: (r) => r.n, right: true }, { k: 'i', label: 'Importe', v: (r) => m(r.importe), right: true }]}
          alto={Math.max(160, porLinea.length * 48 + 30)} vacio={porLinea.length ? null : 'Sin cotizaciones con este filtro.'}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porLinea} layout="vertical" margin={{ top: 4, right: 90, left: 8, bottom: 4 }}>
              <CartesianGrid stroke={C.grid} horizontal={false} />
              <XAxis type="number" {...ejeProps} tickFormatter={mk} />
              <YAxis type="category" dataKey="nombre" {...ejeProps} width={140} tick={tickUnaLinea(20)} />
              <Tooltip formatter={(v: number) => [m(v), 'Importe']} />
              <Bar dataKey="importe" radius={[0, 4, 4, 0]} barSize={18}>
                {porLinea.map((l, i) => <Cell key={i} fill={colorLinea.get(l.linea_id ?? '') ?? C.muted} />)}
                <LabelList dataKey="importe" content={etiquetaDerecha(mk)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard titulo="Cantidad de cotizaciones por línea" descripcion="Número de cotizaciones de cada línea con el filtro aplicado."
          filas={porLinea} columnas={[{ k: 'n', label: 'Línea', v: (r) => r.nombre }, { k: 'c', label: 'Cotizaciones', v: (r) => r.n, right: true }]}
          alto={Math.max(160, porLinea.length * 48 + 30)} vacio={porLinea.length ? null : 'Sin cotizaciones con este filtro.'}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porLinea} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
              <CartesianGrid stroke={C.grid} horizontal={false} />
              <XAxis type="number" {...ejeProps} allowDecimals={false} />
              <YAxis type="category" dataKey="nombre" {...ejeProps} width={140} tick={tickUnaLinea(20)} />
              <Tooltip formatter={(v: number) => [`${v} cotización(es)`, 'Cantidad']} />
              <Bar dataKey="n" radius={[0, 4, 4, 0]} barSize={18}>
                {porLinea.map((l, i) => <Cell key={i} fill={colorLinea.get(l.linea_id ?? '') ?? C.muted} />)}
                <LabelList dataKey="n" content={etiquetaDerecha((v) => String(v))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2 · Por tipo de servicio */}
      <ChartCard titulo="Cotizaciones por tipo de servicio" descripcion={`Cantidad por servicio · estado ${estadoLabel.toLowerCase()} · ${moneda === 'USD' ? 'US$' : 'S/'}`}
        filas={serviciosTotales} columnas={[{ k: 'n', label: 'Tipo de servicio', v: (r) => r.nombre }, { k: 'c', label: 'Cotizaciones', v: (r) => r.n, right: true }, { k: 'i', label: 'Importe', v: (r) => m(r.importe), right: true }]}
        alto={Math.max(180, serviciosTotales.length * 34 + 30)} vacio={serviciosTotales.length ? null : 'Sin cotizaciones con este filtro.'}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serviciosTotales} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
            <CartesianGrid stroke={C.grid} horizontal={false} />
            <XAxis type="number" {...ejeProps} allowDecimals={false} />
            <YAxis type="category" dataKey="nombre" {...ejeProps} width={210} tick={tickUnaLinea(32)} />
            <Tooltip formatter={(v: number, _k: string, it: any) => [`${v} cotización(es) · ${m(it.payload.importe)}`, 'Cantidad']} />
            <Bar dataKey="n" fill={C.plan} radius={[0, 4, 4, 0]} barSize={14}>
              <LabelList dataKey="n" content={etiquetaDerecha((v) => String(v))} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Importes por tipo de servicio — {moneda === 'USD' ? 'Dólares (US$)' : 'Soles (S/)'}</CardTitle>
          <p className="text-xs text-muted-foreground">Servicios agrupados por su línea de negocio. La barra compara importes entre todos los servicios; % = participación en el importe total del filtro.</p>
        </CardHeader>
        <CardContent className="p-0">
          {porServicio.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Sin cotizaciones con este filtro.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b"><th className="px-4 py-2 text-left">Línea / servicio</th><th className="px-2 py-2 text-right">Cant.</th><th className="w-[30%] px-2 py-2" /><th className="px-2 py-2 text-right">Importe</th><th className="px-4 py-2 text-right">%</th></tr>
                </thead>
                <tbody>
                  {porLinea.map((l) => {
                    const servs = porServicio.filter((s) => (s.linea_id ?? null) === (l.linea_id ?? null)).sort((a, b) => sinTipoAlFinal(a.nombre, b.nombre) || b.importe - a.importe);
                    return (
                      <React.Fragment key={l.linea_id ?? '_'}>
                        <tr className="border-b bg-muted/40 font-semibold">
                          <td className="px-4 py-2"><span className="mr-2 inline-block size-2.5 rounded-sm align-middle" style={{ backgroundColor: colorLinea.get(l.linea_id ?? '') ?? C.muted }} />{l.nombre}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{l.n}</td><td />
                          <td className="px-2 py-2 text-right tabular-nums">{m(l.importe)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{pct(total > 0 ? l.importe / total : 0, 1)}</td>
                        </tr>
                        {servs.map((s) => (
                          <tr key={s.nombre} className="border-b last:border-0">
                            <td className="py-1.5 pl-9 pr-2">{s.nombre}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{s.n}</td>
                            <td className="px-2 py-1.5"><div className="h-2 w-full rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${Math.max(1, (s.importe / maxServ) * 100)}%`, backgroundColor: colorLinea.get(l.linea_id ?? '') ?? C.muted }} /></div></td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{m(s.importe)}</td>
                            <td className="px-4 py-1.5 text-right tabular-nums text-muted-foreground">{pct(total > 0 ? s.importe / total : 0, 1)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ChartCard titulo="Evolución mensual" descripcion="Cotizaciones creadas vs aceptadas por mes, con el filtro aplicado."
        filas={meses} columnas={[{ k: 'm', label: 'Mes', v: (r) => r.mes }, { k: 'c', label: 'Creadas', v: (r) => r.creadas, right: true }, { k: 'a', label: 'Aceptadas', v: (r) => r.aceptadas, right: true }]}
        vacio={meses.length ? null : 'Sin cotizaciones con este filtro.'}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={meses} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="mes" {...ejeProps} />
            <YAxis {...ejeProps} allowDecimals={false} width={32} />
            <Tooltip />
            <Legend formatter={leyendaTexto} />
            <Line type="monotone" dataKey="creadas" name="Creadas" stroke={C.plan} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="aceptadas" name="Aceptadas" stroke={C.tercera} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <p className="text-[11px] text-muted-foreground">Importe = total de la cotización con descuento (el mismo del PDF). Estados: “En revisión / Aprobada / Observada” vienen de la revisión de Costos y Presupuestos.</p>
    </div>
  );
}
