'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Layers, Wrench, Landmark, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field, EmptyState } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page';
import { digitosGuiones } from '@/lib/utils';
import { guardarLinea, toggleLinea, guardarTipoServicio, toggleTipoServicio, eliminarTipoServicio, type Res } from './actions';
import { guardarMedioPago, eliminarRegistro } from '../catalogos/actions';

type Linea = { id: string; nombre: string; codigo: string; color: string | null; activo: boolean };
type Servicio = { id: string; nombre: string; activo: boolean; orden: number };
type Medio = {
  id: string; banco: string; titular: string; cuenta_soles: string | null; cci_soles: string | null;
  cuenta_dolares: string | null; cci_dolares: string | null; es_detraccion: boolean;
  mostrar_cotizacion?: boolean; mostrar_valorizacion?: boolean; mostrar_liquidacion?: boolean;
};

function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="rounded-lg bg-azur-50 px-3 py-2 text-sm font-medium text-azur-700">{msg}</p>;
}

function useGuardar() {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const run = async (fn: () => Promise<Res>, onDone: () => void) => {
    setSaving(true); setError(null);
    try {
      const res = await fn();
      if (!res.ok) { setError(res.error ?? 'No se pudo guardar'); return; }
      onDone();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error inesperado'); }
    finally { setSaving(false); }
  };
  return { saving, error, run };
}

// ─────────────────────── Líneas de negocio ───────────────────────
function LineasTab({ rows, uso }: { rows: Linea[]; uso: Record<string, number> }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Linea | null>(null);
  async function cambiarEstado(l: Linea) {
    if (l.activo && !window.confirm(`¿Desactivar "${l.nombre}"? Ya no aparecerá al crear cotizaciones (las existentes no se afectan).`)) return;
    await toggleLinea(l.id, !l.activo); router.refresh();
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Líneas de negocio que se eligen al crear una cotización. Desactiva las que ya no ofreces (ej. Cocina Pro) sin perder su histórico.</p>
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" /> Nueva línea</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Layers className="size-8" />} titulo="Sin líneas de negocio" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Línea</TableHead><TableHead>Código</TableHead><TableHead>Color</TableHead><TableHead>Uso</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id} className={l.activo ? '' : 'opacity-60'}>
                  <TableCell className="font-medium">{l.nombre}</TableCell>
                  <TableCell><Badge variant="outline">{l.codigo}</Badge></TableCell>
                  <TableCell><span className="inline-block size-4 rounded-full align-middle" style={{ background: l.color ?? '#E20627' }} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{uso[l.id] ? `${uso[l.id]} cotiz.` : '—'}</TableCell>
                  <TableCell>{l.activo ? <Badge variant="success">Activa</Badge> : <Badge variant="muted">Inactiva</Badge>}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => { setEditing(l); setOpen(true); }} title="Editar"><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => cambiarEstado(l)} title={l.activo ? 'Desactivar' : 'Activar'}>{l.activo ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <LineaForm linea={editing} onClose={() => { setOpen(false); router.refresh(); }} />}
    </div>
  );
}

function LineaForm({ linea, onClose }: { linea: Linea | null; onClose: () => void }) {
  const { saving, error, run } = useGuardar();
  const [f, setF] = React.useState({
    nombre: linea?.nombre ?? '', codigo: linea?.codigo ?? '', color: linea?.color ?? '#E20627', activo: linea?.activo ?? true,
  });
  // Autosugerir código desde el nombre (solo al crear).
  const onNombre = (v: string) => setF((s) => ({ ...s, nombre: v, codigo: linea ? s.codigo : v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() }));
  const submit = () => run(() => guardarLinea({ id: linea?.id, nombre: f.nombre, codigo: f.codigo, color: f.color, activo: f.activo }), onClose);
  return (
    <Modal open onClose={onClose} title={linea ? 'Editar línea de negocio' : 'Nueva línea de negocio'}
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button variant="gradient" disabled={saving} onClick={submit}>{saving ? 'Guardando…' : 'Guardar'}</Button></>}>
      <div className="space-y-3">
        <Field label="Nombre" required><Input value={f.nombre} onChange={(e) => onNombre(e.target.value)} placeholder="Ej. Azul, Mantenimiento…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código" required hint="Corto, aparece en tablas y badges."><Input value={f.codigo} maxLength={12} onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase() })} /></Field>
          <Field label="Color"><Input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} className="h-10 p-1" /></Field>
        </div>
        <ErrorMsg msg={error} />
      </div>
    </Modal>
  );
}

