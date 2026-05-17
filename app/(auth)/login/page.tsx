import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Logo } from '@/components/ui/logo';
import { LoginForm } from './login-form';
import { DevQuickAccess } from '@/components/auth/dev-quick-access';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Acceso al ERP y a la PWA de AZUR Constructora.',
};

export default function LoginPage() {
  const showDevAccess = process.env.NEXT_PUBLIC_ENV !== 'production';

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 lg:hidden">
        <Logo variant="mark" className="h-16 w-auto" priority />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-azur-red">Bienvenido</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-azur-ink">Inicia sesión</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Accede al ERP de AZUR Constructora con tu correo corporativo.
        </p>
      </div>

      <Suspense fallback={<div className="skeleton h-72" />}>
        <LoginForm />
      </Suspense>

      {showDevAccess ? <DevQuickAccess /> : null}

      <p className="text-center text-xs text-muted-foreground">
        ¿Necesitas un acceso?{' '}
        <a href="mailto:gerencia@azur.dev" className="font-medium text-azur-red hover:underline">
          Contacta a gerencia
        </a>
      </p>
    </div>
  );
}
