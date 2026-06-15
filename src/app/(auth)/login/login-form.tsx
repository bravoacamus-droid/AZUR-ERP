'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2, KeyRound, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/misc';
import { DEV_USERS, DEV_PASSWORD } from '@/lib/dev-users';
import { ROL_META } from '@/lib/roles';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e?: React.FormEvent, creds?: { email: string; password: string }) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: creds?.email ?? email,
      password: creds?.password ?? password,
    });
    if (error) {
      setError('Credenciales inválidas. Verifica correo y contraseña.');
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  function quickLogin(userEmail: string) {
    setEmail(userEmail);
    setPassword(DEV_PASSWORD);
    void signIn(undefined, { email: userEmail, password: DEV_PASSWORD });
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={signIn} className="space-y-4 rounded-2xl border bg-white p-6 shadow-lg sm:p-8">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground">
            Accede al ERP y a la app de obra de AZUR.
          </p>
        </div>

        <Field label="Correo electrónico">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="usuario@azur.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
              autoComplete="email"
            />
          </div>
        </Field>

        <Field label="Contraseña">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              required
              autoComplete="current-password"
            />
          </div>
        </Field>

        {error && (
          <p className="rounded-lg bg-azur-50 px-3 py-2 text-sm text-azur-700">{error}</p>
        )}

        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <LogIn />}
          Ingresar
        </Button>
      </form>

      {/* ⚠️ TEMPORAL — usuarios de prueba (quitar antes de producción) */}
      <div className="mt-5 rounded-2xl border border-dashed bg-muted/30 p-4">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Usuarios de prueba · contraseña{' '}
          <code className="rounded bg-white px-1.5 py-0.5 text-azur-700">{DEV_PASSWORD}</code>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEV_USERS.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => quickLogin(u.email)}
              disabled={loading}
              className="flex flex-col items-start rounded-lg border bg-white px-3 py-2 text-left transition-colors hover:border-azur-300 hover:bg-azur-50 disabled:opacity-60"
            >
              <span className="text-sm font-medium leading-tight">{u.nombre}</span>
              <span className="text-[11px] text-azur-600">{ROL_META[u.rol].label}</span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">{u.email}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Toca cualquiera para ingresar al instante.
        </p>
      </div>
    </div>
  );
}
