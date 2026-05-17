'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { crearRdo, type CrearRdoState } from './actions';

type Proyecto = { id: string; codigo: string; nombre: string };

const selectClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

const textareaClass =
  'flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" loading={pending} className="w-full">
      <Save className="h-4 w-4" />
      Guardar parte diario
    </Button>
  );
}

export function RdoForm({ proyectos }: { proyectos: Proyecto[] }) {
  const [state, formAction] = useFormState<CrearRdoState, FormData>(crearRdo, { ok: true });

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      <div className="azur-card space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="proyecto_id">Proyecto</Label>
          <select id="proyecto_id" name="proyecto_id" required className={selectClass}>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" name="fecha" type="date" required defaultValue={today} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="personal_total">Personal total</Label>
            <Input
              id="personal_total"
              name="personal_total"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="clima">Clima</Label>
            <select id="clima" name="clima" className={selectClass} defaultValue="">
              <option value="">— Selecciona —</option>
              <option value="soleado">☀ Soleado</option>
              <option value="nublado">☁ Nublado</option>
              <option value="nuboso">⛅ Nuboso</option>
              <option value="lluvioso">🌧 Lluvioso</option>
              <option value="tormenta">⛈ Tormenta</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temperatura_c">Temperatura (°C)</Label>
            <Input id="temperatura_c" name="temperatura_c" type="number" step="0.1" placeholder="ej. 22.5" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="resumen">Resumen del día *</Label>
          <textarea
            id="resumen"
            name="resumen"
            rows={3}
            required
            minLength={5}
            placeholder="Qué se hizo hoy, frentes activos, hitos."
            className={textareaClass}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="observaciones">Observaciones</Label>
          <textarea
            id="observaciones"
            name="observaciones"
            rows={2}
            placeholder="Materiales recibidos, equipos, visitas, decisiones."
            className={textareaClass}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="incidencias">Incidencias</Label>
          <textarea
            id="incidencias"
            name="incidencias"
            rows={2}
            placeholder="Demoras, problemas, accidentes (si los hubiera)."
            className={textareaClass}
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
