'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/misc';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { fmtMoney } from '@/lib/format';
import { SALUD_LABEL, type Salud } from '@/lib/salud';

const AZUR = '#E20627';
const AZUR_DARK = '#BE1723';
const SKY = '#0ea5e9';
const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const PIE_COLORS = [AZUR, SKY, EMERALD, AMBER, AZUR_DARK];

export interface LineaResultado {
  linea_id: string;
  nombre: string;
  color: string;
  proyectado: number;
  pagos: number;
  gasto: number;
}

export interface CategoriaGasto {
  tipo: string;
  label: string;
  monto: number;
}

export interface ProyectoResultado {
  proyecto_id: string;
  codigo: string | null;
  nombre: string;
  proyectado: number;
  pagos: number;
  gasto: number;
  valorizado: number;
  salud: Salud;
}

const SALUD_VARIANT: Record<Salud, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  advertencia: 'warning',
  critica: 'danger',
};

const tooltipFmt = (v: number | string) => fmtMoney(Number(v));

export function ReportesCharts({
  lineas,
  categorias,
  proyectos,
}: {
  lineas: LineaResultado[];
  categorias: CategoriaGasto[];
  proyectos: ProyectoResultado[];
}) {
  function exportarCSV() {
    const headers = ['Código', 'Proyecto', 'Proyectado', 'Pagos', 'Gasto', 'Valorizado', 'Salud'];
    const rows = proyectos.map((p) => [
      p.codigo ?? '',
      p.nombre,
      p.proyectado,
      p.pagos,
      p.gasto,
      p.valorizado,
      SALUD_LABEL[p.salud],
    ]);
    const escape = (val: string | number) => {
      const s = String(val).replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };
    const csv = [headers, ...rows].map((r) => r.map(escape).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-proyectos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const totalCategorias = categorias.reduce((a, c) => a + c.monto, 0);

  return (
    <div className="space-y-6">
      {/* Estado de resultados por línea de negocio */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Estado de resultados por línea de negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {lineas.length === 0 ? (
            <EmptyState titulo="Sin datos" descripcion="No hay proyectos asociados a líneas de negocio." />
          ) : (
            <>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineas} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtMoney(Number(v)).replace(/\s?PEN|S\/\s?/g, 'S/')} width={80} />
                    <Tooltip formatter={tooltipFmt} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="proyectado" name="Proyectado" fill={SKY} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pagos" name="Pagos" fill={EMERALD} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gasto" name="Gasto" fill={AZUR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Línea</TableHead>
                    <TableHead className="text-right">Proyectado</TableHead>
                    <TableHead className="text-right">Pagos</TableHead>
                    <TableHead className="text-right">Gasto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineas.map((l) => (
                    <TableRow key={l.linea_id}>
                      <TableCell className="font-medium">
                        <span
                          className="mr-2 inline-block size-2.5 rounded-full align-middle"
                          style={{ backgroundColor: l.color }}
                        />
                        {l.nombre}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMoney(l.proyectado)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMoney(l.pagos)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMoney(l.gasto)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Gasto por las 5 categorías */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gasto por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {totalCategorias === 0 ? (
            <EmptyState titulo="Sin gasto registrado" descripcion="No hay pagos pagados o conciliados." />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorias.filter((c) => c.monto > 0)}
                      dataKey="monto"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(e) => e.label}
                    >
                      {categorias
                        .filter((c) => c.monto > 0)
                        .map((c, i) => (
                          <Cell key={c.tipo} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={tooltipFmt} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Gasto</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorias.map((c) => (
                      <TableRow key={c.tipo}>
                        <TableCell className="font-medium">{c.label}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtMoney(c.monto)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {totalCategorias > 0 ? Math.round((c.monto / totalCategorias) * 100) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de proyectos */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Proyectos</CardTitle>
          <Button variant="outline" size="sm" onClick={exportarCSV} disabled={proyectos.length === 0}>
            <Download /> Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {proyectos.length === 0 ? (
            <EmptyState titulo="Sin proyectos" descripcion="Aún no hay proyectos para reportar." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead className="text-right">Proyectado</TableHead>
                  <TableHead className="text-right">Pagos</TableHead>
                  <TableHead className="text-right">Gasto</TableHead>
                  <TableHead className="text-right">Valorizado</TableHead>
                  <TableHead>Salud</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proyectos.map((p) => (
                  <TableRow key={p.proyecto_id}>
                    <TableCell>
                      <span className="font-medium">{p.nombre}</span>
                      {p.codigo && (
                        <span className="ml-1 font-mono text-xs text-muted-foreground">{p.codigo}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(p.proyectado)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(p.pagos)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(p.gasto)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(p.valorizado)}</TableCell>
                    <TableCell>
                      <Badge variant={SALUD_VARIANT[p.salud]}>{SALUD_LABEL[p.salud]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
