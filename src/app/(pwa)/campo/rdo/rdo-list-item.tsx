'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, FileText, Trash2, Loader2, Pencil } from 'lucide-react';
import { fmtDate } from '@/lib/format';
import { useIsStandalone } from '@/lib/pwa';
import { enviarRdo, eliminarRdo } from './actions';

const ESTADO: Record<string, { label: string; cls: string }> = {
  borrador: { label: 'Borrador', cls: 'bg-slate-100 text-slate-600' },
  enviado: { label: 'Enviado a revisión', cls: 'bg-sky-100 text-sky-700' },
  aprobado: { label: 'Aprobado', cls: 'bg-emerald-100 text-emerald-700' },
  observado: { label: 'Observado', cls: 'bg-red-100 text-red-700' },
};

export type ParteItem = {
  id: string; fecha: string; clima: string | null; personal_count: number | null;
  proyecto_id: string; estado: string; obs_revision: string | null; nombre: string;
};

export function RdoListItem({ p }: { p: ParteItem }) {
  const router = useRouter();
  const standalone = useIsStandalone();
  const [busy, setBusy] = useState<'' | 'enviar' | 'eliminar'>('');
  const est = ESTADO[p.estado] ?? ESTADO.borrador;
  const puedeEnviar = p.estado === 'borrador' || p.estado === 'observado';
  const puedeEditar = p.estado === 'borrador' || p.estado === 'observado';
  const puedeEliminar = p.estado !== 'aprobado';

  async function onEnviar() {
    setBusy('enviar');
    const r = await enviarRdo(p.id);
    setBusy('');
    if (!r.ok) alert(r.error);
    else router.refresh();
  }
  async function onEliminar() {
    if (!window.confirm('¿Eliminar este reporte?')) return;
    setBusy('eliminar');
    const r = await eliminarRdo(p.id);
    setBusy('');
    if (!r.ok) alert(r.error);
    else router.refresh();
  }

  return (
    <li className="py-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{p.nombre}</p>
          <p className="text-xs text-muted-foreground">{fmtDate(p.fecha)}{p.clima ? ` · ${p.clima}` : ''}{p.personal_count != null ? ` · ${p.personal_count} pers.` : ''}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${est.cls}`}>{est.label}</span>
      </div>
      {p.estado === 'observado' && p.obs_revision && (
        <p className="mt-1 rounded bg-red-50 px-2 py-1 text-xs text-red-700">Observación: {p.obs_revision}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {puedeEnviar && (
          <button onClick={onEnviar} disabled={!!busy} className="inline-flex items-center gap-1 rounded-lg bg-azur-gradient px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60">
            {busy === 'enviar' ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Enviar a revisión
          </button>
        )}
        {puedeEditar && (
          <Link href={`/campo/rdo/${p.id}/editar`} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-foreground">
            <Pencil className="size-3.5" /> Editar
          </Link>
        )}
        <a href={`/proyectos/${p.proyecto_id}/rdo/${p.id}/pdf${standalone ? '?dl=1' : ''}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-foreground">
          <FileText className="size-3.5" /> PDF
        </a>
        {puedeEliminar && (
          <button onClick={onEliminar} disabled={!!busy} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-azur-600 disabled:opacity-60">
            {busy === 'eliminar' ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        )}
      </div>
    </li>
  );
}
