-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Plantillas de APU en el catálogo de partidas.                         ║
-- ║  Al elegir una partida del catálogo, su APU se copia a la cotización.  ║
-- ╚══════════════════════════════════════════════════════════════════════╝

create table if not exists catalogo_apu (
  id uuid primary key default gen_random_uuid(),
  catalogo_partida_id uuid not null references catalogo_partidas(id) on delete cascade,
  tipo apu_tipo not null default 'materiales',
  descripcion text not null,
  unidad text,
  cuadrilla numeric(10,4),
  rendimiento numeric(12,4),
  cantidad numeric(14,4) not null default 0,
  precio numeric(14,4) not null default 0,
  orden int not null default 0
);
create index if not exists idx_catapu_part on catalogo_apu(catalogo_partida_id);

alter table catalogo_apu enable row level security;
drop policy if exists catapu_sel on catalogo_apu;
create policy catapu_sel on catalogo_apu for select to authenticated using (true);
drop policy if exists catapu_wr on catalogo_apu;
create policy catapu_wr on catalogo_apu for all to authenticated using (es_mando()) with check (es_mando());

-- ── APU de ejemplo para partidas típicas (idempotente) ──────────────────
-- Concreto f'c=210 (EST-001 o EST-007): MO + materiales + equipos
insert into catalogo_apu (catalogo_partida_id, tipo, descripcion, unidad, cantidad, precio, orden)
select p.id, t.tipo::apu_tipo, t.descr, t.und, t.cant, t.precio, t.orden
from catalogo_partidas p
join (values
  ('materiales','Cemento Portland Tipo I','bls',9.0,32.5,1),
  ('materiales','Arena gruesa','m3',0.5,65,2),
  ('materiales','Piedra chancada 1/2"','m3',0.55,75,3),
  ('mano_obra','Cuadrilla de concreto (operario+peón)','hh',2.5,20,4),
  ('equipos','Mezcladora de concreto','hm',0.4,35,5)
) t(tipo,descr,und,cant,precio,orden) on true
where p.codigo = 'EST-007'
  and not exists (select 1 from catalogo_apu a where a.catalogo_partida_id = p.id);

-- Muro de ladrillo King Kong soga (ALB-001)
insert into catalogo_apu (catalogo_partida_id, tipo, descripcion, unidad, cantidad, precio, orden)
select p.id, t.tipo::apu_tipo, t.descr, t.und, t.cant, t.precio, t.orden
from catalogo_partidas p
join (values
  ('materiales','Ladrillo King Kong 18 huecos','und',39,1.2,1),
  ('materiales','Cemento Portland Tipo I','bls',0.21,32.5,2),
  ('materiales','Arena gruesa','m3',0.03,65,3),
  ('mano_obra','Operario albañil','hh',1.0,23,4),
  ('mano_obra','Peón','hh',0.5,15,5)
) t(tipo,descr,und,cant,precio,orden) on true
where p.codigo = 'ALB-001'
  and not exists (select 1 from catalogo_apu a where a.catalogo_partida_id = p.id);

-- Tarrajeo de muros interiores (ALB-003)
insert into catalogo_apu (catalogo_partida_id, tipo, descripcion, unidad, cantidad, precio, orden)
select p.id, t.tipo::apu_tipo, t.descr, t.und, t.cant, t.precio, t.orden
from catalogo_partidas p
join (values
  ('materiales','Cemento Portland Tipo I','bls',0.12,32.5,1),
  ('materiales','Arena fina','m3',0.02,70,2),
  ('mano_obra','Operario','hh',0.6,23,3),
  ('mano_obra','Peón','hh',0.3,15,4)
) t(tipo,descr,und,cant,precio,orden) on true
where p.codigo = 'ALB-003'
  and not exists (select 1 from catalogo_apu a where a.catalogo_partida_id = p.id);

-- Piso porcelanato 60x60 (PIS-001)
insert into catalogo_apu (catalogo_partida_id, tipo, descripcion, unidad, cantidad, precio, orden)
select p.id, t.tipo::apu_tipo, t.descr, t.und, t.cant, t.precio, t.orden
from catalogo_partidas p
join (values
  ('materiales','Porcelanato 60x60','m2',1.05,75,1),
  ('materiales','Pegamento para porcelanato','bls',0.25,38,2),
  ('materiales','Fragua','kg',0.3,8,3),
  ('mano_obra','Operario','hh',0.8,23,4),
  ('mano_obra','Peón','hh',0.4,15,5)
) t(tipo,descr,und,cant,precio,orden) on true
where p.codigo = 'PIS-001'
  and not exists (select 1 from catalogo_apu a where a.catalogo_partida_id = p.id);

-- Salida de tomacorriente (IIE-002)
insert into catalogo_apu (catalogo_partida_id, tipo, descripcion, unidad, cantidad, precio, orden)
select p.id, t.tipo::apu_tipo, t.descr, t.und, t.cant, t.precio, t.orden
from catalogo_partidas p
join (values
  ('materiales','Tomacorriente doble','und',1,15,1),
  ('materiales','Cable THW 14 AWG','m',8,2.2,2),
  ('materiales','Tubería conduit 3/4"','und',2,8,3),
  ('mano_obra','Operario electricista','hh',1.5,23,4)
) t(tipo,descr,und,cant,precio,orden) on true
where p.codigo = 'IIE-002'
  and not exists (select 1 from catalogo_apu a where a.catalogo_partida_id = p.id);

-- Sincroniza el costo_referencial de esas partidas con su APU
update catalogo_partidas p set costo_referencial = sub.cu
from (select catalogo_partida_id, sum(cantidad*precio) cu from catalogo_apu group by catalogo_partida_id) sub
where sub.catalogo_partida_id = p.id;
