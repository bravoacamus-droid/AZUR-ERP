'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { type NavItem } from '@/lib/auth/nav';
import { cn } from '@/lib/utils';

type BottomNavProps = {
  primary: NavItem[];
  more: NavItem[];
};

export function BottomNav({ primary, more }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = primary.slice(0, 4);
  const hasMore = more.length > 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-white/85 backdrop-blur-xl safe-bottom lg:hidden">
      <ul className={cn('grid', hasMore ? 'grid-cols-5' : `grid-cols-${items.length || 1}`)}>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-azur-red' : 'text-muted-foreground hover:text-azur-ink',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-azur-gradient"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}

        {hasMore && (
          <li>
            <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
              <DrawerTrigger asChild>
                <button
                  type="button"
                  className="flex w-full flex-col items-center justify-center gap-1 px-2 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-azur-ink"
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span>Más</span>
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Más opciones</DrawerTitle>
                  <DrawerDescription>Accesos secundarios del módulo de campo</DrawerDescription>
                </DrawerHeader>
                <div className="grid grid-cols-2 gap-3 p-4">
                  {more.map((m) => {
                    const Icon = m.icon;
                    return (
                      <Link
                        key={m.href}
                        href={m.href}
                        onClick={() => setMoreOpen(false)}
                        className="azur-card flex flex-col items-start gap-2 p-4"
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-azur-ink">{m.label}</p>
                          {m.description && (
                            <p className="text-[11px] text-muted-foreground">{m.description}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </DrawerContent>
            </Drawer>
          </li>
        )}
      </ul>
    </nav>
  );
}
