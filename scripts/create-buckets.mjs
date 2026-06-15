const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const S = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !S) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}
const h = { apikey: S, Authorization: 'Bearer ' + S, 'Content-Type': 'application/json' };
const buckets = ['avatars', 'documentos', 'evidencias', 'vouchers'];
for (const b of buckets) {
  const r = await fetch(BASE + '/storage/v1/bucket', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ id: b, name: b, public: true, file_size_limit: 10485760 }),
  });
  console.log(b, r.status, (await r.text()).slice(0, 120));
}
