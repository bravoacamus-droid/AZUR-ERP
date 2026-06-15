'use client';

import * as React from 'react';
import { Camera, Mail, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, Avatar } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page';
import { rolLabel } from '@/lib/roles';
import { actualizarPerfil, guardarAvatar } from './actions';

export type PerfilData = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  telefono: string | null;
  avatar_url: string | null;
};

export function PerfilClient({ perfil }: { perfil: PerfilData }) {
  const [nombre, setNombre] = React.useState(perfil.nombre);
  const [telefono, setTelefono] = React.useState(perfil.telefono ?? '');
  const [avatarUrl, setAvatarUrl] = React.useState(perfil.avatar_url);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);

  const [uploading, setUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setOk(false);
    try {
      const res = await actualizarPerfil({ nombre, telefono });
      if (!res.ok) { setError(res.error ?? 'No se pudo guardar'); return; }
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setAvatarError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${perfil.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) { setAvatarError(upErr.message); return; }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = data.publicUrl;
      const res = await guardarAvatar({ avatar_url: url });
      if (!res.ok) { setAvatarError(res.error ?? 'No se pudo guardar el avatar'); return; }
      setAvatarUrl(url);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Mi perfil" description="Actualiza tus datos personales y foto." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="relative">
              <Avatar nombre={nombre || perfil.nombre} src={avatarUrl} className="size-24 text-2xl" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-azur-gradient text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                title="Cambiar foto"
              >
                <Camera className="size-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            </div>
            <div>
              <div className="text-lg font-semibold">{perfil.nombre}</div>
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground"><Mail className="size-3.5" /> {perfil.email}</div>
            </div>
            <Badge variant="info"><Shield className="size-3" /> {rolLabel(perfil.rol)}</Badge>
            {uploading && <p className="text-xs text-muted-foreground">Subiendo foto…</p>}
            {avatarError && <p className="text-xs font-medium text-azur-700">{avatarError}</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Datos personales</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Nombre completo" required><Input value={nombre} onChange={(e) => setNombre(e.target.value)} required /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" hint="No editable"><Input value={perfil.email} disabled /></Field>
                <Field label="Teléfono"><Input value={telefono} onChange={(e) => setTelefono(e.target.value)} /></Field>
              </div>
              <Field label="Rol" hint="Asignado por administración"><Input value={rolLabel(perfil.rol)} disabled /></Field>
              {error && <p className="rounded-lg bg-azur-50 px-3 py-2 text-sm font-medium text-azur-700">{error}</p>}
              {ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Perfil actualizado.</p>}
              <div className="flex justify-end">
                <Button type="submit" variant="gradient" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
