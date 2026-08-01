import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { LOGO_DATA_URI } from '@/lib/brand-logo';

const AZUR = '#E20627';
const INK = '#1a1a1a';
const s = StyleSheet.create({
  page: { paddingHorizontal: 34, paddingTop: 22, paddingBottom: 42, fontSize: 9, fontFamily: 'Helvetica', color: INK },
  topbar: { height: 5, backgroundColor: AZUR, borderRadius: 2, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: AZUR, paddingBottom: 10, marginBottom: 12 },
  logoBox: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#eee' },
  logo: { width: 42, height: 42, objectFit: 'contain' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: AZUR },
  brandSub: { fontSize: 6.5, color: '#666', letterSpacing: 1.5 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: AZUR, textAlign: 'right' },
  fecha: { fontSize: 8.5, color: '#444', textAlign: 'right', marginTop: 2, fontFamily: 'Helvetica-Bold' },
  chip: { alignSelf: 'flex-end', marginTop: 4, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, fontSize: 7.5, fontFamily: 'Helvetica-Bold' },

  // Datos generales (cuadro con borde, celdas etiqueta/valor)
  grid: { borderWidth: 1, borderColor: '#dcdcdc', borderRadius: 3, marginBottom: 12 },
  gRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  gRowLast: { flexDirection: 'row' },
  gLabel: { width: 90, backgroundColor: '#f5f5f5', paddingVertical: 5, paddingHorizontal: 6, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#555' },
  gVal: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8.5, borderRightWidth: 1, borderRightColor: '#eee' },
  gValLast: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8.5 },

  // Título de sección con barra roja
  secWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 4 },
  secBar: { width: 3.5, height: 12, backgroundColor: AZUR, borderRadius: 2 },
  secTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10.5, color: AZUR },

  // Tabla actividades
  thead: { flexDirection: 'row', backgroundColor: AZUR, paddingVertical: 5, paddingHorizontal: 6 },
  th: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 5, paddingHorizontal: 6, alignItems: 'center' },
  trAlt: { backgroundColor: '#fafafa' },
  cAct: { width: '30%', fontFamily: 'Helvetica-Bold' }, cPart: { width: '42%', color: '#333' },
  cAv: { width: '14%', textAlign: 'right', color: AZUR, fontFamily: 'Helvetica-Bold' }, cEst: { width: '14%', textAlign: 'center' },
  cell: { fontSize: 8 },
  estBadge: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', paddingVertical: 1.5, paddingHorizontal: 3, borderRadius: 2, textAlign: 'center' },

  // Reporte fotográfico
  fotosWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  fotoCard: { width: '48.5%', borderWidth: 1, borderColor: '#dcdcdc', borderRadius: 4, padding: 6, marginBottom: 8 },
  foto: { width: '100%', height: 150, objectFit: 'cover', borderRadius: 3, backgroundColor: '#f2f2f2' },
  fotoTit: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: AZUR, marginTop: 5 },
  fotoDesc: { fontSize: 7.5, color: '#555', marginTop: 2 },

  // Sección 3 (programación / observaciones)
  box3: { borderWidth: 1, borderColor: '#dcdcdc', borderLeftWidth: 3, borderLeftColor: AZUR, borderRadius: 3, padding: 8, marginBottom: 4 },
  box3Tit: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  bullet: { flexDirection: 'row', marginBottom: 2 },
  bulletDot: { width: 10, fontSize: 8.5, color: AZUR },
  bulletTxt: { flex: 1, fontSize: 8.5 },

  obsBox: { borderWidth: 1, borderColor: '#f0c9d1', backgroundColor: '#fbe9ec', borderRadius: 3, padding: 8, marginTop: 6 },

  firmas: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30 },
  firmaCol: { alignItems: 'center', width: 210 },
  firmaLinea: { borderTopWidth: 1, borderTopColor: '#333', width: 190, marginBottom: 4 },
  firmaNom: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  firmaRol: { fontSize: 7.5, color: '#666' },
  footer: { position: 'absolute', bottom: 20, left: 34, right: 34, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
  footerTxt: { fontSize: 7, color: '#999' },
});

