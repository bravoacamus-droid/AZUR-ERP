import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { LOGO_DATA_URI } from '@/lib/brand-logo';
import { rolLabel } from '@/lib/roles';

const AZUR = '#E20627';
const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: AZUR, paddingBottom: 10, marginBottom: 12 },
  logoBox: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#eee' },
  logo: { width: 44, height: 44, objectFit: 'contain' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: AZUR },
  brandSub: { fontSize: 7, color: '#666', letterSpacing: 2 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  meta: { fontSize: 8, color: '#444', textAlign: 'right', marginTop: 2 },
  estado: { alignSelf: 'flex-end', marginTop: 3, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: AZUR, marginBottom: 4, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 4 },
  gcell: { width: '50%', paddingVertical: 4, paddingHorizontal: 8 },
  gk: { fontSize: 7.5, color: '#888', textTransform: 'uppercase' },
  gv: { fontSize: 9 },
  thead: { flexDirection: 'row', backgroundColor: AZUR, paddingVertical: 4, paddingHorizontal: 4 },
  th: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 3, paddingHorizontal: 4 },
  trAlt: { backgroundColor: '#f6f6f6' },
  cCod: { width: 42 }, cAct: { flex: 1 }, cPart: { width: 150 }, cPct: { width: 50, textAlign: 'right' },
  cell: { fontSize: 8 },
  obsBox: { borderWidth: 1, borderColor: '#f0c9d1', backgroundColor: '#fbe9ec', borderRadius: 4, padding: 8, marginTop: 6 },
  fotosWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  fotoBox: { width: 168, marginBottom: 6 },
  foto: { width: 168, height: 120, objectFit: 'cover', borderRadius: 4, borderWidth: 1, borderColor: '#e5e5e5' },
  fotoCap: { fontSize: 7, color: '#666', marginTop: 2 },
  firmas: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 28 },
  firmaCol: { alignItems: 'center', width: 200 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 7, color: '#999', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
});

const ESTADO_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  borrador: { bg: '#f0f0f0', color: '#666', label: 'BORRADOR' },
  enviado: { bg: '#e0f2fe', color: '#0369a1', label: 'ENVIADO · PENDIENTE DE APROBACIÓN' },
  aprobado: { bg: '#dcfce7', color: '#15803d', label: 'APROBADO' },
  observado: { bg: '#fee2e2', color: '#b91c1c', label: 'OBSERVADO' },
};

export interface RdoPdfData {
  proyecto: string; codigo: string; cliente?: string; fecha: string; estado: string;
  residente?: string; residenteFirma?: string; jefe?: string; jefeFirma?: string;
  revisadoFecha?: string; obsRevision?: string;
  clima?: string; personal?: number | null; equipos?: string; materiales?: string; observaciones?: string; incidencias?: string;
  actividades: { codigo: string; titulo?: string; descripcion: string; avancePct: number | null }[];
  fotos: { url: string; descripcion?: string }[];
}

