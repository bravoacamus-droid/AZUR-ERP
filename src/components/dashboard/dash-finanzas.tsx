'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { fmtMoney } from '@/lib/format';
import type { DashData } from '@/lib/dashboards-tipos';
import { TRAMOS } from '@/lib/dashboards-tipos';
import { C, RAMPA_ANTIG, ChartCard, StatTile, ejeProps, etiquetaDerecha, fmtSoles, leyendaTexto, tickUnaLinea } from './charts';

const META_LIQUIDEZ = 1.2;

function AntiguedadPorProyecto({ titulo, descripcion, filas, vacio }: { titulo: string; descripcion: string; filas: { etiqueta: string; tramos: Record<string, number>; total: number }[]; vacio: string }) {
  const data = filas.slice(0, 12).map((f) => ({ nombre: f.etiqueta, ...f.tramos, total: f.total }));
  return (
    <ChartCard
      titulo={titulo}
      descripcion={descripcion}
      filas={data}
      columnas={[{ k: 'n', label: 'Proyecto', v: (r: any) => r.nombre }, ...TRAMOS.map((t) => ({ k: t.k, label: t.label, v: (r: any) => fmtMoney(r[t.k]), right: true })), { k: 't', label: 'Total', v: (r: any) => fmtMoney(r.total), right: true }]}
      alto={Math.max(200, data.length * 44 + 60)}
      vacio={data.length ? null : vacio}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 70, left: 8, bottom: 4 }}>
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
  );
}

export function DashFinanzas({ d }: { d: DashData }) {
  const f = d.finanzas;
  const liq = f.liquidez;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile etiqueta="Saldo en cajas" valor={fmtSoles(f.saldoCajas)} sub="Lo que hay hoy en las cajas" estado={f.saldoCajas >= f.porPagar ? 'bien' : 'critico'} />
        <StatTile etiqueta="Caja a 30 días" valor={fmtSoles(f.caja30)} sub="Saldo − lo por pagar, sin cobros nuevos" estado={f.caja30 >= 0 ? 'bien' : 'critico'} />
        <StatTile etiqueta="Por cobrar" valor={fmtSoles(f.porCobrar)} sub={`${fmtSoles(f.porCobrar60)} con más de 60 días`} estado={f.porCobrar60 > 0 ? 'critico' : f.porCobrar > 0 ? 'atencion' : 'bien'} />
        <StatTile etiqueta="Por pagar" valor={fmtSoles(f.porPagar)} sub={f.porPagarVencido > 0 ? `${fmtSoles(f.porPagarVencido)} vencido (programado y no pagado)` : 'Nada vencido'} estado={f.porPagarVencido > 0 ? 'critico' : 'bien'} />
        <StatTile etiqueta="Por facturar" valor={fmtSoles(f.porFacturar)} sub={f.armadasVencidas ? `${f.armadasVencidas} armada(s) vencida(s) del cronograma de cobros` : 'Cronograma de cobros al día'} estado={f.porFacturar > 0 ? 'critico' : 'bien'} />
        <StatTile etiqueta="Liquidez operativa" valor={liq == null ? '—' : liq.toFixed(2)} sub={`Caja ÷ por pagar · meta ${META_LIQUIDEZ.toFixed(2)}`} estado={liq == null ? 'bien' : liq >= META_LIQUIDEZ ? 'bien' : liq >= 1 ? 'atencion' : 'critico'} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Por cobrar = valorizaciones emitidas al cliente aún no cobradas (los cobros se aplican a la más antigua) + facturas abiertas. Por facturar = armadas del cronograma de cobros con fecha vencida que todavía no se cobran ni están por cobrar. Por pagar = solicitudes de pago solicitadas, aprobadas o programadas (igual que en Finanzas).
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        <AntiguedadPorProyecto titulo="Cuentas por cobrar · antigüedad" descripcion="Por proyecto y días desde el corte de la valorización. Montos con IGV (lo que entra a caja)." filas={d.cxc} vacio="No hay cuentas por cobrar pendientes." />
        <AntiguedadPorProyecto titulo="Cuentas por pagar · antigüedad" descripcion="Solicitudes de contratistas y proveedores pendientes, por proyecto y días desde su recepción." filas={d.cxp} vacio="No hay cuentas por pagar pendientes." />
      </div>
    </div>
  );
}
