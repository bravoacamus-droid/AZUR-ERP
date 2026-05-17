'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { ArrowRight, KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction, type LoginActionState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      {pending ? 'Iniciando sesión…' : 'Ingresar'}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  );
}

export function LoginForm({ defaultEmail }: { defaultEmail?: string }) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '';
  const errorParam = searchParams.get('error');

  const [state, formAction] = useFormState<LoginActionState, FormData>(loginAction, {
    ok: true,
  });

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  useEffect(() => {
    if (errorParam === 'inactive') toast.error('Tu cuenta está desactivada. Contacta a gerencia.');
  }, [errorParam]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="redirect" value={redirectTo} />

      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@azur.dev"
            defaultValue={defaultEmail}
            required
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <a href="/recuperar" className="text-xs font-medium text-azur-red hover:underline">
            ¿Olvidaste tu clave?
          </a>
        </div>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            minLength={6}
            className="pl-10"
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
