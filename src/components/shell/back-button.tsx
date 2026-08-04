'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

// Botón "Atrás" para la PWA de campo: evita tener que cerrar la app para volver
// (útil sobre todo tras abrir/descargar un PDF desde el celular).
export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Atrás"
      className="-ml-1 rounded-full p-1.5 text-foreground/80 hover:bg-secondary active:scale-95"
    >
      <ChevronLeft className="size-5" />
    </button>
  );
}
