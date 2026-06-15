import { Logo } from '@/components/brand/logo';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-azur-gradient p-12 text-white lg:flex">
        <div className="rounded-2xl bg-white p-3 w-fit shadow-lg">
          <Logo size={48} />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight text-balance">
            Una sola fuente de verdad para toda la obra.
          </h2>
          <p className="max-w-md text-white/85">
            Cotizaciones, proyectos, valorizaciones, finanzas y campo conectados
            de extremo a extremo. Del lead a la liquidación, con trazabilidad total.
          </p>
        </div>
        <div className="flex gap-8 text-sm text-white/80">
          <div>
            <p className="text-2xl font-bold text-white">3</p>
            <p>Líneas de negocio</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">100%</p>
            <p>Trazabilidad</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">PWA</p>
            <p>Obra sin conexión</p>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-10 size-80 rounded-full bg-black/10" />
      </div>

      {/* Formulario */}
      <div className="flex flex-col items-center justify-center gap-6 bg-secondary/40 px-4 py-10">
        <div className="lg:hidden">
          <Logo size={52} />
        </div>
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AZUR Constructora e Inmobiliaria · ERP integral
        </p>
      </div>
    </div>
  );
}
