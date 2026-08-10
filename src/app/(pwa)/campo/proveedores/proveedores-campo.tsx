'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Eye, Search, Loader2, Clock, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field, EmptyState } from '@/components/ui/misc';
import { soloDigitos } from '@/lib/utils';
import { guardarContraparte } from '@/app/(erp)/catalogos/actions';

type Proveedor = {
  id: string; razon_social: string; tipo: string; ruc_dni: string | null; especialidad: string | null;
  contacto: string | null; telefono: string | null; banco: string | null; cuenta: string | null;
  cci: string | null; cuenta_detraccion: string | null;
};
type Modo = 'editar' | 'solicitar' | 'lectura';
const TIPO_LBL: Record<string, string> = { contratista: 'Contratista', proveedor: 'Proveedor', ambos: 'Ambos' };

export function ProveedoresCampo({ proveedores, modo, pendientes }: { proveedores: Proveedor[]; modo: Modo; pendientes: number }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Proveedor | null>(null);
  const gestiona = modo !== 'lectura';
  const solicita = modo === 'solicitar';
  const lista = proveedores.filter((p) => `${p.razon_social} ${p.ruc_dni ?? ''} ${p.especialidad ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      {solicita && pendientes > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <Clock className="size-4 shrink-0" /> Tienes <strong>{pendientes}</strong> solicitud(es) en revisión.
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar proveedor…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {gestiona && <Button variant="gradient" size="icon" onClick={() => { setEditing(null); setOpen(true); }} aria-label="Solicitar alta"><Plus className="size-4" /></Button>}
      </div>

      {lista.length === 0 ? (
        <EmptyState icon={<HardHat className="size-8" />} titulo="Sin proveedores" descripcion={q ? 'No hay resultados para tu búsqueda.' : 'Aún no hay proveedores validados.'} />
      ) : (
        <ul className="space-y-2">
          {lista.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 rounded-2xl border bg-white p-3">
              <button className="min-w-0 flex-1 text-left" onClick={() => { setEditing(p); setOpen(true); }}>
                <p className="truncate text-sm font-medium">{p.razon_social}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {TIPO_LBL[p.tipo] ?? p.tipo}{p.ruc_dni ? ` · ${p.ruc_dni}` : ''}{p.especialidad ? ` · ${p.especialidad}` : ''}
                </p>
              </button>
              <span className="shrink-0 text-muted-foreground">{gestiona ? <Pencil className="size-4" /> : <Eye className="size-4" />}</span>
            </li>
          ))}
        </ul>
      )}

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
        ? 'Tu edición quedó como solicitud de cambio; finanzas/gerencia debe aprobarla.'
        : 'Proveedor registrado. Queda por validar por finanzas/gerencia.');
    }
    onClose(); router.refresh();
  }

  const titulo = soloLectura ? 'Detalle del proveedor' : proveedor?.id ? (solicita ? 'Solicitar cambio' : 'Editar proveedor') : (solicita ? 'Solicitar alta' : 'Nuevo proveedor');
  const dis = soloLectura;

  return (
    <Modal open onClose={onClose} title={titulo}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Razón social" required><Input value={f.razon_social} onChange={(e) => setF({ ...f, razon_social: e.target.value })} disabled={dis} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} disabled={dis}>
              <option value="contratista">Contratista</option><option value="proveedor">Proveedor</option><option value="ambos">Ambos</option>
            </Select>
          </Field>
          <Field label="RUC/DNI"><Input inputMode="numeric" maxLength={11} value={f.ruc_dni} onChange={(e) => setF({ ...f, ruc_dni: soloDigitos(e.target.value) })} disabled={dis} /></Field>
        </div>
        <Field label="Especialidad"><Input value={f.especialidad} onChange={(e) => setF({ ...f, especialidad: e.target.value })} disabled={dis} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contacto"><Input value={f.contacto} onChange={(e) => setF({ ...f, contacto: e.target.value })} disabled={dis} /></Field>
          <Field label="Teléfono"><Input inputMode="tel" maxLength={15} value={f.telefono} onChange={(e) => setF({ ...f, telefono: soloDigitos(e.target.value) })} disabled={dis} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Banco"><Input value={f.banco} onChange={(e) => setF({ ...f, banco: e.target.value })} disabled={dis} /></Field>
          <Field label="Cuenta"><Input inputMode="numeric" maxLength={20} value={f.cuenta} onChange={(e) => setF({ ...f, cuenta: soloDigitos(e.target.value) })} disabled={dis} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CCI"><Input inputMode="numeric" maxLength={20} value={f.cci} onChange={(e) => setF({ ...f, cci: soloDigitos(e.target.value) })} disabled={dis} /></Field>
          <Field label="Cta. detracción"><Input inputMode="numeric" maxLength={20} value={f.cuenta_detraccion} onChange={(e) => setF({ ...f, cuenta_detraccion: soloDigitos(e.target.value) })} disabled={dis} /></Field>
        </div>
        {solicita && <p className="text-[11px] text-muted-foreground">Lo que registres queda a la espera de aprobación de finanzas/gerencia; no cambia el proveedor hasta ser aprobado.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>{soloLectura ? 'Cerrar' : 'Cancelar'}</Button>
          {!soloLectura && <Button type="submit" variant="gradient" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null} {solicita ? (proveedor?.id ? 'Enviar solicitud' : 'Solicitar alta') : 'Guardar'}</Button>}
        </div>
      </form>
    </Modal>
  );
}
