'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Dialog, DialogPortal, DialogOverlay, DialogContent } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCommandPaletteItems } from '@/lib/auth/nav';
import { type RolSistema, ROL_LABEL } from '@/lib/auth/roles';
import { logoutAction } from '@/lib/auth/actions';

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rol: RolSistema;
};

export function CommandPalette({ open, onOpenChange, rol }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const items = getCommandPaletteItems(rol);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent
          className="top-[20%] max-w-[640px] translate-y-0 overflow-hidden p-0"
          showClose={false}
        >
          <Command label="Buscar acciones" className="azur-cmd">
            <div className="flex items-center border-b border-border/60 px-4">
              <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder={`Buscar en ${ROL_LABEL[rol]}…`}
                className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground/60"
              />
              <kbd className="ml-2 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
            <Command.List className="max-h-[420px] overflow-y-auto p-2">
              <Command.Empty className="grid place-items-center py-8 text-sm text-muted-foreground">
                Sin resultados para “{search}”
              </Command.Empty>

              <Command.Group heading="Navegación" className="cmd-group">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${item.description ?? ''} ${item.href}`}
                      onSelect={() => go(item.href)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
                        'aria-selected:bg-azur-coral/20 aria-selected:text-azur-red',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-azur-ink">{item.label}</p>
                        {item.description && (
                          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>

              <Command.Group heading="Sesión" className="cmd-group">
                <Command.Item
                  value="cerrar sesion logout salir"
                  onSelect={async () => {
                    onOpenChange(false);
                    await logoutAction();
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-azur-coral/20 aria-selected:text-azur-red"
                >
                  Cerrar sesión
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
