'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/misc';
import { crearRdo, actualizarRdo, adjuntarFotosRdo, eliminarFotoRdo } from './actions';
import { enqueue, isOnline } from '@/lib/offline-queue';
import { optimizarImagen } from '@/lib/img';

type Proyecto = { id: string; nombre: string };
type Partida = { id: string; titulo: string; proyecto_id: string };
type FotoExistente = { id: string; url: string };

type Actividad = {
  descripcion: string;
  proyecto_item_id: string;
  avance_pct: string;
  estado: string;
};

function nuevaActividad(): Actividad {
  return { descripcion: '', proyecto_item_id: '', avance_pct: '', estado: '' };
}

export type RdoInicial = {
  id: string; proyecto_id: string; fecha: string; clima?: string | null; jornada?: string | null;
  personal_count?: number | null; equipos?: string | null; materiales_recibidos?: string | null;
  programacion?: string | null; observaciones?: string | null; incidencias?: string | null;
  actividades: { descripcion: string; proyecto_item_id: string | null; avance_pct: number | null; estado: string | null }[];
  fotos: FotoExistente[];
};

export function RdoForm({
  proyectos,
  partidas,
  hoy,
  inicial,
}: {
  proyectos: Proyecto[];
  partidas: Partida[];
  hoy: string;
  inicial?: RdoInicial;
}) {
  const router = useRouter();
  const esEdicion = !!inicial;
  const [proyectoId, setProyectoId] = useState(inicial?.proyecto_id ?? proyectos[0]?.id ?? '');
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoy);
  const [clima, setClima] = useState(inicial?.clima ?? '');
  const [jornada, setJornada] = useState(inicial?.jornada ?? '');
  const [programacion, setProgramacion] = useState(inicial?.programacion ?? '');
  const [personal, setPersonal] = useState(inicial?.personal_count != null ? String(inicial.personal_count) : '');
  const [equipos, setEquipos] = useState(inicial?.equipos ?? '');
  const [materiales, setMateriales] = useState(inicial?.materiales_recibidos ?? '');
  const [observaciones, setObservaciones] = useState(inicial?.observaciones ?? '');
  const [incidencias, setIncidencias] = useState(inicial?.incidencias ?? '');
  const [actividades, setActividades] = useState<Actividad[]>(
    inicial?.actividades?.length
      ? inicial.actividades.map((a) => ({ descripcion: a.descripcion, proyecto_item_id: a.proyecto_item_id ?? '', avance_pct: a.avance_pct != null ? String(Math.round(a.avance_pct * 100)) : '', estado: a.estado ?? '' }))
      : [nuevaActividad()],
  );
  const [fotosPrev, setFotosPrev] = useState<FotoExistente[]>(inicial?.fotos ?? []);
  const [fotos, setFotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const partidasProyecto = partidas.filter((p) => p.proyecto_id === proyectoId);

  async function quitarFotoPrev(id: string) {
    const r = await eliminarFotoRdo(id);
    if (r.ok) setFotosPrev((f) => f.filter((x) => x.id !== id));
    else setMsg({ type: 'err', text: r.error ?? 'No se pudo eliminar la foto.' });
  }

  function setActividad(i: number, patch: Partial<Actividad>) {
    setActividades((arr) => arr.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  async function onSubmit() {
    setMsg(null);
    if (!proyectoId) {
      setMsg({ type: 'err', text: 'Selecciona un proyecto.' });
      return;
    }
    setLoading(true);
    const payload = {
      proyecto_id: proyectoId,
      fecha,
      clima: clima || null,
      jornada: jornada || null,
      personal_count: personal ? Number(personal) : null,
      equipos: equipos || null,
      materiales_recibidos: materiales || null,
      programacion: programacion || null,
      observaciones: observaciones || null,
      incidencias: incidencias || null,
      actividades: actividades
        .filter((a) => a.descripcion.trim().length > 0)
        .map((a) => ({
          descripcion: a.descripcion.trim(),
          proyecto_item_id: a.proyecto_item_id || null,
          avance_pct: a.avance_pct ? Number(a.avance_pct) : null,
          estado: a.estado || null,
        })),
    };

    function limpiar() {
      setClima(''); setJornada(''); setProgramacion(''); setPersonal(''); setEquipos(''); setMateriales('');
      setObservaciones(''); setIncidencias(''); setActividades([nuevaActividad()]); setFotos([]);
    }

    // Sube las fotos al bucket y las registra en el reporte recién creado.
    async function subirFotos(rdoId: string) {
      if (!fotos.length) return;
      const supabase = createClient();
      const subidas: { url: string }[] = [];
      for (const original of fotos) {
        const file = await optimizarImagen(original); // HEIC→JPEG + comprime
        const safe = file.name.replace(/[^\w.\-]/g, '_');
        const path = `${proyectoId}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage.from('evidencias').upload(path, file, { cacheControl: '3600', upsert: false });
        if (error) continue;
        const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(path);
        subidas.push({ url: publicUrl });
      }
      if (subidas.length) await adjuntarFotosRdo(rdoId, proyectoId, subidas);
    }

    // Edición: requiere conexión (actualiza y sube fotos nuevas, luego vuelve).
    if (esEdicion) {
      if (!isOnline()) { setLoading(false); setMsg({ type: 'err', text: 'Necesitas conexión para editar.' }); return; }
      const res = await actualizarRdo(inicial!.id, payload);
      if (res.ok) await subirFotos(inicial!.id);
      setLoading(false);
      if (res.ok) { router.push('/campo/rdo'); router.refresh(); }
      else setMsg({ type: 'err', text: res.error ?? 'No se pudo guardar.' });
      return;
    }

    // Sin conexión → encolar para sincronizar luego (Sección 8.9)
    if (!isOnline()) {
      enqueue('rdo', payload);
      setLoading(false);
      setMsg({ type: 'ok', text: 'Sin conexión: guardado y se enviará al reconectar 📴' });
      limpiar();
      return;
    }

    try {
      const res = await crearRdo(payload);
      if (res.ok && res.id) await subirFotos(res.id);
      setLoading(false);
      if (res.ok) {
        setMsg({ type: 'ok', text: `Reporte registrado ✅${fotos.length ? ` con ${fotos.length} foto(s)` : ''}` });
        limpiar();
        router.refresh();
      } else {
        setMsg({ type: 'err', text: res.error ?? 'No se pudo registrar.' });
      }
    } catch {
      // fallo de red → encolar
      enqueue('rdo', payload);
      setLoading(false);
      setMsg({ type: 'ok', text: 'Guardado offline, se enviará al reconectar 📴' });
      limpiar();
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <ClipboardList className="size-5 text-azur-600" />
        <p className="font-semibold">{esEdicion ? 'Editar reporte diario' : 'Nuevo reporte diario'}</p>
      </div>

      <Field label="Proyecto" required>
        <Select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
          {proyectos.length === 0 && <option value="">Sin proyectos</option>}
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 items-end gap-3">
        <Field label="Fecha" required>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label="Personal">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={personal}
            onChange={(e) => setPersonal(e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 items-end gap-3">
        <Field label="Clima">
          <Input value={clima} onChange={(e) => setClima(e.target.value)} placeholder="Soleado, lluvioso..." />
        </Field>
        <Field label="Jornada">
          <Input value={jornada} onChange={(e) => setJornada(e.target.value)} placeholder="08:00 - 17:00 h" />
        </Field>
      </div>

      {/* Actividades: la parte más relevante del reporte, va arriba. */}
      <div className="space-y-3 rounded-xl border-2 border-azur-100 bg-azur-50/30 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-azur-700">Actividades y avance</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActividades((a) => [...a, nuevaActividad()])}
          >
            <Plus className="size-4" /> Actividad
          </Button>
        </div>

        {actividades.map((a, i) => (
          <div key={i} className="space-y-2 rounded-xl border bg-white p-3">
            <div className="flex items-start gap-2">
              <Textarea
                className="min-h-[60px]"
                value={a.descripcion}
                onChange={(e) => setActividad(i, { descripcion: e.target.value })}
                placeholder="Descripción de la actividad"
              />
              {actividades.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setActividades((arr) => arr.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="size-4 text-azur-600" />
                </Button>
              )}
            </div>
            <Select
              value={a.proyecto_item_id}
              onChange={(e) => setActividad(i, { proyecto_item_id: e.target.value })}
            >
              <option value="">Partida (opcional)</option>
              {partidasProyecto.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={a.avance_pct}
                onChange={(e) => setActividad(i, { avance_pct: e.target.value })}
                placeholder="Avance %"
              />
              <Select value={a.estado} onChange={(e) => setActividad(i, { estado: e.target.value })}>
                <option value="">Estado…</option>
                <option value="Iniciado">Iniciado</option>
                <option value="En ejecución">En ejecución</option>
                <option value="Completado">Completado</option>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <Field label="Equipos">
        <Textarea value={equipos} onChange={(e) => setEquipos(e.target.value)} placeholder="Equipos en obra" />
      </Field>

      <Field label="Materiales recibidos">
        <Textarea
          value={materiales}
          onChange={(e) => setMateriales(e.target.value)}
          placeholder="Materiales recibidos"
        />
      </Field>

      <Field label="Programación para la siguiente jornada">
        <Textarea value={programacion} onChange={(e) => setProgramacion(e.target.value)} placeholder="Una línea por punto (aparecen como viñetas en el PDF)" />
      </Field>

      <Field label="Observaciones">
        <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </Field>

      <Field label="Incidencias">
        <Textarea value={incidencias} onChange={(e) => setIncidencias(e.target.value)} />
      </Field>

      <Field label="Fotos de respaldo">
        {fotosPrev.length > 0 && (
          <div className="mb-2 grid grid-cols-3 gap-2">
            {fotosPrev.map((f) => (
              <div key={f.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt="foto" className="h-20 w-full rounded-lg object-cover" />
                <button type="button" onClick={() => quitarFotoPrev(f.id)} className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-azur-600 text-white shadow" aria-label="Eliminar foto">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFotos(Array.from(e.target.files ?? []))}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-azur-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-azur-600"
        />
        {fotos.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{fotos.length} foto(s) nueva(s). Se subirán al guardar (requiere conexión).</p>}
      </Field>

      <Button variant="gradient" size="lg" className="w-full" disabled={loading} onClick={onSubmit}>
        {loading && <Loader2 className="animate-spin" />} {esEdicion ? 'Guardar cambios' : 'Guardar reporte'}
      </Button>
      {esEdicion && <Button variant="outline" className="w-full" onClick={() => router.push('/campo/rdo')}>Cancelar</Button>}

      {msg && (
        <p className={`text-center text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-azur-600'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
