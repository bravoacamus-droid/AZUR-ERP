'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { registrarObservacion, type SstActionState } from './actions';

type Proyecto = { id: string; codigo: string; nombre: string };

const inputClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

const textareaClass =
  'flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Reportar observación
    </Button>
  );
}

export function ObservacionForm({ proyectos }: { proyectos: Proyecto[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const lastSavedRef = useRef<number | null>(null);
  const [state, formAction] = useFormState<SstActionState, FormData>(registrarObservacion, {
    ok: true,
  });

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.savedAt && state.savedAt !== lastSavedRef.current) {
      lastSavedRef.current = state.savedAt;
      toast.success('Observación reportada');
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="azur-card space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-azur-red" />
        <h2 className="font-display text-base font-bold text-azur-ink">Reportar observación</h2>
      </div>
      <div className="space-y-2">
        <Label htmlFor="obs_proy">Proyecto</Label>
        <select name="proyecto_id" id="obs_proy" required className={inputClass}>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} · {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="obs_tipo">Tipo</Label>
        <select
          name="tipo"
          id="obs_tipo"
          required
          className={inputClass}
          defaultValue="condicion_insegura"
        >
          <option value="acto_inseguro">Acto inseguro</option>
          <option value="condicion_insegura">Condición insegura</option>
          <option value="sugerencia">Sugerencia</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="obs_desc">Descripción *</Label>
        <textarea
          name="descripcion"
          id="obs_desc"
          required
          minLength={5}
          rows={2}
          placeholder="Mínimo 5 caracteres"
          className={textareaClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="obs_acc">Acción correctiva (opcional)</Label>
        <textarea name="accion_correctiva" id="obs_acc" rows={2} className={textareaClass} />
      </div>
      <SubmitButton />
    </form>
  );
}
