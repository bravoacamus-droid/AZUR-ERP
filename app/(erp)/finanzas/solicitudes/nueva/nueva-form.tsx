'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { crearSolicitud, type CrearSolicitudState } from '../actions';
import { SOLICITUD_CATEGORIA_LABEL, URGENCIA_LABEL } from '@/lib/finanzas/estados';

type Proyecto = { id: string; codigo: string; nombre: string; moneda: string | null };

const inputBase =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Enviar a aprobación
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function NuevaSolicitudForm({ proyectos }: { proyectos: Proyecto[] }) {
  const [state, formAction] = useFormState<CrearSolicitudState, FormData>(crearSolicitud, {
    ok: true,
  });

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <div className="azur-card space-y-5 lg:col-span-2">
        <h2 className="font-display text-lg font-bold text-azur-ink">Solicitud</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="proyecto_id">Proyecto *</Label>
            <select id="proyecto_id" name="proyecto_id" required className={inputBase}>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} · {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoria">Categoría *</Label>
            <select id="categoria" name="categoria" required className={inputBase} defaultValue="proveedor">
              {Object.entries(SOLICITUD_CATEGORIA_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="urgencia">Urgencia</Label>
            <select id="urgencia" name="urgencia" className={inputBase} defaultValue="normal">
              {Object.entries(URGENCIA_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="concepto">Concepto *</Label>
            <Input
              id="concepto"
              name="concepto"
              required
              minLength={3}
              placeholder="Ej. Compra de cemento Portland — 50 bolsas"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="beneficiario">Beneficiario *</Label>
            <Input
              id="beneficiario"
              name="beneficiario"
              required
              minLength={3}
              placeholder="Razón social o nombre completo"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monto">Monto *</Label>
            <Input id="monto" name="monto" type="number" step="0.01" min={0.01} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="moneda">Moneda</Label>
            <select id="moneda" name="moneda" className={inputBase} defaultValue="PEN">
              <option value="PEN">PEN — Soles</option>
              <option value="USD">USD — Dólares</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notas">Notas / sustento</Label>
            <textarea
              id="notas"
              name="notas"
              rows={3}
              className="flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="azur-card space-y-3 bg-azur-coral/10">
          <p className="text-sm font-semibold text-azur-ink">Flujo de aprobación</p>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li>1. Tu solicitud queda <strong>pendiente</strong>.</li>
            <li>2. El jefe de proyectos la revisa y aprueba.</li>
            <li>3. El administrador la programa contra cuenta bancaria.</li>
            <li>4. Se sube voucher → marca como <strong>pagada</strong>.</li>
            <li>5. Comparte el voucher por WhatsApp con 1 click.</li>
          </ol>
          <div className="flex gap-2 pt-3">
            <Link
              href="/finanzas/solicitudes"
              className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-azur-coral hover:text-azur-red"
            >
              Cancelar
            </Link>
            <SubmitButton />
          </div>
        </div>
      </div>
    </form>
  );
}
