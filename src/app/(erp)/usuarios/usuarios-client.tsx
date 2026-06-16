'use client';

import * as React from 'react';
import { Plus, UserCog, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Field, Avatar, EmptyState } from '@/components/ui/misc';
import { PageHeader } from '@/components/ui/page';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ROLES, ROL_META, rolLabel, type Rol } from '@/lib/roles';
import { crearUsuario, cambiarRol, cambiarActivo, cambiarPassword } from './actions';

export type Profile = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  telefono: string | null;
  activo: boolean;
  avatar_url: string | null;
};

function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="rounded-lg bg-azur-50 px-3 py-2 text-sm font-medium text-azur-700">{msg}</p>;
}

function NuevoUsuarioModal({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [f, setF] = React.useState({ nombre: '', email: '', rol: 'comercial' as Rol, telefono: '', password: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await crearUsuario(f);
      if (!res.ok) { setError(res.error ?? 'No se pudo crear'); return; }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nuevo usuario" description="Se crea la cuenta y el perfil automáticamente.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre completo" required><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" required><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
          <Field label="Teléfono"><Input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rol" required>
            <Select value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value as Rol })}>
              {ROLES.map((r) => <option key={r} value={r}>{ROL_META[r].label}</option>)}
            </Select>
          </Field>
          <Field label="Contraseña" required hint="Mínimo 6 caracteres"><Input type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></Field>
        </div>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={saving}>{saving ? 'Creando…' : 'Crear usuario'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function FilaUsuario({ u, esYo }: { u: Profile; esYo: boolean }) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [passOpen, setPassOpen] = React.useState(false);
  const [pass, setPass] = React.useState('');
  const [passMsg, setPassMsg] = React.useState<string | null>(null);

  const onPass = async () => {
    setPending(true); setPassMsg(null);
    const res = await cambiarPassword({ id: u.id, password: pass });
    setPending(false);
    if (!res.ok) { setPassMsg(res.error ?? 'Error'); return; }
    setPass(''); setPassOpen(false);
  };

  const onRol = async (rol: Rol) => {
    if (rol === u.rol) return;
    setPending(true); setError(null);
    const res = await cambiarRol({ id: u.id, rol });
    if (!res.ok) setError(res.error ?? 'Error');
    setPending(false);
  };
  const onActivo = async () => {
    setPending(true); setError(null);
    const res = await cambiarActivo({ id: u.id, activo: !u.activo });
    if (!res.ok) setError(res.error ?? 'Error');
    setPending(false);
  };

  return (
    <>
    <TableRow className={pending ? 'opacity-60' : undefined}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar nombre={u.nombre} src={u.avatar_url} />
          <div>
            <div className="font-medium">{u.nombre}{esYo && <span className="ml-1 text-xs text-muted-foreground">(tú)</span>}</div>
            <div className="text-xs text-muted-foreground">{u.email}</div>
            {error && <div className="text-xs font-medium text-azur-700">{error}</div>}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm">{u.telefono ?? '—'}</TableCell>
      <TableCell>
        {esYo ? (
          <Badge variant="muted">{rolLabel(u.rol)}</Badge>
        ) : (
          <Select className="h-8 text-xs" value={u.rol} disabled={pending} onChange={(e) => onRol(e.target.value as Rol)}>
            {ROLES.map((r) => <option key={r} value={r}>{ROL_META[r].label}</option>)}
          </Select>
        )}
      </TableCell>
      <TableCell>
        {u.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="danger">Inactivo</Badge>}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1.5">
          <Button variant="outline" size="sm" disabled={pending} onClick={() => { setPassOpen(true); setPassMsg(null); setPass(''); }}>
            <KeyRound className="size-3.5" /> Contraseña
          </Button>
          <Button
            variant={u.activo ? 'outline' : 'gradient'}
            size="sm"
            disabled={pending || esYo}
            onClick={onActivo}
            title={esYo ? 'No puedes cambiar tu propio estado' : undefined}
          >
            {u.activo ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
    {passOpen && (
      <Modal open={passOpen} onClose={() => setPassOpen(false)} title={`Cambiar contraseña · ${u.nombre}`}
        description="Define una nueva contraseña (mínimo 6 caracteres)."
        footer={<>
          <Button variant="outline" onClick={() => setPassOpen(false)}>Cancelar</Button>
          <Button variant="gradient" disabled={pending || pass.length < 6} onClick={onPass}>Guardar contraseña</Button>
        </>}>
        <Field label="Nueva contraseña">
          <Input type="text" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Nueva contraseña" />
        </Field>
        {passMsg && <p className="mt-2 text-sm text-azur-700">{passMsg}</p>}
      </Modal>
    )}
    </>
  );
}

export function UsuariosClient({ usuarios, miId }: { usuarios: Profile[]; miId: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestión de cuentas, roles y accesos al sistema."
        action={<Button variant="gradient" onClick={() => setOpen(true)}><Plus className="size-4" /> Nuevo usuario</Button>}
      />
      {usuarios.length === 0 ? (
        <EmptyState icon={<UserCog className="size-8" />} titulo="Sin usuarios" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => <FilaUsuario key={u.id} u={u} esYo={u.id === miId} />)}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <NuevoUsuarioModal onClose={() => setOpen(false)} />}
    </div>
  );
}