// ─────────────────────── Tipos de servicio ───────────────────────
function ServiciosTab({ rows, uso }: { rows: Servicio[]; uso: Record<string, number> }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Servicio | null>(null);
  async function cambiarEstado(s: Servicio) {
    if (s.activo && !window.confirm(`¿Desactivar "${s.nombre}"? Ya no aparecerá al crear cotizaciones.`)) return;
    await toggleTipoServicio(s.id, !s.activo); router.refresh();
  }
  async function borrar(s: Servicio) {
    if (uso[s.id]) { alert('Hay cotizaciones que usan este servicio. Desactívalo en lugar de eliminarlo.'); return; }
    if (!window.confirm(`¿Eliminar "${s.nombre}"? Esta acción no se puede deshacer.`)) return;
    const res = await eliminarTipoServicio(s.id);
    if (!res.ok) alert(res.error ?? 'No se pudo eliminar');
    router.refresh();
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Servicios que se cierran (diseño/construcción de edificio, implementación de oficina, mantenimiento…). Se eligen al crear una cotización. El tamaño Grande/Chico se define aparte en la cotización.</p>
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" /> Nuevo servicio</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Wrench className="size-8" />} titulo="Sin tipos de servicio" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Servicio</TableHead><TableHead>Orden</TableHead><TableHead>Uso</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id} className={s.activo ? '' : 'opacity-60'}>
                  <TableCell className="font-medium">{s.nombre}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{s.orden}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{uso[s.id] ? `${uso[s.id]} cotiz.` : '—'}</TableCell>
                  <TableCell>{s.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="muted">Inactivo</Badge>}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => { setEditing(s); setOpen(true); }} title="Editar"><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => cambiarEstado(s)} title={s.activo ? 'Desactivar' : 'Activar'}>{s.activo ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
                      <Button variant="ghost" size="icon" className="size-8 text-azur-600" onClick={() => borrar(s)} title="Eliminar"><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <ServicioForm servicio={editing} onClose={() => { setOpen(false); router.refresh(); }} />}
    </div>
  );
}

function ServicioForm({ servicio, onClose }: { servicio: Servicio | null; onClose: () => void }) {
  const { saving, error, run } = useGuardar();
  const [f, setF] = React.useState({ nombre: servicio?.nombre ?? '', orden: servicio?.orden ?? 0, activo: servicio?.activo ?? true });
  const submit = () => run(() => guardarTipoServicio({ id: servicio?.id, nombre: f.nombre, orden: Number(f.orden) || 0, activo: f.activo }), onClose);
  return (
    <Modal open onClose={onClose} title={servicio ? 'Editar tipo de servicio' : 'Nuevo tipo de servicio'}
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button variant="gradient" disabled={saving} onClick={submit}>{saving ? 'Guardando…' : 'Guardar'}</Button></>}>
      <div className="space-y-3">
        <Field label="Nombre del servicio" required><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej. Construcción de edificio" /></Field>
        <Field label="Orden" hint="Menor aparece primero en la lista."><Input type="number" value={f.orden} onChange={(e) => setF({ ...f, orden: Number(e.target.value) })} className="w-28" /></Field>
        <ErrorMsg msg={error} />
      </div>
    </Modal>
  );
}

