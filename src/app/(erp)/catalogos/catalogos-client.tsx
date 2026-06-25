'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Upload, Building2, HardHat, ListTree, Package, FileText, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Field, EmptyState } from '@/components/ui/misc';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page';
import { fmtMoney } from '@/lib/format';
import { soloDigitos } from '@/lib/utils';
import {
  guardarCliente,
  importarClientes,
  guardarContraparte,
  guardarPartida,
  guardarInsumo,
  guardarPlantilla,
  guardarMedioPago,
  eliminarRegistro,
  actualizarPreciosMasivo,
  type Res,
  type TablaCatalogo,
} from './actions';

// ───────── tipos ─────────
export type Linea = { id: string; nombre: string; codigo: string; color: string };
export type Cliente = {
  id: string; razon_social: string; tipo_doc: string; ruc_dni: string | null;
  contacto_nombre: string | null; contacto_email: string | null; contacto_telefono: string | null;
  ubicacion: string | null; origen: string | null;
};
export type Contraparte = {
  id: string; razon_social: string; tipo: string; ruc_dni: string | null; especialidad: string | null;
  contacto: string | null; telefono: string | null; banco: string | null; cuenta: string | null; cci: string | null;
};
export type Partida = {
  id: string; linea_id: string | null; codigo: string | null; descripcion: string; unidad: string | null; costo_referencial: number | null;
};
export type Insumo = { id: string; codigo: string | null; nombre: string; unidad: string | null; precio: number | null; tipo: string | null };
export type Plantilla = {
  id: string; linea_id: string | null; nombre: string; condiciones: string | null;
  servicios_incluidos: string | null; servicios_omitidos: string | null; garantia: string | null;
};
export type Medio = {
  id: string; banco: string; titular: string; cuenta_soles: string | null; cci_soles: string | null;
  cuenta_dolares: string | null; cci_dolares: string | null; es_detraccion: boolean;
};

type Data = {
  lineas: Linea[];
  clientes: Cliente[];
  contrapartes: Contraparte[];
  partidas: Partida[];
  insumos: Insumo[];
  plantillas: Plantilla[];
  medios: Medio[];
};

const ORIGENES = [
  { v: 'directo', l: 'Directo' },
  { v: 'recomendacion', l: 'Recomendación' },
  { v: 'oficina', l: 'Oficina' },
  { v: 'llamada', l: 'Llamada' },
];

// ─────────────────────── helpers UI ───────────────────────
function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="rounded-lg bg-azur-50 px-3 py-2 text-sm font-medium text-azur-700">{msg}</p>;
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" className="size-8" onClick={onEdit} title="Editar">
        <Pencil className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" className="size-8 text-azur-600" onClick={onDelete} title="Eliminar">
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function useGuardar() {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const run = async (fn: () => Promise<Res>, onDone: () => void) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? 'No se pudo guardar');
        return;
      }
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };
  return { saving, error, setError, run };
}

// ─────────────────────── Clientes ───────────────────────
function ClientesTab({ rows }: { rows: Cliente[] }) {
  const [open, setOpen] = React.useState(false);
  const [imp, setImp] = React.useState(false);
  const [editing, setEditing] = React.useState<Cliente | null>(null);

  const abrirNuevo = () => { setEditing(null); setOpen(true); };
  const abrirEditar = (c: Cliente) => { setEditing(c); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setImp(true)}><Upload className="size-4" /> Importar</Button>
        <Button variant="gradient" onClick={abrirNuevo}><Plus className="size-4" /> Nuevo cliente</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Building2 className="size-8" />} titulo="Sin clientes" descripcion="Crea o importa tu cartera de clientes." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón social</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.razon_social}</TableCell>
                  <TableCell className="tabular-nums">{c.ruc_dni ? `${c.tipo_doc} ${c.ruc_dni}` : '—'}</TableCell>
                  <TableCell>
                    <div className="text-sm">{c.contacto_nombre ?? '—'}</div>
                    {c.contacto_telefono && <div className="text-xs text-muted-foreground">{c.contacto_telefono}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.ubicacion ?? '—'}</TableCell>
                  <TableCell>{c.origen ? <Badge variant="muted">{c.origen}</Badge> : '—'}</TableCell>
                  <TableCell><RowActions onEdit={() => abrirEditar(c)} onDelete={() => deleteRow('clientes', c.id, c.razon_social)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <ClienteForm cliente={editing} onClose={() => setOpen(false)} />}
      {imp && <ImportarClientesForm onClose={() => setImp(false)} />}
    </div>
  );
}

