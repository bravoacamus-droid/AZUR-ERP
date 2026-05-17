'use client';

import { useRef, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ROLES, ROL_LABEL, type RolSistema } from '@/lib/auth/roles';
import { cambiarRol } from './actions';

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40 disabled:opacity-50';

export function RolSelect({ userId, rolActual }: { userId: string; rolActual: RolSistema }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      try {
        await cambiarRol(fd);
        toast.success('Rol actualizado');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al actualizar';
        toast.error(msg);
        e.target.value = rolActual;
      }
    });
  }

  return (
    <form ref={formRef} className="relative w-full">
      <input type="hidden" name="user_id" value={userId} />
      <select
        name="rol"
        defaultValue={rolActual}
        onChange={onChange}
        disabled={pending}
        className={selectClass}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROL_LABEL[r]}
          </option>
        ))}
      </select>
      {pending && (
        <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-azur-red" />
      )}
    </form>
  );
}
