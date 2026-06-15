import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Cliente admin (service_role) — BYPASS RLS.
// Usar SOLO en server (actions / route handlers) para lookups internos
// post-validación de rol. Ver Bug #1 (Anexo A): entre update() y select() con
// el cliente del usuario, PostgREST puede perder auth.uid() y devolver null
// silencioso. Para esos lookups usar este cliente.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