function ClienteForm({ cliente, onClose }: { cliente: Cliente | null; onClose: () => void }) {
  const { saving, error, run } = useGuardar();
  const [f, setF] = React.useState({
    razon_social: cliente?.razon_social ?? '',
    tipo_doc: cliente?.tipo_doc ?? 'RUC',
    ruc_dni: cliente?.ruc_dni ?? '',
    contacto_nombre: cliente?.contacto_nombre ?? '',
    contacto_email: cliente?.contacto_email ?? '',
    contacto_telefono: cliente?.contacto_telefono ?? '',
    ubicacion: cliente?.ubicacion ?? '',
    origen: cliente?.origen ?? '',
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => guardarCliente({ id: cliente?.id, ...f, origen: f.origen as never }), onClose);
  };
  return (
    <Modal open onClose={onClose} title={cliente ? 'Editar cliente' : 'Nuevo cliente'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Razón social" required>
          <Input value={f.razon_social} onChange={(e) => setF({ ...f, razon_social: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Tipo doc">
            <Select value={f.tipo_doc} onChange={(e) => setF({ ...f, tipo_doc: e.target.value })}>
              <option value="RUC">RUC</option>
              <option value="DNI">DNI</option>
              <option value="CE">CE</option>
            </Select>
          </Field>
          <Field label="N° documento" className="col-span-2">
            <Input inputMode="numeric" maxLength={11} value={f.ruc_dni} onChange={(e) => setF({ ...f, ruc_dni: soloDigitos(e.target.value) })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contacto"><Input value={f.contacto_nombre} onChange={(e) => setF({ ...f, contacto_nombre: e.target.value })} /></Field>
          <Field label="Teléfono"><Input inputMode="tel" maxLength={15} value={f.contacto_telefono} onChange={(e) => setF({ ...f, contacto_telefono: soloDigitos(e.target.value) })} /></Field>
        </div>
        <Field label="Email"><Input type="email" value={f.contacto_email} onChange={(e) => setF({ ...f, contacto_email: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ubicación"><Input value={f.ubicacion} onChange={(e) => setF({ ...f, ubicacion: e.target.value })} /></Field>
          <Field label="Origen">
            <Select value={f.origen} onChange={(e) => setF({ ...f, origen: e.target.value })}>
              <option value="">—</option>
              {ORIGENES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </Select>
          </Field>
        </div>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ImportarClientesForm({ onClose }: { onClose: () => void }) {
  const [raw, setRaw] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setOk(null);
    try {
      const res = await importarClientes(raw);
      if (!res.ok) { setError(res.error ?? 'No se pudo importar'); return; }
      setOk(`${res.insertados} insertados · ${res.duplicados} duplicados omitidos`);
      setRaw('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title="Importación masiva de clientes" description="Pega filas TSV/CSV: razón social, RUC/DNI, contacto (una por línea).">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Datos" hint="Separadores admitidos: tabulación, coma o punto y coma. Se omiten duplicados por RUC/DNI.">
          <Textarea
            rows={10}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={'Constructora ABC SAC\t20512345678\tJuan Pérez\nServicios XYZ EIRL,20587654321,María Gómez'}
            className="font-mono text-xs"
          />
        </Field>
        <ErrorMsg msg={error} />
        {ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{ok}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button type="submit" variant="gradient" disabled={saving || !raw.trim()}>{saving ? 'Importando…' : 'Importar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────── Contrapartes ───────────────────────
function ContrapartesTab({ rows }: { rows: Contraparte[] }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Contraparte | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" /> Nuevo</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<HardHat className="size-8" />} titulo="Sin contratistas/proveedores" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón social</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Banco / Cuenta</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.razon_social}<div className="text-xs text-muted-foreground tabular-nums">{c.ruc_dni}</div></TableCell>
                  <TableCell><Badge variant="info">{c.tipo}</Badge></TableCell>
                  <TableCell className="text-sm">{c.especialidad ?? '—'}</TableCell>
                  <TableCell className="text-sm">{c.contacto ?? '—'}{c.telefono && <div className="text-xs text-muted-foreground">{c.telefono}</div>}</TableCell>
                  <TableCell className="text-sm">{c.banco ?? '—'}{c.cuenta && <div className="text-xs text-muted-foreground tabular-nums">{c.cuenta}</div>}</TableCell>
                  <TableCell><RowActions onEdit={() => { setEditing(c); setOpen(true); }} onDelete={() => deleteRow('contrapartes', c.id, c.razon_social)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <ContraparteForm contraparte={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ContraparteForm({ contraparte, onClose }: { contraparte: Contraparte | null; onClose: () => void }) {
  const { saving, error, run } = useGuardar();
  const [f, setF] = React.useState({
    razon_social: contraparte?.razon_social ?? '',
    tipo: contraparte?.tipo ?? 'proveedor',
    ruc_dni: contraparte?.ruc_dni ?? '',
    especialidad: contraparte?.especialidad ?? '',
    contacto: contraparte?.contacto ?? '',
    telefono: contraparte?.telefono ?? '',
    banco: contraparte?.banco ?? '',
    cuenta: contraparte?.cuenta ?? '',
    cci: contraparte?.cci ?? '',
    cuenta_detraccion: (contraparte as any)?.cuenta_detraccion ?? '',
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => guardarContraparte({ id: contraparte?.id, ...f, tipo: f.tipo as never }), onClose);
  };
  return (
    <Modal open onClose={onClose} title={contraparte ? 'Editar contraparte' : 'Nueva contraparte'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Razón social" required className="col-span-2"><Input value={f.razon_social} onChange={(e) => setF({ ...f, razon_social: e.target.value })} required /></Field>
          <Field label="Tipo" required>
            <Select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
              <option value="contratista">Contratista</option>
              <option value="proveedor">Proveedor</option>
              <option value="ambos">Ambos</option>
            </Select>
          </Field>
          <Field label="RUC/DNI"><Input inputMode="numeric" maxLength={11} value={f.ruc_dni} onChange={(e) => setF({ ...f, ruc_dni: soloDigitos(e.target.value) })} /></Field>
          <Field label="Especialidad" className="col-span-2"><Input value={f.especialidad} onChange={(e) => setF({ ...f, especialidad: e.target.value })} /></Field>
          <Field label="Contacto"><Input value={f.contacto} onChange={(e) => setF({ ...f, contacto: e.target.value })} /></Field>
          <Field label="Teléfono"><Input inputMode="tel" maxLength={15} value={f.telefono} onChange={(e) => setF({ ...f, telefono: soloDigitos(e.target.value) })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Banco"><Input value={f.banco} onChange={(e) => setF({ ...f, banco: e.target.value })} /></Field>
          <Field label="Cuenta"><Input value={f.cuenta} onChange={(e) => setF({ ...f, cuenta: e.target.value })} /></Field>
          <Field label="CCI"><Input value={f.cci} onChange={(e) => setF({ ...f, cci: e.target.value })} /></Field>
          <Field label="Cuenta de detracción" className="col-span-3"><Input value={f.cuenta_detraccion} onChange={(e) => setF({ ...f, cuenta_detraccion: e.target.value })} placeholder="N° de cuenta de detracciones (Banco de la Nación)" /></Field>
        </div>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────── Partidas ───────────────────────
function PartidasTab({ rows, lineas }: { rows: Partida[]; lineas: Linea[] }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Partida | null>(null);
  const lineaNombre = (id: string | null) => lineas.find((l) => l.id === id)?.nombre ?? '—';
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" /> Nueva partida</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<ListTree className="size-8" />} titulo="Sin partidas" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Línea</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Costo ref.</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.codigo ?? '—'}</TableCell>
                  <TableCell className="font-medium">{p.descripcion}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lineaNombre(p.linea_id)}</TableCell>
                  <TableCell className="text-sm">{p.unidad ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.costo_referencial != null ? fmtMoney(p.costo_referencial) : '—'}</TableCell>
                  <TableCell><RowActions onEdit={() => { setEditing(p); setOpen(true); }} onDelete={() => deleteRow('partidas', p.id, p.descripcion)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <PartidaForm partida={editing} lineas={lineas} onClose={() => setOpen(false)} />}
    </div>
  );
}

function PartidaForm({ partida, lineas, onClose }: { partida: Partida | null; lineas: Linea[]; onClose: () => void }) {
  const { saving, error, run } = useGuardar();
  const [f, setF] = React.useState({
    linea_id: partida?.linea_id ?? '',
    codigo: partida?.codigo ?? '',
    descripcion: partida?.descripcion ?? '',
    unidad: partida?.unidad ?? '',
    costo_referencial: partida?.costo_referencial != null ? String(partida.costo_referencial) : '',
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => guardarPartida({
      id: partida?.id,
      linea_id: f.linea_id,
      codigo: f.codigo,
      descripcion: f.descripcion,
      unidad: f.unidad,
      costo_referencial: f.costo_referencial === '' ? null : Number(f.costo_referencial),
    }), onClose);
  };
  return (
    <Modal open onClose={onClose} title={partida ? 'Editar partida' : 'Nueva partida'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Línea de negocio">
          <Select value={f.linea_id} onChange={(e) => setF({ ...f, linea_id: e.target.value })}>
            <option value="">—</option>
            {lineas.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Código"><Input value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} /></Field>
          <Field label="Unidad"><Input value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })} placeholder="m2, glb, und" /></Field>
          <Field label="Costo ref."><Input type="number" step="0.01" min="0" value={f.costo_referencial} onChange={(e) => setF({ ...f, costo_referencial: e.target.value })} /></Field>
        </div>
        <Field label="Descripción" required><Textarea rows={2} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} required /></Field>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────── Insumos ───────────────────────
function InsumosTab({ rows }: { rows: Insumo[] }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Insumo | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" /> Nuevo insumo</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Package className="size-8" />} titulo="Sin insumos" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.codigo ?? '—'}</TableCell>
                  <TableCell className="font-medium">{i.nombre}</TableCell>
                  <TableCell>{i.tipo ? <Badge variant="muted">{i.tipo}</Badge> : '—'}</TableCell>
                  <TableCell className="text-sm">{i.unidad ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{i.precio != null ? fmtMoney(i.precio) : '—'}</TableCell>
                  <TableCell><RowActions onEdit={() => { setEditing(i); setOpen(true); }} onDelete={() => deleteRow('insumos', i.id, i.nombre)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <InsumoForm insumo={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function InsumoForm({ insumo, onClose }: { insumo: Insumo | null; onClose: () => void }) {
  const { saving, error, run } = useGuardar();
  const [f, setF] = React.useState({
    codigo: insumo?.codigo ?? '',
    nombre: insumo?.nombre ?? '',
    unidad: insumo?.unidad ?? '',
    precio: insumo?.precio != null ? String(insumo.precio) : '',
    tipo: insumo?.tipo ?? '',
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => guardarInsumo({
      id: insumo?.id, codigo: f.codigo, nombre: f.nombre, unidad: f.unidad, tipo: f.tipo,
      precio: f.precio === '' ? null : Number(f.precio),
    }), onClose);
  };
  return (
    <Modal open onClose={onClose} title={insumo ? 'Editar insumo' : 'Nuevo insumo'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código"><Input value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} /></Field>
          <Field label="Tipo"><Input value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} placeholder="material, mano de obra…" /></Field>
        </div>
        <Field label="Nombre" required><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unidad"><Input value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })} /></Field>
          <Field label="Precio"><Input type="number" step="0.01" min="0" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} /></Field>
        </div>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────── Plantillas ───────────────────────
function PlantillasTab({ rows, lineas }: { rows: Plantilla[]; lineas: Linea[] }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Plantilla | null>(null);
  const lineaNombre = (id: string | null) => lineas.find((l) => l.id === id)?.nombre ?? '—';
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" /> Nueva plantilla</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<FileText className="size-8" />} titulo="Sin plantillas" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Línea</TableHead>
                <TableHead>Garantía</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lineaNombre(p.linea_id)}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{p.garantia ?? '—'}</TableCell>
                  <TableCell><RowActions onEdit={() => { setEditing(p); setOpen(true); }} onDelete={() => deleteRow('plantillas', p.id, p.nombre)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <PlantillaForm plantilla={editing} lineas={lineas} onClose={() => setOpen(false)} />}
    </div>
  );
}

function PlantillaForm({ plantilla, lineas, onClose }: { plantilla: Plantilla | null; lineas: Linea[]; onClose: () => void }) {
  const { saving, error, run } = useGuardar();
  const [f, setF] = React.useState({
    linea_id: plantilla?.linea_id ?? '',
    nombre: plantilla?.nombre ?? '',
    condiciones: plantilla?.condiciones ?? '',
    servicios_incluidos: plantilla?.servicios_incluidos ?? '',
    servicios_omitidos: plantilla?.servicios_omitidos ?? '',
    garantia: plantilla?.garantia ?? '',
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => guardarPlantilla({ id: plantilla?.id, ...f }), onClose);
  };
  return (
    <Modal open onClose={onClose} title={plantilla ? 'Editar plantilla' : 'Nueva plantilla'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" required><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required /></Field>
          <Field label="Línea de negocio">
            <Select value={f.linea_id} onChange={(e) => setF({ ...f, linea_id: e.target.value })}>
              <option value="">—</option>
              {lineas.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Condiciones"><Textarea rows={2} value={f.condiciones} onChange={(e) => setF({ ...f, condiciones: e.target.value })} /></Field>
        <Field label="Servicios incluidos"><Textarea rows={2} value={f.servicios_incluidos} onChange={(e) => setF({ ...f, servicios_incluidos: e.target.value })} /></Field>
        <Field label="Servicios omitidos"><Textarea rows={2} value={f.servicios_omitidos} onChange={(e) => setF({ ...f, servicios_omitidos: e.target.value })} /></Field>
        <Field label="Garantía"><Textarea rows={2} value={f.garantia} onChange={(e) => setF({ ...f, garantia: e.target.value })} /></Field>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────── Medios de pago ───────────────────────
function MediosTab({ rows }: { rows: Medio[] }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Medio | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" /> Nuevo medio</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Landmark className="size-8" />} titulo="Sin medios de pago" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead>Soles</TableHead>
                <TableHead>Dólares</TableHead>
                <TableHead>Detracción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.banco}</TableCell>
                  <TableCell className="text-sm">{m.titular}</TableCell>
                  <TableCell className="text-xs tabular-nums">{m.cuenta_soles ?? '—'}{m.cci_soles && <div className="text-muted-foreground">CCI {m.cci_soles}</div>}</TableCell>
                  <TableCell className="text-xs tabular-nums">{m.cuenta_dolares ?? '—'}{m.cci_dolares && <div className="text-muted-foreground">CCI {m.cci_dolares}</div>}</TableCell>
                  <TableCell>{m.es_detraccion ? <Badge variant="warning">Detracción</Badge> : '—'}</TableCell>
                  <TableCell><RowActions onEdit={() => { setEditing(m); setOpen(true); }} onDelete={() => deleteRow('medios', m.id, m.banco)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <MedioForm medio={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function MedioForm({ medio, onClose }: { medio: Medio | null; onClose: () => void }) {
  const { saving, error, run } = useGuardar();
  const [f, setF] = React.useState({
    banco: medio?.banco ?? '',
    titular: medio?.titular ?? '',
    cuenta_soles: medio?.cuenta_soles ?? '',
    cci_soles: medio?.cci_soles ?? '',
    cuenta_dolares: medio?.cuenta_dolares ?? '',
    cci_dolares: medio?.cci_dolares ?? '',
    es_detraccion: medio?.es_detraccion ?? false,
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => guardarMedioPago({ id: medio?.id, ...f }), onClose);
  };
  return (
    <Modal open onClose={onClose} title={medio ? 'Editar medio de pago' : 'Nuevo medio de pago'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Banco" required><Input value={f.banco} onChange={(e) => setF({ ...f, banco: e.target.value })} required /></Field>
          <Field label="Titular" required><Input value={f.titular} onChange={(e) => setF({ ...f, titular: e.target.value })} required /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cuenta soles"><Input value={f.cuenta_soles} onChange={(e) => setF({ ...f, cuenta_soles: e.target.value })} /></Field>
          <Field label="CCI soles"><Input value={f.cci_soles} onChange={(e) => setF({ ...f, cci_soles: e.target.value })} /></Field>
          <Field label="Cuenta dólares"><Input value={f.cuenta_dolares} onChange={(e) => setF({ ...f, cuenta_dolares: e.target.value })} /></Field>
          <Field label="CCI dólares"><Input value={f.cci_dolares} onChange={(e) => setF({ ...f, cci_dolares: e.target.value })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="size-4 accent-azur-600" checked={f.es_detraccion} onChange={(e) => setF({ ...f, es_detraccion: e.target.checked })} />
          Cuenta de detracción
        </label>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────── eliminar con confirmación ───────────────────────
async function deleteRow(tabla: TablaCatalogo, id: string, nombre: string) {
  if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
  const res = await eliminarRegistro(tabla, id);
  if (!res.ok) alert(res.error ?? 'No se pudo eliminar');
}

// ─────────────────────── shell con tabs ───────────────────────
const TABS = [
  { value: 'clientes', label: 'Clientes' },
  { value: 'contrapartes', label: 'Contratistas/Proveedores' },
  { value: 'partidas', label: 'Partidas' },
  { value: 'insumos', label: 'Insumos' },
  { value: 'plantillas', label: 'Plantillas' },
  { value: 'medios', label: 'Medios de pago' },
];

function PreciosMasivos() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [destino, setDestino] = React.useState<'insumos' | 'partidas' | 'ambos'>('insumos');
  const [factor, setFactor] = React.useState(5);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function aplicar() {
    setBusy(true); setMsg(null);
    const res = await actualizarPreciosMasivo({ destino, factorPct: Number(factor) });
    setBusy(false);
    if (!res.ok) { setMsg(res.error ?? 'Error'); return; }
    setMsg(`Actualizados ${res.actualizados ?? 0} precios. ${res.borradores ? `Revisa ${res.borradores} cotización(es) enviada(s)/en negociación que podrían quedar desactualizadas.` : ''}`);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" onClick={() => { setOpen(true); setMsg(null); }}>Actualizar precios</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Actualización masiva de precios"
        description="Aplica un ajuste porcentual al catálogo. Las cotizaciones ya armadas conservan sus precios (el catálogo es referencial)."
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button><Button variant="gradient" disabled={busy} onClick={aplicar}>Aplicar</Button></>}>
        <div className="space-y-3">
          <Field label="Aplicar a">
            <Select value={destino} onChange={(e) => setDestino(e.target.value as never)}>
              <option value="insumos">Insumos</option>
              <option value="partidas">Partidas</option>
              <option value="ambos">Insumos y partidas</option>
            </Select>
          </Field>
          <Field label="Ajuste % (ej. 5 sube 5%, -10 baja 10%)">
            <Input type="number" value={factor} onChange={(e) => setFactor(Number(e.target.value))} />
          </Field>
          {msg && <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{msg}</p>}
        </div>
      </Modal>
    </>
  );
}

export function CatalogosClient({ data }: { data: Data }) {
  const [tab, setTab] = React.useState('clientes');
  return (
    <div className="space-y-6">
      <PageHeader title="Catálogos" description="Maestros de datos: clientes, contrapartes, partidas, insumos, plantillas y medios de pago." action={<PreciosMasivos />} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div>
        {tab === 'clientes' && <ClientesTab rows={data.clientes} />}
        {tab === 'contrapartes' && <ContrapartesTab rows={data.contrapartes} />}
        {tab === 'partidas' && <PartidasTab rows={data.partidas} lineas={data.lineas} />}
        {tab === 'insumos' && <InsumosTab rows={data.insumos} />}
        {tab === 'plantillas' && <PlantillasTab rows={data.plantillas} lineas={data.lineas} />}
        {tab === 'medios' && <MediosTab rows={data.medios} />}
      </div>
    </div>
  );
}
