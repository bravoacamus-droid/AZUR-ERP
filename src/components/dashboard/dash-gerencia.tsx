'use client';

import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList, ReferenceLine } from 'recharts';
import { Select } from '@/components/ui/select';
import { fmtMoney } from '@/lib/format';
import type { DashData } from '@/lib/dashboards-tipos';
import { TRAMOS } from '@/lib/dashboards-tipos';
import { C, RAMPA_ANTIG, ChartCard, StatTile, ejeProps, etiquetaArriba, etiquetaDerecha, fmtK, fmtSoles, leyendaTexto, pct, tickUnaLinea } from './charts';

type Periodo = 'ytd' | '12m' | 'todo';
const PERIODOS: { v: Periodo; l: string }[] = [{ v: 'ytd', l: 'Año a la fecha' }, { v: '12m', l: 'Últimos 12 meses' }, { v: 'todo', l: 'Todo el historial' }];

function desdePeriodo(p: Periodo, hoy: string): string | null {
  if (p === 'todo') return null;
  if (p === 'ytd') return `${hoy.slice(0, 4)}-01-01`;
  const d = new Date(hoy + 'T00:00:00'); d.setFullYear(d.getFullYear() - 1); d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const ACTIVOS = ['en_ejecucion', 'pausado', 'cerrado', 'liquidado'];
const TERMINADOS = ['cerrado', 'liquidado'];

export function DashGerencia({ d }: { d: DashData }) {
  const [periodo, setPeriodo] = React.useState<Periodo>('ytd');
  const [proyFin, setProyFin] = React.useState('');
  const [inclEjec, setInclEjec] = React.useState(false);
  const desde = desdePeriodo(periodo, d.hoy);
  const enPeriodo = (f: string) => !desde || f >= desde;
  const activos = d.proyectos.filter((p) => ACTIVOS.includes(p.estado) || p.ac > 0 || p.ev > 0);

  // 1 · Utilidad por proyecto (terminados; opcional en ejecución)
  const util = d.proyectos
    .filter((p) => TERMINADOS.includes(p.estado) || (inclEjec && p.estado === 'en_ejecucion'))
    .map((p) => ({ nombre: p.etiqueta, proy: p.utilProy, real: p.utilReal, proyPct: p.utilProyPct, realPct: p.utilRealPct, estado: p.estado }))
    .sort((a, b) => b.real - a.real);

  // 2 · Estado financiero (acumulado o un proyecto), todo como % del costo directo comercial
  const base = proyFin ? d.proyectos.filter((p) => p.id === proyFin) : activos;
  const cd = base.reduce((a, p) => a + (p.costoComercial ?? p.bac), 0);
  const acT = base.reduce((a, p) => a + p.ac, 0);
  const bacT = base.reduce((a, p) => a + p.bac, 0);
  const evT = base.reduce((a, p) => a + p.ev, 0);
  const estFin = [
    { k: 'Costo directo sin margen (comercial)', v: cd > 0 ? 1 : 0, monto: cd, color: C.plan, etiqueta: fmtSoles(cd) },
    { k: 'Costo real (finanzas)', v: cd > 0 ? acT / cd : 0, monto: acT, color: C.real, etiqueta: `${fmtSoles(acT)} · ${pct(cd > 0 ? acT / cd : 0)}` },
    { k: '% de avance (valorizaciones)', v: bacT > 0 ? evT / bacT : 0, monto: evT, color: C.tercera, etiqueta: pct(bacT > 0 ? evT / bacT : 0) },
  ];

  // 3 · Cumplimiento de plazos
  const plazos = d.proyectos
    .filter((p) => p.durPlan != null || p.durReal != null || (p.plazoComercial != null && ACTIVOS.includes(p.estado)))
    .map((p) => ({ nombre: p.etiqueta, comercial: p.plazoComercial ?? 0, proyectado: p.durPlan ?? 0, real: p.durReal ?? 0, retraso: p.retrasoDias, costo: p.costoRetraso }))
    .sort((a, b) => (b.retraso ?? -999) - (a.retraso ?? -999));
  const colorReal = (r: { proyectado: number; real: number }) => (!r.proyectado || !r.real ? C.eje : r.real <= r.proyectado ? C.bien : r.real <= r.proyectado * 1.1 ? C.serio : C.critico);

  // 4 · Flujo de caja (periodo)
  const fl = d.flujo.filter((m) => enPeriodo(m.fecha));
  const ingresos = fl.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
  const egresos = fl.filter((m) => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0);
  const neto = ingresos - egresos;
  const flujoProy = d.proyectos.map((p) => {
    const ing = fl.filter((m) => m.proyecto_id === p.id && m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
    const egr = fl.filter((m) => m.proyecto_id === p.id && m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0);
    return { nombre: p.etiqueta, ingresos: ing, egresos: egr, neto: ing - egr };
  }).filter((x) => x.ingresos > 0 || x.egresos > 0).sort((a, b) => b.ingresos + b.egresos - (a.ingresos + a.egresos)).slice(0, 8);

  // 5 · Cuentas por cobrar
  const cxcTot = TRAMOS.reduce((acc, t) => ({ ...acc, [t.k]: d.cxc.reduce((a, c) => a + c.tramos[t.k], 0) }), {} as Record<string, number>);
  const cxcTotal = Object.values(cxcTot).reduce((a, b) => a + b, 0);
  const cxcGeneral = [{ nombre: 'CxC total', ...cxcTot }];
  const cxcProy = d.cxc.map((c) => ({ nombre: c.etiqueta, ...c.tramos, total: c.total })).slice(0, 10);

  // 6 · Rentabilidad por negocio (ventas cerradas en el periodo)
  const vs = d.ventas.filter((v) => enPeriodo(v.fecha));
  const ventaTot = vs.reduce((a, v) => a + v.venta, 0);
  const costoTot = vs.reduce((a, v) => a + v.costo, 0);
  const agrupa = (key: 'linea_id' | 'servicio_id', nombres: Map<string, string>, sinNombre: string) => {
    const m = new Map<string, { nombre: string; venta: number; costo: number; n: number }>();
    vs.forEach((v) => {
      const k = v[key] ?? '_';
      const f = m.get(k) ?? { nombre: nombres.get(k) ?? sinNombre, venta: 0, costo: 0, n: 0 };
      f.venta += v.venta; f.costo += v.costo; f.n += 1; m.set(k, f);
    });
    return [...m.values()].map((f) => ({ ...f, margen: f.venta > 0 ? (f.venta - f.costo) / f.venta : 0 })).sort((a, b) => b.venta - a.venta);
  };
  const porLinea = agrupa('linea_id', new Map(d.lineas.map((l) => [l.id, l.nombre])), 'Sin línea');
  const porServicio = agrupa('servicio_id', new Map(d.servicios.map((s) => [s.id, s.nombre])), 'Sin tipo de servicio').slice(0, 8);

  // 7 · CAC por canal (periodo)
  const mesDesde = desde ? desde.slice(0, 7) : null;
  const invPer = d.cac.inversiones.filter((i) => !mesDesde || i.mes >= mesDesde);
  const cotPer = d.cac.cotizaciones.filter((c) => enPeriodo(c.fecha));
  const cac = d.cac.canales.map((c) => {
    const inversion = invPer.filter((i) => i.canal_id === c.id).reduce((a, i) => a + i.monto, 0);
    const leads = cotPer.filter((q) => q.canal_id === c.id).length;
    const ganados = new Set(cotPer.filter((q) => q.canal_id === c.id && q.estado === 'aceptada').map((q) => q.cliente_id ?? '')).size;
    return { nombre: c.nombre, inversion, leads, ganados, cac: ganados > 0 ? inversion / ganados : null };
  }).filter((c) => c.inversion > 0 || c.leads > 0);
  const invTotal = cac.reduce((a, c) => a + c.inversion, 0);
  const ganTotal = cac.reduce((a, c) => a + c.ganados, 0);
  const cacData = cac.map((c) => ({ ...c, pInv: invTotal > 0 ? c.inversion / invTotal : 0, pGan: ganTotal > 0 ? c.ganados / ganTotal : 0 }));

  return (
    <div className="space-y-4">
      {/* Fila única de filtros (arriba de todo lo que acotan) */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3 text-xs">
        <label className="min-w-[180px]"><span className="mb-0.5 block font-medium text-muted-foreground">Periodo (flujo, ventas y CAC)</span>
          <Select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>{PERIODOS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}</Select>
        </label>
        <label className="min-w-[240px] flex-1 sm:max-w-sm"><span className="mb-0.5 block font-medium text-muted-foreground">Proyecto (estado financiero)</span>
          <Select value={proyFin} onChange={(e) => setProyFin(e.target.value)}>
            <option value="">Acumulado de proyectos</option>
            {activos.map((p) => <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>)}
          </Select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" className="size-4 accent-azur-600" checked={inclEjec} onChange={(e) => setInclEjec(e.target.checked)} /> Incluir proyectos en ejecución en “Utilidad”</label>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* 1 · Utilidad */}
        <ChartCard
          titulo="1 · Utilidad por proyecto"
          descripcion={<>Proyectada (contrato ajustado − costo presupuestado) vs real (cobrado − gastado), de mayor a menor. {inclEjec ? 'Proyectos terminados y en ejecución.' : 'Solo proyectos terminados o liquidados.'}</>}
          filas={util}
          columnas={[
            { k: 'n', label: 'Proyecto', v: (r) => r.nombre },
            { k: 'p', label: 'Utilidad proyectada', v: (r) => `${fmtMoney(r.proy)} (${pct(r.proyPct)})`, right: true },
            { k: 'r', label: 'Utilidad real', v: (r) => `${fmtMoney(r.real)} (${pct(r.realPct)})`, right: true },
          ]}
          vacio={util.length ? null : 'Aún no hay proyectos terminados o liquidados. Marca “Incluir proyectos en ejecución” para ver los que están en curso.'}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={util} margin={{ top: 22, right: 8, left: 8, bottom: 8 }} barGap={2}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="nombre" {...ejeProps} interval={0} tick={tickUnaLinea(15, "middle")} />
              <YAxis {...ejeProps} tickFormatter={fmtSoles} width={86} />
              <ReferenceLine y={0} stroke={C.eje} />
              <Tooltip formatter={(v: number, k: string, it: any) => [`${fmtMoney(v)} (${pct(k === 'Utilidad proyectada' ? it.payload.proyPct : it.payload.realPct)})`, k]} />
              <Legend formatter={leyendaTexto} />
              <Bar dataKey="proy" name="Utilidad proyectada" fill={C.plan} radius={[4, 4, 0, 0]} maxBarSize={44}>
                {util.length <= 6 && <LabelList dataKey="proyPct" position="top" fontSize={10} fill={C.tinta2} formatter={(v: number) => pct(v)} />}
              </Bar>
              <Bar dataKey="real" name="Utilidad real" fill={C.real} radius={[4, 4, 0, 0]} maxBarSize={44}>
                {util.length <= 6 && <LabelList dataKey="realPct" position="top" fontSize={10} fill={C.tinta2} formatter={(v: number) => pct(v)} />}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2 · Estado financiero */}
        <ChartCard
          titulo="2 · Estado financiero por proyecto"
          descripcion={<>{proyFin ? base[0]?.nombre : 'Acumulado de proyectos'}: cuánto del costo directo comercial (sin margen) ya se gastó frente a cuánto se avanzó. Las tres barras en % del costo directo.</>}
          filas={estFin}
          columnas={[
            { k: 'k', label: 'Concepto', v: (r) => r.k },
            { k: 'm', label: 'Monto', v: (r) => (r.k.startsWith('%') ? `EV ${fmtMoney(r.monto)}` : fmtMoney(r.monto)), right: true },
            { k: 'v', label: '%', v: (r) => pct(r.v, 1), right: true },
          ]}
          vacio={cd > 0 || acT > 0 ? null : 'Sin costos presupuestados ni gastos para mostrar.'}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estFin} margin={{ top: 24, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="k" {...ejeProps} interval={0} tickFormatter={(v: string) => v.split(' (')[0]} />
              <YAxis {...ejeProps} tickFormatter={(v) => pct(v)} width={48} domain={[0, (max: number) => Math.max(1, Math.ceil(max * 10) / 10)]} />
              <Tooltip formatter={(v: number, _k: string, it: any) => [`${pct(v, 1)}${it.payload.k.startsWith('%') ? '' : ` · ${fmtMoney(it.payload.monto)}`}`, it.payload.k]} />
              <Bar dataKey="v" radius={[4, 4, 0, 0]} maxBarSize={90}>
                {estFin.map((e) => <Cell key={e.k} fill={e.color} />)}
                <LabelList dataKey="etiqueta" content={etiquetaArriba(String)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 3 · Plazos */}
      <ChartCard
        titulo="3 · Cumplimiento de plazos por proyecto"
        descripcion={<>Plazo cerrado en la cotización (comercial) vs plazo proyectado (línea base del cronograma) vs plazo real de obra, en días. Al final de la barra real: días de retraso y su costo (días de más × costo diario real).</>}
        filas={plazos}
        columnas={[
          { k: 'n', label: 'Proyecto', v: (r) => r.nombre },
          { k: 'c', label: 'Comercial', v: (r) => (r.comercial ? `${r.comercial} d` : '—'), right: true },
          { k: 'p', label: 'Proyectado', v: (r) => (r.proyectado ? `${r.proyectado} d` : '—'), right: true },
          { k: 'r', label: 'Real', v: (r) => (r.real ? `${r.real} d` : '—'), right: true },
          { k: 'x', label: 'Retraso', v: (r) => (r.retraso == null ? '—' : r.retraso > 0 ? `+${r.retraso} d` : 'En plazo'), right: true },
          { k: 'y', label: 'Costo del retraso', v: (r) => (r.costo ? fmtMoney(r.costo) : '—'), right: true },
        ]}
        alto={Math.max(220, plazos.length * 62 + 60)}
        vacio={plazos.length ? null : 'Aún no hay plazos registrados (cotización o cronograma).'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={plazos} layout="vertical" margin={{ top: 4, right: 130, left: 8, bottom: 4 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid stroke={C.grid} horizontal={false} />
            <XAxis type="number" {...ejeProps} tickFormatter={(v) => `${v} d`} />
            <YAxis type="category" dataKey="nombre" {...ejeProps} width={190} tick={tickUnaLinea(28)} />
            <Tooltip formatter={(v: number, k: string) => [`${v} días`, k]} />
            <Legend formatter={leyendaTexto} />
            <Bar dataKey="comercial" name="Plazo comercial (cotización)" fill={C.planClaro} radius={[0, 4, 4, 0]} barSize={10} />
            <Bar dataKey="proyectado" name="Plazo proyectado (cronograma)" fill={C.plan} radius={[0, 4, 4, 0]} barSize={10} />
            <Bar dataKey="real" name="Plazo real de obra (verde en plazo · naranja/rojo con retraso)" fill={C.muted} radius={[0, 4, 4, 0]} barSize={12}>
              {plazos.map((p, i) => <Cell key={i} fill={colorReal(p)} />)}
              <LabelList position="right" content={(props: any) => {
                const r = plazos[props.index];
                if (!r) return null;
                const txt = r.retraso == null ? '' : r.retraso > 0 ? `+${r.retraso} d · ${fmtSoles(r.costo ?? 0)}` : 'en plazo';
                return <text x={props.x + props.width + 6} y={props.y + props.height / 2 + 4} fontSize={11} fontWeight={600} fill={r.retraso && r.retraso > 0 ? C.critico : C.bien}>{txt}</text>;
              }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4 · Flujo de caja */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ChartCard
          titulo="4 · Flujo de caja general"
          descripcion={<>{PERIODOS.find((p) => p.v === periodo)?.l}: cobros del cliente vs pagos ejecutados (solicitudes pagadas + gastos de empresa).</>}
          filas={[{ c: 'Ingresos', v: ingresos }, { c: 'Egresos', v: egresos }, { c: 'Flujo neto', v: neto }]}
          columnas={[{ k: 'c', label: 'Concepto', v: (r) => r.c }, { k: 'v', label: 'Monto', v: (r) => fmtMoney(r.v), right: true }]}
          acciones={<span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${neto >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>Neto {neto >= 0 ? '+' : '−'}{fmtSoles(Math.abs(neto))} · {pct(ingresos > 0 ? neto / ingresos : null, 1)}</span>}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ c: 'Ingresos', v: ingresos }, { c: 'Egresos', v: egresos }]} margin={{ top: 24, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="c" {...ejeProps} />
              <YAxis {...ejeProps} tickFormatter={fmtSoles} width={86} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Bar dataKey="v" radius={[4, 4, 0, 0]} maxBarSize={110}>
                <Cell fill={C.tercera} /><Cell fill={C.real} />
                <LabelList dataKey="v" content={etiquetaArriba(fmtSoles)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          titulo="Flujo de caja por proyecto"
          descripcion="Ingresos y egresos de cada obra en el periodo; la etiqueta es el flujo neto."
          filas={flujoProy}
          columnas={[
            { k: 'n', label: 'Proyecto', v: (r) => r.nombre },
            { k: 'i', label: 'Ingresos', v: (r) => fmtMoney(r.ingresos), right: true },
            { k: 'e', label: 'Egresos', v: (r) => fmtMoney(r.egresos), right: true },
            { k: 'x', label: 'Neto', v: (r) => fmtMoney(r.neto), right: true },
          ]}
          vacio={flujoProy.length ? null : 'Sin movimientos de proyectos en el periodo.'}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={flujoProy} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barGap={2}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="nombre" {...ejeProps} interval={0} tick={tickUnaLinea(13, "middle")} />
              <YAxis {...ejeProps} tickFormatter={fmtSoles} width={86} />
              <Tooltip formatter={(v: number, k: string) => [fmtMoney(v), k]} />
              <Legend formatter={leyendaTexto} />
              <Bar dataKey="ingresos" name="Ingresos" fill={C.tercera} radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList position="top" content={(props: any) => {
                  const r = flujoProy[props.index];
                  if (!r) return null;
                  return <text x={props.x + props.width} y={props.y - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill={r.neto >= 0 ? '#006300' : C.critico}>{r.neto >= 0 ? '+' : '−'}{fmtK(Math.abs(r.neto))}</text>;
                }} />
              </Bar>
              <Bar dataKey="egresos" name="Egresos" fill={C.real} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 5 · Cuentas por cobrar */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ChartCard
          titulo="5 · Cuentas por cobrar por antigüedad"
          descripcion="Valorizaciones emitidas aún no cobradas (y facturas abiertas), por días desde su corte."
          filas={TRAMOS.map((t) => ({ t: t.label, v: cxcTot[t.k] ?? 0 }))}
          columnas={[{ k: 't', label: 'Antigüedad', v: (r) => r.t }, { k: 'v', label: 'Monto', v: (r) => fmtMoney(r.v), right: true }, { k: 'p', label: '%', v: (r) => pct(cxcTotal > 0 ? r.v / cxcTotal : 0), right: true }]}
          acciones={<span className="text-sm font-semibold">{fmtSoles(cxcTotal)}</span>}
          vacio={cxcTotal > 0 ? null : 'No hay cuentas por cobrar pendientes.'}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cxcGeneral} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="nombre" {...ejeProps} />
              <YAxis {...ejeProps} tickFormatter={fmtSoles} width={86} />
              <Tooltip formatter={(v: number, k: string) => [`${fmtMoney(v)} · ${pct(cxcTotal > 0 ? v / cxcTotal : 0)}`, k]} />
              <Legend formatter={leyendaTexto} />
              {TRAMOS.map((t, i) => (
                <Bar key={t.k} dataKey={t.k} name={t.label} stackId="a" fill={RAMPA_ANTIG[i]} maxBarSize={150} stroke="#fff" strokeWidth={2}>
                  <LabelList dataKey={t.k} position="center" content={(props: any) => {
                    const v = Number(props.value ?? 0);
                    if (!v || props.height < 22) return null;
                    return <text x={props.x + props.width / 2} y={props.y + props.height / 2 + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={i < 1 ? C.tinta : '#fff'}>{fmtK(v)} · {pct(v / cxcTotal)}</text>;
                  }} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          titulo="Cuentas por cobrar por proyecto"
          descripcion="De mayor a menor, con el mismo corte por antigüedad."
          filas={cxcProy}
          columnas={[{ k: 'n', label: 'Proyecto', v: (r) => r.nombre }, ...TRAMOS.map((t) => ({ k: t.k, label: t.label, v: (r: any) => fmtMoney(r[t.k]), right: true })), { k: 't', label: 'Total', v: (r) => fmtMoney(r.total), right: true }]}
          alto={Math.max(200, cxcProy.length * 44 + 60)}
          vacio={cxcProy.length ? null : 'No hay cuentas por cobrar pendientes.'}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cxcProy} layout="vertical" margin={{ top: 4, right: 70, left: 8, bottom: 4 }}>
              <CartesianGrid stroke={C.grid} horizontal={false} />
              <XAxis type="number" {...ejeProps} tickFormatter={fmtSoles} />
              <YAxis type="category" dataKey="nombre" {...ejeProps} width={190} tick={tickUnaLinea(28)} />
              <Tooltip formatter={(v: number, k: string) => [fmtMoney(v), k]} />
              <Legend formatter={leyendaTexto} />
              {TRAMOS.map((t, i) => (
                <Bar key={t.k} dataKey={t.k} name={t.label} stackId="a" fill={RAMPA_ANTIG[i]} barSize={18} stroke="#fff" strokeWidth={2}>
                  {i === TRAMOS.length - 1 && <LabelList dataKey="total" content={etiquetaDerecha(fmtSoles)} />}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 6 · Rentabilidad por negocio */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile etiqueta="Presupuesto cerrado comercialmente" valor={fmtSoles(ventaTot)} sub={`${vs.length} proyecto(s) · ${PERIODOS.find((p) => p.v === periodo)?.l.toLowerCase()} · sin IGV`} />
        <StatTile etiqueta="Costo directo comprometido" valor={fmtSoles(costoTot)} sub="Costo sin margen de esos proyectos" />
        <StatTile etiqueta="Margen comercial" valor={pct(ventaTot > 0 ? (ventaTot - costoTot) / ventaTot : null, 1)} sub={fmtMoney(ventaTot - costoTot)} estado={ventaTot > 0 ? ((ventaTot - costoTot) / ventaTot >= 0.1 ? 'bien' : (ventaTot - costoTot) / ventaTot >= 0 ? 'atencion' : 'critico') : undefined} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[{ t: '6 · Presupuestos cerrados por línea de negocio', rows: porLinea }, { t: 'Presupuestos cerrados por línea de servicio', rows: porServicio }].map((g) => (
          <ChartCard key={g.t} titulo={g.t} descripcion="Venta cerrada (sin IGV) y su margen sobre el costo directo."
            filas={g.rows}
            columnas={[{ k: 'n', label: 'Línea', v: (r) => r.nombre }, { k: 'c', label: 'Proyectos', v: (r) => r.n, right: true }, { k: 'v', label: 'Venta', v: (r) => fmtMoney(r.venta), right: true }, { k: 'm', label: 'Margen', v: (r) => pct(r.margen, 1), right: true }]}
            vacio={g.rows.length ? null : 'Sin ventas cerradas en el periodo.'}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={g.rows} margin={{ top: 24, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="nombre" {...ejeProps} interval={0} tick={tickUnaLinea(17, "middle")} />
                <YAxis {...ejeProps} tickFormatter={fmtSoles} width={86} />
                <Tooltip formatter={(v: number, _k: string, it: any) => [`${fmtMoney(v)} · margen ${pct(it.payload.margen, 1)}`, 'Venta']} />
                <Bar dataKey="venta" fill={C.plan} radius={[4, 4, 0, 0]} maxBarSize={56}>
                  <LabelList position="top" content={(props: any) => {
                    const r = g.rows[props.index];
                    if (!r) return null;
                    return <text x={props.x + props.width / 2} y={props.y - 6} textAnchor="middle" fontSize={11} fill={C.tinta}><tspan fontWeight={600}>{fmtK(r.venta)}</tspan><tspan fill={r.margen < 0 ? C.critico : C.tinta2}> · {pct(r.margen)}</tspan></text>;
                  }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ))}
      </div>

      {/* 7 · CAC */}
      <ChartCard
        titulo="7 · Costo de adquisición de clientes (CAC)"
        descripcion={<>Peso de cada canal en la inversión de marketing vs su peso en los clientes ganados ({PERIODOS.find((p) => p.v === periodo)?.l.toLowerCase()}). CAC = inversión ÷ clientes ganados. La inversión se registra en Configuración → Canales e inversión.</>}
        filas={cacData}
        columnas={[
          { k: 'n', label: 'Canal', v: (r) => r.nombre },
          { k: 'i', label: 'Inversión', v: (r) => fmtMoney(r.inversion), right: true },
          { k: 'l', label: 'Cotizaciones', v: (r) => r.leads, right: true },
          { k: 'g', label: 'Clientes ganados', v: (r) => r.ganados, right: true },
          { k: 'c', label: 'CAC', v: (r) => (r.cac == null ? '—' : fmtMoney(r.cac)), right: true },
        ]}
        alto={Math.max(220, cacData.length * 52 + 60)}
        acciones={invTotal === 0 ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">Sin inversión registrada</span> : <span className="text-xs text-muted-foreground">CAC promedio <strong className="text-foreground">{ganTotal ? fmtMoney(invTotal / ganTotal) : '—'}</strong></span>}
        vacio={cacData.length ? null : 'Sin cotizaciones ni inversión en el periodo.'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cacData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }} barGap={2}>
            <CartesianGrid stroke={C.grid} horizontal={false} />
            <XAxis type="number" {...ejeProps} tickFormatter={(v) => pct(v)} domain={[0, (max: number) => Math.min(1, Math.ceil(max * 4) / 4)]} ticks={[0, 0.25, 0.5, 0.75, 1]} />
            <YAxis type="category" dataKey="nombre" {...ejeProps} width={190} tick={tickUnaLinea(28)} />
            <Tooltip formatter={(v: number, k: string) => [pct(v, 1), k]} />
            <Legend formatter={leyendaTexto} />
            <Bar dataKey="pInv" name="% de la inversión" fill={C.real} radius={[0, 4, 4, 0]} barSize={12}>
              <LabelList dataKey="pInv" content={etiquetaDerecha((v: number) => pct(v))} />
            </Bar>
            <Bar dataKey="pGan" name="% de los clientes ganados" fill={C.plan} radius={[0, 4, 4, 0]} barSize={12}>
              <LabelList dataKey="pGan" content={etiquetaDerecha((v: number) => pct(v))} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
