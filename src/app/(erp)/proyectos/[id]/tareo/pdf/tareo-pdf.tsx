import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { LOGO_DATA_URI } from '@/lib/brand-logo';

const AZUR = '#C02128';
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const s = StyleSheet.create({
  page: { paddingHorizontal: 28, paddingTop: 22, paddingBottom: 42, fontSize: 8, fontFamily: 'Helvetica', color: '#1a1a1a' },
  topbar: { height: 5, backgroundColor: AZUR, borderRadius: 2, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: AZUR, paddingBottom: 10, marginBottom: 12 },
  logoBox: { width: 46, height: 46, backgroundColor: '#fff', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#eee' },
  logo: { width: 40, height: 40, objectFit: 'contain' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: AZUR },
  brandSub: { fontSize: 6.5, color: '#666', letterSpacing: 1.5 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: AZUR, textAlign: 'right' },
  fecha: { fontSize: 8.5, color: '#444', textAlign: 'right', marginTop: 2, fontFamily: 'Helvetica-Bold' },
  grid: { borderWidth: 1, borderColor: '#dcdcdc', borderRadius: 3, marginBottom: 12 },
  gRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  gRowLast: { flexDirection: 'row' },
  gLabel: { width: 78, backgroundColor: '#f5f5f5', paddingVertical: 5, paddingHorizontal: 6, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#555' },
  gVal: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8.5, borderRightWidth: 1, borderRightColor: '#eee' },
  gValLast: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8.5 },
  secWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 10 },
  secBar: { width: 3.5, height: 12, backgroundColor: AZUR, borderRadius: 2 },
  secTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: AZUR },
  thead: { flexDirection: 'row', backgroundColor: AZUR, paddingVertical: 4, paddingHorizontal: 4 },
  th: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 7 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 4, paddingHorizontal: 4, alignItems: 'center' },
  trAlt: { backgroundColor: '#fafafa' },
  trTot: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, backgroundColor: '#f0e6e6', borderTopWidth: 1, borderTopColor: AZUR },
  cNombre: { width: '26%', fontFamily: 'Helvetica-Bold' },
  cDia: { width: '7.4%', textAlign: 'center' },
  cTot: { width: '9%', textAlign: 'right' },
  cExtra: { width: '8%', textAlign: 'right', color: '#b45309' },
  cMonto: { width: '13.4%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  cell: { fontSize: 7.5 },
  extraTag: { fontSize: 5.5, color: '#b45309' },
  totalBox: { marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end' },
  totalInner: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: AZUR, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 12 },
  totalLbl: { color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  totalVal: { color: '#fff', fontSize: 12, fontFamily: 'Helvetica-Bold' },
  nota: { fontSize: 7, color: '#888', marginTop: 6 },
  footer: { position: 'absolute', bottom: 20, left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
  footerTxt: { fontSize: 7, color: '#999' },
});

export interface TareoFila {
  nombre: string;
  dias: (number | null)[];   // horas normales por día (Lun..Dom)
  extra: (number | null)[];  // horas extra por día (Lun..Dom)
  totalH: number; totalExtra: number; monto: number;
}
export interface TareoSemana { label: string; filas: TareoFila[]; totalMonto: number; }
export interface TareoPdfData {
  proyecto: string; codigo: string; ubicacion?: string; supervisor?: string;
  desde: string; hasta: string;
  semanas: TareoSemana[];
  totalMonto: number;
  fmtMoney: (n: number) => string;
}

export function TareoPDF({ d }: { d: TareoPdfData }) {
  return (
    <Document title={`Tareo — ${d.codigo} — ${d.desde} al ${d.hasta}`}>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.topbar} fixed />
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View><Text style={s.brand}>Azur</Text><Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text></View>
          </View>
          <View>
            <Text style={s.title}>TAREO DE CUADRILLA (USO INTERNO)</Text>
            <Text style={s.fecha}>Del {d.desde} al {d.hasta}</Text>
          </View>
        </View>

        <View style={s.grid}>
          <View style={s.gRow}>
            <Text style={s.gLabel}>PROYECTO</Text><Text style={s.gVal}>{d.proyecto}</Text>
            <Text style={s.gLabel}>UBICACIÓN</Text><Text style={s.gValLast}>{d.ubicacion || '—'}</Text>
          </View>
          <View style={s.gRowLast}>
            <Text style={s.gLabel}>CÓDIGO</Text><Text style={s.gVal}>{d.codigo || '—'}</Text>
            <Text style={s.gLabel}>SUPERVISOR</Text><Text style={s.gValLast}>{d.supervisor || '—'}</Text>
          </View>
        </View>

        {d.semanas.length === 0 ? (
          <Text style={{ fontSize: 9, color: '#888' }}>Sin tareo registrado en el periodo.</Text>
        ) : d.semanas.map((sem, si) => (
          <View key={si} wrap={false}>
            <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>{sem.label}</Text></View>
            <View style={s.thead}>
              <Text style={[s.cNombre, s.th]}>TRABAJADOR</Text>
              {DIAS.map((dia) => <Text key={dia} style={[s.cDia, s.th]}>{dia}</Text>)}
              <Text style={[s.cTot, s.th]}>TOT. h</Text>
              <Text style={[s.cExtra, s.th]}>EXTRA</Text>
              <Text style={[s.cMonto, s.th]}>MONTO</Text>
            </View>
            {sem.filas.map((f, i) => (
              <View key={i} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
                <Text style={[s.cell, s.cNombre]}>{f.nombre}</Text>
                {f.dias.map((h, di) => (
                  <Text key={di} style={[s.cell, s.cDia]}>
                    {h == null && !f.extra[di] ? '·' : `${h ?? 0}${f.extra[di] ? `+${f.extra[di]}` : ''}`}
                  </Text>
                ))}
                <Text style={[s.cell, s.cTot]}>{f.totalH}</Text>
                <Text style={[s.cell, s.cExtra]}>{f.totalExtra || '—'}</Text>
                <Text style={[s.cell, s.cMonto]}>{d.fmtMoney(f.monto)}</Text>
              </View>
            ))}
            <View style={s.trTot}>
              <Text style={[s.cell, s.cNombre]}>Total semana</Text>
              {DIAS.map((_, i) => <Text key={i} style={[s.cell, s.cDia]} />)}
              <Text style={[s.cell, s.cTot]} />
              <Text style={[s.cell, s.cExtra]} />
              <Text style={[s.cell, s.cMonto]}>{d.fmtMoney(sem.totalMonto)}</Text>
            </View>
          </View>
        ))}

        {d.semanas.length > 0 && (
          <View style={s.totalBox}>
            <View style={s.totalInner}>
              <Text style={s.totalLbl}>TOTAL DEL PERIODO</Text>
              <Text style={s.totalVal}>{d.fmtMoney(d.totalMonto)}</Text>
            </View>
          </View>
        )}
        <Text style={s.nota}>Cálculo: jornal semanal ÷ 48 × horas trabajadas; la hora extra vale 20% más. Los valores en cada celda muestran horas normales y, con "+", las horas extra.</Text>

        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>Azur Constructora e Inmobiliaria | Tareo · {d.codigo}</Text>
          <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
