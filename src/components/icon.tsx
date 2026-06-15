'use client';

import {
  LayoutDashboard, BellRing, FileText, HardHat, Wallet, Package, BarChart3,
  Database, Users, Home, ClipboardList, Receipt, ShieldCheck, Contact, type LucideProps,
} from 'lucide-react';

const MAP = {
  LayoutDashboard, BellRing, FileText, HardHat, Wallet, Package, BarChart3,
  Database, Users, Home, ClipboardList, Receipt, ShieldCheck, Contact,
} as const;

export type IconName = keyof typeof MAP;

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = MAP[name as IconName] ?? LayoutDashboard;
  return <Cmp {...props} />;
}
