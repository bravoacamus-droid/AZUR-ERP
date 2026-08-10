import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { LOGO_DATA_URI } from '@/lib/brand-logo';

const AZUR = '#C02128';
const s = StyleSheet.create({
  page: { paddingHorizontal: 34, paddingTop: 22, paddingBottom: 42, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  topbar: { height: 5, backgroundColor: AZUR, borderRadius: 2, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: AZUR, paddingBottom: 10, marginBottom: 12 },
  logoBox: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#eee' },
  logo: { width: 42, height: 42, objectFit: 'contain' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: AZUR },
  brandSub: { fontSize: 6.5, color: '#666', letterSpacing: 1.5 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', textAlign: 'right' },
  fecha: { fontSize: 8.5, color: '#444', textAlign: 'right', marginTop: 2, fontFamily: 'Helvetica-Bold' },
  grid: { borderWidth: 1, borderColor: '#dcdcdc', borderRadius: 3, marginBottom: 12 },
  gRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  gRowLast: { flexDirection: 'row' },
  gLabel: { width: 90, backgroundColor: '#f5f5f5', paddingVertical: 5, paddingHorizontal: 6, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#555' },
  gVal: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8.5, borderRightWidth: 1, borderRightColor: '#eee' },
  gValLast: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8.5 },
  secWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 8 },
  secBar: { width: 3.5, height: 12, backgroundColor: AZUR, borderRadius: 2 },
  secTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10.5, color: AZUR },
  thead: { flexDirection: 'row', backgroundColor: AZUR, paddingVertical: 5, paddingHorizontal: 6 },
  th: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 5, paddingHorizontal: 6, alignItems: 'center' },
  trAlt: { backgroundColor: '#fafafa' },
  cell: { fontSize: 8 },
  // sección avance
  cAct: { width: '34%', fontFamily: 'Helvetica-Bold' }, cPart: { width: '48%', color: '#333' }, cAv: { width: '18%', textAlign: 'right', color: AZUR, fontFamily: 'Helvetica-Bold' },
  // sección días
  dFecha: { width: '24%' }, dResid: { width: '34%', color: '#333' }, dAct: { width: '16%', textAlign: 'center' }, dPers: { width: '13%', textAlign: 'center' }, dEst: { width: '13%', textAlign: 'center' },
  fotosWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  fotoCard: { width: '32%', borderWidth: 1, borderColor: '#dcdcdc', borderRadius: 4, padding: 5, marginBottom: 8 },
  foto: { width: '100%', height: 95, objectFit: 'cover', borderRadius: 3, backgroundColor: '#f2f2f2' },
  fotoCap: { fontSize: 6.5, color: '#555', marginTop: 3 },
  fotoFecha: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#444', marginTop: 2 },
  nota: { marginBottom: 3, fontSize: 8 },
  footer: { position: 'absolute', bottom: 20, left: 34, right: 34, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
  footerTxt: { fontSize: 7, color: '#999' },
});

export interface ConsolidadoData {
  proyecto: string; ubicacion?: string; codigo: string; desde: string; hasta: string; nReportes: number; residentes?: string;
  supervisor?: string;
  estadoFiltro?: string;
  partidas: { actividad: string; partida?: string; avanceAcum: number }[];
  dias: { fecha: string; residente?: string; nActividades: number; personal?: number | null; estado: string }[];
  fotos: { url: string; descripcion?: string; fecha: string }[];
  notas: { fecha: string; observaciones?: string; incidencias?: string }[];
}

const ESTADO_LBL: Record<string, string> = { borrador: 'Borrador', enviado: 'Enviado a revisión', aprobado: 'Aprobado', observado: 'Observado' };

