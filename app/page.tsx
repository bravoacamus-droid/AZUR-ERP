import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, ClipboardCheck, LineChart, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const features = [
  {
    icon: Wallet,
    title: 'Finanzas con trazabilidad total',
    description:
      'Solicitud → aprobación doble nivel → pago → voucher con URL pública para compartir en WhatsApp. Cajas chicas por proyecto y caja central consolidadas.',
  },
  {
    icon: Building2,
    title: 'Proyectos con APU y Curva S',
    description:
      'Presupuesto heredado del módulo Comercial, cronograma planificado vs ejecutado, valorización quincenal con formato del sector y adicionales/deductivos.',
  },
  {
    icon: ClipboardCheck,
    title: 'Comercial inteligente',
    description:
      'Cotizaciones con Análisis de Precios Unitarios, catálogo maestro de insumos y partidas. Al aprobar, el proyecto se genera automáticamente.',
  },
  {
    icon: Smartphone,
    title: 'PWA para el personal de campo',
    description:
      'Check-in con GPS, parte diario digital, captura fotográfica geolocalizada, solicitudes de pago y SST — instalable como app desde el navegador.',
  },
  {
    icon: LineChart,
    title: 'Dashboards en tiempo real',
    description:
      'Gerencia ve el avance físico vs financiero por proyecto, detección temprana de sobrecostos y consolidados multi-proyecto exportables.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguridad y auditoría',
    description:
      'Row Level Security por rol y proyecto. Log inmutable de cada acción crítica: quién, cuándo, qué y por qué.',
  },
];

const modules = [
  { label: 'Finanzas', href: '/finanzas', tone: 'from-azur-red to-azur-bright' },
  { label: 'Proyectos', href: '/proyectos', tone: 'from-azur-bright to-azur-red' },
  { label: 'Comercial', href: '/comercial', tone: 'from-azur-coral to-azur-red' },
  { label: 'PWA Campo', href: '/inicio', tone: 'from-azur-ink to-azur-red' },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-azur-coral/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-azur-red/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-azur-bright/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="container flex items-center justify-between py-6">
        <Logo variant="full" className="h-12 w-auto" />
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#modulos" className="transition-colors hover:text-azur-red">
            Módulos
          </a>
          <a href="#caracteristicas" className="transition-colors hover:text-azur-red">
            Características
          </a>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-azur-gradient px-5 py-2.5 text-white shadow-azur-md transition-all hover:shadow-azur-lg"
          >
            Ingresar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-azur-gradient px-4 py-2 text-sm text-white shadow-azur-md md:hidden"
        >
          Ingresar
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Hero */}
      <section className="container grid items-center gap-12 py-12 md:py-20 lg:grid-cols-2 lg:py-28">
        <div className="animate-fade-in space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-azur-coral/40 bg-azur-coral/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-azur-red">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-azur-bright" />
            Plataforma integral · Lima, Perú
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-azur-ink sm:text-5xl lg:text-6xl">
            ERP de obra <span className="azur-text-gradient">a medida</span> para AZUR Constructora.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Una sola plataforma para finanzas, proyectos y comercial — con aplicativo móvil PWA para el
            personal de campo. Valorizaciones quincenales con APU, Curva S, partes diarios y trazabilidad
            total del flujo solicitud → pago → comprobante.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-azur-gradient px-6 py-3 font-semibold text-white shadow-azur-md transition-all hover:-translate-y-0.5 hover:shadow-azur-lg"
            >
              Acceder a la plataforma
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#modulos"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 font-semibold text-azur-ink transition-all hover:border-azur-coral hover:bg-azur-coral/10"
            >
              Conocer los módulos
            </a>
          </div>
          <dl className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: '3', label: 'Módulos ERP' },
              { value: '1', label: 'PWA de campo' },
              { value: '100%', label: 'Propiedad de AZUR' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur">
                <dt className="font-display text-2xl font-bold text-azur-red">{stat.value}</dt>
                <dd className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-slide-up">
          <div className="azur-glass relative aspect-[4/5] overflow-hidden rounded-3xl p-8">
            <div className="absolute inset-0 -z-10 bg-azur-soft opacity-40" />
            <div className="flex h-full flex-col items-center justify-center gap-8">
              <Image
                src="/logo.png"
                alt="AZUR Constructora e Inmobiliaria"
                width={280}
                height={350}
                priority
                className="drop-shadow-[0_24px_48px_rgba(190,23,35,0.25)]"
              />
              <div className="space-y-2 text-center">
                <p className="font-display text-xl font-bold text-azur-ink">Sistema ERP + PWA</p>
                <p className="text-sm text-muted-foreground">
                  Construido sobre Next.js · Supabase · Vercel
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-azur-red/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-azur-coral/40 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="container py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-azur-ink sm:text-4xl">
            Una plataforma, cuatro frentes.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Cada módulo está pensado para un rol concreto del equipo, pero todos comparten una única fuente
            de verdad.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((mod) => (
            <Link
              key={mod.label}
              href={mod.href}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-azur-lg"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${mod.tone}`}
                aria-hidden
              />
              <p className="font-display text-xl font-bold text-azur-ink">{mod.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">Acceder al módulo</p>
              <ArrowRight className="mt-6 h-5 w-5 text-azur-red transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="container py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-azur-ink sm:text-4xl">
            Pensado para constructoras peruanas.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Valorización con metrados contractuales y ejecutados, APU desagregado, Curva S y formato
            estándar del sector.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="azur-card group"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-azur-coral/20 text-azur-red transition-colors group-hover:bg-azur-red group-hover:text-white">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-azur-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl bg-azur-dark p-10 text-white sm:p-16">
          <div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-azur-bright/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-azur-coral/40 blur-2xl" />
          <div className="relative grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Listo para reemplazar la matriz del Drive y los WhatsApp.
              </h2>
              <p className="mt-3 max-w-xl text-white/80">
                Una sola plataforma. Una sola fuente de verdad. Trazabilidad completa de cada solicitud, cada
                aprobación y cada pago.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-azur-red shadow-azur-md transition-all hover:-translate-y-0.5 hover:shadow-azur-glow lg:w-auto"
            >
              Ingresar al sistema
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container border-t border-border/60 py-8">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-3">
            <Logo variant="mark" className="h-6 w-auto" />
            <span>© {new Date().getFullYear()} AZUR Constructora e Inmobiliaria</span>
          </div>
          <p>Desarrollado por Promptive · Luciérnaga &amp; Asociados S.A.C.</p>
        </div>
      </footer>
    </main>
  );
}
