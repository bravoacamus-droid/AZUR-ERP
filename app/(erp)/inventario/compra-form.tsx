'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useMemo, useState } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { registrarCompra, type CompraState } from './actions';

export type InsumoOption = {
  id: string;
  codigo: string;
  descripcion: string;
  categoria: string;
  unidad: string;
  precio_unit: number | null;
};

const inputClass =
  'flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

const initialState: CompraState = { ok: false };

export function CompraForm({ insumos }: { insumos: InsumoOption[] }) {
  const [state, formAction] = useFormState(registrarCompra, initialState);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');

  const filtered = useMemo(() => {
    if (!query.trim()) return insumos;
    const q = query.toLowerCase();
    return insumos.filter(
      (i) => i.descripcion.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q),
    );
  }, [insumos, query]);

  const selected = insumos.find((i) => i.id === selectedId) ?? null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="insumo_id" value={selectedId} />

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Insumo *
        </label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar (taladro, cemento, casco…)"
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border/60 bg-white">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground">Sin resultados</p>
          ) : (
            filtered.slice(0, 40).map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setSelectedId(i.id)}
                className={`flex w-full items-start justify-between gap-2 border-b border-border/40 px-3 py-2 text-left text-xs transition-colors hover:bg-azur-coral/5 ${
                  selectedId === i.id ? 'bg-azur-coral/15' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] text-muted-foreground">{i.codigo}</p>
                  <p className="font-semibold text-azur-ink">{i.descripcion}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold">
                    {i.unidad}
                  </span>
                  {i.precio_unit != null && i.precio_unit > 0 && (
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      ref: S/ {Number(i.precio_unit).toFixed(2)}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
        {selected && (
          <div className="mt-2 rounded-xl border border-azur-coral/40 bg-azur-coral/10 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-azur-red">Insumo seleccionado</p>
            <p className="text-sm font-bold text-azur-ink">{selected.descripcion}</p>
            <p className="text-[11px] text-muted-foreground">
              <span className="font-mono">{selected.codigo}</span> · unidad{' '}
              <span className="font-semibold">{selected.unidad}</span>
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cantidad *
          </label>
          <input
            name="cantidad"
            type="number"
            step="0.01"
            min={0.01}
            required
            defaultValue={1}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Costo unitario (opcional)
          </label>
          <input
            name="costo_unit"
            type="number"
            step="0.01"
            min={0}
            placeholder={selected?.precio_unit ? `Ref: ${selected.precio_unit}` : 'S/ 0.00'}
            className={`mt-1 ${inputClass}`}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">Si lo llenas, actualiza el precio del catálogo.</p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fecha *
          </label>
          <input
            name="fecha"
            type="date"
            defaultValue={today}
            required
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Proveedor *
          </label>
          <input
            name="proveedor"
            type="text"
            required
            minLength={2}
            placeholder="Ej. Maestro Home Center / Ferretería San Juan"
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            N° factura/boleta
          </label>
          <input
            name="numero_documento"
            type="text"
            placeholder="F001-12345"
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notas (opcional)
        </label>
        <input
          name="notas"
          type="text"
          placeholder="Observaciones del ingreso"
          className={`mt-1 ${inputClass}`}
        />
      </div>

      {state.error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.ok && state.message && (
        <div className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          ✓ {state.message}
        </div>
      )}

      <SubmitButton disabled={!selectedId} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-azur-gradient px-5 text-sm font-semibold text-white shadow-azur-md disabled:opacity-50"
    >
      <ShoppingCart className="h-4 w-4" />
      {pending ? 'Registrando…' : 'Registrar ingreso al almacén central'}
    </button>
  );
}
