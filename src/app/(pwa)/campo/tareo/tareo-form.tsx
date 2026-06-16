'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/misc';
import { fmtDateInput } from '@/lib/format';
import { guardarTareo } from './actions';

type Trab = { trabajador_nombre: string; presente: boolean; horas: string };
const vacio = (): Trab => ({ trabajador_nombre: '', presente: true, horas: '8' });

export function TareoForm({ proyectos }: { proyectos: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '');
  const [fecha, setFecha] = useState(fmtDateInput(new Date()));
  const [trabs, setTrabs] = useState<Trab[]>([vacio()]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const upd = (i: number, p: Partial<Trab>) => setTrabs((t) => t.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function submit() {
    setMsg(null);
    const lista = trabs.filter((t) => t.trabajador_nombre.trim());
    if (!proyectoId || lista.length === 0) { setMsg('Selecciona proyecto y agrega al menos un trabajador.'); return; }
    setLoading(true);
    const res = await guardarTareo({
      proyecto_id: proyectoId, fecha,
      trabajadores: lista.map((t) => ({ trabajador_nombre: t.trabajador_nombre.trim(), presente: t.presente, horas: t.horas ? Number(t.horas) : null })),
    });
    setLoading(false);
    if (res.ok) { setMsg('Tareo registrado ✅'); setTrabs([vacio()]); router.refresh(); }
    else setMsg(res.error ?? 'No se pudo registrar.');
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2"><Users className="size-5 text-azur-600" /><p className="font-semibold">Tareo de cuadrilla</p></div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Proyecto"><Select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>{proyectos.length === 0 && <option value="">Sin proyectos</option>}{proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Select></Field>
        <Field label="Fecha"><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
      </div>

      <div className="space-y-2">
        {trabs.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input className="flex-1" placeholder="Nombre del trabajador" value={t.trabajador_nombre} onChange={(e) => upd(i, { trabajador_nombre: e.target.value })} />
            <Input className="w-16" type="number" inputMode="numeric" placeholder="hrs" value={t.horas} onChange={(e) => upd(i, { horas: e.target.value })} />
            <button onClick={() => upd(i, { presente: !t.presente })} title={t.presente ? 'Presente' : 'Ausente'} className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${t.presente ? 'bg-emerald-50 text-emerald-600' : 'bg-azur-50 text-azur-600'}`}>
              {t.presente ? <Check className="size-4" /> : <Trash2 className="size-4" />}
            </button>
            {trabs.length > 1 && <button onClick={() => setTrabs((tr) => tr.filter((_, j) => j !== i))} className="text-muted-foreground"><Trash2 className="size-4" /></button>}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setTrabs((t) => [...t, vacio()])}><Plus /> Agregar trabajador</Button>
      </div>

      <Button variant="gradient" size="lg" className="w-full" disabled={loading} onClick={submit}>{loading && <Loader2 className="animate-spin" />} Registrar tareo</Button>
      {msg && <p className="text-center text-sm text-emerald-600">{msg}</p>}
    </div>
  );
}
