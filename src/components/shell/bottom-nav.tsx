'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon';
import { pwaNavForRol } from '@/lib/nav';
import type { Rol } from '@/lib/roles';

export function BottomNav({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const items = pwaNavForRol(rol);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 pb-safe backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/campo' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                active ? 'text-azur-600' : 'text-muted-foreground',
              )}
            >
              <Icon name={item.icon} className={cn('size-5', active && 'text-azur-600')} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
