'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const OTRO = '__otro__';

// Gestor del gasto: se elige de la lista de usuarios o se escribe uno libre
// (David pidió el campo; puede ser alguien sin cuenta en el sistema).
export function GestorInput({
  value,
  onChange,
  perfiles = [],
}: {
  value: string;
  onChange: (v: string) => void;
  perfiles?: { id: string; nombre: string }[];
}) {
  const nombres = perfiles.map((p) => p.nombre);
  // Si el valor guardado no está en la lista, arrancamos en modo "escribir".
  const [libre, setLibre] = useState(!!value && !nombres.includes(value));

  if (libre) {
    return (
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nombre del gestor"
          className="flex-1"
        />
        <button
          type="button"
          className="shrink-0 text-xs text-azur-600 hover:underline"
          onClick={() => { setLibre(false); onChange(''); }}
        >
          Elegir de la lista
        </button>
      </div>
    );
  }

  return (
    <Select
      value={nombres.includes(value) ? value : ''}
      onChange={(e) => {
        const v = e.target.value;
        if (v === OTRO) { setLibre(true); onChange(''); return; }
        onChange(v);
      }}
    >
      <option value="">— Sin gestor —</option>
      {perfiles.map((p) => (
        <option key={p.id} value={p.nombre}>{p.nombre}</option>
      ))}
      <option value={OTRO}>Otro (escribir nombre)…</option>
    </Select>
  );
}
