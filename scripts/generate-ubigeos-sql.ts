/**
 * Convierte los CSVs de UBIGEO Perú (jmcastagnetto/ubigeo-peru-aumentado)
 * a una migración SQL idempotente para nuestra tabla public.ubigeos.
 *
 * Uso (después de descargar /tmp/dep.csv /tmp/prov.csv /tmp/dist.csv):
 *   pnpm tsx scripts/generate-ubigeos-sql.ts
 *
 * Genera: supabase/migrations/0017_ubigeos_full.sql
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'supabase', 'migrations', '0017_ubigeos_full.sql');

type Row = Record<string, string>;

function parseCsv(filePath: string): Row[] {
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines.shift()!.split(',');
  return lines.map((line) => {
    // CSV simple (sin campos con comas escapadas en estos archivos)
    const cols = line.split(',');
    const row: Row = {};
    header.forEach((h, i) => (row[h.trim()] = (cols[i] ?? '').trim()));
    return row;
  });
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w[0]!.toUpperCase() + w.slice(1)))
    .join(' ');
}

function sqlEscape(s: string): string {
  return s.replace(/'/g, "''");
}

function numOrNull(s: string): string {
  if (!s || s === '' || s === 'NA' || s === 'NULL') return 'NULL';
  const n = Number(s);
  return Number.isFinite(n) ? n.toFixed(7) : 'NULL';
}

const TMP = path.join(ROOT, '.tmp');
const dep = parseCsv(path.join(TMP, 'dep.csv'));
const prov = parseCsv(path.join(TMP, 'prov.csv'));
const dist = parseCsv(path.join(TMP, 'dist.csv'));

console.log(`Leídos: ${dep.length} departamentos, ${prov.length} provincias, ${dist.length} distritos`);

// Map of dept codes (2 dígitos) to titleCase name (para usar en provincias y distritos)
const depCodeToName = new Map<string, string>();
for (const d of dep) {
  const code2 = d.inei!.slice(0, 2);
  depCodeToName.set(code2, titleCase(d.departamento!));
}

const lines: string[] = [];
lines.push('-- =====================================================================');
lines.push('-- AZUR ERP · Migration 0017 — Seed COMPLETO de UBIGEOS Perú');
lines.push('-- Fuente: jmcastagnetto/ubigeo-peru-aumentado (INEI 2019)');
lines.push('-- 25 departamentos + 196 provincias + 1895 distritos con lat/lon');
lines.push('-- =====================================================================');
lines.push('');
lines.push('-- Limpiar referencias previas en proyectos (códigos de 2 dígitos del seed v1)');
lines.push("update public.proyectos set ubigeo_codigo = null where ubigeo_codigo is not null and char_length(ubigeo_codigo) < 6;");
lines.push('');
lines.push('-- Borrar seed anterior (códigos cortos)');
lines.push("delete from public.ubigeos where char_length(codigo) < 6;");
lines.push('');

// Departamentos: usamos 6 dígitos (010000, 020000, ...)
lines.push('-- Departamentos (25)');
const depValues: string[] = [];
for (const d of dep) {
  const codigo = d.inei!;
  const departamento = titleCase(d.departamento!);
  const lat = numOrNull(d.latitude!);
  const lon = numOrNull(d.longitude!);
  depValues.push(`('${codigo}', '${sqlEscape(departamento)}', '', '', ${lat}, ${lon}, 'departamento')`);
}
lines.push(`insert into public.ubigeos (codigo, departamento, provincia, distrito, latitud, longitud, tipo) values`);
lines.push(depValues.join(',\n'));
lines.push(`on conflict (codigo) do update set departamento = excluded.departamento, latitud = excluded.latitud, longitud = excluded.longitud, tipo = 'departamento';`);
lines.push('');

// Provincias (insert en lotes de 100)
lines.push('-- Provincias (196)');
const provValues: string[] = [];
for (const p of prov) {
  const codigo = p.inei!;
  const code2 = codigo.slice(0, 2);
  const dep = depCodeToName.get(code2) ?? titleCase(p.departamento!);
  const provincia = titleCase(p.provincia!);
  const lat = numOrNull(p.latitude!);
  const lon = numOrNull(p.longitude!);
  provValues.push(`('${codigo}', '${sqlEscape(dep)}', '${sqlEscape(provincia)}', '', ${lat}, ${lon}, 'provincia')`);
}
// Una sola inserción
lines.push(`insert into public.ubigeos (codigo, departamento, provincia, distrito, latitud, longitud, tipo) values`);
lines.push(provValues.join(',\n'));
lines.push(`on conflict (codigo) do update set departamento = excluded.departamento, provincia = excluded.provincia, latitud = excluded.latitud, longitud = excluded.longitud, tipo = 'provincia';`);
lines.push('');

// Distritos (insert en lotes de ~500 para evitar SQL gigante)
lines.push('-- Distritos (1895) — en lotes');
const distValues: string[] = [];
for (const d of dist) {
  const codigo = d.inei!;
  const code2 = codigo.slice(0, 2);
  const dep = depCodeToName.get(code2) ?? titleCase(d.departamento!);
  const provincia = titleCase(d.provincia!);
  const distrito = titleCase(d.distrito!);
  const lat = numOrNull(d.latitude!);
  const lon = numOrNull(d.longitude!);
  distValues.push(`('${codigo}', '${sqlEscape(dep)}', '${sqlEscape(provincia)}', '${sqlEscape(distrito)}', ${lat}, ${lon}, 'distrito')`);
}

const CHUNK = 500;
for (let i = 0; i < distValues.length; i += CHUNK) {
  const slice = distValues.slice(i, i + CHUNK);
  lines.push(`-- Lote ${Math.floor(i / CHUNK) + 1}`);
  lines.push(`insert into public.ubigeos (codigo, departamento, provincia, distrito, latitud, longitud, tipo) values`);
  lines.push(slice.join(',\n'));
  lines.push(`on conflict (codigo) do update set departamento = excluded.departamento, provincia = excluded.provincia, distrito = excluded.distrito, latitud = excluded.latitud, longitud = excluded.longitud, tipo = 'distrito';`);
  lines.push('');
}

const sql = lines.join('\n');
writeFileSync(OUT, sql, 'utf8');
console.log(`✓ Generado ${OUT} (${(sql.length / 1024).toFixed(1)} KB)`);
