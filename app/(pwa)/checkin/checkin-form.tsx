'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Crosshair, LogIn, LogOut, MapPin, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useGeolocation, type GeoFix } from '@/hooks/use-geolocation';
import { registrarAsistencia, type CheckActionResult } from './actions';

type Proyecto = {
  id: string;
  codigo: string;
  nombre: string;
  latitud: number | null;
  longitud: number | null;
  radio_geofence_m: number | null;
};

type CheckinFormProps = {
  proyectos: Proyecto[];
  ultimoTipo: 'checkin' | 'checkout' | null;
};

export function CheckinForm({ proyectos, ultimoTipo }: CheckinFormProps) {
  const tipoSiguiente = ultimoTipo === 'checkin' ? 'checkout' : 'checkin';
  const [proyectoId, setProyectoId] = useState<string>(proyectos[0]?.id ?? '');
  const { request, loading: gpsLoading, fix, error: gpsError } = useGeolocation();
  const [pending, startTransition] = useTransition();

  const [state, formAction] = useFormState<CheckActionResult | null, FormData>(
    registrarAsistencia,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      const msg =
        state.distancia_m == null
          ? '¡Registrado!'
          : state.dentro
            ? `¡Registrado en obra! (${Math.round(state.distancia_m)} m del centro)`
            : `Registrado fuera de obra (${Math.round(state.distancia_m)} m del centro)`;
      toast.success(msg);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  const proyectoSel = proyectos.find((p) => p.id === proyectoId);

  return (
    <div className="space-y-5">
      {/* Selector proyecto */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Proyecto
        </label>
        <div className="space-y-2">
          {proyectos.map((p) => {
            const sel = p.id === proyectoId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProyectoId(p.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  sel
                    ? 'border-azur-red bg-azur-coral/10 shadow-azur-md'
                    : 'border-border bg-white hover:border-azur-coral'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-azur-red">{p.codigo}</p>
                    <p className="line-clamp-1 text-sm font-semibold text-azur-ink">{p.nombre}</p>
                  </div>
                  {sel && <CheckCircle2 className="h-5 w-5 text-azur-red" />}
                </div>
                {p.latitud && p.longitud ? (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {Number(p.latitud).toFixed(5)}, {Number(p.longitud).toFixed(5)} · radio {p.radio_geofence_m ?? 200} m
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-warning">⚠ Sin geofence configurada</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* GPS */}
      <div className="azur-card space-y-3">
        <div className="flex items-center gap-2">
          <Crosshair className={`h-5 w-5 ${fix ? 'text-success' : 'text-muted-foreground'}`} />
          <p className="text-sm font-semibold text-azur-ink">Mi ubicación</p>
        </div>

        {fix ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-success/10 p-3"
          >
            <p className="font-mono text-xs">
              Lat: <span className="font-bold">{fix.latitud.toFixed(6)}</span>
            </p>
            <p className="font-mono text-xs">
              Lon: <span className="font-bold">{fix.longitud.toFixed(6)}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Precisión: ±{Math.round(fix.precision_metros)} m
            </p>
          </motion.div>
        ) : gpsError ? (
          <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            <XCircle className="mb-1 h-4 w-4" />
            No se pudo obtener tu ubicación. Verifica permisos del navegador.
          </div>
        ) : (
          <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            Toca el botón para obtener tu posición GPS actual.
          </p>
        )}

        <Button
          type="button"
          variant={fix ? 'secondary' : 'default'}
          onClick={() => request().catch(() => {})}
          loading={gpsLoading}
          className="w-full"
        >
          <Crosshair className="h-4 w-4" />
          {fix ? 'Actualizar ubicación' : 'Obtener mi GPS'}
        </Button>
      </div>

      {/* Form */}
      <form
        action={(fd) => {
          startTransition(() => formAction(fd));
        }}
        className="space-y-3"
      >
        <input type="hidden" name="proyecto_id" value={proyectoId} />
        <input type="hidden" name="tipo" value={tipoSiguiente} />
        <input type="hidden" name="latitud" value={fix?.latitud ?? ''} />
        <input type="hidden" name="longitud" value={fix?.longitud ?? ''} />
        <input
          type="hidden"
          name="precision_metros"
          value={fix?.precision_metros ?? 0}
        />
        <textarea
          name="observaciones"
          rows={2}
          placeholder="Observaciones (opcional)"
          className="flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
        />

        <Button
          type="submit"
          size="lg"
          disabled={!fix || !proyectoId}
          loading={pending}
          className="w-full"
        >
          {tipoSiguiente === 'checkin' ? (
            <>
              <LogIn className="h-5 w-5" />
              Registrar Check-IN
            </>
          ) : (
            <>
              <LogOut className="h-5 w-5" />
              Registrar Check-OUT
            </>
          )}
        </Button>

        {proyectoSel?.latitud && fix && (
          <p className="text-center text-xs text-muted-foreground">
            Si estás dentro del radio de geofence ({proyectoSel.radio_geofence_m ?? 200} m), el sistema lo marcará como válido en obra.
          </p>
        )}
      </form>
    </div>
  );
}
