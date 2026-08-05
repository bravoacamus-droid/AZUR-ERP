'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, Users, UserPlus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/misc';
import { fmtDateInput } from '@/lib/format';
import { guardarTareo, guardarTrabajador } from './actions';

export type Trabajador = { id: string; nombre: string; especialidad?: string | null; tarifa_dia?: number | null; recurrente?: boolean };
type Fila = { trabajador_id: string | null; trabajador_nombre: string; presente: boolean; horas: string; horas_extra: string };

const nuevaFila = (id: string | null, nombre: string): Fila => ({ trabajador_id: id, trabajador_nombre: nombre, presente: true, horas: '8', horas_extra: '' });

export function TareoForm({ proyectos, trabajadores }: { proyectos: { id: string; nombre: string }[]; trabajadores: Trabajador[] }) {
  const router = useRouter();
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '');
  const [fecha, setFecha] = useState(fmtDateInput(new Date()));
  const [filas, setFilas] = useState<Fila[]>([]);
  const [libre, setLibre] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; x: string } | null>(null);
  const [nuevo, setNuevo] = useState({ open: false, nombre: '', especialidad: '', tarifa: '', recurrente: true });
  const [savingT, setSavingT] = useState(false);

  const recurrentes = trabajadores.filter((t) => t.recurrente);
  const upd = (i: number, p: Partial<Fila>) => setFilas((f) => f.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const yaEsta = (id: string) => filas.some((f) => f.trabajador_id === id);

  function agregarDelMaestro(id: string) {
    if (!id || yaEsta(id)) return;
    const t = trabajadores.find((x) => x.id === id);
    if (t) setFilas((f) => [...f, nuevaFila(t.id, t.nombre)]);
  }
  function agregarLibre() {
    const n = libre.trim();
    if (!n) return;
    setFilas((f) => [...f, nuevaFila(null, n)]);
    setLibre('');
  }
  async function crearEnMaestro() {
    if (!nuevo.nombre.trim()) return;
    setSavingT(true);
    const r = await guardarTrabajador({ nombre: nuevo.nombre.trim(), especialidad: nuevo.especialidad || null, tarifa_dia: nuevo.tarifa ? Number(nuevo.tarifa) : 0, recurrente: nuevo.recurrente });
    setSavingT(false);
    if (!r.ok) { setMsg({ t: 'err', x: r.error ?? 'Error' }); return; }
    if (r.id) setFilas((f) => [...f, nuevaFila(r.id!, nuevo.nombre.trim())]);
    setNuevo({ open: false, nombre: '', especialidad: '', tarifa: '', recurrente: true });
    router.refresh();
  }

  const presentes = filas.filter((f) => f.presente).length;
  const conExtra = filas.filter((f) => Number(f.horas_extra) > 0).length;

  async function submit() {
    setMsg(null);
    const lista = filas.filter((f) => f.trabajador_nombre.trim());
    if (!proyectoId || lista.length === 0) { setMsg({ t: 'err', x: 'Selecciona proyecto y agrega al menos un trabajador.' }); return; }
    setLoading(true);
    const res = await guardarTareo({
      proyecto_id: proyectoId, fecha,
      trabajadores: lista.map((f) => ({ trabajador_id: f.trabajador_id, trabajador_nombre: f.trabajador_nombre.trim(), presente: f.presente, horas: f.horas ? Number(f.horas) : null, horas_extra: f.horas_extra ? Number(f.horas_extra) : null })),
    });
    setLoading(false);
    if (res.ok) { setMsg({ t: 'ok', x: 'Tareo registrado ✅' }); setFilas([]); router.refresh(); }
    else setMsg({ t: 'err', x: res.error ?? 'No se pudo registrar.' });
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2"><Users className="size-5 text-azur-600" /><p className="font-semibold">Tareo de cuadrilla</p></div>
      <div className="grid grid-cols-2 items-end gap-2">
        <Field label="Proyecto"><Select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>{proyectos.length === 0 && <option value="">Sin proyectos</option>}{proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Select></Field>
        <Field label="Fecha"><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
      </div>

      {recurrentes.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Frecuentes</p>
          <div className="flex flex-wrap gap-1.5">
            {recurrentes.map((t) => (
              <button key={t.id} type="button" disabled={yaEsta(t.id)} onClick={() => agregarDelMaestro(t.id)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${yaEsta(t.id) ? 'opacity-40' : 'hover:bg-azur-50'}`}>
                <Star className="size-3 text-amber-500" /> {t.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        <Select value="" onChange={(e) => agregarDelMaestro(e.target.value)}>
          <option value="">➕ Elegir del maestro…</option>
          {trabajadores.filter((t) => !yaEsta(t.id)).map((t) => <option key={t.id} value={t.id}>{t.nombre}{t.especialidad ? ` · ${t.especialidad}` : ''}</option>)}
        </Select>
        <div className="flex gap-2">
          <Input className="flex-1" placeholder="…o escribe un nombre" value={libre} onChange={(e) => setLibre(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarLibre(); } }} />
          <Button type="button" variant="outline" onClick={agregarLibre}><Plus /> Agregar</Button>
        </div>
        <button type="button" onClick={() => setNuevo((n) => ({ ...n, open: !n.open }))} className="inline-flex items-center gap-1 self-start text-xs font-medium text-azur-600">
          <UserPlus className="size-3.5" /> {nuevo.open ? 'Cerrar' : 'Registrar nuevo en el maestro'}
        </button>
        {nuevo.open && (
          <div className="space-y-2 rounded-xl border bg-secondary/30 p-3">
            <Input placeholder="Nombre completo" value={nuevo.nombre} onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Especialidad (opc.)" value={nuevo.especialidad} onChange={(e) => setNuevo((n) => ({ ...n, especialidad: e.target.value }))} />
              <Input type="number" inputMode="decimal" placeholder="Tarifa/día S/" value={nuevo.tarifa} onChange={(e) => setNuevo((n) => ({ ...n, tarifa: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={nuevo.recurrente} onChange={(e) => setNuevo((n) => ({ ...n, recurrente: e.target.checked }))} /> Marcar como frecuente</label>
            <Button type="button" size="sm" variant="gradient" disabled={savingT} onClick={crearEnMaestro}>{savingT && <Loader2 className="animate-spin" />} Guardar y agregar</Button>
          </div>
        )}
      </div>

      {filas.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_3.5rem_3.5rem_2.25rem] items-center gap-2 px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>Trabajador</span><span className="text-center">Horas</span><span className="text-center">Extra</span><span />
          </div>
          {filas.map((f, i) => (
            <div key={i} className="grid grid-cols-[1fr_3.5rem_3.5rem_2.25rem] items-center gap-2">
              <div className="min-w-0">
                {f.trabajador_id ? <p className="truncate text-sm font-medium">{f.trabajador_nombre}</p>
                  : <Input value={f.trabajador_nombre} onChange={(e) => upd(i, { trabajador_nombre: e.target.value })} placeholder="Nombre" />}
                <button type="button" onClick={() => upd(i, { presente: !f.presente })} className={`text-[11px] font-medium ${f.presente ? 'text-emerald-600' : 'text-azur-600'}`}>{f.presente ? 'Presente' : 'Ausente'}</button>
              </div>
              <Input className="text-center" type="number" inputMode="decimal" value={f.horas} onChange={(e) => upd(i, { horas: e.target.value })} />
              <Input className="text-center" type="number" inputMode="decimal" placeholder="0" value={f.horas_extra} onChange={(e) => upd(i, { horas_extra: e.target.value })} />
              <button type="button" onClick={() => setFilas((fs) => fs.filter((_, j) => j !== i))} className="flex size-9 items-center justify-center text-muted-foreground"><Trash2 className="size-4" /></button>
            </div>
          ))}
          <div className="flex gap-4 rounded-lg bg-secondary/40 px-3 py-1.5 text-xs">
            <span><b>{presentes}</b> hombres</span>
            <span><b>{conExtra}</b> con horas extra</span>
          </div>
        </div>
      )}

      <Button variant="gradient" size="lg" className="w-full" disabled={loading} onClick={submit}>{loading && <Loader2 className="animate-spin" />} Registrar tareo</Button>
      {msg && <p className={`text-center text-sm ${msg.t === 'ok' ? 'text-emerald-600' : 'text-azur-600'}`}>{msg.x}</p>}
    </div>
  );
}
