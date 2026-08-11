'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/misc';
import { crearProyectoDirecto } from './actions';

type Opt = { id: string; nombre: string };

export function NuevoProyecto({ clientes, lineas }: { clientes: Opt[]; lineas: Opt[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const vacio = {
    nombre: '', cliente_id: '', linea_id: '', tipo_proyecto: 'chico', direccion: '',
    contrato_total: '', fecha_inicio: '', fecha_fin: '', adelanto_pct: '', base_valorizacion: 'costo',
    gg_pct: '', ga_pct: '', utilidad_pct: '', igv_pct: '18',
  };
  const [f, setF] = React.useState(vacio);
  const set = (k: keyof typeof vacio, v: string) => setF((s) => ({ ...s, [k]: v }));
  const pct = (v: string) => (v === '' ? 0 : Number(v) / 100); // el usuario ingresa %, se guarda fracción

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const r = await crearProyectoDirecto({
      nombre: f.nombre, cliente_id: f.cliente_id, linea_id: f.linea_id,
      tipo_proyecto: f.tipo_proyecto as 'grande' | 'chico', direccion: f.direccion || null,
      contrato_total: f.contrato_total ? Number(f.contrato_total) : 0,
      fecha_inicio: f.fecha_inicio || null, fecha_fin: f.fecha_fin || null,
      adelanto_pct: pct(f.adelanto_pct), base_valorizacion: f.base_valorizacion as 'costo' | 'precio',
      gg_pct: pct(f.gg_pct), ga_pct: pct(f.ga_pct), utilidad_pct: pct(f.utilidad_pct), igv_pct: pct(f.igv_pct),
    });
    setSaving(false);
    if (!r.ok) { setError(r.error ?? 'No se pudo crear'); return; }
    setOpen(false); setF(vacio);
    if (r.id) router.push(`/proyectos/${r.id}`);
    else router.refresh();
  }

  return (
    <>
      <Button variant="gradient" onClick={() => setOpen(true)}><Plus className="size-4" /> Nuevo proyecto</Button>
      {open && (
        <Modal open onClose={() => setOpen(false)} title="Nuevo proyecto (sin cotización)">
          <form onSubmit={submit} className="space-y-3">
            <Field label="Nombre del proyecto" required><Input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cliente" required>
                <Select value={f.cliente_id} onChange={(e) => set('cliente_id', e.target.value)} required>
                  <option value="">Seleccionar…</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </Select>
              </Field>
              <Field label="Línea de negocio" required>
                <Select value={f.linea_id} onChange={(e) => set('linea_id', e.target.value)} required>
                  <option value="">Seleccionar…</option>
                  {lineas.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </Select>
              </Field>
              <Field label="Tipo">
                <Select value={f.tipo_proyecto} onChange={(e) => set('tipo_proyecto', e.target.value)}>
                  <option value="chico">Chico</option><option value="grande">Grande</option>
                </Select>
              </Field>
              <Field label="Contrato total (S/)"><Input type="number" step="0.01" inputMode="decimal" value={f.contrato_total} onChange={(e) => set('contrato_total', e.target.value)} /></Field>
            </div>
            <Field label="Dirección / ubicación"><Input value={f.direccion} onChange={(e) => set('direccion', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de inicio"><Input type="date" value={f.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} /></Field>
              <Field label="Fecha de fin"><Input type="date" value={f.fecha_fin} onChange={(e) => set('fecha_fin', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Adelanto (%)"><Input type="number" step="0.1" inputMode="decimal" value={f.adelanto_pct} onChange={(e) => set('adelanto_pct', e.target.value)} placeholder="0" /></Field>
              <Field label="Base de valorización">
                <Select value={f.base_valorizacion} onChange={(e) => set('base_valorizacion', e.target.value)}>
                  <option value="costo">Costo</option><option value="precio">Precio (con margen)</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Field label="GG %"><Input type="number" step="0.1" inputMode="decimal" value={f.gg_pct} onChange={(e) => set('gg_pct', e.target.value)} placeholder="0" /></Field>
              <Field label="GA %"><Input type="number" step="0.1" inputMode="decimal" value={f.ga_pct} onChange={(e) => set('ga_pct', e.target.value)} placeholder="0" /></Field>
              <Field label="Utilidad %"><Input type="number" step="0.1" inputMode="decimal" value={f.utilidad_pct} onChange={(e) => set('utilidad_pct', e.target.value)} placeholder="0" /></Field>
              <Field label="IGV %"><Input type="number" step="0.1" inputMode="decimal" value={f.igv_pct} onChange={(e) => set('igv_pct', e.target.value)} placeholder="18" /></Field>
            </div>
            <p className="text-[11px] text-muted-foreground">El proyecto se crea con el itemizado vacío; lo completas luego en <strong>Last Planner</strong> (o lo importas). Los % de margen se usan al valorizar a precio.</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="gradient" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null} Crear proyecto</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
