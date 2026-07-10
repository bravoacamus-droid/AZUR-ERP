'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenLine } from 'lucide-react';
import { rolLabel } from '@/lib/roles';

export type UsuarioFirma = { id: string; nombre: string; rol: string; tiene_firma: boolean };

export function FirmasEditor({
  usuarios, value, onSave, editable = true, descripcion,
}: {
  usuarios: UsuarioFirma[];
  value: string[];
  onSave: (ids: string[]) => Promise<void> | void;
  editable?: boolean;
  descripcion?: string;
}) {
  const [sel, setSel] = React.useState<string[]>(value ?? []);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => setSel(value ?? []), [value]);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const cambiado = JSON.stringify([...sel].sort()) !== JSON.stringify([...(value ?? [])].sort());
  const guardar = async () => {
    setBusy(true); await onSave(sel); setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 1800);
  };
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><PenLine className="size-4 text-azur-600" /> Firmas del documento</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {descripcion ?? 'Marca quién firma este documento. La firma se incrusta en el PDF si el usuario la tiene cargada; si no, queda el espacio para firmar a mano.'}
        </p>
        <div className="max-h-56 divide-y overflow-auto rounded-lg border">
          {usuarios.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No hay usuarios activos.</p>
          ) : usuarios.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-secondary/50">
              <input type="checkbox" className="size-4 accent-azur-600" checked={sel.includes(u.id)} disabled={!editable} onChange={() => toggle(u.id)} />
              <span className="min-w-0 flex-1 truncate"><span className="font-medium">{u.nombre}</span> <span className="text-xs text-muted-foreground">· {rolLabel(u.rol)}</span></span>
              {u.tiene_firma ? <Badge variant="success">Firma ✓</Badge> : <Badge variant="muted">Sin firma</Badge>}
            </label>
          ))}
        </div>
        {editable && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">{sel.length} firmante(s)</span>
            <Button size="sm" variant="gradient" disabled={busy || !cambiado} onClick={guardar}>{busy ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar firmas'}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
