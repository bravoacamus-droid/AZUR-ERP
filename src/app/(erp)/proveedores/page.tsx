import { redirect } from 'next/navigation';

// Proveedores/contratistas viven ahora dentro del libro único de Catálogos.
export default function ProveedoresPage() {
  redirect('/catalogos?tab=contrapartes');
}
