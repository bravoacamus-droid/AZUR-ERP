import { redirect } from 'next/navigation';

// Clientes vive ahora dentro del libro único de Catálogos.
export default function ClientesPage() {
  redirect('/catalogos?tab=clientes');
}
