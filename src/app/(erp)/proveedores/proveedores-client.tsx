'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Eye, HardHat, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Field, EmptyState } from '@/components/ui/misc';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page';
import { soloDigitos } from '@/lib/utils';
import { guardarContraparte } from '@/app/(erp)/catalogos/actions';

type Proveedor = {
  id: string; razon_social: string; tipo: string; ruc_dni: string | null; especialidad: string | null;
  contacto: string | null; telefono: string | null; banco: string | null; cuenta: string | null;
  cci: string | null; cuenta_detraccion: string | null;
};
type Modo = 'editar' | 'solicitar' | 'lectura';

const TIPO_LBL: Record<string, string> = { contratista: 'Contratista', proveedor: 'Proveedor', ambos: 'Ambos' };

export function ProveedoresClient({ proveedores, modo, pendientes }: { proveedores: Proveedor[]; modo: Modo; pendientes: number }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Proveedor | null>(null);
  const gestiona = modo !== 'lectura';
  const solicita = modo === 'solicitar';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description={
          modo === 'editar' ? 'Maestro de proveedores y contratistas.'
            : solicita ? 'Consulta el maestro y solicita altas o cambios; finanzas/gerencia los aprueban.'
            : 'Consulta del maestro de proveedores (solo lectura).'
        }
        action={gestiona ? <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" /> {solicita ? 'Solicitar alta' : 'Nuevo proveedor'}</Button> : undefined}
      />

      {solicita && pendientes > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <Clock className="size-4" /> Tienes <strong>{pendientes}</strong> solicitud(es) en revisión por finanzas/gerencia.
        </div>
      )}

      <Card>
        {proveedores.length === 0 ? (
          <EmptyState icon={<HardHat className="size-8" />} titulo="Sin proveedores" descripcion="Aún no hay proveedores validados." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razón social</TableHead><TableHead>Tipo</TableHead><TableHead>RUC/DNI</TableHead>
                  <TableHead>Especialidad</TableHead><TableHead>Contacto</TableHead><TableHead>Banco / cuenta</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.razon_social}</TableCell>
                    <TableCell><Badge variant="outline">{TIPO_LBL[c.tipo] ?? c.tipo}</Badge></TableCell>
                    <TableCell className="tabular-nums">{c.ruc_dni ?? '—'}</TableCell>
                    <TableCell>{c.especialidad ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.contacto || c.telefono || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.banco ? `${c.banco} · ${c.cci || c.cuenta || ''}` : (c.cci || c.cuenta || '—')}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                        {gestiona ? <><Pencil className="size-3.5" /> {solicita ? 'Solicitar cambio' : 'Editar'}</> : <><Eye className="size-4" /> Ver</>}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {open && <ProveedorForm proveedor={editing} modo={modo} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ProveedorForm({ proveedor, modo, onClose }: { proveedor: Proveedor | null; modo: Modo; onClose: () => void }) {
  const router = useRouter();
  const soloLectura = modo === 'lectura';
  const solicita = modo === 'solicitar';
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [f, setF] = React.useState({
    razon_social: proveedor?.razon_social ?? '', tipo: proveedor?.tipo ?? 'proveedor', ruc_dni: proveedor?.ruc_dni ?? '',
    especialidad: proveedor?.especialidad ?? '', contacto: proveedor?.contacto ?? '', telefono: proveedor?.telefono ?? '',
    banco: proveedor?.banco ?? '', cuenta: proveedor?.cuenta ?? '', cci: proveedor?.cci ?? '', cuenta_detraccion: proveedor?.cuenta_detraccion ?? '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const r = await guardarContraparte({ id: proveedor?.id, ...f, tipo: f.tipo as never });
    setSaving(false);
    if (!r.ok) { setError(r.error ?? 'No se pudo guardar'); return; }
    if ((r as { pendiente?: boolean }).pendiente) {
      alert(proveedor?.id
        ? 'Tu edición quedó como solicitud de cambio; finanzas/gerencia debe aprobarla antes de aplicarse.'
        : 'Proveedor registrado. Queda por validar por finanzas/gerencia antes de usarse.');
    }
    onClose(); router.refresh();
  }

  const titulo = soloLectura ? 'Detalle del proveedor' : proveedor?.id ? (solicita ? 'Solicitar cambio' : 'Editar proveedor') : (solicita ? 'Solicitar alta' : 'Nuevo proveedor');
  const dis = soloLectura;

  return (
    <Modal open onClose={onClose} title={titulo}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Razón social" required className="col-span-2"><Input value={f.razon_social} onChange={(e) => setF({ ...f, razon_social: e.target.value })} disabled={dis} required /></Field>
          <Field label="Tipo">
            <Select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} disabled={dis}>
              <option value="contratista">Contratista</option><option value="proveedor">Proveedor</option><option value="ambos">Ambos</option>
            </Select>
          </Field>
          <Field label="RUC/DNI"><Input inputMode="numeric" maxLength={11} value={f.ruc_dni} onChange={(e) => setF({ ...f, ruc_dni: soloDigitos(e.target.value) })} disabled={dis} /></Field>
          <Field label="Especialidad" className="col-span-2"><Input value={f.especialidad} onChange={(e) => setF({ ...f, especialidad: e.target.value })} disabled={dis} /></Field>
          <Field label="Contacto"><Input value={f.contacto} onChange={(e) => setF({ ...f, contacto: e.target.value })} disabled={dis} /></Field>
          <Field label="Teléfono"><Input inputMode="tel" maxLength={15} value={f.telefono} onChange={(e) => setF({ ...f, telefono: soloDigitos(e.target.value) })} disabled={dis} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Banco"><Input value={f.banco} onChange={(e) => setF({ ...f, banco: e.target.value })} disabled={dis} /></Field>
          <Field label="Cuenta"><Input inputMode="numeric" maxLength={20} value={f.cuenta} onChange={(e) => setF({ ...f, cuenta: soloDigitos(e.target.value) })} disabled={dis} /></Field>
          <Field label="CCI"><Input inputMode="numeric" maxLength={20} value={f.cci} onChange={(e) => setF({ ...f, cci: soloDigitos(e.target.value) })} disabled={dis} /></Field>
          <Field label="Cuenta de detracción" className="col-span-3"><Input inputMode="numeric" maxLength={20} value={f.cuenta_detraccion} onChange={(e) => setF({ ...f, cuenta_detraccion: soloDigitos(e.target.value) })} disabled={dis} /></Field>
        </div>
        {solicita && <p className="text-xs text-muted-foreground">Los cambios que registres aquí quedan a la espera de aprobación de finanzas/gerencia; no modifican el proveedor hasta ser aprobados.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>{soloLectura ? 'Cerrar' : 'Cancelar'}</Button>
          {!soloLectura && <Button type="submit" variant="gradient" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null} {solicita ? (proveedor?.id ? 'Enviar solicitud' : 'Solicitar alta') : 'Guardar'}</Button>}
        </div>
      </form>
    </Modal>
  );
}