export function RdoPDF({ d }: { d: RdoPdfData }) {
  const est = ESTADO_STYLE[d.estado] ?? ESTADO_STYLE.borrador;
  const dato = (k: string, v?: string | number | null) => (
    <View style={s.gcell}><Text style={s.gk}>{k}</Text><Text style={s.gv}>{v === null || v === undefined || v === '' ? '—' : String(v)}</Text></View>
  );
  return (
    <Document title={`Reporte de obra — ${d.codigo} — ${d.fecha}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View><Text style={s.brand}>AZUR</Text><Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text></View>
          </View>
          <View>
            <Text style={s.title}>REPORTE DE OBRA</Text>
            <Text style={[s.meta, { fontFamily: 'Helvetica-Bold', color: '#1a1a1a' }]}>{d.proyecto}</Text>
            <Text style={s.meta}>{d.codigo} · {d.fecha}</Text>
            {d.cliente ? <Text style={s.meta}>Cliente: {d.cliente}</Text> : null}
            <Text style={[s.estado, { backgroundColor: est.bg, color: est.color }]}>{est.label}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Datos generales</Text>
        <View style={s.grid}>
          {dato('Residente / Coordinador', d.residente)}
          {dato('Fecha', d.fecha)}
          {dato('Clima', d.clima)}
          {dato('Personal en obra', d.personal ?? undefined)}
          {dato('Equipos', d.equipos)}
          {dato('Materiales recibidos', d.materiales)}
        </View>

        <Text style={s.sectionTitle}>Actividades y avance</Text>
        <View style={s.thead}>
          <Text style={[s.th, s.cCod]}>ÍTEM</Text>
          <Text style={[s.th, s.cAct]}>ACTIVIDAD</Text>
          <Text style={[s.th, s.cPart]}>PARTIDA</Text>
          <Text style={[s.th, s.cPct]}>% AVANCE</Text>
        </View>
        {d.actividades.length === 0 ? (
          <View style={s.tr}><Text style={s.cell}>Sin actividades registradas.</Text></View>
        ) : d.actividades.map((a, i) => (
          <View key={i} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
            <Text style={[s.cell, s.cCod]}>{a.codigo || '—'}</Text>
            <Text style={[s.cell, s.cAct]}>{a.descripcion}</Text>
            <Text style={[s.cell, s.cPart]}>{a.titulo ?? '—'}</Text>
            <Text style={[s.cell, s.cPct]}>{a.avancePct == null ? '—' : `${Math.round(a.avancePct * 100)}%`}</Text>
          </View>
        ))}

        {(d.observaciones || d.incidencias) ? (
          <>
            <Text style={s.sectionTitle}>Observaciones e incidencias</Text>
            {d.observaciones ? <Text style={{ fontSize: 8.5, marginBottom: 3 }}>• {d.observaciones}</Text> : null}
            {d.incidencias ? <Text style={{ fontSize: 8.5, color: AZUR }}>⚠ {d.incidencias}</Text> : null}
          </>
        ) : null}

        {d.obsRevision ? (
          <View style={s.obsBox}><Text style={{ fontSize: 8.5, color: '#b91c1c' }}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Observación del jefe de proyectos: </Text>{d.obsRevision}</Text></View>
        ) : null}

        {d.fotos.length > 0 ? (
          <>
            <Text style={s.sectionTitle}>Registro fotográfico</Text>
            <View style={s.fotosWrap}>
              {d.fotos.map((f, i) => (
                <View key={i} style={s.fotoBox} wrap={false}>
                  <Image src={f.url} style={s.foto} />
                  {f.descripcion ? <Text style={s.fotoCap}>{f.descripcion}</Text> : null}
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View wrap={false} style={s.firmas}>
          <View style={s.firmaCol}>
            {d.residenteFirma ? <Image src={d.residenteFirma} style={{ height: 44, width: 150, objectFit: 'contain' }} /> : <View style={{ height: 44 }} />}
            <View style={{ borderTopWidth: 1, borderTopColor: '#333', width: 170, marginBottom: 4 }} />
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{d.residente ?? ''}</Text>
            <Text style={{ fontSize: 8, color: '#666' }}>Elaborado por · Residente / Coordinador</Text>
          </View>
          <View style={s.firmaCol}>
            {d.estado === 'aprobado' && d.jefeFirma ? <Image src={d.jefeFirma} style={{ height: 44, width: 150, objectFit: 'contain' }} /> : <View style={{ height: 44 }} />}
            <View style={{ borderTopWidth: 1, borderTopColor: '#333', width: 170, marginBottom: 4 }} />
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{d.estado === 'aprobado' ? (d.jefe ?? '') : ' '}</Text>
            <Text style={{ fontSize: 8, color: '#666' }}>{d.estado === 'aprobado' ? `Aprobado por · Jefe de Proyectos${d.revisadoFecha ? ` · ${d.revisadoFecha}` : ''}` : 'Pendiente de aprobación'}</Text>
          </View>
        </View>

        <Text style={s.footer} fixed>AZUR Constructora e Inmobiliaria · Reporte de obra · {d.codigo} · {d.fecha}</Text>
      </Page>
    </Document>
  );
}
