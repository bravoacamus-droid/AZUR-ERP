'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs } from '@/components/ui/tabs';

// Pestañas del Dashboard por rol; la pestaña elegida queda en la URL (?vista=).
export function DashboardTabs({ tabs, children }: { tabs: { value: string; label: string }[]; children: Record<string, React.ReactNode> }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const inicial = tabs.some((t) => t.value === sp.get('vista')) ? sp.get('vista')! : tabs[0]?.value;
  const [tab, setTab] = React.useState(inicial);
  const cambiar = (v: string) => {
    setTab(v);
    const params = new URLSearchParams(Array.from(sp.entries()));
    params.set('vista', v);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  if (tabs.length <= 1) return <>{children[tabs[0]?.value ?? '']}</>;
  return (
    <div className="space-y-4">
      <Tabs tabs={tabs} value={tab} onChange={cambiar} />
      {children[tab]}
    </div>
  );
}
