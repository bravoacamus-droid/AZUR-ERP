'use client';

import { useState } from 'react';
import { CheckCircle2, MapPin, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UbicacionEditor } from './ubicacion-editor';

type Ubigeo = {
  codigo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  latitud: number | null;
  longitud: number | null;
  tipo: 'departamento' | 'provincia' | 'distrito';
};

type Initial = {
  ubigeo_codigo: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  direccion: string | null;
  ubicacion: string | null;
  latitud: number | null;
  longitud: number | null;
  radio_geofence_m: number | null;
};

export function UbicacionSection({
  proyectoId,
  ubigeos,
  initial,
}: {
  proyectoId: string;
  ubigeos: Ubigeo[];
  initial: Initial;
}) {
  const [editing, setEditing] = useState(false);

  const tieneCoords = initial.latitud != null && initial.longitud != null;
  const lineaUbigeo = [initial.distrito, initial.provincia, initial.departamento]
    .filter(Boolean)
    .join(', ');

  return (
    <section className="azur-card">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-azur-ink">Ubicación de obra</h2>
            <p className="text-xs text-muted-foreground">
              Determina dónde se valida el check-in GPS del residente.
            </p>
          </div>
        </div>
        {!editing && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        )}
      </header>

      {editing ? (
        <UbicacionEditor
          proyectoId={proyectoId}
          ubigeos={ubigeos}
          initial={initial}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <div className="space-y-3">
          {!tieneCoords ? (
            <div className="rounded-xl border-2 border-dashed border-azur-coral/50 bg-azur-coral/5 p-4 text-sm text-muted-foreground">
              ⚠ Este proyecto aún no tiene ubicación configurada. Click "Editar" para definirla en
              el mapa.
            </div>
          ) : (
            <>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Ubigeo
                  </p>
                  <p className="font-medium text-azur-ink">{lineaUbigeo || '— Sin ubigeo —'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Dirección
                  </p>
                  <p className="font-medium text-azur-ink">{initial.direccion ?? '— Sin dirección —'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Coordenadas GPS
                  </p>
                  <p className="font-mono text-azur-ink">
                    {Number(initial.latitud).toFixed(6)}, {Number(initial.longitud).toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Radio geofence
                  </p>
                  <p className="font-medium text-azur-ink">
                    {initial.radio_geofence_m ?? 200} m
                  </p>
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Check-in del residente quedará validado contra este punto.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
