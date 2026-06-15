'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { Card, CardContent } from '@/components/ui/card';
import { fmtDateTime } from '@/lib/format';
import { resolverAlerta } from './actions';

export interface AlertaRow {
  id: string;
  titulo: string;
  detalle: string | null;
  tipo: string;
  severidad: 'info' | 'advertencia' | 'critica';
  resuelta: boolean;
  created_at: string;
  proyecto: { nombre: string; codigo: string | null } | null;
}

type Filtro = 'todas' | 'abiertas' | 'resueltas';

const SEVERIDAD_META: Record<string, { label: string; variant: 'info' | 'warning' | 'danger' }> = {
  info: { label: 'Info', variant: 'info' },
  advertencia: { label: 'Advertencia', variant: 'warning' },
  critica: { label: 'Crítica', variant: 'danger' },
};

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'abiertas', label: 'Abiertas' },
  { key: 'resueltas', label: 'Resueltas' },
  { key: 'todas', label: 'Todas' },
];

export function AlertasClient({ alertas }: { alertas: AlertaRow[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = React.useState<Filtro>('abiertas');
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const visibles = alertas.filter((a) =>
    filtro === 'todas' ? true : filtro === 'abiertas' ? !a.resuelta : a.resuelta,
  );

  async function resolver(id: string) {
    setLoadingId(id);
    const res = await resolverAlerta({ id });
    setLoadingId(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Button
            key={f.key}
            variant={filtro === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltro(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          icon={<BellOff className="size-8" />}
          titulo="Sin alertas"
          descripcion={filtro === 'resueltas' ? 'No hay alertas resueltas.' : 'No hay alertas que mostrar.'}
        />
      ) : (
        <div className="space-y-2">
          {visibles.map((a) => {
            const sev = SEVERIDAD_META[a.severidad] ?? SEVERIDAD_META.info;
            return (
              <Card key={a.id} className={a.resuelta ? 'opacity-70' : undefined}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={sev.variant}>{sev.label}</Badge>
                      <p className="font-medium">{a.titulo}</p>
                      {a.resuelta && <Badge variant="muted">Resuelta</Badge>}
                    </div>
                    {a.detalle && <p className="text-sm text-muted-foreground">{a.detalle}</p>}
                    <p className="text-xs text-muted-foreground/70">
                      {fmtDateTime(a.created_at)}
                      {a.proyecto && <span className="ml-2">· {a.proyecto.nombre}</span>}
                    </p>
                  </div>
                  {!a.resuelta && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => resolver(a.id)}
                      disabled={loadingId === a.id}
                    >
                      <CheckCircle2 /> {loadingId === a.id ? 'Resolviendo…' : 'Marcar resuelta'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
