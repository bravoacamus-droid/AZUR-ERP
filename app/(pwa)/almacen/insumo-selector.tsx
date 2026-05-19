'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';

export type InsumoOption = {
  id: string;
  codigo: string;
  descripcion: string;
  categoria: string;
  unidad: string;
  stockCentral: number;
};

const CATEGORIA_LABEL: Record<string, string> = {
  equipo: '🔧 Herramientas',
  material: '📦 Materiales',
  mano_obra: '👷 Mano de obra',
  subcontrato: '🏗 Subcontrato',
  transporte: '🚚 Transporte',
  gasto_general: '💼 Gasto general',
};

const inputClass =
  'flex h-12 w-full rounded-xl border border-input bg-background px-3 text-base shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

type Props = {
  insumos: InsumoOption[];
  unidades: { codigo: string; nombre: string }[];
};

export function InsumoSelector({ insumos, unidades }: Props) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [unidadOverride, setUnidadOverride] = useState<string>('und');
  const [textoLibre, setTextoLibre] = useState<string>('');
  const [modoLibre, setModoLibre] = useState(false);

  // Filtrar insumos por búsqueda
  const filtered = useMemo(() => {
    if (!query.trim()) return insumos;
    const q = query.toLowerCase();
    return insumos.filter(
      (i) => i.descripcion.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q),
    );
  }, [insumos, query]);

  // Agrupar por categoría
  const byCategoria = useMemo(() => {
    const map = new Map<string, InsumoOption[]>();
    for (const i of filtered) {
      if (!map.has(i.categoria)) map.set(i.categoria, []);
      map.get(i.categoria)!.push(i);
    }
    return map;
  }, [filtered]);

  const selected = insumos.find((i) => i.id === selectedId) ?? null;
  const unidadFinal = modoLibre ? unidadOverride : selected?.unidad ?? unidadOverride;
  const descripcionFinal = modoLibre ? textoLibre : selected?.descripcion ?? '';

  return (
    <div className="space-y-3">
      <input type="hidden" name="insumo_id" value={modoLibre ? '' : selectedId} />
      <input type="hidden" name="descripcion" value={descripcionFinal} />
      <input type="hidden" name="unidad" value={unidadFinal} />

      {/* Modo toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-1.5">
        <button
          type="button"
          onClick={() => setModoLibre(false)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            !modoLibre ? 'bg-azur-red text-white shadow-sm' : 'text-muted-foreground hover:text-azur-ink'
          }`}
        >
          Del catálogo
        </button>
        <button
          type="button"
          onClick={() => setModoLibre(true)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            modoLibre ? 'bg-azur-red text-white shadow-sm' : 'text-muted-foreground hover:text-azur-ink'
          }`}
        >
          Texto libre
        </button>
      </div>

      {!modoLibre ? (
        <>
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar: taladro, cemento, casco…"
              className={`${inputClass} pl-10`}
            />
          </div>

          {/* Lista agrupada (más alto, mejor scroll) */}
          <div className="max-h-80 overflow-y-auto rounded-xl border border-border/60 bg-white">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Sin resultados — prueba "texto libre" arriba.
              </p>
            ) : (
              Array.from(byCategoria.entries()).map(([cat, items]) => (
                <div key={cat}>
                  <p className="sticky top-0 border-b border-border/60 bg-azur-coral/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-azur-red">
                    {CATEGORIA_LABEL[cat] ?? cat}
                  </p>
                  {items.map((i) => {
                    const stockColor =
                      i.stockCentral <= 0
                        ? 'bg-destructive/15 text-destructive'
                        : i.stockCentral < 5
                          ? 'bg-warning/15 text-[hsl(38_92%_30%)]'
                          : 'bg-success/15 text-success';
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setSelectedId(i.id)}
                        className={`flex w-full items-start justify-between gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-azur-coral/5 ${
                          selectedId === i.id ? 'bg-azur-coral/15' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[11px] text-muted-foreground">{i.codigo}</p>
                          <p className="text-sm font-semibold text-azur-ink">{i.descripcion}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${stockColor}`}
                          >
                            {i.stockCentral <= 0 && <AlertTriangle className="h-3 w-3" />}
                            {i.stockCentral.toLocaleString('es-PE')} {i.unidad}
                          </span>
                          <p className="mt-1 text-[10px] text-muted-foreground">en central</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {selected && (
            <div className="rounded-xl border border-azur-coral/40 bg-azur-coral/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-azur-red">
                Seleccionado
              </p>
              <p className="text-base font-bold text-azur-ink">{selected.descripcion}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-mono">{selected.codigo}</span> · unidad{' '}
                <span className="font-semibold">{selected.unidad}</span>
              </p>
              <p className="mt-2 text-sm">
                Stock en almacén central:{' '}
                <span
                  className={`font-bold ${
                    selected.stockCentral <= 0
                      ? 'text-destructive'
                      : selected.stockCentral < 5
                        ? 'text-[hsl(38_92%_30%)]'
                        : 'text-success'
                  }`}
                >
                  {selected.stockCentral.toLocaleString('es-PE')} {selected.unidad}
                </span>
              </p>
              {selected.stockCentral <= 0 && (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Sin stock en central. La salida será bloqueada — coordina con gerencia para
                    registrar la compra.
                  </span>
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-2">
            <input
              type="text"
              value={textoLibre}
              onChange={(e) => setTextoLibre(e.target.value)}
              placeholder="Ej. Taladro modelo especial X"
              minLength={3}
              className={inputClass}
              required={modoLibre}
            />
            <p className="text-xs text-[hsl(38_92%_30%)]">
              ⚠ Texto libre: no se valida contra stock central y no agrupa saldos.
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold text-azur-ink">Unidad</label>
            <select
              value={unidadOverride}
              onChange={(e) => setUnidadOverride(e.target.value)}
              className={`mt-1 ${inputClass}`}
            >
              {unidades.map((u) => (
                <option key={u.codigo} value={u.codigo}>
                  {u.codigo} — {u.nombre}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
