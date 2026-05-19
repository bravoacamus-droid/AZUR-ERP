'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { crearCliente, type ClienteState } from '@/app/(erp)/clientes/actions';
import { ClienteFormFields } from '@/app/(erp)/clientes/cliente-form-fields';

type Props = {
  /** Callback con el cliente recién creado para auto-seleccionarlo */
  onCreated?: (cliente: { id: string; razon_social: string; ruc: string | null }) => void;
};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Crear cliente
    </Button>
  );
}

export function ClienteQuickCreate({ onCreated }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<ClienteState, FormData>(crearCliente, { ok: false });

  function openModal() {
    setOpen(true);
    dialogRef.current?.showModal();
  }
  function closeModal() {
    setOpen(false);
    dialogRef.current?.close();
  }

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && state.cliente) {
      toast.success(`Cliente "${state.cliente.razon_social}" creado y seleccionado`);
      onCreated?.(state.cliente);
      router.refresh();
      closeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-azur-red/40 bg-white px-3 text-xs font-semibold text-azur-red transition-colors hover:bg-azur-coral/10"
      >
        <Plus className="h-3.5 w-3.5" />
        Nuevo cliente
      </button>

      <dialog
        ref={dialogRef}
        onClose={closeModal}
        onClick={(e) => {
          // Click fuera del contenido cierra
          if (e.target === dialogRef.current) closeModal();
        }}
        className="backdrop:bg-black/40 backdrop:backdrop-blur-sm rounded-2xl p-0 shadow-2xl max-w-2xl w-full"
      >
        {open && (
          <form action={action} className="space-y-5 p-6">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-azur-ink">Crear cliente nuevo</h2>
                <p className="text-xs text-muted-foreground">
                  Se guardará en el módulo Clientes y quedará disponible para esta cotización.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted/60"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <ClienteFormFields />

            {state.error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <footer className="flex justify-end gap-2 border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 items-center rounded-full border border-border bg-white px-4 text-sm font-medium hover:border-azur-coral"
              >
                Cancelar
              </button>
              <SubmitBtn />
            </footer>
          </form>
        )}
      </dialog>
    </>
  );
}
