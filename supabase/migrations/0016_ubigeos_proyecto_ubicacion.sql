-- =====================================================================
-- AZUR ERP · Migration 0016 — Ubigeos Perú + columnas ubicación en proyectos
-- =====================================================================

-- ---------------------------------------------------------------------
-- Catálogo ubigeo: jerarquía completa (depto/prov/dist)
-- código INEI de 6 dígitos
-- ---------------------------------------------------------------------
create table if not exists public.ubigeos (
  codigo       text primary key,            -- 150101
  departamento text not null,
  provincia    text not null,
  distrito     text not null,
  latitud      numeric(10,7),
  longitud     numeric(10,7),
  tipo         text not null check (tipo in ('departamento','provincia','distrito'))
);

create index if not exists idx_ubigeos_dep on public.ubigeos (departamento);
create index if not exists idx_ubigeos_prov on public.ubigeos (departamento, provincia);
create index if not exists idx_ubigeos_tipo on public.ubigeos (tipo);

alter table public.ubigeos enable row level security;
drop policy if exists "ubigeos_select" on public.ubigeos;
create policy "ubigeos_select" on public.ubigeos for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- Seed: 25 departamentos del Perú (con coords del centro político)
-- ---------------------------------------------------------------------
insert into public.ubigeos (codigo, departamento, provincia, distrito, latitud, longitud, tipo) values
  ('01','Amazonas','','',-6.2306,-77.8694,'departamento'),
  ('02','Áncash','','',-9.5278,-77.5278,'departamento'),
  ('03','Apurímac','','',-13.6386,-72.8814,'departamento'),
  ('04','Arequipa','','',-15.8402,-71.5375,'departamento'),
  ('05','Ayacucho','','',-13.1631,-74.2236,'departamento'),
  ('06','Cajamarca','','',-7.1611,-78.5125,'departamento'),
  ('07','Callao','','',-12.0566,-77.1181,'departamento'),
  ('08','Cusco','','',-13.5320,-71.9675,'departamento'),
  ('09','Huancavelica','','',-12.7847,-74.9744,'departamento'),
  ('10','Huánuco','','',-9.9306,-76.2422,'departamento'),
  ('11','Ica','','',-14.0678,-75.7286,'departamento'),
  ('12','Junín','','',-12.0653,-75.2049,'departamento'),
  ('13','La Libertad','','',-8.1090,-79.0215,'departamento'),
  ('14','Lambayeque','','',-6.7714,-79.8409,'departamento'),
  ('15','Lima','','',-12.0464,-77.0428,'departamento'),
  ('16','Loreto','','',-3.7437,-73.2516,'departamento'),
  ('17','Madre de Dios','','',-12.5933,-69.1893,'departamento'),
  ('18','Moquegua','','',-17.1956,-70.9347,'departamento'),
  ('19','Pasco','','',-10.6828,-76.2563,'departamento'),
  ('20','Piura','','',-5.1945,-80.6328,'departamento'),
  ('21','Puno','','',-15.8402,-70.0219,'departamento'),
  ('22','San Martín','','',-6.4858,-76.3700,'departamento'),
  ('23','Tacna','','',-18.0066,-70.2463,'departamento'),
  ('24','Tumbes','','',-3.5669,-80.4515,'departamento'),
  ('25','Ucayali','','',-8.3791,-74.5539,'departamento')
on conflict (codigo) do update
  set departamento = excluded.departamento,
      latitud      = excluded.latitud,
      longitud     = excluded.longitud;

