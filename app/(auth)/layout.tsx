import { Logo } from '@/components/ui/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen overflow-hidden bg-white lg:grid-cols-2">
      {/* Panel decorativo (lg+) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-azur-dark p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -left-20 -top-20 h-[420px] w-[420px] rounded-full bg-azur-bright/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-[460px] w-[460px] rounded-full bg-azur-coral/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-azur-red/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Logo variant="mark" className="h-12 w-auto brightness-0 invert" priority />
          <div>
            <p className="font-display text-lg font-bold leading-tight">AZUR</p>
            <p className="text-xs uppercase tracking-wider text-white/70">Constructora e Inmobiliaria</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-4xl font-bold leading-[1.1]">
            La obra ordenada, <br />
            <span className="text-azur-coral">en una sola plataforma.</span>
          </h1>
          <p className="max-w-md text-white/80">
            Finanzas, proyectos y comercial integrados — con app móvil PWA para el personal de campo.
            Trazabilidad total y reportes automáticos.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Finanzas', 'Proyectos', 'Comercial', 'PWA Campo'].map((m) => (
              <span
                key={m}
                className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} AZUR · Desarrollado por Promptive · Luciérnaga &amp; Asociados S.A.C.
        </p>
      </aside>

      {/* Panel formulario */}
      <section className="relative flex items-center justify-center p-6 sm:p-12">
        <div className="pointer-events-none absolute inset-0 -z-10 lg:hidden">
          <div className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-azur-coral/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-[340px] w-[340px] rounded-full bg-azur-red/15 blur-3xl" />
        </div>

        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
