'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Defaults = {
  razon_social?: string | null;
  nombre_comercial?: string | null;
  ruc?: string | null;
  contacto?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  notas?: string | null;
};

/** Campos compartidos por el form completo y el modal del wizard. */
export function ClienteFormFields({ defaults }: { defaults?: Defaults }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="razon_social">Razón social *</Label>
        <Input
          id="razon_social"
          name="razon_social"
          required
          minLength={3}
          defaultValue={defaults?.razon_social ?? ''}
          placeholder="Ej. Inversiones Constructoras Lima S.A.C."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nombre_comercial">Nombre comercial</Label>
        <Input
          id="nombre_comercial"
          name="nombre_comercial"
          defaultValue={defaults?.nombre_comercial ?? ''}
          placeholder="Ej. ICL Constructora"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ruc">RUC</Label>
        <Input
          id="ruc"
          name="ruc"
          inputMode="numeric"
          pattern="[0-9]{11}"
          maxLength={11}
          defaultValue={defaults?.ruc ?? ''}
          placeholder="20512345678"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contacto">Contacto principal</Label>
        <Input
          id="contacto"
          name="contacto"
          defaultValue={defaults?.contacto ?? ''}
          placeholder="Ej. Ing. María López"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          type="tel"
          defaultValue={defaults?.telefono ?? ''}
          placeholder="+51 999 999 999"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaults?.email ?? ''}
          placeholder="contacto@empresa.com"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          name="direccion"
          defaultValue={defaults?.direccion ?? ''}
          placeholder="Av. principal 123, distrito, ciudad"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="notas">Notas internas</Label>
        <textarea
          id="notas"
          name="notas"
          rows={2}
          defaultValue={defaults?.notas ?? ''}
          className="flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
          placeholder="Observaciones, condiciones de pago, contacto secundario, etc."
        />
      </div>
    </div>
  );
}
