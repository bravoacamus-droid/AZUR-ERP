import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-white p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-azur-coral/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-azur-red/20 blur-3xl" />
      </div>
      <div className="max-w-md text-center">
        <Logo variant="mark" className="mx-auto h-20 w-auto" />
        <p className="mt-6 font-display text-6xl font-bold azur-text-gradient">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-azur-ink">Página no encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          La ruta que buscas no existe o fue movida. Volvamos al inicio.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-azur-gradient px-5 py-2.5 font-semibold text-white shadow-azur-md transition-all hover:-translate-y-0.5 hover:shadow-azur-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
