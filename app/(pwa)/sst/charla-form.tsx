'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrarCharla, type SstActionState } from './actions';

type Proyecto = { id: string; codigo: string; nombre: string };

const inputClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Registrar charla
    </Button>
  );
}

export function CharlaForm({ proyectos }: { proyectos: Proyecto[] }) {
  const [state, formAction] = useFormState<SstActionState, FormData>(registrarCharla, { ok: true });

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && !state.error) {
      // OK
    }
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="charla_proy">Proyecto</Label>
        <select name="proyecto_id" id="charla_proy" required className={inputClass}>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} · {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input name="fecha" id="fecha" type="date" required defaultValue={today} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="asistencia">Asistencia</Label>
          <Input name="asistencia" id="asistencia" type="number" min={0} required defaultValue={0} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tema">Tema</Label>
        <Input
          name="tema"
          id="tema"
          required
          minLength={3}
          placeholder="Ej. Uso de EPP en trabajos en altura"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
