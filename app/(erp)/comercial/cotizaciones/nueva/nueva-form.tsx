'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { crearCotizacion, type CrearCotizacionState } from '../actions';

type Cliente = { id: string; razon_social: string; ruc: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Crear cotización
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function NuevaCotizacionForm({ clientes }: { clientes: Cliente[] }) {
  const [state, formAction] = useFormState<CrearCotizacionState, FormData>(crearCotizacion, {
    ok: true,
  });

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <div className="azur-card space-y-5 lg:col-span-2">
        <h2 className="font-display text-lg font-bold text-azur-ink">Datos generales</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="titulo">Título de la cotización *</Label>
            <Input
              id="titulo"
              name="titulo"
              required
              minLength={3}
              placeholder="Ej. Construcción de oficina administrativa — Edificio Lima Center"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cliente_id">Cliente</Label>
            <select
              id="cliente_id"
              name="cliente_id"
              className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
            >
              <option value="">— Sin cliente asignado —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razon_social} {c.ruc ? `· RUC ${c.ruc}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ubicacion">Ubicación de la obra</Label>
            <Input id="ubicacion" name="ubicacion" placeholder="Ej. Av. Javier Prado 1234, San Isidro" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="descripcion">Descripción / alcance</Label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              className="flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
              placeholder="Resumen del alcance contractual"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="azur-card space-y-4">
          <h2 className="font-display text-lg font-bold text-azur-ink">Comerciales</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="moneda">Moneda</Label>
              <select
                id="moneda"
                name="moneda"
                defaultValue="PEN"
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
              >
                <option value="PEN">PEN — Soles</option>
                <option value="USD">USD — Dólares</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validez_dias">Validez (días)</Label>
              <Input id="validez_dias" name="validez_dias" type="number" min={1} max={365} defaultValue={15} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gastos_generales_porcentaje">GG (%)</Label>
              <Input
                id="gastos_generales_porcentaje"
                name="gastos_generales_porcentaje"
                type="number"
                step="0.01"
                min={0}
                max={50}
                defaultValue={8}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="margen_porcentaje">Utilidad (%)</Label>
              <Input
                id="margen_porcentaje"
                name="margen_porcentaje"
                type="number"
                step="0.01"
                min={0}
                max={200}
                defaultValue={10}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="igv_porcentaje">IGV (%)</Label>
              <Input
                id="igv_porcentaje"
                name="igv_porcentaje"
                type="number"
                step="0.01"
                min={0}
                max={30}
                defaultValue={18}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas internas</Label>
            <textarea
              id="notas"
              name="notas"
              rows={2}
              className="flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
              placeholder="Solo visible para el equipo Azur"
            />
          </div>
        </div>

        <div className="azur-card space-y-3 bg-azur-coral/10">
          <p className="text-sm font-semibold text-azur-ink">¿Qué sigue?</p>
          <p className="text-xs text-muted-foreground">
            Después de crear el header, agregarás partidas y, opcionalmente, el detalle APU de cada
            una. Los totales se calculan automáticamente.
          </p>
          <div className="flex gap-2 pt-2">
            <Link
              href="/comercial/cotizaciones"
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
