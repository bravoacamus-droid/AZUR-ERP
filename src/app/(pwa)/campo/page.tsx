import Link from 'next/link';
import { ClipboardList, Receipt, ShieldCheck, Package, Camera, HardHat } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { CheckIn } from './checkin';

export const dynamic = 'force-dynamic';

const ACCIONES = [
  { href: '/campo/rdo', label: 'Parte diario', icon: ClipboardList, color: 'bg-sky-50 text-sky-600' },
  { href: '/campo/solicitudes', label: 'Solicitud de pago', icon: Receipt, color: 'bg-emerald-50 text-emerald-600' },
  { href: '/campo/evidencias', label: 'Evidencias', icon: Camera, color: 'bg-violet-50 text-violet-600' },
  { href: '/campo/sst', label: 'Seguridad (SST)', icon: ShieldCheck, color: 'bg-amber-50 text-amber-600' },
  { href: '/campo/almacen', label: 'Almacén', icon: Package, color: 'bg-azur-50 text-azur-600' },
];

export default async function CampoHome() {
  const session = await requireSession();
  const supabase = createClient();
  const { data: proyectos } = await supabase
    .from('proyectos')
    .select('id, nombre')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Bienvenido</p>
        <h1 className="text-xl font-bold">{session.nombre}</h1>
      </div>

      <CheckIn proyectos={proyectos ?? []} />

      <div>
        <p className="mb-2 text-sm font-semibold text-muted-foreground">Acciones rápidas</p>
        <div className="grid grid-cols-2 gap-3">
          {ACCIONES.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-shadow active:scale-[0.98]"
            >
              <span className={`flex size-11 items-center justify-center rounded-xl ${a.color}`}>
                <a.icon className="size-5" />
              </span>
              <span className="text-sm font-medium leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <HardHat className="size-4 text-azur-600" />
          <p className="text-sm font-semibold">Mis proyectos</p>
        </div>
        {!proyectos || proyectos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin proyectos asignados.</p>
        ) : (
          <ul className="divide-y">
            {proyectos.map((p) => (
              <li key={p.id} className="py-2.5 text-sm">
                {p.nombre}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
