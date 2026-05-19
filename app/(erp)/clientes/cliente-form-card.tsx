'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { crearCliente, type ClienteState } from './actions';
import { ClienteFormFields } from './cliente-form-fields';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Guardar cliente
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

/** Card del módulo /clientes para crear un cliente nuevo. */
export function ClienteFormCard() {
  const router = useRouter();
  const [state, action] = useFormState<ClienteState, FormData>(crearCliente, { ok: false });

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && state.cliente) {
      toast.success(`Cliente "${state.cliente.razon_social}" creado`);
      router.refresh();
      // limpia el form via reload
      const form = document.getElementById('cliente-form') as HTMLFormElement | null;
      form?.reset();
    }
  }, [state, router]);

  return (
    <form id="cliente-form" action={action} className="azur-card space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-azur-ink">Nuevo cliente</h2>
        <p className="text-xs text-muted-foreground">
          Razón social obligatoria. El RUC debe ser único en el sistema.
        </p>
      </div>
      <ClienteFormFields />
      <div className="flex justify-end">
        <SubmitBtn />
      </div>
    </form>
  );
}
