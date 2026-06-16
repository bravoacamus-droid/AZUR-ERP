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
import { crearRdo } from './actions';
import { enqueue, isOnline } from '@/lib/offline-queue';

type Proyecto = { id: string; nombre: string };
type Partida = { id: string; titulo: string; proyecto_id: string };

type Actividad = {
  descripcion: string;
  proyecto_item_id: string;
  avance_pct: string;
};

function nuevaActividad(): Actividad {
  return { descripcion: '', proyecto_item_id: '', avance_pct: '' };
}

export function RdoForm({
  proyectos,
  partidas,
  hoy,
}: {
  proyectos: Proyecto[];
  partidas: Partida[];
  hoy: string;
}) {
  const router = useRouter();
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '');
  const [fecha, setFecha] = useState(hoy);
  const [clima, setClima] = useState('');
  const [personal, setPersonal] = useState('');
  const [equipos, setEquipos] = useState('');
  const [materiales, setMateriales] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [incidencias, setIncidencias] = useState('');
  const [actividades, setActividades] = useState<Actividad[]>([nuevaActividad()]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const partidasProyecto = partidas.filter((p) => p.proyecto_id === proyectoId);

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
      personal_count: personal ? Number(personal) : null,
      equipos: equipos || null,
      materiales_recibidos: materiales || null,
      observaciones: observaciones || null,
      incidencias: incidencias || null,
      actividades: actividades
        .filter((a) => a.descripcion.trim().length > 0)
        .map((a) => ({
          descripcion: a.descripcion.trim(),
          proyecto_item_id: a.proyecto_item_id || null,
          avance_pct: a.avance_pct ? Number(a.avance_pct) : null,
        })),
    };

    function limpiar() {
      setClima(''); setPersonal(''); setEquipos(''); setMateriales('');
      setObservaciones(''); setIncidencias(''); setActividades([nuevaActividad()]);
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
      setLoading(false);
      if (res.ok) {
        setMsg({ type: 'ok', text: 'Parte diario registrado ✅' });
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
        <p className="font-semibold">Nuevo parte diario</p>
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

      <div className="grid grid-cols-2 gap-3">
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

      <Field label="Clima">
        <Input value={clima} onChange={(e) => setClima(e.target.value)} placeholder="Soleado, lluvioso..." />
      </Field>

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

      <Field label="Observaciones">
        <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </Field>

      <Field label="Incidencias">
        <Textarea value={incidencias} onChange={(e) => setIncidencias(e.target.value)} />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Actividades</p>
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
          <div key={i} className="space-y-2 rounded-xl border bg-secondary/30 p-3">
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
            <div className="grid grid-cols-2 gap-2">
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
              <Input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={a.avance_pct}
                onChange={(e) => setActividad(i, { avance_pct: e.target.value })}
                placeholder="Avance %"
              />
            </div>
          </div>
        ))}
      </div>

      <Button variant="gradient" size="lg" className="w-full" disabled={loading} onClick={onSubmit}>
        {loading && <Loader2 className="animate-spin" />} Guardar parte
      </Button>

      {msg && (
        <p className={`text-center text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-azur-600'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
