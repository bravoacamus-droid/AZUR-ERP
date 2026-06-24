-- Tipo de plazo de la cotización: agregar semanas y meses (ya existían calendario y util).
do $$ begin alter type plazo_tipo add value if not exists 'semanas'; exception when others then null; end $$;
do $$ begin alter type plazo_tipo add value if not exists 'meses'; exception when others then null; end $$;
