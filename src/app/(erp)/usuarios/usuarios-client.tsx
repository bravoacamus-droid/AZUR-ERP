'use client';

import * as React from 'react';
import { Plus, UserCog, KeyRound, Pencil, Shield, Trash2 } from 'lucide-react';
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
import { MODULOS, MODULO_LABEL, type Modulo, type Nivel } from '@/lib/permisos';
import { soloDigitos } from '@/lib/utils';
import {
  crearUsuario, cambiarRol, cambiarActivo, cambiarPassword, actualizarUsuario,
  guardarRolPersonalizado, eliminarRolPersonalizado, asignarRolPersonalizado, guardarFirma,
} from './actions';

export type Profile = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  telefono: string | null;
  activo: boolean;
  avatar_url: string | null;
  rol_personalizado_id: string | null;
  firma_data: string | null;
};

export type RolPers = { id: string; nombre: string; permisos: Record<string, Nivel> | null; activo: boolean };

const NIVEL_LABEL: Record<Nivel, string> = { none: 'Sin acceso', ver: 'Solo ver', editar: 'Editar' };

function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="rounded-lg bg-azur-50 px-3 py-2 text-sm font-medium text-azur-700">{msg}</p>;
}

function NuevoUsuarioModal({ roles, onClose }: { roles: RolPers[]; onClose: () => void }) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [f, setF] = React.useState({ nombre: '', email: '', rol: 'comercial' as Rol, telefono: '', password: '', rol_personalizado_id: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await crearUsuario({ ...f, rol_personalizado_id: f.rol_personalizado_id || null });
      if (!res.ok) { setError(res.error ?? 'No se pudo crear'); return; }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nuevo usuario" description="Se crea la cuenta y el perfil automáticamente. El rol personalizado se asigna luego desde la lista.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre completo" required><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" required><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
          <Field label="Teléfono"><Input inputMode="tel" maxLength={15} value={f.telefono} onChange={(e) => setF({ ...f, telefono: soloDigitos(e.target.value) })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rol base" required hint="Define el entorno (oficina/campo) y el acceso por defecto.">
            <Select value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value as Rol })}>
              {ROLES.map((r) => <option key={r} value={r}>{ROL_META[r].label}</option>)}
            </Select>
          </Field>
          <Field label="Contraseña" required hint="Mínimo 6 caracteres"><Input type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></Field>
        </div>
        <Field label="Rol personalizado (opcional)" hint={roles.length ? 'Si eliges uno, sus permisos por módulo mandan sobre el rol base.' : 'Aún no hay roles personalizados. Créalos con “Nuevo rol”.'}>
          <Select value={f.rol_personalizado_id} onChange={(e) => setF({ ...f, rol_personalizado_id: e.target.value })} disabled={roles.length === 0}>
            <option value="">— usar rol base —</option>
            {roles.filter((r) => r.activo).map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </Select>
        </Field>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={saving}>{saving ? 'Creando…' : 'Crear usuario'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditarUsuarioModal({ u, onClose }: { u: Profile; onClose: () => void }) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [f, setF] = React.useState({ nombre: u.nombre, email: u.email, telefono: u.telefono ?? '' });
  const [firma, setFirma] = React.useState<string | null>(u.firma_data);
  const [firmaBusy, setFirmaBusy] = React.useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await actualizarUsuario({ id: u.id, nombre: f.nombre, telefono: f.telefono, email: f.email !== u.email ? f.email : undefined });
    setSaving(false);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    onClose();
  };
  const onFirma = async (file: File) => {
    setError(null);
    if (file.size > 2_000_000) { setError('La firma debe pesar menos de 2 MB.'); return; }
    const dataUri = await new Promise<string>((resolve, reject) => {
      const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file);
    });
    setFirmaBusy(true);
    const res = await guardarFirma({ id: u.id, firma_data: dataUri });
    setFirmaBusy(false);
    if (!res.ok) { setError(res.error ?? 'Error al guardar la firma'); return; }
    setFirma(dataUri);
  };
  const quitarFirma = async () => {
    setFirmaBusy(true);
    await guardarFirma({ id: u.id, firma_data: null });
    setFirmaBusy(false); setFirma(null);
  };
  return (
    <Modal open onClose={onClose} title={`Editar · ${u.nombre}`} description="Actualiza nombre, correo, teléfono y firma del usuario.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre completo" required><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" required><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
          <Field label="Teléfono"><Input inputMode="tel" maxLength={15} value={f.telefono} onChange={(e) => setF({ ...f, telefono: soloDigitos(e.target.value) })} /></Field>
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-sm font-medium">Firma (PNG sin fondo)</p>
          {firma ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={firma} alt="Firma" className="h-14 rounded border bg-white object-contain px-2" />
              <Button type="button" variant="outline" size="sm" disabled={firmaBusy} onClick={quitarFirma}>Quitar</Button>
            </div>
          ) : (
            <p className="mb-2 text-xs text-muted-foreground">Sin firma cargada. Sube un PNG (idealmente con fondo transparente) — se incrusta en el PDF cuando el usuario es el responsable.</p>
          )}
          <input type="file" accept="image/png,image/jpeg" className="mt-2 block w-full text-sm" disabled={firmaBusy}
            onChange={(e) => { const file = e.target.files?.[0]; if (file) onFirma(file); }} />
        </div>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function FilaUsuario({ u, esYo, roles, canEdit }: { u: Profile; esYo: boolean; roles: RolPers[]; canEdit: boolean }) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [passOpen, setPassOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
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
  const onRolPers = async (val: string) => {
    setPending(true); setError(null);
    const res = await asignarRolPersonalizado({ id: u.id, rol_personalizado_id: val || null });
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
        {esYo || !canEdit ? (
          <Badge variant="muted">{rolLabel(u.rol)}</Badge>
        ) : (
          <Select className="h-8 text-xs" value={u.rol} disabled={pending} onChange={(e) => onRol(e.target.value as Rol)}>
            {ROLES.map((r) => <option key={r} value={r}>{ROL_META[r].label}</option>)}
          </Select>
        )}
      </TableCell>
      <TableCell>
        {esYo || !canEdit ? (
          <span className="text-xs text-muted-foreground">{roles.find((r) => r.id === u.rol_personalizado_id)?.nombre ?? '— rol base —'}</span>
        ) : (
          <Select className="h-8 text-xs" value={u.rol_personalizado_id ?? ''} disabled={pending} onChange={(e) => onRolPers(e.target.value)}>
            <option value="">— usar rol base —</option>
            {roles.filter((r) => r.activo).map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </Select>
        )}
      </TableCell>
      <TableCell>
        {u.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="danger">Inactivo</Badge>}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1.5">
          {canEdit && <Button variant="outline" size="sm" disabled={pending} onClick={() => setEditOpen(true)}><Pencil className="size-3.5" /> Editar</Button>}
          {canEdit && <Button variant="outline" size="sm" disabled={pending} onClick={() => { setPassOpen(true); setPassMsg(null); setPass(''); }}><KeyRound className="size-3.5" /> Contraseña</Button>}
          {canEdit && (
            <Button variant={u.activo ? 'outline' : 'gradient'} size="sm" disabled={pending || esYo} onClick={onActivo} title={esYo ? 'No puedes cambiar tu propio estado' : undefined}>
              {u.activo ? 'Desactivar' : 'Activar'}
            </Button>
          )}
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
    {editOpen && <EditarUsuarioModal u={u} onClose={() => setEditOpen(false)} />}
    </>
  );
}

// ── Constructor de roles personalizados ─────────────────────────────────
function RolModal({ rol, onClose }: { rol: RolPers | null; onClose: () => void }) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [nombre, setNombre] = React.useState(rol?.nombre ?? '');
  const [permisos, setPermisos] = React.useState<Record<Modulo, Nivel>>(() => {
    const base = {} as Record<Modulo, Nivel>;
    for (const m of MODULOS) base[m] = (rol?.permisos?.[m] as Nivel) ?? 'none';
    return base;
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await guardarRolPersonalizado({ id: rol?.id, nombre, permisos });
    setSaving(false);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={rol ? `Editar rol · ${rol.nombre}` : 'Nuevo rol personalizado'}
      description="Define por cada módulo si el rol no tiene acceso, solo puede ver, o puede editar.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre del rol" required><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Asistente de administración" required /></Field>
        <div className="rounded-lg border divide-y">
          {MODULOS.map((m) => (
            <div key={m} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium">{MODULO_LABEL[m]}</span>
              <Select className="h-8 w-36 text-xs" value={permisos[m]} onChange={(e) => setPermisos((p) => ({ ...p, [m]: e.target.value as Nivel }))}>
                <option value="none">{NIVEL_LABEL.none}</option>
                <option value="ver">{NIVEL_LABEL.ver}</option>
                <option value="editar">{NIVEL_LABEL.editar}</option>
              </Select>
            </div>
          ))}
        </div>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={saving || nombre.trim().length < 2}>{saving ? 'Guardando…' : 'Guardar rol'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function RolesSection({ roles, canEdit }: { roles: RolPers[]; canEdit: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RolPers | null>(null);
  const del = async (r: RolPers) => {
    if (!confirm(`¿Eliminar el rol "${r.nombre}"? Los usuarios con este rol volverán a su rol base.`)) return;
    await eliminarRolPersonalizado(r.id);
  };
  const resumen = (r: RolPers) => MODULOS
    .filter((m) => r.permisos?.[m] && r.permisos[m] !== 'none')
    .map((m) => `${MODULO_LABEL[m]}: ${r.permisos![m] === 'editar' ? 'editar' : 'ver'}`)
    .join(' · ') || 'Sin módulos';
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-azur-600" />
          <h2 className="font-semibold">Roles personalizados</h2>
        </div>
        {canEdit && <Button variant="outline" size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-3.5" /> Nuevo rol</Button>}
      </div>
      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay roles personalizados. Crea uno para asignar acceso por módulo (ver/editar) a medida.</p>
      ) : (
        <ul className="divide-y">
          {roles.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className="font-medium">{r.nombre}{!r.activo && <span className="ml-2 text-xs text-muted-foreground">(inactivo)</span>}</div>
                <div className="truncate text-xs text-muted-foreground">{resumen(r)}</div>
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="size-3.5" /></Button>
                  <Button variant="outline" size="sm" onClick={() => del(r)}><Trash2 className="size-3.5" /></Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {open && <RolModal rol={editing} onClose={() => setOpen(false)} />}
    </Card>
  );
}

export function UsuariosClient({ usuarios, roles, miId, canEdit }: { usuarios: Profile[]; roles: RolPers[]; miId: string; canEdit: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestión de cuentas, roles y accesos al sistema."
        action={canEdit ? <Button variant="gradient" onClick={() => setOpen(true)}><Plus className="size-4" /> Nuevo usuario</Button> : undefined}
      />
      <RolesSection roles={roles} canEdit={canEdit} />
      {usuarios.length === 0 ? (
        <EmptyState icon={<UserCog className="size-8" />} titulo="Sin usuarios" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Rol base</TableHead>
                <TableHead>Rol personalizado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => <FilaUsuario key={u.id} u={u} esYo={u.id === miId} roles={roles} canEdit={canEdit} />)}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <NuevoUsuarioModal roles={roles} onClose={() => setOpen(false)} />}
    </div>
  );
}