export function RdoConsolidadoPDF({ d }: { d: ConsolidadoData }) {
  // El resumen diario es opcional (uso interno). La numeración de secciones se
  // ajusta según se incluya o no.
  const mostrarResumen = d.dias.length > 0;
  const nFotos = mostrarResumen ? 3 : 2;
  const nObs = mostrarResumen ? 4 : 3;
  return (
    <Document title={`Reporte consolidado — ${d.codigo} — ${d.desde} al ${d.hasta}`}>
      <Page size="A4" style={s.page}>
        <View style={s.topbar} fixed />
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View><Text style={s.brand}>Azur</Text><Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text></View>
          </View>
          <View>
            <Text style={s.title}>REPORTE CONSOLIDADO DE OBRA</Text>
            <Text style={s.fecha}>Del {d.desde} al {d.hasta}{d.estadoFiltro && d.estadoFiltro !== 'Todos' ? ` · ${d.estadoFiltro}` : ''}</Text>
          </View>
        </View>

        <View style={s.grid}>
          <View style={s.gRow}>
            <Text style={s.gLabel}>PROYECTO</Text><Text style={s.gVal}>{d.proyecto}</Text>
            <Text style={s.gLabel}>UBICACIÓN</Text><Text style={s.gValLast}>{d.ubicacion || '—'}</Text>
          </View>
          <View style={s.gRowLast}>
            <Text style={s.gLabel}>RESIDENTE(S)</Text><Text style={s.gVal}>{d.residentes || '—'}</Text>
            <Text style={s.gLabel}>SUPERVISOR</Text><Text style={s.gValLast}>{d.supervisor || '—'}</Text>
          </View>
        </View>

        {/* Avance acumulado por partida */}
        <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>1. AVANCE ACUMULADO DEL PERIODO POR ACTIVIDAD / PARTIDA</Text></View>
        <View style={s.thead}>
          <Text style={[s.cAct, s.th]}>ACTIVIDAD</Text>
          <Text style={[s.cPart, s.th]}>PARTIDA</Text>
          <Text style={[s.cAv, s.th]}>AVANCE ACUM.</Text>
        </View>
        {d.partidas.length === 0 ? (
          <View style={s.tr}><Text style={s.cell}>Sin actividades en el periodo.</Text></View>
        ) : d.partidas.map((p, i) => (
          <View key={i} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
            <Text style={[s.cell, s.cAct]}>{p.actividad}</Text>
            <Text style={[s.cell, s.cPart]}>{p.partida ?? '—'}</Text>
            <Text style={[s.cell, s.cAv]}>+{(p.avanceAcum * 100).toFixed(1)}%</Text>
          </View>
        ))}

        {/* Resumen por día (opcional · uso interno) */}
        {mostrarResumen && (
          <>
            <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>2. RESUMEN DIARIO DEL PERIODO (uso interno)</Text></View>
            <View style={s.thead}>
              <Text style={[s.dFecha, s.th]}>FECHA</Text>
              <Text style={[s.dResid, s.th]}>RESIDENTE</Text>
              <Text style={[s.dAct, s.th]}>ACTIVID.</Text>
              <Text style={[s.dPers, s.th]}>PERSONAL</Text>
              <Text style={[s.dEst, s.th]}>ESTADO</Text>
            </View>
            {d.dias.map((r, i) => (
              <View key={i} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
                <Text style={[s.cell, s.dFecha]}>{r.fecha}</Text>
                <Text style={[s.cell, s.dResid]}>{r.residente ?? '—'}</Text>
                <Text style={[s.cell, s.dAct]}>{r.nActividades}</Text>
                <Text style={[s.cell, s.dPers]}>{r.personal ?? '—'}</Text>
                <Text style={[s.cell, s.dEst]}>{ESTADO_LBL[r.estado] ?? r.estado}</Text>
              </View>
            ))}
          </>
        )}

        {/* Registro fotográfico consolidado */}
        <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>{nFotos}. REGISTRO FOTOGRÁFICO DEL PERIODO</Text></View>
        {d.fotos.length === 0 ? (
          <Text style={{ fontSize: 8, color: '#888' }}>Sin fotografías en el periodo.</Text>
        ) : (
          <View style={s.fotosWrap}>
            {d.fotos.map((f, i) => (
              <View key={i} style={s.fotoCard} wrap={false}>
                <Image src={f.url} style={s.foto} />
                <Text style={s.fotoFecha}>{f.fecha}</Text>
                {f.descripcion ? <Text style={s.fotoCap}>{f.descripcion}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Observaciones e incidencias */}
        {d.notas.length > 0 && (
          <>
            <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>{nObs}. OBSERVACIONES E INCIDENCIAS DEL PERIODO</Text></View>
            {d.notas.map((n, i) => (
              <View key={i} wrap={false}>
                {n.observaciones ? <Text style={s.nota}><Text style={{ fontFamily: 'Helvetica-Bold' }}>{n.fecha}: </Text>{n.observaciones}</Text> : null}
                {n.incidencias ? <Text style={[s.nota, { color: AZUR }]}><Text style={{ fontFamily: 'Helvetica-Bold' }}>{n.fecha} (incidencia): </Text>{n.incidencias}</Text> : null}
              </View>
            ))}
          </>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>Azur Constructora e Inmobiliaria | Reporte consolidado · {d.codigo}</Text>
          <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
