'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Eye, EyeOff, Megaphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field, EmptyState } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { fmtMoney } from '@/lib/format';
import { guardarCanal, guardarInversion } from './actions';

export type Canal = { id: string; nombre: string; activo: boolean; orden: number };
export type Inversion = { canal_id: string; mes: string; monto: number };

const mesActual = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
const lblMes = (m: string) => `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

// Canales de adquisición (origen del lead) + inversión mensual por canal.
// Alimenta el dashboard de Gerencia "Costo de adquisición de clientes (CAC)".
export function CanalesTab({ canales, inversiones, uso }: { canales: Canal[]; inversiones: Inversion[]; uso: Record<string, number> }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Canal | null | 'nuevo'>(null);
  const [mes, setMes] = React.useState(mesActual());
  const [busy, setBusy] = React.useState<string | null>(null);
  const inv = React.useMemo(() => {
    const m = new Map<string, number>();
    inversiones.forEach((i) => m.set(`${i.canal_id}|${String(i.mes).slice(0, 7)}`, Number(i.monto)));
    return m;
  }, [inversiones]);
  const meses = React.useMemo(() => [...new Set(inversiones.map((i) => String(i.mes).slice(0, 7)))].sort().reverse(), [inversiones]);
  const totalMes = canales.reduce((a, c) => a + (inv.get(`${c.id}|${mes}`) ?? 0), 0);

  async function guardarMonto(c: Canal, valor: string) {
    const monto = valor === '' ? 0 : Number(valor);
    if ((inv.get(`${c.id}|${mes}`) ?? 0) === monto) return;
    setBusy(c.id);
    const r = await guardarInversion(c.id, mes, monto);
    setBusy(null);
    if (!r.ok) alert(r.error ?? 'No se pudo guardar'); else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-3xl text-xs text-muted-foreground">Canales por los que llegan los clientes (se eligen como “Origen del lead” al crear la cotización) y lo invertido en cada uno por mes. Con eso el dashboard calcula el costo de adquisición por cliente ganado (CAC).</p>
        <Button variant="gradient" onClick={() => setEditing('nuevo')}><Plus className="size-4" /> Nuevo canal</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Canales de adquisición</CardTitle></CardHeader>
          <CardContent className="p-0">
            {canales.length === 0 ? <div className="p-6"><EmptyState icon={<Megaphone className="size-8" />} titulo="Sin canales" /></div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Canal</TableHead><TableHead>Uso</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {canales.map((c) => (
                    <TableRow key={c.id} className={c.activo ? '' : 'opacity-60'}>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{uso[c.id] ? `${uso[c.id]} cotiz.` : '—'}</TableCell>
                      <TableCell>{c.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="muted">Inactivo</Badge>}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" title="Editar" onClick={() => setEditing(c)}><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="icon" className="size-8" title={c.activo ? 'Desactivar' : 'Activar'}
                            onClick={async () => { await guardarCanal({ id: c.id, nombre: c.nombre, orden: c.orden, activo: !c.activo }); router.refresh(); }}>
                            {c.activo ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">Inversión por canal</CardTitle>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">Mes
              <Input type="month" value={mes} onChange={(e) => setMes(e.target.value || mesActual())} className="h-8 w-40" />
            </label>
          </CardHeader>
          <CardContent className="space-y-2">
            {canales.filter((c) => c.activo || inv.get(`${c.id}|${mes}`)).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3">
                <span className="text-sm">{c.nombre}</span>
                <div className="flex items-center gap-2">
                  {busy === c.id && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground">S/</span>
                  <Input type="number" min="0" step="0.01" inputMode="decimal" className="h-8 w-32 text-right"
                    key={`${c.id}-${mes}-${inv.get(`${c.id}|${mes}`) ?? ''}`}
                    defaultValue={inv.get(`${c.id}|${mes}`) ?? ''}
                    onBlur={(e) => guardarMonto(c, e.target.value)} />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
              <span>Total {lblMes(mes)}</span><span className="tabular-nums">{fmtMoney(totalMes)}</span>
            </div>
            {meses.length > 0 && (
              <p className="text-[11px] text-muted-foreground">Meses con inversión registrada: {meses.slice(0, 12).map(lblMes).join(' · ')}</p>
            )}
          </CardContent>
        </Card>
      </div>
      {editing && <CanalForm canal={editing === 'nuevo' ? null : editing} onClose={() => { setEditing(null); router.refresh(); }} />}
    </div>
  );
}

function CanalForm({ canal, onClose }: { canal: Canal | null; onClose: () => void }) {
  const [f, setF] = React.useState({ nombre: canal?.nombre ?? '', orden: canal?.orden ?? 100 });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  async function submit() {
    setSaving(true); setError(null);
    const r = await guardarCanal({ id: canal?.id, nombre: f.nombre, orden: Number(f.orden) || 0, activo: canal?.activo ?? true });
    setSaving(false);
    if (!r.ok) { setError(r.error ?? 'No se pudo guardar'); return; }
    onClose();
  }
  return (
    <Modal open onClose={onClose} title={canal ? 'Editar canal' : 'Nuevo canal'}
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button variant="gradient" disabled={saving} onClick={submit}>{saving ? 'Guardando…' : 'Guardar'}</Button></>}>
      <div className="space-y-3">
        <Field label="Nombre del canal" required><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej. TikTok Ads" /></Field>
        <Field label="Orden" hint="Menor aparece primero."><Input type="number" className="w-28" value={f.orden} onChange={(e) => setF({ ...f, orden: Number(e.target.value) })} /></Field>
        {error && <p className="text-sm text-azur-700">{error}</p>}
      </div>
    </Modal>
  );
}