const CHIP_ESTADO: Record<string, { bg: string; color: string; label: string }> = {
  borrador: { bg: '#f0f0f0', color: '#666', label: 'BORRADOR' },
  enviado: { bg: '#e0f2fe', color: '#0369a1', label: 'PENDIENTE DE APROBACIÓN' },
  aprobado: { bg: '#dcfce7', color: '#15803d', label: 'APROBADO' },
  observado: { bg: '#fee2e2', color: '#b91c1c', label: 'OBSERVADO' },
};

// Estado por actividad: usa el capturado o lo deriva del avance.
function estadoActividad(estado: string | undefined, pct: number | null): { label: string; bg: string; color: string } {
  const e = (estado || '').toLowerCase();
  if (e.includes('complet') || (!estado && pct != null && pct >= 1)) return { label: 'COMPLETADO', bg: '#dcfce7', color: '#15803d' };
  if (e.includes('inici') || (!estado && (pct == null || pct <= 0))) return { label: estado ? 'INICIADO' : 'PENDIENTE', bg: '#fef3c7', color: '#a16207' };
  return { label: 'EN EJECUCIÓN', bg: '#fde8ea', color: AZUR };
}

export interface RdoActividadPdf { actividad: string; partida?: string; avancePct: number | null; estado?: string }
export interface RdoPdfData {
  proyecto: string; ubicacion?: string; codigo: string; cliente?: string; fecha: string; estado: string;
  residente?: string; residenteCip?: string; residenteFirma?: string;
  supervisor?: string; supervisorCip?: string; supervisorFirma?: string;
  jornada?: string; personal?: number | null; programacion?: string;
  observaciones?: string; incidencias?: string; obsRevision?: string; revisadoFecha?: string;
  actividades: RdoActividadPdf[];
  fotos: { url: string; descripcion?: string }[];
}

