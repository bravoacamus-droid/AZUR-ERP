-- Políticas de Storage: lectura pública + escritura para usuarios autenticados
-- en los 4 buckets (avatars, documentos, evidencias, vouchers).

do $$
declare b text;
begin
  foreach b in array array['avatars','documentos','evidencias','vouchers'] loop
    -- lectura pública
    execute format($f$
      drop policy if exists "read_%1$s" on storage.objects;
      create policy "read_%1$s" on storage.objects for select to public using (bucket_id = %2$L);
    $f$, b, b);
    -- subir (insert) autenticado
    execute format($f$
      drop policy if exists "insert_%1$s" on storage.objects;
      create policy "insert_%1$s" on storage.objects for insert to authenticated with check (bucket_id = %2$L);
    $f$, b, b);
    -- actualizar / borrar autenticado
    execute format($f$
      drop policy if exists "update_%1$s" on storage.objects;
      create policy "update_%1$s" on storage.objects for update to authenticated using (bucket_id = %2$L);
    $f$, b, b);
    execute format($f$
      drop policy if exists "delete_%1$s" on storage.objects;
      create policy "delete_%1$s" on storage.objects for delete to authenticated using (bucket_id = %2$L);
    $f$, b, b);
  end loop;
end $$;
