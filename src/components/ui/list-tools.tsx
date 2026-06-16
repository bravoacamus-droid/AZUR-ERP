'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

export function SearchBox({ placeholder = 'Buscar…' }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(Array.from(sp.entries()));
      if (q) params.set('q', q); else params.delete('q');
      params.delete('page');
      if ((sp.get('q') ?? '') !== q) startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="relative max-w-sm flex-1">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-9" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
      {pending && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-azur-600" />}
    </div>
  );
}

export function Pagination({ page, total, pageSize }: { page: number; total: number; pageSize: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const go = (p: number) => {
    const params = new URLSearchParams(Array.from(sp.entries()));
    params.set('page', String(p));
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
      <span className="text-muted-foreground">Página {page} de {totalPages} · {total} registros</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => go(page - 1)}><ChevronLeft className="size-4" /> Anterior</Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => go(page + 1)}>Siguiente <ChevronRight className="size-4" /></Button>
      </div>
    </div>
  );
}