export function RdoPDF({ d }: { d: RdoPdfData }) {
  const chip = CHIP_ESTADO[d.estado] ?? CHIP_ESTADO.borrador;
  const conNombreCip = (n?: string, cip?: string) => (n ? `${n}${cip ? ` (CIP ${cip})` : ''}` : '—');
  const progLineas = (d.programacion || '').split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <Document title={`Reporte Diario de Obra — ${d.codigo} — ${d.fecha}`}>
      <Page size="A4" style={s.page}>
        <View style={s.topbar} fixed />
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View><Text style={s.brand}>Azur</Text><Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text></View>
          </View>
          <View>
            <Text style={s.title}>REPORTE DIARIO DE OBRA</Text>
            <Text style={s.fecha}>Fecha: {d.fecha}</Text>
            {d.estado !== 'aprobado' && <Text style={[s.chip, { backgroundColor: chip.bg, color: chip.color }]}>{chip.label}</Text>}
          </View>
        </View>

        {/* Datos generales */}
        <View style={s.grid}>
          <View style={s.gRow}>
            <Text style={s.gLabel}>PROYECTO</Text><Text style={s.gVal}>{d.proyecto}</Text>
            <Text style={s.gLabel}>UBICACIÓN</Text><Text style={s.gValLast}>{d.ubicacion || '—'}</Text>
          </View>
          <View style={s.gRow}>
            <Text style={s.gLabel}>RESIDENTE</Text><Text style={s.gVal}>{conNombreCip(d.residente, d.residenteCip)}</Text>
            <Text style={s.gLabel}>SUPERVISOR</Text><Text style={s.gValLast}>{conNombreCip(d.supervisor, d.supervisorCip)}</Text>
          </View>
          <View style={s.gRowLast}>
            <Text style={s.gLabel}>JORNADA</Text><Text style={s.gVal}>{d.jornada || '—'}</Text>
            <Text style={s.gLabel}>PERSONAL{'\n'}EN OBRA</Text><Text style={s.gValLast}>{d.personal != null ? `${d.personal} trabajadores` : '—'}</Text>
          </View>
        </View>

        {/* 1. Actividades */}
        <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>1. AVANCE DIARIO POR ACTIVIDADES / PARTIDAS</Text></View>
        <View style={s.thead}>
          <Text style={[s.cAct, s.th]}>ACTIVIDAD</Text>
          <Text style={[s.cPart, s.th]}>PARTIDA</Text>
          <Text style={[s.cAv, s.th]}>AVANCE DIARIO</Text>
          <Text style={[s.cEst, s.th]}>ESTADO</Text>
        </View>
        {d.actividades.length === 0 ? (
          <View style={s.tr}><Text style={s.cell}>Sin actividades registradas.</Text></View>
        ) : d.actividades.map((a, i) => {
          const est = estadoActividad(a.estado, a.avancePct);
          return (
            <View key={i} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
              <Text style={[s.cell, s.cAct]}>{a.actividad}</Text>
              <Text style={[s.cell, s.cPart]}>{a.partida ?? '—'}</Text>
              <Text style={[s.cell, s.cAv]}>{a.avancePct == null ? '—' : `+${(a.avancePct * 100).toFixed(1)}%`}</Text>
              <View style={s.cEst}><Text style={[s.estBadge, { backgroundColor: est.bg, color: est.color }]}>{est.label}</Text></View>
            </View>
          );
        })}

        {/* 2. Reporte fotográfico */}
        <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>2. REPORTE FOTOGRÁFICO DE CAMPO</Text></View>
        {d.fotos.length === 0 ? (
          <Text style={{ fontSize: 8, color: '#888', marginBottom: 6 }}>Sin registro fotográfico en este reporte.</Text>
        ) : (
          <View style={s.fotosWrap}>
            {d.fotos.map((f, i) => (
              <View key={i} style={s.fotoCard} wrap={false}>
                <Image src={f.url} style={s.foto} />
                <Text style={s.fotoTit}>REG-{String(i + 1).padStart(2, '0')}</Text>
                {f.descripcion ? <Text style={s.fotoDesc}>{f.descripcion}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* 3. Programación y observaciones */}
        <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>3. PROGRAMACIÓN PARA LA SIGUIENTE JORNADA Y OBSERVACIONES</Text></View>
        <View style={s.box3} wrap={false}>
          {progLineas.length > 0 ? (
            <>
              <Text style={s.box3Tit}>Plan de trabajo programado:</Text>
              {progLineas.map((l, i) => (
                <View key={i} style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletTxt}>{l}</Text></View>
              ))}
            </>
          ) : null}
          {d.observaciones ? <Text style={{ fontSize: 8.5, marginTop: progLineas.length ? 6 : 0 }}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Observaciones: </Text>{d.observaciones}</Text> : null}
          {d.incidencias ? <Text style={{ fontSize: 8.5, color: AZUR, marginTop: 3 }}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Incidencias: </Text>{d.incidencias}</Text> : null}
          {!progLineas.length && !d.observaciones && !d.incidencias ? <Text style={{ fontSize: 8, color: '#888' }}>Sin observaciones registradas.</Text> : null}
        </View>

        {d.obsRevision ? (
          <View style={s.obsBox}><Text style={{ fontSize: 8.5, color: '#b91c1c' }}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Observación del jefe de proyectos: </Text>{d.obsRevision}</Text></View>
        ) : null}

        {/* Firmas */}
        <View wrap={false} style={s.firmas}>
          <View style={s.firmaCol}>
            {d.residenteFirma ? <Image src={d.residenteFirma} style={{ height: 40, width: 150, objectFit: 'contain' }} /> : <View style={{ height: 40 }} />}
            <View style={s.firmaLinea} />
            <Text style={s.firmaNom}>{d.residente ?? ''}</Text>
            <Text style={s.firmaRol}>RESIDENTE DE OBRA{d.residenteCip ? ` · CIP ${d.residenteCip}` : ''}</Text>
          </View>
          <View style={s.firmaCol}>
            {d.estado === 'aprobado' && d.supervisorFirma ? <Image src={d.supervisorFirma} style={{ height: 40, width: 150, objectFit: 'contain' }} /> : <View style={{ height: 40 }} />}
            <View style={s.firmaLinea} />
            <Text style={s.firmaNom}>{d.estado === 'aprobado' ? (d.supervisor ?? '') : ' '}</Text>
            <Text style={s.firmaRol}>{d.estado === 'aprobado' ? `SUPERVISIÓN DE OBRA${d.supervisorCip ? ` · CIP ${d.supervisorCip}` : ''}${d.revisadoFecha ? ` · ${d.revisadoFecha}` : ''}` : 'PENDIENTE DE APROBACIÓN'}</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>Azur Constructora e Inmobiliaria | Reporte Diario de Obra · {d.codigo}</Text>
          <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
