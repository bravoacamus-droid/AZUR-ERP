'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ROL_DEFAULT_HOME, ROL_LABEL, type RolSistema } from '@/lib/auth/roles';
import { cn, initials } from '@/lib/utils';

type DevUser = {
  email: string;
  full_name: string;
  rol: RolSistema;
  cargo: string;
};

const DEV_USERS: DevUser[] = [
  { email: 'gerencia@azur.dev',  full_name: 'Juan Valiente Pizarro', rol: 'gerencia_general',  cargo: 'Gerente General' },
  { email: 'jefeproy@azur.dev',  full_name: 'Carlos Mendoza Ríos',   rol: 'jefe_proyectos',    cargo: 'Jefe de Proyectos' },
  { email: 'jefepres@azur.dev',  full_name: 'Lucía Quispe Torres',   rol: 'jefe_presupuestos', cargo: 'Jefa de Presupuestos' },
  { email: 'admin@azur.dev',     full_name: 'María Salazar Vega',    rol: 'administrador',     cargo: 'Administradora' },
  { email: 'comercial@azur.dev', full_name: 'Diego Paredes Núñez',   rol: 'comercial',         cargo: 'Comercial' },
  { email: 'residente@azur.dev', full_name: 'Pedro Huamán Cusi',     rol: 'residente',         cargo: 'Residente de Obra' },
];

const ROL_GRADIENT: Record<RolSistema, string> = {
  gerencia_general:  'from-azur-red to-azur-bright',
  jefe_proyectos:    'from-azur-bright to-azur-red',
  jefe_presupuestos: 'from-azur-red via-azur-bright to-azur-coral',
  administrador:     'from-azur-bright to-azur-coral',
  comercial:         'from-azur-coral to-azur-red',
  residente:         'from-azur-ink to-azur-red',
};

export function DevQuickAccess() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeEmail, setActiveEmail] = useState<string | null>(null);

  async function loginAs(user: DevUser) {
    setActiveEmail(user.email);
    const supabase = createClient();
    const password = process.env.NEXT_PUBLIC_DEV_USERS_PASSWORD || 'azur2026';

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error) {
      toast.error(`No se pudo entrar como ${user.email}: ${error.message}`);
      setActiveEmail(null);
      return;
    }

    toast.success(`Bienvenido, ${user.full_name.split(' ')[0]}`);
    startTransition(() => {
      router.replace(ROL_DEFAULT_HOME[user.rol]);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-dashed border-azur-coral/50 bg-azur-coral/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-azur-gradient text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-azur-ink">Acceso rápido · Desarrollo</p>
          <p className="text-xs text-muted-foreground">
            Click en cualquier rol para entrar al sistema (password: <code className="rounded bg-white px-1 py-0.5 text-[10px]">azur2026</code>)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEV_USERS.map((u, i) => {
          const isActive = activeEmail === u.email && pending;
          return (
            <motion.button
              key={u.email}
              type="button"
              disabled={pending}
              onClick={() => loginAs(u)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'group relative overflow-hidden rounded-xl border border-border/70 bg-white p-3 text-left transition-all',
                'hover:border-azur-red hover:shadow-azur-md',
                'disabled:opacity-50 disabled:hover:translate-y-0',
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow',
                    ROL_GRADIENT[u.rol],
                  )}
                >
                  {isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    initials(u.full_name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-azur-ink">
                    {ROL_LABEL[u.rol]}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{u.full_name}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