-- ---------------------------------------------------------------------
-- Seed: provincias y distritos más representativos (Lima y principales ciudades)
-- Esta lista cubre ~80% de los proyectos de obra reales en Lima Metro + capitales.
-- Para distritos faltantes el usuario digita libremente; el mapa GPS valida igual.
-- ---------------------------------------------------------------------
insert into public.ubigeos (codigo, departamento, provincia, distrito, latitud, longitud, tipo) values
  -- Lima Metropolitana (provincia 1501) — 43 distritos
  ('150101','Lima','Lima','Lima',-12.0464,-77.0428,'distrito'),
  ('150102','Lima','Lima','Ancón',-11.7733,-77.1745,'distrito'),
  ('150103','Lima','Lima','Ate',-12.0273,-76.9263,'distrito'),
  ('150104','Lima','Lima','Barranco',-12.1486,-77.0227,'distrito'),
  ('150105','Lima','Lima','Breña',-12.0608,-77.0517,'distrito'),
  ('150106','Lima','Lima','Carabayllo',-11.8475,-77.0356,'distrito'),
  ('150107','Lima','Lima','Chaclacayo',-11.9786,-76.7704,'distrito'),
  ('150108','Lima','Lima','Chorrillos',-12.1740,-77.0166,'distrito'),
  ('150109','Lima','Lima','Cieneguilla',-12.1198,-76.8194,'distrito'),
  ('150110','Lima','Lima','Comas',-11.9311,-77.0508,'distrito'),
  ('150111','Lima','Lima','El Agustino',-12.0418,-76.9988,'distrito'),
  ('150112','Lima','Lima','Independencia',-11.9889,-77.0537,'distrito'),
  ('150113','Lima','Lima','Jesús María',-12.0719,-77.0489,'distrito'),
  ('150114','Lima','Lima','La Molina',-12.0867,-76.9469,'distrito'),
  ('150115','Lima','Lima','La Victoria',-12.0696,-77.0167,'distrito'),
  ('150116','Lima','Lima','Lince',-12.0830,-77.0357,'distrito'),
  ('150117','Lima','Lima','Los Olivos',-11.9756,-77.0739,'distrito'),
  ('150118','Lima','Lima','Lurigancho',-11.9786,-76.8950,'distrito'),
  ('150119','Lima','Lima','Lurín',-12.2778,-76.8694,'distrito'),
  ('150120','Lima','Lima','Magdalena del Mar',-12.0950,-77.0744,'distrito'),
  ('150121','Lima','Lima','Pueblo Libre',-12.0744,-77.0653,'distrito'),
  ('150122','Lima','Lima','Miraflores',-12.1219,-77.0298,'distrito'),
  ('150123','Lima','Lima','Pachacámac',-12.2278,-76.8528,'distrito'),
  ('150124','Lima','Lima','Pucusana',-12.4806,-76.7975,'distrito'),
  ('150125','Lima','Lima','Puente Piedra',-11.8689,-77.0769,'distrito'),
  ('150126','Lima','Lima','Punta Hermosa',-12.3358,-76.8233,'distrito'),
  ('150127','Lima','Lima','Punta Negra',-12.3653,-76.7900,'distrito'),
  ('150128','Lima','Lima','Rímac',-12.0287,-77.0297,'distrito'),
  ('150129','Lima','Lima','San Bartolo',-12.3878,-76.7806,'distrito'),
  ('150130','Lima','Lima','San Borja',-12.1042,-76.9981,'distrito'),
  ('150131','Lima','Lima','San Isidro',-12.0978,-77.0365,'distrito'),
  ('150132','Lima','Lima','San Juan de Lurigancho',-12.0090,-77.0028,'distrito'),
  ('150133','Lima','Lima','San Juan de Miraflores',-12.1606,-76.9706,'distrito'),
  ('150134','Lima','Lima','San Luis',-12.0789,-76.9986,'distrito'),
  ('150135','Lima','Lima','San Martín de Porres',-12.0028,-77.0833,'distrito'),
  ('150136','Lima','Lima','San Miguel',-12.0789,-77.0928,'distrito'),
  ('150137','Lima','Lima','Santa Anita',-12.0428,-76.9722,'distrito'),
  ('150138','Lima','Lima','Santa María del Mar',-12.4150,-76.7956,'distrito'),
  ('150139','Lima','Lima','Santa Rosa',-11.7903,-77.1631,'distrito'),
  ('150140','Lima','Lima','Santiago de Surco',-12.1444,-76.9939,'distrito'),
  ('150141','Lima','Lima','Surquillo',-12.1158,-77.0186,'distrito'),
  ('150142','Lima','Lima','Villa El Salvador',-12.2133,-76.9389,'distrito'),
  ('150143','Lima','Lima','Villa María del Triunfo',-12.1683,-76.9408,'distrito'),

  -- Callao (provincia 0701)
  ('070101','Callao','Callao','Callao',-12.0566,-77.1181,'distrito'),
  ('070102','Callao','Callao','Bellavista',-12.0631,-77.1294,'distrito'),
  ('070103','Callao','Callao','Carmen de la Legua-Reynoso',-12.0431,-77.1014,'distrito'),
  ('070104','Callao','Callao','La Perla',-12.0717,-77.1217,'distrito'),
  ('070105','Callao','Callao','La Punta',-12.0719,-77.1664,'distrito'),
  ('070106','Callao','Callao','Ventanilla',-11.8836,-77.1300,'distrito'),
  ('070107','Callao','Callao','Mi Perú',-11.8556,-77.1389,'distrito'),

  -- Arequipa
  ('040101','Arequipa','Arequipa','Arequipa',-16.4090,-71.5375,'distrito'),
  ('040128','Arequipa','Arequipa','Cayma',-16.3886,-71.5483,'distrito'),
  ('040129','Arequipa','Arequipa','Cerro Colorado',-16.3781,-71.5764,'distrito'),
  ('040130','Arequipa','Arequipa','José Luis Bustamante y Rivero',-16.4275,-71.5314,'distrito'),
  ('040131','Arequipa','Arequipa','Yanahuara',-16.3956,-71.5469,'distrito'),

  -- Trujillo (La Libertad)
  ('130101','La Libertad','Trujillo','Trujillo',-8.1090,-79.0215,'distrito'),
  ('130103','La Libertad','Trujillo','Florencia de Mora',-8.0772,-79.0331,'distrito'),
  ('130104','La Libertad','Trujillo','Huanchaco',-8.0828,-79.1208,'distrito'),
  ('130105','La Libertad','Trujillo','La Esperanza',-8.0850,-79.0306,'distrito'),
  ('130108','La Libertad','Trujillo','Víctor Larco Herrera',-8.1361,-79.0394,'distrito'),

  -- Chiclayo (Lambayeque)
  ('140101','Lambayeque','Chiclayo','Chiclayo',-6.7714,-79.8409,'distrito'),
  ('140104','Lambayeque','Chiclayo','José Leonardo Ortiz',-6.7611,-79.8483,'distrito'),
  ('140105','Lambayeque','Chiclayo','La Victoria',-6.7958,-79.8364,'distrito'),

  -- Piura
  ('200101','Piura','Piura','Piura',-5.1945,-80.6328,'distrito'),
  ('200104','Piura','Piura','Castilla',-5.1989,-80.6181,'distrito'),

  -- Cusco
  ('080101','Cusco','Cusco','Cusco',-13.5183,-71.9783,'distrito'),
  ('080102','Cusco','Cusco','San Sebastián',-13.5278,-71.9483,'distrito'),
  ('080109','Cusco','Cusco','Wanchaq',-13.5306,-71.9656,'distrito'),

  -- Iquitos (Loreto)
  ('160101','Loreto','Maynas','Iquitos',-3.7437,-73.2516,'distrito'),

  -- Huancayo (Junín)
  ('120101','Junín','Huancayo','Huancayo',-12.0653,-75.2049,'distrito'),

  -- Tarapoto (San Martín)
  ('220901','San Martín','San Martín','Tarapoto',-6.4858,-76.3700,'distrito')
on conflict (codigo) do update
  set distrito = excluded.distrito,
      latitud  = excluded.latitud,
      longitud = excluded.longitud;

-- ---------------------------------------------------------------------
-- Columnas de ubicación en proyectos
-- ---------------------------------------------------------------------
alter table public.proyectos
  add column if not exists ubigeo_codigo  text references public.ubigeos(codigo) on delete set null,
  add column if not exists departamento   text,
  add column if not exists provincia      text,
  add column if not exists distrito       text,
  add column if not exists direccion      text;

create index if not exists idx_proyectos_ubigeo on public.proyectos (ubigeo_codigo);