// ─────────────────────── Medios de pago (movido desde Catálogos) ───────────────────────
function MediosTab({ rows }: { rows: Medio[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Medio | null>(null);
  async function borrar(m: Medio) {
    if (!window.confirm(`¿Eliminar "${m.banco}"? Esta acción no se puede deshacer.`)) return;
    const res = await eliminarRegistro('medios', m.id);
    if (!res.ok) alert(res.error ?? 'No se pudo eliminar');
    router.refresh();
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Cuentas bancarias de la empresa que aparecen en cotizaciones, valorizaciones y liquidaciones.</p>
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" /> Nuevo medio</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Landmark className="size-8" />} titulo="Sin medios de pago" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Banco</TableHead><TableHead>Titular</TableHead><TableHead>Soles</TableHead><TableHead>Dólares</TableHead><TableHead>Detracción</TableHead><TableHead>Visible en</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.banco}</TableCell>
                  <TableCell className="text-sm">{m.titular}</TableCell>
                  <TableCell className="text-xs tabular-nums">{m.cuenta_soles ?? '—'}{m.cci_soles && <div className="text-muted-foreground">CCI {m.cci_soles}</div>}</TableCell>
                  <TableCell className="text-xs tabular-nums">{m.cuenta_dolares ?? '—'}{m.cci_dolares && <div className="text-muted-foreground">CCI {m.cci_dolares}</div>}</TableCell>
                  <TableCell>{m.es_detraccion ? <Badge variant="warning">Detracción</Badge> : '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(m.mostrar_cotizacion ?? true) && <Badge variant="muted">Cot</Badge>}
                      {(m.mostrar_valorizacion ?? true) && <Badge variant="muted">Val</Badge>}
                      {(m.mostrar_liquidacion ?? true) && <Badge variant="muted">Liq</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => { setEditing(m); setOpen(true); }} title="Editar"><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="size-8 text-azur-600" onClick={() => borrar(m)} title="Eliminar"><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <MedioForm medio={editing} onClose={() => { setOpen(false); router.refresh(); }} />}
    </div>
  );
}

function MedioForm({ medio, onClose }: { medio: Medio | null; onClose: () => void }) {
  const { saving, error, run } = useGuardar();
  const [f, setF] = React.useState({
    banco: medio?.banco ?? '', titular: medio?.titular ?? '',
    cuenta_soles: medio?.cuenta_soles ?? '', cci_soles: medio?.cci_soles ?? '',
    cuenta_dolares: medio?.cuenta_dolares ?? '', cci_dolares: medio?.cci_dolares ?? '',
    es_detraccion: medio?.es_detraccion ?? false,
    mostrar_cotizacion: medio?.mostrar_cotizacion ?? true,
    mostrar_valorizacion: medio?.mostrar_valorizacion ?? true,
    mostrar_liquidacion: medio?.mostrar_liquidacion ?? true,
  });
  const submit = () => run(() => guardarMedioPago({ id: medio?.id, ...f }), onClose);
  return (
    <Modal open onClose={onClose} title={medio ? 'Editar medio de pago' : 'Nuevo medio de pago'}
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button variant="gradient" disabled={saving} onClick={submit}>{saving ? 'Guardando…' : 'Guardar'}</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Banco" required><Input value={f.banco} onChange={(e) => setF({ ...f, banco: e.target.value })} /></Field>
          <Field label="Titular" required><Input value={f.titular} onChange={(e) => setF({ ...f, titular: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cuenta soles"><Input inputMode="numeric" maxLength={25} value={f.cuenta_soles} onChange={(e) => setF({ ...f, cuenta_soles: digitosGuiones(e.target.value) })} /></Field>
          <Field label="CCI soles"><Input inputMode="numeric" maxLength={25} value={f.cci_soles} onChange={(e) => setF({ ...f, cci_soles: digitosGuiones(e.target.value) })} /></Field>
          <Field label="Cuenta dólares"><Input inputMode="numeric" maxLength={25} value={f.cuenta_dolares} onChange={(e) => setF({ ...f, cuenta_dolares: digitosGuiones(e.target.value) })} /></Field>
          <Field label="CCI dólares"><Input inputMode="numeric" maxLength={25} value={f.cci_dolares} onChange={(e) => setF({ ...f, cci_dolares: digitosGuiones(e.target.value) })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="size-4 accent-azur-600" checked={f.es_detraccion} onChange={(e) => setF({ ...f, es_detraccion: e.target.checked })} /> Cuenta de detracción
        </label>
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mostrar esta cuenta en</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-azur-600" checked={f.mostrar_cotizacion} onChange={(e) => setF({ ...f, mostrar_cotizacion: e.target.checked })} /> Cotización</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-azur-600" checked={f.mostrar_valorizacion} onChange={(e) => setF({ ...f, mostrar_valorizacion: e.target.checked })} /> Valorización</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-azur-600" checked={f.mostrar_liquidacion} onChange={(e) => setF({ ...f, mostrar_liquidacion: e.target.checked })} /> Liquidación</label>
          </div>
        </div>
        <ErrorMsg msg={error} />
      </div>
    </Modal>
  );
}

// ─────────────────────── shell ───────────────────────
const TABS = [
  { value: 'lineas', label: 'Líneas de negocio' },
  { value: 'servicios', label: 'Tipos de servicio' },
  { value: 'medios', label: 'Medios de pago' },
];

export function ConfiguracionClient({
  lineas, servicios, medios, usoLinea, usoServicio,
}: {
  lineas: Linea[]; servicios: Servicio[]; medios: Medio[];
  usoLinea: Record<string, number>; usoServicio: Record<string, number>;
}) {
  const [tab, setTab] = React.useState('lineas');
  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Maestros del negocio (solo gerencia): líneas, tipos de servicio y medios de pago." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div>
        {tab === 'lineas' && <LineasTab rows={lineas} uso={usoLinea} />}
        {tab === 'servicios' && <ServiciosTab rows={servicios} uso={usoServicio} />}
        {tab === 'medios' && <MediosTab rows={medios} />}
      </div>
    </div>
  );
}
