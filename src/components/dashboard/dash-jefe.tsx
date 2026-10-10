'use client';

import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList } from 'recharts';
import { Select } from '@/components/ui/select';
import { fmtMoney, fmtDate } from '@/lib/format';
import type { DashData, DashProyecto } from '@/lib/dashboards-tipos';
import { C, ChartCard, Medidor, StatTile, ejeProps, etiquetaArriba, etiquetaDerecha, fmtK, fmtSoles, leyendaTexto, pct, tickUnaLinea } from './charts';

const EN_CURSO = ['en_ejecucion', 'pausado'];

function MiniBarras({ datos, formato, alto = 150 }: { datos: { k: string; v: number; color: string }[]; formato: (v: number) => string; alto?: number }) {
  return (
    <div style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 22, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="k" {...ejeProps} />
          <YAxis hide domain={[0, (m: number) => (m > 0 ? m * 1.15 : 1)]} />
          <Tooltip formatter={(v: number) => formato(v)} />
          <Bar dataKey="v" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {datos.map((d) => <Cell key={d.k} fill={d.color} />)}
            <LabelList dataKey="v" content={etiquetaArriba(formato)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Diferencia({ a, b, formato, positivoBueno = true }: { a: number; b: number; formato: (v: number) => string; positivoBueno?: boolean }) {
  const dlt = a - b;
  const bueno = positivoBueno ? dlt >= 0 : dlt <= 0;
  return (
    <p className={`mx-auto mt-1 w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${bueno ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
      {bueno ? '▲' : '▼'} {dlt >= 0 ? '+' : '−'}{formato(Math.abs(dlt))} {positivoBueno ? (bueno ? 'a favor' : 'de atraso') : (bueno ? 'bajo lo proyectado' : 'sobre lo proyectado')}
    </p>
  );
}

export function DashJefe({ d }: { d: DashData }) {
  const candidatos = d.proyectos.filter((p) => EN_CURSO.includes(p.estado) || p.ev > 0 || p.ac > 0);
  // Por defecto: el proyecto en ejecución con línea base más reciente.
  const porDefecto = [...candidatos].filter((p) => p.estado === 'en_ejecucion' && p.iniPlan).sort((a, b) => (b.iniPlan ?? '').localeCompare(a.iniPlan ?? ''))[0]
    ?? candidatos.find((p) => p.estado === 'en_ejecucion') ?? candidatos[0];
  const [proyId, setProyId] = React.useState(porDefecto?.id ?? '');
  const p: DashProyecto | undefined = d.proyectos.find((x) => x.id === proyId);
  const semanas = (p?.serie ?? []).filter((s) => s.semana > 0);
  const semanaHoy = semanas.find((s) => s.fecha >= d.hoy)?.semana ?? semanas[semanas.length - 1]?.semana ?? 1;
  const [semana, setSemana] = React.useState<number | null>(null);
  const sem = semana ?? semanaHoy;
  React.useEffect(() => setSemana(null), [proyId]);

  if (!p) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No hay proyectos en ejecución para analizar.</p>;

  // Control semanal: diferencias de la semana elegida + índices acumulados a esa semana.
  const pt = p.serie.find((s) => s.semana === sem);
  const prev = p.serie.find((s) => s.semana === sem - 1);
  const dPv = (pt?.pv ?? 0) - (prev?.pv ?? 0);
  const dEv = (pt?.ev ?? 0) - (prev?.ev ?? 0);
  const dAc = (pt?.ac ?? 0) - (prev?.ac ?? 0);
  const spiSem = pt && pt.pv > 0 && pt.ev != null ? pt.ev / pt.pv : null;
  const cpiSem = pt && pt.ac && pt.ac > 0 && pt.ev != null ? pt.ev / pt.ac : null;
  const bac = p.bac || 1;
  const ultimas = semanas.filter((s) => s.semana <= Math.max(sem, semanaHoy)).slice(-4);

  const avanceProyectos = d.proyectos.filter((x) => EN_CURSO.includes(x.estado) && x.bac > 0)
    .map((x) => ({ nombre: x.etiqueta, proy: x.avanceProy, real: x.avanceReal, atraso: x.avanceReal < x.avanceProy - 0.005 }));
  const partidas = p.partidas.filter((f) => f.presupuesto > 0 || f.costoReal > 0);
  const contratistas = p.contratistas;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3 text-xs">
        <label className="min-w-[260px] flex-1 sm:max-w-md"><span className="mb-0.5 block font-medium text-muted-foreground">Proyecto</span>
          <Select value={proyId} onChange={(e) => setProyId(e.target.value)}>
            {candidatos.map((x) => <option key={x.id} value={x.id}>{x.codigo} · {x.nombre}</option>)}
          </Select>
        </label>
        <label className="min-w-[200px]"><span className="mb-0.5 block font-medium text-muted-foreground">Semana (control semanal)</span>
          <Select value={String(sem)} onChange={(e) => setSemana(Number(e.target.value))} disabled={!semanas.length}>
            {semanas.map((s) => <option key={s.semana} value={s.semana}>S{s.semana} · al {fmtDate(s.fecha)}</option>)}
          </Select>
        </label>
        <div className="flex gap-1 pb-0.5">
          {ultimas.map((s) => (
            <button key={s.semana} type="button" onClick={() => setSemana(s.semana)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${s.semana === sem ? 'border-azur-600 bg-azur-600 text-white' : 'hover:bg-secondary'}`}>S{s.semana}</button>
          ))}
        </div>
      </div>

      {/* 1 · Resumen por proyecto */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm font-bold uppercase tracking-wide">Acumulado del proyecto</p>
          <p className="mb-3 text-xs text-muted-foreground">Desde el inicio de obra hasta hoy · {p.nombre}</p>
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">Avance físico</p>
          <MiniBarras datos={[{ k: 'Real', v: p.avanceReal, color: C.real }, { k: 'Proyectado', v: p.avanceProy, color: C.plan }]} formato={(v) => pct(v)} />
          <Diferencia a={p.avanceReal * 100} b={p.avanceProy * 100} formato={(v) => `${v.toFixed(1)} pts`} />
          <p className="mt-4 text-[11px] font-semibold uppercase text-muted-foreground">Costos generales</p>
          <MiniBarras datos={[{ k: 'Real', v: p.ac, color: C.real }, { k: 'Proyectado', v: p.pv, color: C.plan }]} formato={(v) => fmtSoles(v)} />
          <Diferencia a={p.ac} b={p.pv} formato={(v) => fmtSoles(v)} positivoBueno={false} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatTile etiqueta="Por pagar a contratistas" valor={fmtSoles(p.porPagarContratistas)} sub="Solicitudes aún no pagadas" />
            <StatTile etiqueta="Saldo de contratos" valor={fmtSoles(contratistas.reduce((a, c) => a + c.saldo, 0))} sub="Contratado − pagado" />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm font-bold uppercase tracking-wide">Control semanal · S{sem}</p>
          <p className="mb-3 text-xs text-muted-foreground">Desempeño de la semana elegida{pt ? ` (hasta el ${fmtDate(pt.fecha)})` : ''}. Los índices son acumulados a esa semana.</p>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Avance físico de la semana</p>
              <MiniBarras datos={[{ k: 'Real', v: dEv / bac, color: C.real }, { k: 'Proyectado', v: dPv / bac, color: C.plan }]} formato={(v) => pct(v, 1)} />
              <Diferencia a={(dEv / bac) * 100} b={(dPv / bac) * 100} formato={(v) => `${v.toFixed(1)} pts`} />
              <p className="mt-4 text-[11px] font-semibold uppercase text-muted-foreground">Costos de la semana</p>
              <MiniBarras datos={[{ k: 'Real', v: dAc, color: C.real }, { k: 'Proyectado', v: dPv, color: C.plan }]} formato={(v) => fmtSoles(v)} />
              <Diferencia a={dAc} b={dPv} formato={(v) => fmtSoles(v)} positivoBueno={false} />
            </div>
            <div className="space-y-3">
              <Medidor titulo="SPI · Plazo" sub="Avance real ÷ proyectado" valor={spiSem} okTexto="Adelantado" malTexto="Atrasado" />
              <Medidor titulo="CPI · Costo" sub="Valorización ÷ costo real" valor={cpiSem} okTexto="Bajo presupuesto" malTexto="Sobrecosto" />
            </div>
          </div>
          <div className="mt-3 grid gap-2 border-t pt-3 text-[11px] text-muted-foreground sm:grid-cols-2">
            <p><strong className="text-foreground">SPI</strong> = avance real ÷ avance proyectado. ≥ 1.00 adelantado; &lt; 1.00 atrasado.</p>
            <p><strong className="text-foreground">CPI</strong> = valorización (obra ejecutada) ÷ costo real. ≥ 1.00 bajo presupuesto; &lt; 1.00 sobrecosto.</p>
            <p className="sm:col-span-2"><span style={{ color: C.bien }}>●</span> ≥ 0.95 bien · <span style={{ color: C.atencion }}>●</span> 0.90–0.95 atención · <span style={{ color: C.critico }}>●</span> &lt; 0.90 crítico · la marca negra del anillo es la meta 1.00.</p>
          </div>
        </div>
      </div>

      {/* 2 · Análisis de costos */}
      <ChartCard
        titulo="2 · Análisis de costos"
        descripcion={<>{p.nombre}: costo proyectado sin margen (BAC) vs costo real (AC), con el valor ganado (EV) y el CPI.</>}
        filas={[{ k: 'BAC (sin margen)', v: p.bac }, { k: 'AC (costo real)', v: p.ac }, { k: 'EV (valor ganado)', v: p.ev }, { k: 'CPI (EV/AC)', v: p.cpi ?? 0 }]}
        columnas={[{ k: 'k', label: 'Indicador', v: (r) => r.k }, { k: 'v', label: 'Valor', v: (r) => (r.k.startsWith('CPI') ? (p.cpi == null ? '—' : p.cpi.toFixed(2)) : fmtMoney(r.v)), right: true }]}
        alto={330}
      >
        <div className="flex h-full flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatTile etiqueta="BAC (sin margen)" valor={fmtMoney(p.bac)} />
            <StatTile etiqueta="AC (costo real)" valor={fmtMoney(p.ac)} />
            <StatTile etiqueta="EV (valor ganado)" valor={fmtMoney(p.ev)} />
            <StatTile etiqueta="CPI (EV / AC)" valor={p.cpi == null ? '—' : p.cpi.toFixed(2)} sub={p.cpi == null ? 'Sin costo real registrado' : p.cpi >= 1 ? 'Bajo presupuesto' : 'Sobrecosto'} estado={p.cpi == null ? undefined : p.cpi >= 0.95 ? 'bien' : p.cpi >= 0.9 ? 'atencion' : 'critico'} />
          </div>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ k: 'Costo', proy: p.bac, real: p.ac }]} margin={{ top: 22, right: 8, left: 8, bottom: 0 }} barGap={4}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="k" hide />
                <YAxis {...ejeProps} tickFormatter={fmtSoles} width={86} />
                <Tooltip formatter={(v: number, k: string) => [fmtMoney(v), k]} />
                <Legend formatter={leyendaTexto} />
                <Bar dataKey="proy" name="Proyectado (BAC)" fill={C.plan} radius={[4, 4, 0, 0]} maxBarSize={90}><LabelList dataKey="proy" content={etiquetaArriba((v: number) => fmtMoney(v))} /></Bar>
                <Bar dataKey="real" name="Real (AC)" fill={C.real} radius={[4, 4, 0, 0]} maxBarSize={90}><LabelList dataKey="real" content={etiquetaArriba((v: number) => fmtMoney(v))} /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartCard>

      {/* 3 · Avance físico por proyecto */}
      <ChartCard
        titulo="3 · Avance físico: proyectado vs real por proyecto"
        descripcion="Proyectos en ejecución. Proyectado = valor planificado a hoy según la línea base; real = valorizado ÷ presupuesto. ▼ marca los que van atrasados."
        filas={avanceProyectos}
        columnas={[{ k: 'n', label: 'Proyecto', v: (r) => r.nombre }, { k: 'p', label: 'Proyectado', v: (r) => pct(r.proy, 1), right: true }, { k: 'r', label: 'Real', v: (r) => pct(r.real, 1), right: true }, { k: 'a', label: 'Situación', v: (r) => (r.atraso ? 'Atrasado' : 'En línea o adelantado') }]}
        vacio={avanceProyectos.length ? null : 'No hay proyectos en ejecución con presupuesto.'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={avanceProyectos} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barGap={2}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="nombre" {...ejeProps} interval={0} tick={tickUnaLinea(15, "middle")} />
            <YAxis {...ejeProps} tickFormatter={(v) => pct(v)} width={48} domain={[0, 1]} />
            <Tooltip formatter={(v: number, k: string) => [pct(v, 1), k]} />
            <Legend formatter={leyendaTexto} />
            <Bar dataKey="proy" name="Avance proyectado" fill={C.plan} radius={[4, 4, 0, 0]} maxBarSize={44} />
            <Bar dataKey="real" name="Avance real" fill={C.real} radius={[4, 4, 0, 0]} maxBarSize={44}>
              <LabelList position="top" content={(props: any) => {
                const r = avanceProyectos[props.index];
                if (!r) return null;
                return <text x={props.x + props.width / 2} y={props.y - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill={r.atraso ? C.critico : C.tinta2}>{r.atraso ? '▼ ' : ''}{pct(r.real)}</text>;
              }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* 4 · Avance por partida */}
        <ChartCard
          titulo="4 · Avance físico por partida"
          descripcion={<>{p.nombre}: porcentaje valorizado sobre el presupuesto de cada partida.</>}
          filas={partidas}
          columnas={[{ k: 'c', label: 'Ítem', v: (r) => r.codigo }, { k: 'n', label: 'Partida', v: (r) => r.titulo }, { k: 'a', label: 'Avance', v: (r) => pct(r.avance, 1), right: true }]}
          alto={Math.max(200, partidas.length * 36 + 40)}
          vacio={partidas.length ? null : 'El proyecto aún no tiene partidas con presupuesto.'}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={partidas.filter((f) => f.presupuesto > 0)} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
              <CartesianGrid stroke={C.grid} horizontal={false} />
              <XAxis type="number" {...ejeProps} tickFormatter={(v) => pct(v)} domain={[0, 1]} />
              <YAxis type="category" dataKey="titulo" {...ejeProps} width={190} tick={tickUnaLinea(28)} />
              <Tooltip formatter={(v: number) => [pct(v, 1), 'Avance']} />
              <Bar dataKey="avance" fill={C.plan} radius={[0, 4, 4, 0]} barSize={16}>
                <LabelList dataKey="avance" content={etiquetaDerecha((v: number) => pct(v))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5 · Costo por partida */}
        <ChartCard
          titulo="5 · Costo proyectado vs costo real por partida"
          descripcion="Presupuesto a costo de cada partida vs lo pagado en Finanzas imputado a ella (por la partida indicada en la solicitud de pago)."
          filas={partidas}
          columnas={[{ k: 'n', label: 'Partida', v: (r) => r.titulo }, { k: 'p', label: 'Presupuesto', v: (r) => fmtMoney(r.presupuesto), right: true }, { k: 'r', label: 'Costo real', v: (r) => fmtMoney(r.costoReal), right: true }, { k: 'd', label: 'Diferencia', v: (r) => fmtMoney(r.presupuesto - r.costoReal), right: true }]}
          alto={Math.max(200, partidas.length * 44 + 60)}
          vacio={partidas.length ? null : 'El proyecto aún no tiene partidas con presupuesto.'}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={partidas} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }} barGap={2}>
              <CartesianGrid stroke={C.grid} horizontal={false} />
              <XAxis type="number" {...ejeProps} tickFormatter={fmtSoles} />
              <YAxis type="category" dataKey="titulo" {...ejeProps} width={190} tick={tickUnaLinea(28)} />
              <Tooltip formatter={(v: number, k: string) => [fmtMoney(v), k]} />
              <Legend formatter={leyendaTexto} />
              <Bar dataKey="presupuesto" name="Presupuesto (costo)" fill={C.plan} radius={[0, 4, 4, 0]} barSize={10} />
              <Bar dataKey="costoReal" name="Costo real" fill={C.real} radius={[0, 4, 4, 0]} barSize={10}>
                <LabelList position="right" content={(props: any) => {
                  const r = partidas[props.index];
                  if (!r || !r.costoReal) return null;
                  const sobre = r.presupuesto > 0 && r.costoReal > r.presupuesto;
                  return <text x={props.x + props.width + 4} y={props.y + props.height / 2 + 4} fontSize={10} fontWeight={600} fill={sobre ? C.critico : C.tinta2}>{sobre ? '▲ ' : ''}{fmtK(r.costoReal)}</text>;
                }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 6 · Pagos a contratistas */}
      <ChartCard
        titulo="6 · Cuentas por pagar a contratistas"
        descripcion={<>{p.nombre}: contrato de cada contratista (partidas asignadas en el Last Planner) repartido entre lo pagado y el saldo. La etiqueta es el contrato completo.</>}
        filas={contratistas}
        columnas={[{ k: 'n', label: 'Contratista', v: (r) => r.nombre }, { k: 'c', label: 'Contrato', v: (r) => fmtMoney(r.contrato), right: true }, { k: 'p', label: 'Pagado', v: (r) => fmtMoney(r.pagado), right: true }, { k: 's', label: 'Saldo', v: (r) => fmtMoney(r.saldo), right: true }, { k: 'x', label: 'Solicitado por pagar', v: (r) => fmtMoney(r.porPagar), right: true }]}
        alto={Math.max(200, contratistas.length * 44 + 60)}
        vacio={contratistas.length ? null : 'No hay contratistas asignados a las partidas de este proyecto.'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={contratistas.map((c) => ({ ...c, pagadoBar: Math.min(c.pagado, c.contrato || c.pagado) }))} layout="vertical" margin={{ top: 4, right: 64, left: 8, bottom: 4 }}>
            <CartesianGrid stroke={C.grid} horizontal={false} />
            <XAxis type="number" {...ejeProps} tickFormatter={fmtSoles} />
            <YAxis type="category" dataKey="nombre" {...ejeProps} width={190} tick={tickUnaLinea(28)} />
            <Tooltip formatter={(v: number, k: string) => [fmtMoney(v), k]} />
            <Legend formatter={leyendaTexto} />
            <Bar dataKey="pagadoBar" name="Pagado" stackId="c" fill={C.plan} barSize={18} stroke="#fff" strokeWidth={2} />
            <Bar dataKey="saldo" name="Saldo por pagar" stackId="c" fill={C.tercera} barSize={18} stroke="#fff" strokeWidth={2} radius={[0, 4, 4, 0]}>
              <LabelList dataKey="contrato" content={etiquetaDerecha(fmtSoles)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
