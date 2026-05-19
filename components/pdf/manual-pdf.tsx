import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const BRAND = {
  red: '#BE1723',
  bright: '#E20627',
  coral: '#ECA4A9',
  coralSoft: '#F8DDDF',
  ink: '#0A0A0A',
  muted: '#5b5b5b',
  border: '#e3e3e3',
  bg: '#fafafa',
  success: '#16a34a',
  warning: '#f59e0b',
};

const s = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: BRAND.ink,
    lineHeight: 1.4,
  },
  pageCover: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    fontFamily: 'Helvetica',
    color: BRAND.ink,
    backgroundColor: '#fff',
  },

  // Header recurrente
  headerBar: {
    position: 'absolute',
    top: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  headerLogo: { width: 22, height: 27 },
  headerBrand: { fontSize: 10, fontWeight: 700, color: BRAND.red, letterSpacing: 0.5 },
  headerMeta: { fontSize: 8, color: BRAND.muted },

  // Footer con paginación
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: BRAND.muted,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: BRAND.border,
  },

  // Portada — fondo blanco para que destaque el logo rojo, footer rojo con texto blanco
  coverHero: {
    height: 470,
    backgroundColor: '#fff',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    borderBottomWidth: 6,
    borderBottomColor: BRAND.red,
  },
  coverLogo: { width: 120, height: 147, marginBottom: 30 },
  coverTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: BRAND.red,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  coverSub: {
    fontSize: 14,
    color: BRAND.muted,
    marginTop: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  coverFooter: {
    flex: 1,
    backgroundColor: BRAND.red,
    padding: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  coverFooterLabel: {
    fontSize: 8,
    color: '#fff',
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  coverFooterValue: { fontSize: 12, color: '#fff', marginTop: 2, fontWeight: 700 },
  coverBadge: {
    backgroundColor: '#fff',
    color: BRAND.red,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Tipografía
  h1: {
    fontSize: 20,
    fontWeight: 700,
    color: BRAND.red,
    marginTop: 6,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.red,
  },
  h2: { fontSize: 13, fontWeight: 700, color: BRAND.ink, marginTop: 14, marginBottom: 6 },
  h3: { fontSize: 11, fontWeight: 700, color: BRAND.red, marginTop: 10, marginBottom: 4 },
  p: { fontSize: 9.5, color: BRAND.ink, marginBottom: 5, lineHeight: 1.5 },
  pMuted: { fontSize: 9, color: BRAND.muted, marginBottom: 5, lineHeight: 1.5 },
  mono: { fontFamily: 'Helvetica' },

  // Bullets
  bullet: { flexDirection: 'row', marginBottom: 3, paddingLeft: 4 },
  bulletDot: { color: BRAND.red, width: 10 },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.5 },

  // Steps numerados
  step: {
    flexDirection: 'row',
    marginBottom: 6,
    padding: 6,
    backgroundColor: BRAND.bg,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.red,
  },
  stepNum: {
    width: 22,
    height: 22,
    backgroundColor: BRAND.red,
    color: '#fff',
    borderRadius: 11,
    fontSize: 10,
    fontWeight: 700,
    textAlign: 'center',
    paddingTop: 5,
    marginRight: 8,
  },
  stepBody: { flex: 1, paddingTop: 3 },

  // Cards
  card: {
    backgroundColor: BRAND.coralSoft,
    padding: 10,
    borderRadius: 4,
    marginVertical: 4,
  },
  cardLabel: {
    fontSize: 7,
    color: BRAND.red,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  cardTitle: { fontSize: 10, fontWeight: 700, color: BRAND.ink, marginBottom: 2 },
  cardText: { fontSize: 8.5, color: BRAND.muted, lineHeight: 1.4 },

  // Tabla
  tableHead: {
    flexDirection: 'row',
    backgroundColor: BRAND.red,
    color: '#fff',
    padding: 6,
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.border,
    fontSize: 8.5,
  },
  tableRowAlt: { backgroundColor: BRAND.bg },

  // Notas / alertas
  noteInfo: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    padding: 8,
    marginVertical: 5,
    fontSize: 8.5,
    color: '#1e40af',
  },
  noteWarning: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: BRAND.warning,
    padding: 8,
    marginVertical: 5,
    fontSize: 8.5,
    color: '#92400e',
  },
  noteSuccess: {
    backgroundColor: '#dcfce7',
    borderLeftWidth: 3,
    borderLeftColor: BRAND.success,
    padding: 8,
    marginVertical: 5,
    fontSize: 8.5,
    color: '#166534',
  },

  // TOC
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.border,
    fontSize: 10,
  },
  tocNum: { color: BRAND.red, fontWeight: 700, width: 24 },
  tocText: { flex: 1 },

  // Pill
  pill: {
    backgroundColor: BRAND.red,
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 7,
    fontWeight: 700,
  },
});

// ------------ Helpers de layout ------------

const HeaderBar = () => (
  <View style={s.headerBar} fixed>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={s.headerBrand}>AZUR</Text>
      <Text style={s.headerMeta}>Manual de usuario · ERP + PWA Campo</Text>
    </View>
    <Text style={s.headerMeta}>Constructora e Inmobiliaria</Text>
  </View>
);

const Footer = () => (
  <View style={s.footer} fixed>
    <Text>azur-erp.vercel.app · Promptive · 2026</Text>
    <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
  </View>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <View style={s.bullet}>
    <Text style={s.bulletDot}>•</Text>
    <Text style={s.bulletText}>{children}</Text>
  </View>
);

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <View style={s.step} wrap={false}>
    <Text style={s.stepNum}>{n}</Text>
    <View style={s.stepBody}>{children}</View>
  </View>
);

// ------------ Documento ------------

type Props = { logoUrl: string };

export function ManualPDF({ logoUrl }: Props) {
  return (
    <Document
      title="Manual de Usuario AZUR ERP"
      author="Promptive"
      subject="Guía completa del sistema AZUR ERP + PWA Campo"
    >
      {/* PORTADA */}
      <Page size="A4" style={s.pageCover}>
        <View style={s.coverHero}>
          <Image src={logoUrl} style={s.coverLogo} />
          <Text style={s.coverTitle}>Manual de Usuario</Text>
          <Text style={s.coverSub}>AZUR ERP + PWA Campo</Text>
        </View>
        <View style={s.coverFooter}>
          <View>
            <Text style={s.coverFooterLabel}>Cliente</Text>
            <Text style={s.coverFooterValue}>AZUR Constructora e Inmobiliaria</Text>
            <Text style={s.coverFooterLabel}>{'\n'}URL del sistema</Text>
            <Text style={s.coverFooterValue}>azur-erp.vercel.app</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.coverBadge}>v1.0</Text>
            <Text style={s.coverFooterLabel}>{'\n'}Desarrollado por</Text>
            <Text style={s.coverFooterValue}>Promptive</Text>
          </View>
        </View>
      </Page>

      {/* ÍNDICE */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>Índice</Text>
        <Toc n="1" titulo="Introducción y arquitectura" />
        <Toc n="2" titulo="Acceso inicial y usuarios" />
        <Toc n="3" titulo="Roles y permisos" />
        <Toc n="4" titulo="Módulo Clientes" />
        <Toc n="5" titulo="Módulo Comercial (Catálogo, APU, Cotizaciones)" />
        <Toc n="6" titulo="Módulo Proyectos" />
        <Toc n="7" titulo="Solicitudes de pago y aprobaciones" />
        <Toc n="8" titulo="Cajas y flujo de caja" />
        <Toc n="9" titulo="Valorizaciones quincenales y Curva S" />
        <Toc n="10" titulo="Módulo Almacén (central + por proyecto)" />
        <Toc n="11" titulo="PWA Campo (residente)" />
        <Toc n="12" titulo="SST — Seguridad y Salud en el Trabajo" />
        <Toc n="13" titulo="Documentos del proyecto" />
        <Toc n="14" titulo="Dashboard ejecutivo y Auditoría" />
        <Toc n="15" titulo="Notificaciones push" />
        <Toc n="16" titulo="Tipo de cambio SUNAT" />
        <Toc n="17" titulo="Reportes financieros y exportaciones" />
        <Toc n="18" titulo="Flujo end-to-end de una obra" />
        <Toc n="19" titulo="FAQ y resolución de problemas" />
        <Footer />
      </Page>

      {/* 1. INTRODUCCIÓN */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>1. Introducción y arquitectura</Text>
        <Text style={s.p}>
          AZUR ERP es un sistema de gestión integral para empresas constructoras compuesto por
          dos aplicaciones que comparten una sola base de datos y sistema de permisos:
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 8 }}>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.cardLabel}>1 · ERP Web</Text>
            <Text style={s.cardTitle}>azur-erp.vercel.app</Text>
            <Text style={s.cardText}>
              Para oficina: gerencia, jefes, administración y comercial. Pantalla amplia, sidebar
              de navegación, command palette (⌘K), tablas y dashboards.
            </Text>
          </View>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.cardLabel}>2 · PWA Campo</Text>
            <Text style={s.cardTitle}>Misma URL, instalable en celular</Text>
            <Text style={s.cardText}>
              Para residentes en obra: check-in GPS, parte diario (RDO), evidencias fotográficas
              con geolocalización, solicitudes de pago, almacén y SST. Funciona offline parcial.
            </Text>
          </View>
        </View>

        <Text style={s.h2}>Stack técnico</Text>
        <Bullet>Next.js 14 (App Router) con Route Groups (erp) y (pwa)</Bullet>
        <Bullet>Supabase: PostgreSQL + Auth + Storage + Realtime + RLS por rol</Bullet>
        <Bullet>Tailwind CSS con tokens de marca AZUR (#BE1723 rojo principal)</Bullet>
        <Bullet>React-PDF para cotizaciones, valorizaciones y este manual</Bullet>
        <Bullet>Web-Push (VAPID) para notificaciones móviles</Bullet>
        <Bullet>Despliegue en Vercel con CI/CD automático desde GitHub</Bullet>

        <Text style={s.h2}>Convenciones del manual</Text>
        <View style={s.noteInfo}>
          <Text>Los pasos numerados indican una secuencia que debes seguir en orden.</Text>
        </View>
        <View style={s.noteSuccess}>
          <Text>Las notas verdes confirman comportamientos esperados o tips útiles.</Text>
        </View>
        <View style={s.noteWarning}>
          <Text>Las notas amarillas advierten sobre validaciones, restricciones o errores comunes.</Text>
        </View>
        <Footer />
      </Page>

      {/* 2. ACCESO INICIAL */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>2. Acceso inicial y usuarios</Text>

        <Text style={s.h2}>2.1 Acceso al sistema</Text>
        <Step n={1}>
          <Text style={s.p}>Abre tu navegador y entra a <Text style={{ fontWeight: 700, color: BRAND.red }}>https://azur-erp.vercel.app</Text></Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>Te redirige a /login. Ingresa tu email corporativo y contraseña.</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>
            El sistema te lleva automáticamente a tu pantalla principal según tu rol (gerencia
            va al Dashboard, residente va a /inicio en modo PWA, etc.)
          </Text>
        </Step>

        <Text style={s.h2}>2.2 Usuarios sembrados de desarrollo</Text>
        <Text style={s.pMuted}>
          Estos 6 usuarios vienen pre-creados para pruebas. Cámbialos por usuarios reales en
          /usuarios cuando entres a producción.
        </Text>
        <View style={s.tableHead}>
          <Text style={{ flex: 2 }}>Email</Text>
          <Text style={{ flex: 1 }}>Rol</Text>
          <Text style={{ flex: 2 }}>Nombre</Text>
        </View>
        {USERS_DEV.map((u, i) => (
          <View key={u.email} style={[s.tableRow, ...(i % 2 === 0 ? [s.tableRowAlt] : [])]}>
            <Text style={[{ flex: 2 }, s.mono]}>{u.email}</Text>
            <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>{u.rol}</Text>
            <Text style={{ flex: 2 }}>{u.nombre}</Text>
          </View>
        ))}
        <View style={s.noteInfo}>
          <Text>
            Contraseña por defecto para todos: {' '}
            <Text style={{ fontWeight: 700 }}>azur2026</Text>
            {' '}(configurable vía env DEV_USERS_PASSWORD).
          </Text>
        </View>

        <Text style={s.h2}>2.3 Instalación de la PWA en celular</Text>
        <Step n={1}>
          <Text style={s.p}>En tu Android/iPhone, abre <Text style={{ fontWeight: 700 }}>Chrome</Text> (Android) o <Text style={{ fontWeight: 700 }}>Safari</Text> (iOS 16.4+).</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>Entra a azur-erp.vercel.app y haz login.</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>Menú del navegador → "Instalar app" o "Agregar a inicio". El ícono AZUR queda en tu pantalla principal.</Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>Abre la app instalada. Ya no se ve la barra del navegador — funciona como app nativa.</Text>
        </Step>
        <View style={s.noteWarning}>
          <Text>
            iOS exige Safari ≥16.4 y la PWA debe estar instalada para recibir notificaciones push.
            En Android funciona con Chrome 84+.
          </Text>
        </View>
        <Footer />
      </Page>

      {/* 3. ROLES */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>3. Roles y permisos</Text>
        <Text style={s.p}>
          AZUR ERP tiene 6 roles. Cada uno ve módulos diferentes y tiene su pantalla por defecto al
          hacer login.
        </Text>

        <View style={s.tableHead}>
          <Text style={{ flex: 1.5 }}>Rol</Text>
          <Text style={{ flex: 1.5 }}>Default home</Text>
          <Text style={{ flex: 3 }}>Acceso</Text>
        </View>
        {ROLES.map((r, i) => (
          <View key={r.rol} style={[s.tableRow, ...(i % 2 === 0 ? [s.tableRowAlt] : [])]} wrap={false}>
            <Text style={{ flex: 1.5, fontWeight: 700, color: BRAND.red }}>{r.rol}</Text>
            <Text style={[{ flex: 1.5 }, s.mono]}>{r.home}</Text>
            <Text style={{ flex: 3 }}>{r.accesos}</Text>
          </View>
        ))}

        <Text style={s.h2}>Reglas clave de seguridad</Text>
        <Bullet>El residente nunca entra al ERP web — solo usa la PWA.</Bullet>
        <Bullet>La gerencia general es la única que ve Auditoría y puede gestionar usuarios.</Bullet>
        <Bullet>Cada tabla tiene RLS (Row Level Security) — las restricciones aplican en BD, no solo en UI.</Bullet>
        <Bullet>Las cotizaciones aprobadas generan proyecto automáticamente.</Bullet>
        <Bullet>Las solicitudes de pago requieren aprobación de jefatura antes de programarse.</Bullet>
        <Footer />
      </Page>

      {/* 4. CLIENTES */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>4. Módulo Clientes</Text>
        <Text style={s.p}>
          Maestro de empresas o personas a las que emites cotizaciones. Acceso desde sidebar →
          "Clientes" (visible para gerencia, jefe presupuestos, comercial y administrador).
        </Text>

        <Text style={s.h2}>4.1 Crear cliente desde el módulo</Text>
        <Step n={1}>
          <Text style={s.p}>Sidebar → Clientes. La pantalla tiene listado a la izquierda y form a la derecha.</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>En el form "Nuevo cliente" llena: <Text style={{ fontWeight: 700 }}>Razón social (obligatorio)</Text>, nombre comercial, RUC (11 dígitos, único), contacto, teléfono, email, dirección y notas.</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>Click "Guardar cliente". Toast verde confirma creación y aparece en el listado.</Text>
        </Step>

        <Text style={s.h2}>4.2 Crear cliente al vuelo desde cotización</Text>
        <Text style={s.p}>
          Si estás creando una cotización y el cliente no existe, no necesitas salir del flujo:
        </Text>
        <Step n={1}>
          <Text style={s.p}>En /comercial/cotizaciones/nueva, al lado del label "Cliente" hay un botón <Text style={{ fontWeight: 700, color: BRAND.red }}>"+ Nuevo cliente"</Text>.</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>Click → abre un modal con el mismo form de clientes.</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>Al guardar, el cliente se crea Y queda auto-seleccionado en el dropdown. Continúas la cotización sin perder los datos que ya llenaste.</Text>
        </Step>

        <Text style={s.h2}>4.3 Búsqueda y filtros</Text>
        <Bullet>Buscador por razón social, nombre comercial o RUC.</Bullet>
        <Bullet>Filtro: Activos / Inactivos / Todos.</Bullet>
        <Bullet>Cada fila muestra cuántas cotizaciones tiene ese cliente.</Bullet>
        <Bullet>Botón rojo (X) desactiva al cliente; verde (✓) lo reactiva.</Bullet>

        <View style={s.noteWarning}>
          <Text>El RUC debe ser único en el sistema. Si intentas crear un duplicado, el sistema te dirá qué cliente lo tiene asignado.</Text>
        </View>
        <Footer />
      </Page>

      {/* 5. COMERCIAL */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>5. Módulo Comercial</Text>

        <Text style={s.h2}>5.1 Catálogo maestro (/comercial/catalogo)</Text>
        <Text style={s.p}>
          Lista única de insumos (mano de obra, materiales, equipos, herramientas, EPP) y
          partidas maestras reutilizables en cotizaciones.
        </Text>
        <Bullet>Buscador por descripción o código.</Bullet>
        <Bullet>Filtro por categoría: mano_obra, material, equipo, subcontrato, transporte, gasto_general.</Bullet>
        <Bullet>Prefijos de código: <Text style={s.mono}>INS-</Text> para cotizaciones, <Text style={s.mono}>HER-</Text> herramientas, <Text style={s.mono}>MAT-</Text> materiales, <Text style={s.mono}>EPP-</Text> protección personal.</Bullet>
        <Bullet>El sistema viene con 60 insumos sembrados (20 herramientas, 30 materiales, 10 EPP) más insumos demo.</Bullet>

        <Text style={s.h2}>5.2 APU (/comercial/apu)</Text>
        <Text style={s.p}>
          Análisis de Precio Unitario por partida. Define el rendimiento (cantidad por día) y
          asocia insumos con sus aportes. El sistema calcula el costo por unidad.
        </Text>

        <Text style={s.h2}>5.3 Cotizaciones (/comercial/cotizaciones)</Text>
        <Text style={s.p}>
          Estados: borrador → enviada → en_negociacion → aprobada / rechazada.
        </Text>

        <Text style={s.h3}>Crear cotización paso a paso</Text>
        <Step n={1}>
          <Text style={s.p}>Cotizaciones → "Nueva cotización".</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>Llena: título, cliente (o crear al vuelo), ubicación, descripción.</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>Define comerciales: moneda (PEN/USD), validez en días, GG%, utilidad%, IGV%.</Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>Click "Crear cotización" → te lleva al detalle con código auto-generado (COT-2026-NNNN).</Text>
        </Step>
        <Step n={5}>
          <Text style={s.p}>En el detalle, agrega partidas una por una con cantidad y precio unitario. El sistema calcula parciales y totales en tiempo real.</Text>
        </Step>
        <Step n={6}>
          <Text style={s.p}>"Descargar PDF" genera la cotización lista para enviar al cliente (con logo, tabla de partidas, totales, validez, notas).</Text>
        </Step>
        <Step n={7}>
          <Text style={s.p}>Cuando el cliente confirma, cambia el estado a "Aprobada" → <Text style={{ fontWeight: 700 }}>se genera automáticamente un Proyecto</Text> con código PRY-2026-NNNN y se copian las partidas.</Text>
        </Step>

        <View style={s.noteInfo}>
          <Text>
            Arriba del listado y del detalle de cotización verás el tipo de cambio USD/PEN actual
            (de SUNAT cuando está disponible, o fuente de mercado como fallback).
          </Text>
        </View>
        <Footer />
      </Page>

      {/* 6. PROYECTOS */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>6. Módulo Proyectos</Text>

        <Text style={s.h2}>6.1 Crear proyecto</Text>
        <Text style={s.p}>
          Los proyectos se crean automáticamente al aprobar una cotización. También puedes crear
          manualmente desde /proyectos → "Nuevo proyecto" si tienes rol gerencia o jefe.
        </Text>

        <Text style={s.h2}>6.2 Ficha del proyecto</Text>
        <Text style={s.p}>Al abrir un proyecto verás todas estas secciones:</Text>
        <Bullet><Text style={{ fontWeight: 700 }}>Alertas:</Text> banner con detecciones automáticas (cronograma vencido, presupuesto agotado, sobrecosto detectado, sin avance, ubicación GPS faltante).</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>KPIs:</Text> avance físico %, contrato venta, ejecutado real, margen estimado.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Ubicación de obra:</Text> ubigeo Perú + dirección + GPS + radio de geofence (para validar check-ins del residente).</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Etapas y partidas:</Text> editable con input de metrado ejecutado por partida.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Asistencias:</Text> tareo GPS del residente (last 30 días).</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>RDOs:</Text> partes diarios consolidados.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Evidencias:</Text> galería de fotos georreferenciadas.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>SST:</Text> charlas, observaciones, incidentes.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Almacén del proyecto:</Text> existencias actuales en obra + últimos movimientos.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Documentos:</Text> planos, contratos, fichas (con visibilidad pública/mando/gerencia).</Bullet>

        <Text style={s.h2}>6.3 Configurar ubicación GPS</Text>
        <Step n={1}>
          <Text style={s.p}>En la ficha del proyecto, sección "Ubicación de obra" → click "Editar".</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>Selecciona departamento, provincia y distrito (ubigeo INEI Perú).</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>Escribe la dirección y busca en el mapa para obtener coordenadas GPS exactas.</Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>Define el radio de geofence en metros (típico: 200m). Esto valida que el check-in del residente sea dentro del rango.</Text>
        </Step>

        <Text style={s.h2}>6.4 Adicionales y deductivos</Text>
        <Text style={s.p}>
          Cambios al contractual. Modal para registrar adicional (suma) o deductivo (resta) con
          descripción y monto. Quedan en estado "propuesto" hasta aprobación de gerencia.
        </Text>

        <Text style={s.h2}>6.5 Cambio de estado del proyecto</Text>
        <Text style={s.p}>
          Estados: planificado → en_ejecucion → pausado / cerrado / cancelado. Cada cambio queda
          en auditoría.
        </Text>
        <Footer />
      </Page>

      {/* 7. SOLICITUDES Y PAGOS */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>7. Solicitudes de pago y aprobaciones</Text>
        <Text style={s.p}>
          Las solicitudes son el corazón del flujo financiero. Pasan por 5 estados secuenciales
          con permisos diferentes en cada uno.
        </Text>

        <View style={[s.card, { backgroundColor: BRAND.bg, marginVertical: 8 }]}>
          <Text style={s.cardLabel}>Workflow completo de una solicitud</Text>
          <Text style={s.cardText}>
            <Text style={{ fontWeight: 700, color: BRAND.red }}>1. PENDIENTE</Text>{' '}
            (residente o admin la crea){'\n'}
            <Text style={{ color: BRAND.muted }}>↓ aprobador revisa</Text>{'\n'}
            <Text style={{ fontWeight: 700, color: BRAND.warning }}>2. APROBADA POR JEFE</Text>
            {' '}/ <Text style={{ fontWeight: 700, color: BRAND.red }}>RECHAZADA</Text>{'\n'}
            <Text style={{ color: BRAND.muted }}>↓ admin programa banco/fecha</Text>{'\n'}
            <Text style={{ fontWeight: 700, color: BRAND.warning }}>3. PROGRAMADA</Text>{'\n'}
            <Text style={{ color: BRAND.muted }}>↓ se ejecuta transferencia, sube voucher</Text>{'\n'}
            <Text style={{ fontWeight: 700, color: BRAND.success }}>4. PAGADA</Text>
            {' '}(genera URL pública para WhatsApp)
          </Text>
        </View>

        <Text style={s.h2}>7.1 Crear solicitud desde PWA (residente)</Text>
        <Step n={1}>
          <Text style={s.p}>PWA → bottom nav "Pagos" → botón "+ Nueva solicitud".</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>
            Selecciona <Text style={{ fontWeight: 700 }}>proyecto</Text> (solo aparecen los que
            tienes asignados) y <Text style={{ fontWeight: 700 }}>categoría</Text>: proveedor,
            contratista, jornales, caja_chica, agua, alquiler_equipo, flete, servicios u otros.
          </Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>
            Llena concepto (qué es), beneficiario (a quién se paga), monto, moneda (PEN/USD),
            urgencia (baja/normal/alta/crítica) y notas opcionales.
          </Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>
            Enviar. La solicitud queda PENDIENTE. Los 4 aprobadores con push activado reciben
            notificación inmediata.
          </Text>
        </Step>

        <Text style={s.h2}>7.2 Aprobar (jefe / gerencia)</Text>
        <Step n={1}>
          <Text style={s.p}>
            ERP sidebar → "Aprobaciones" (/finanzas/aprobaciones). Cards ordenadas por urgencia
            (crítica primero).
          </Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>
            Click la solicitud → revisa: monto, concepto, proyecto, quién la creó, evidencia
            adjunta.
          </Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>
            Botones disponibles según rol: <Text style={{ fontWeight: 700, color: BRAND.success }}>Aprobar</Text>{', '}
            <Text style={{ fontWeight: 700, color: BRAND.red }}>Rechazar</Text> (con motivo
            obligatorio) o <Text style={{ fontWeight: 700, color: BRAND.muted }}>Cancelar</Text>.
            El solicitante recibe push del resultado.
          </Text>
        </Step>

        <Text style={s.h2}>7.3 Programar pago (administrador)</Text>
        <Step n={1}>
          <Text style={s.p}>
            En el detalle de una solicitud APROBADA, sección "Programar pago".
          </Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>
            Llena: fecha programada, banco origen, banco destino, cuenta destino, número de
            operación, observaciones.
          </Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>
            Guardar. Estado pasa a PROGRAMADA, residente recibe push de confirmación.
          </Text>
        </Step>

        <Text style={s.h2}>7.4 Subir voucher (administrador)</Text>
        <Step n={1}>
          <Text style={s.p}>
            Después de hacer la transferencia real en el banco, vuelves al detalle de la solicitud.
          </Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>
            Sección "Voucher" → adjunta foto o PDF del comprobante (máximo 5 MB).
          </Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>
            Estado pasa a PAGADA. Se genera URL pública del voucher para compartir por WhatsApp
            al beneficiario. Si la categoría era "caja_chica", se crea automáticamente el
            movimiento de traslado de caja central → caja del proyecto.
          </Text>
        </Step>

        <Footer />
      </Page>

      {/* 8. CAJAS Y FLUJO DE CAJA — DEDICADO */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>8. Cajas y flujo de caja</Text>
        <Text style={s.p}>
          AZUR maneja dos tipos de caja con saldo en tiempo real y traslados automáticos entre
          ellas, calculado vía la vista <Text style={s.mono}>v_cajas_saldos</Text>.
        </Text>

        <Text style={s.h2}>8.1 Tipos de caja</Text>
        <View style={s.tableHead}>
          <Text style={{ flex: 1 }}>Tipo</Text>
          <Text style={{ flex: 3 }}>Descripción</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>Central</Text>
          <Text style={{ flex: 3 }}>
            Una sola caja por moneda (PEN, USD). Refleja el saldo global de la empresa. Se
            alimenta de cobros de valorizaciones o ingresos manuales.
          </Text>
        </View>
        <View style={[s.tableRow, s.tableRowAlt]}>
          <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>Chica</Text>
          <Text style={{ flex: 3 }}>
            Una por proyecto. Se auto-crea cuando se inicia un proyecto. Usada para gastos
            menores en obra (caja chica del residente).
          </Text>
        </View>

        <Text style={s.h2}>8.2 Pantalla /finanzas/cajas</Text>
        <Bullet>Totales consolidados por moneda en las tarjetas superiores (PEN y USD).</Bullet>
        <Bullet>Lista todas las cajas con su saldo actual en tiempo real.</Bullet>
        <Bullet>Botón "Nueva caja" para crear una manual (típicamente chica para un proyecto).</Bullet>
        <Bullet>Click en cualquier caja → entra al detalle con movimientos.</Bullet>

        <Text style={s.h2}>8.3 Registrar movimiento manual</Text>
        <Step n={1}>
          <Text style={s.p}>
            Entra a la caja → sección "Nuevo movimiento".
          </Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>
            Selecciona tipo: <Text style={{ fontWeight: 700, color: BRAND.success }}>Entrada</Text>{' '}
            (ingreso de dinero) o{' '}
            <Text style={{ fontWeight: 700, color: BRAND.red }}>Salida</Text> (egreso).
          </Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>
            Llena: fecha, concepto (qué es), monto, referencia (opcional: número de documento o
            comprobante).
          </Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>
            Guardar. El saldo se actualiza inmediatamente en /finanzas/cajas.
          </Text>
        </Step>

        <Text style={s.h2}>8.4 Traslado entre cajas (operación única)</Text>
        <View style={s.noteInfo}>
          <Text>
            A diferencia de contabilidad clásica, en AZUR un traslado es 1 sola operación que el
            sistema dobla automáticamente: registra una salida en la caja origen y una entrada
            equivalente en la caja destino. Sin doble entrada manual.
          </Text>
        </View>
        <Step n={1}>
          <Text style={s.p}>
            En el detalle de la caja origen, click "Traslado a otra caja".
          </Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>
            Selecciona caja destino (solo se muestran las de la misma moneda y con permisos).
          </Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>
            Define monto y concepto. Confirma.
          </Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>
            El sistema genera dos movimientos vinculados: tipo "traslado_out" en origen, tipo
            "traslado_in" en destino. Ambas cajas actualizan saldos.
          </Text>
        </Step>

        <Text style={s.h2}>8.5 Automatizaciones de caja</Text>
        <View style={s.noteSuccess}>
          <Text style={{ fontWeight: 700, marginBottom: 4 }}>
            El sistema crea movimientos de caja sin que tengas que hacer nada en estos casos:
          </Text>
          <Text>
            · Al SUBIR VOUCHER de una solicitud de categoría "caja_chica" → auto-traslado de caja
            central → caja chica del proyecto.{'\n\n'}
            · Al MARCAR PAGADA una valorización quincenal → auto-ingreso a la caja central
            (cobro al cliente).{'\n\n'}
            · Al CREAR PROYECTO → auto-creación de su caja chica asociada con saldo 0.
          </Text>
        </View>

        <Text style={s.h2}>8.6 Flujo de caja consolidado</Text>
        <Text style={s.p}>
          La pantalla /finanzas/cajas funciona como flujo de caja en tiempo real:
        </Text>
        <Bullet>Saldo actual por cada caja (central y todas las chicas).</Bullet>
        <Bullet>Total agrupado por moneda en las tarjetas superiores.</Bullet>
        <Bullet>Histórico completo de movimientos por caja (entradas, salidas, traslados).</Bullet>
        <Bullet>Filtros: tipo de movimiento, rango de fecha.</Bullet>
        <Bullet>Cada movimiento muestra: fecha, tipo, concepto, monto, referencia, quién lo registró.</Bullet>
        <Footer />
      </Page>

      {/* 9. VALORIZACIONES — DEDICADO Y EXPANDIDO */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>9. Valorizaciones quincenales y Curva S</Text>
        <Text style={s.p}>
          Las valorizaciones son los cortes periódicos (típicamente quincenales) que la
          constructora le cobra al cliente según el avance físico real de las partidas. Es la
          fuente principal de ingresos del proyecto.
        </Text>

        <View style={[s.card, { backgroundColor: BRAND.bg, marginVertical: 8 }]}>
          <Text style={s.cardLabel}>Workflow de una valorización</Text>
          <Text style={s.cardText}>
            <Text style={{ fontWeight: 700, color: BRAND.muted }}>BORRADOR</Text>
            {' '}(jefe la prepara con avances){'\n'}
            <Text style={{ color: BRAND.muted }}>↓</Text>{'\n'}
            <Text style={{ fontWeight: 700, color: BRAND.warning }}>PRESENTADA</Text>
            {' '}(enviada al cliente para revisión){'\n'}
            <Text style={{ color: BRAND.muted }}>↓</Text>{'\n'}
            <Text style={{ fontWeight: 700, color: BRAND.success }}>APROBADA</Text>
            {' '}/ <Text style={{ fontWeight: 700, color: BRAND.red }}>RECHAZADA</Text>{'\n'}
            <Text style={{ color: BRAND.muted }}>↓</Text>{'\n'}
            <Text style={{ fontWeight: 700, color: BRAND.success }}>PAGADA</Text>
            {' '}(cliente transfiere → auto-ingreso a caja central)
          </Text>
        </View>

        <Text style={s.h2}>9.1 Generar una valorización paso a paso</Text>
        <Step n={1}>
          <Text style={s.p}>
            En la ficha del proyecto (/proyectos/[id]) verás el botón "Valorizaciones" arriba a
            la derecha. Click.
          </Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>
            Click "+ Nueva valorización". Llena: número correlativo (ej. VAL-001), fecha inicio y
            fecha fin del periodo (típicamente los 15 días previos).
          </Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>
            El sistema COPIA automáticamente todas las partidas del proyecto al detalle de la
            valorización. Aparece tabla con cada partida y sus columnas editables.
          </Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>
            Por cada partida, ingresa: <Text style={{ fontWeight: 700 }}>cantidad ejecutada en
            el periodo</Text> (no acumulada — solo lo de esta quincena). El sistema calcula
            automáticamente: parcial, % avance, monto bruto.
          </Text>
        </Step>
        <Step n={5}>
          <Text style={s.p}>
            Revisa totales calculados al final: monto bruto, deducciones (adelantos amortizados,
            retención de garantía), monto neto a cobrar.
          </Text>
        </Step>
        <Step n={6}>
          <Text style={s.p}>
            Si quieres detener para guardar como BORRADOR (puedes volver luego), simplemente sal.
            Cuando esté lista, click <Text style={{ fontWeight: 700, color: BRAND.warning }}>
            "Presentar"</Text>. Estado pasa a PRESENTADA.
          </Text>
        </Step>

        <Text style={s.h2}>9.2 Aprobar y descargar PDF</Text>
        <Step n={1}>
          <Text style={s.p}>
            Gerencia revisa la valorización presentada → botón{' '}
            <Text style={{ fontWeight: 700, color: BRAND.success }}>"Aprobar"</Text> o{' '}
            <Text style={{ fontWeight: 700, color: BRAND.red }}>"Rechazar"</Text> con motivo.
          </Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>
            Click "Descargar PDF" → se genera valorización en formato sector construcción con
            logo AZUR, partidas, % avance, totales, sellos de aprobación. Listo para enviar al
            cliente.
          </Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>
            El cliente paga (transferencia bancaria, cheque, etc.). El administrador marca la
            valorización como{' '}
            <Text style={{ fontWeight: 700, color: BRAND.success }}>PAGADA</Text>.
          </Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>
            El sistema genera automáticamente un movimiento de entrada en la caja central por el
            monto neto cobrado (ver Sección 8.5).
          </Text>
        </Step>

        <Text style={s.h2}>9.3 Adicionales y deductivos</Text>
        <Text style={s.p}>
          Antes o durante una valorización puedes registrar adicionales (mayor scope = más cobro)
          y deductivos (menos scope = descuento) que modifican el contractual original.
        </Text>
        <Bullet>Acceso: ficha del proyecto → botón "Adicionales".</Bullet>
        <Bullet>Tipo: adicional (suma) o deductivo (resta).</Bullet>
        <Bullet>Estado: propuesto → aprobado → incorporado.</Bullet>
        <Bullet>Una vez aprobados, modifican el presupuesto venta total del proyecto.</Bullet>
        <Bullet>Quedan trazables en la auditoría (quién aprobó, cuándo, por qué).</Bullet>

        <Text style={s.h2}>9.4 Curva S del proyecto</Text>
        <Text style={s.p}>
          En el detalle del proyecto se renderiza un gráfico de Curva S basado en la vista{' '}
          <Text style={s.mono}>v_curva_s</Text> que compara 3 series a lo largo del tiempo:
        </Text>
        <View style={s.tableHead}>
          <Text style={{ flex: 1 }}>Serie</Text>
          <Text style={{ flex: 3 }}>Significado</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1, color: BRAND.muted, fontWeight: 700 }}>Planificado</Text>
          <Text style={{ flex: 3 }}>Lo que se DEBERÍA haber avanzado según cronograma.</Text>
        </View>
        <View style={[s.tableRow, s.tableRowAlt]}>
          <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>Ejecutado físico</Text>
          <Text style={{ flex: 3 }}>Lo que el residente reportó realmente avanzado (RDOs + valorizaciones).</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1, color: BRAND.success, fontWeight: 700 }}>Valorizado</Text>
          <Text style={{ flex: 3 }}>Lo que se cobró al cliente en valorizaciones aprobadas/pagadas.</Text>
        </View>
        <View style={s.noteInfo}>
          <Text>
            Si la línea "Ejecutado" está por debajo de "Planificado" → atraso. Si "Valorizado"
            está por debajo de "Ejecutado" → flujo de caja en riesgo (estás trabajando sin
            cobrar).
          </Text>
        </View>

        <Footer />
      </Page>

      {/* 10. ALMACEN */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>10. Módulo Almacén</Text>
        <Text style={s.p}>
          Trackea herramientas y materiales desde la compra hasta la devolución a la obra. El
          modelo cubre 3 flujos:
        </Text>

        <View style={[s.card, { marginVertical: 6 }]}>
          <Text style={s.cardLabel}>Flujo completo del almacén</Text>
          <Text style={s.cardText}>
            <Text style={{ fontWeight: 700, color: BRAND.red }}>COMPRA</Text> (proveedor → central){'\n'}
            <Text style={{ fontWeight: 700 }}>↓</Text>{'\n'}
            <Text style={{ fontWeight: 700, color: BRAND.red }}>SALIDA</Text> (central → obra) — el residente registra desde PWA{'\n'}
            <Text style={{ fontWeight: 700 }}>↓</Text>{'\n'}
            <Text style={{ fontWeight: 700, color: BRAND.red }}>DEVOLUCIÓN</Text> (obra → central) — el residente devuelve
          </Text>
        </View>

        <Text style={s.h2}>10.1 Registrar compra al almacén central</Text>
        <Step n={1}>
          <Text style={s.p}>Sidebar → "Almacén" (URL /inventario). Solo gerencia, jefe proyectos y administrador.</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>Sección "Registrar compra / ingreso al almacén central" → busca el insumo del catálogo.</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>Llena cantidad, costo unitario (opcional — si lo llenas, actualiza el precio del catálogo), proveedor, número de factura/boleta, fecha.</Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>"Registrar ingreso" → el stock central sube inmediatamente.</Text>
        </Step>

        <Text style={s.h2}>10.2 Ver stock del almacén central</Text>
        <Text style={s.p}>
          La sección "Stock del almacén central" en /inventario muestra cada insumo con:
        </Text>
        <Bullet>Total ingresos (verde +)</Bullet>
        <Bullet>Total salidas (rojo −)</Bullet>
        <Bullet>Total devoluciones (gris +)</Bullet>
        <Bullet>Stock actual (badge: verde si {'>'}5, ámbar si {'<'}5, rojo si {'<='}0)</Bullet>

        <Text style={s.h2}>10.3 Salida a obra (desde PWA, residente)</Text>
        <Step n={1}>
          <Text style={s.p}>PWA → "Más" → "Almacén".</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>Tipo: "Salida". Busca el insumo en el catálogo — cada uno muestra el stock disponible en central.</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>Llena cantidad y responsable que recibe. Click "Registrar".</Text>
        </Step>
        <View style={s.noteWarning}>
          <Text>
            Si intentas sacar más de lo disponible en el central, el sistema bloquea con mensaje
            "Disponible: X. Intentas sacar Y". Coordina con gerencia para registrar la compra
            antes.
          </Text>
        </View>

        <Text style={s.h2}>10.4 Devolución</Text>
        <Text style={s.p}>
          Mismo form, tipo "Devolución". El stock central sube y el saldo del proyecto baja.
        </Text>

        <Text style={s.h2}>10.5 Almacén por proyecto</Text>
        <Text style={s.p}>
          En cada ficha de proyecto hay una sección "Almacén del proyecto" con las existencias
          actualmente en esa obra y los últimos 5 movimientos.
        </Text>
        <Footer />
      </Page>

      {/* 11. PWA */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>11. PWA Campo (Residente)</Text>
        <Text style={s.p}>
          La aplicación móvil para el residente de obra. Bottom navigation con 4 íconos
          principales + menú "Más" con módulos adicionales.
        </Text>

        <Text style={s.h2}>11.1 Pantalla de inicio</Text>
        <Bullet>Bienvenida con tu nombre.</Bullet>
        <Bullet>Lista de proyectos asignados (con código y nombre).</Bullet>
        <Bullet>Check-in de hoy (botón directo si no has hecho).</Bullet>
        <Bullet>Tarjeta "Notificaciones": botón para activar/desactivar push.</Bullet>

        <Text style={s.h2}>11.2 Check-in GPS</Text>
        <Step n={1}>
          <Text style={s.p}>Tap "Check-in" en bottom nav.</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>Selecciona proyecto y tipo (entrada/salida).</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>El navegador pide permiso de ubicación → permite.</Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>El sistema valida que estás dentro del geofence del proyecto (radio configurado por gerencia).</Text>
        </Step>
        <Step n={5}>
          <Text style={s.p}>Confirma → queda registrado con timestamp, latitud, longitud y distancia a la obra.</Text>
        </Step>

        <Text style={s.h2}>11.3 RDO (Parte Diario)</Text>
        <Bullet>Selecciona proyecto y fecha.</Bullet>
        <Bullet>Por cada partida ejecutada hoy: cantidad, observaciones.</Bullet>
        <Bullet>Cuadrilla asignada (opcional).</Bullet>
        <Bullet>Clima y observaciones generales del día.</Bullet>
        <Bullet>El gerente lo ve consolidado en /proyectos/[id]/rdos.</Bullet>

        <Text style={s.h2}>11.4 Evidencias fotográficas</Text>
        <Bullet>Toma foto con la cámara o sube de galería.</Bullet>
        <Bullet>Captura GPS automático al momento de tomar.</Bullet>
        <Bullet>Asocia a partida del proyecto (opcional).</Bullet>
        <Bullet>Descripción corta.</Bullet>
        <Bullet>Las fotos se ven en la galería del proyecto y en el menú del residente.</Bullet>

        <Text style={s.h2}>11.5 SST · Seguridad y Salud en el Trabajo</Text>
        <Bullet><Text style={{ fontWeight: 700 }}>Charla 5 minutos:</Text> tema del día + participantes.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Observación:</Text> condición o acto inseguro detectado.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Incidente:</Text> evento ocurrido con daño potencial o real.</Bullet>

        <Text style={s.h2}>11.6 Documentos del proyecto</Text>
        <Bullet>Subir documento (PDF, imagen) con título, carpeta (general/planos/contratos/cotizaciones/fichas/permisos) y visibilidad.</Bullet>
        <Bullet>Residentes solo pueden subir como "Pública".</Bullet>
        <Bullet>Mandos pueden subir "Mando" (solo gerencia/jefes/admin) o "Gerencia" (solo gerencia general).</Bullet>
        <Footer />
      </Page>

      {/* 12. SST */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>12. SST · Seguridad y Salud en el Trabajo</Text>
        <Text style={s.p}>
          Cumplimiento de normativa peruana. Tres tipos de registro desde la PWA del residente
          que la gerencia ve consolidado en la ficha del proyecto.
        </Text>

        <Text style={s.h2}>12.1 Charla de 5 minutos</Text>
        <Bullet>Diaria, antes de iniciar labores.</Bullet>
        <Bullet>Registra tema, líder y participantes.</Bullet>
        <Bullet>Indicador de cumplimiento en el dashboard del proyecto.</Bullet>

        <Text style={s.h2}>12.2 Observación de seguridad</Text>
        <Bullet>Condición o acto inseguro detectado.</Bullet>
        <Bullet>Categoría: condición / acto / otros.</Bullet>
        <Bullet>Acción correctiva sugerida.</Bullet>
        <Bullet>Foto opcional.</Bullet>

        <Text style={s.h2}>12.3 Incidente</Text>
        <Bullet>Severidad: bajo / medio / alto.</Bullet>
        <Bullet>Tipo: con daño / sin daño / casi accidente.</Bullet>
        <Bullet>Descripción detallada + foto.</Bullet>
        <Bullet>Estado: abierto / en investigación / cerrado.</Bullet>
        <View style={s.noteWarning}>
          <Text>Los incidentes de severidad alta deben investigarse y cerrarse dentro de 24h según norma G.050.</Text>
        </View>

        <Footer />
      </Page>

      {/* 12. DOCUMENTOS */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>13. Documentos del proyecto</Text>
        <Text style={s.p}>
          Repositorio de archivos por proyecto con sistema de visibilidad de 3 niveles.
        </Text>

        <Text style={s.h2}>13.1 Carpetas disponibles</Text>
        <Bullet>General</Bullet>
        <Bullet>Planos</Bullet>
        <Bullet>Contratos</Bullet>
        <Bullet>Cotizaciones</Bullet>
        <Bullet>Fichas técnicas</Bullet>
        <Bullet>Permisos</Bullet>

        <Text style={s.h2}>13.2 Niveles de visibilidad</Text>
        <View style={s.tableHead}>
          <Text style={{ flex: 1 }}>Visibilidad</Text>
          <Text style={{ flex: 3 }}>Quién ve / Quién puede subir</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1, color: BRAND.success, fontWeight: 700 }}>Pública</Text>
          <Text style={{ flex: 3 }}>Todos con acceso al proyecto (incluye residentes). Cualquier rol puede subir.</Text>
        </View>
        <View style={[s.tableRow, s.tableRowAlt]}>
          <Text style={{ flex: 1, color: BRAND.warning, fontWeight: 700 }}>Mando</Text>
          <Text style={{ flex: 3 }}>Solo gerencia, jefes y administrador. Residente NO ve. Suben gerencia/jefes/admin.</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>Gerencia</Text>
          <Text style={{ flex: 3 }}>Solo gerencia general. Sube solo gerencia general.</Text>
        </View>

        <Text style={s.h2}>13.3 Acceso</Text>
        <Bullet>ERP: ficha del proyecto → sección "Documentos del proyecto" (compacta) o /proyectos/[id]/documentos (completa).</Bullet>
        <Bullet>PWA: bottom nav "Más" → "Documentos".</Bullet>
        <Bullet>Cada documento se descarga con URL firmada (1 hora de validez) por seguridad.</Bullet>

        <View style={s.noteInfo}>
          <Text>Las restricciones de visibilidad se aplican por RLS en la base de datos, no solo en la UI. Un usuario sin permisos no puede acceder ni con URL directa.</Text>
        </View>

        <Footer />
      </Page>

      {/* 13. DASHBOARD + AUDITORIA */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>14. Dashboard ejecutivo y Auditoría</Text>

        <Text style={s.h2}>14.1 Dashboard (/dashboard)</Text>
        <Text style={s.p}>Visión 360 para gerencia. Solo gerencia_general por defecto.</Text>
        <Bullet><Text style={{ fontWeight: 700 }}>4 KPI cards:</Text> Proyectos activos · Cartera en contrato · Solicitudes pendientes · Proyectos en riesgo.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Sección "Proyectos con alertas":</Text> top 8 con su alerta crítica más importante, clickeable al detalle.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Gráfico avance vs gasto:</Text> contractual / ejecutado físico / gastado real por proyecto.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Gasto por categoría:</Text> pie chart con distribución de solicitudes pagadas.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Cartera por estado:</Text> cantidad y monto agrupado.</Bullet>
        <Bullet><Text style={{ fontWeight: 700 }}>Detalle por proyecto:</Text> tabla con código, contractual, ejecutado, gastado, % avance y estado.</Bullet>

        <Text style={s.h2}>14.2 Motor de alertas automáticas</Text>
        <Text style={s.p}>Cada proyecto se evalúa contra estas reglas y muestra banner en su ficha:</Text>
        <View style={s.tableHead}>
          <Text style={{ flex: 1 }}>Severidad</Text>
          <Text style={{ flex: 4 }}>Condición</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>Crítica</Text>
          <Text style={{ flex: 4 }}>Cronograma vencido | Presupuesto agotado ({'>='}100% del contrato) | Sobrecosto severo ({'>'}15% gastado vs ejecutado)</Text>
        </View>
        <View style={[s.tableRow, s.tableRowAlt]}>
          <Text style={{ flex: 1, color: BRAND.warning, fontWeight: 700 }}>Alta</Text>
          <Text style={{ flex: 4 }}>Cierre próximo ({'<='}7 días) | Presupuesto al 90% | Posible sobrecosto ({'>'}5%) | Sin avance reportado en 14 días</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1, color: BRAND.coral, fontWeight: 700 }}>Media</Text>
          <Text style={{ flex: 4 }}>Ritmo de avance bajo (faltan {'<='}30 días, avance {'<'}80%)</Text>
        </View>
        <View style={[s.tableRow, s.tableRowAlt]}>
          <Text style={{ flex: 1, color: BRAND.muted, fontWeight: 700 }}>Info</Text>
          <Text style={{ flex: 4 }}>Ubicación GPS no configurada</Text>
        </View>

        <Text style={s.h2}>14.3 Auditoría (/auditoria)</Text>
        <Text style={s.p}>Solo gerencia_general. Log inmutable de TODOS los cambios en tablas críticas.</Text>
        <Bullet>Cuándo · Actor · ¿Qué pasó? (descripción humana) · Proyecto afectado · Tabla técnica · Acción · Diff.</Bullet>
        <Bullet>Filtros por tabla y por acción (INSERT/UPDATE/DELETE).</Bullet>
        <Bullet>Las descripciones traducen acciones técnicas a lenguaje natural: "Aprobó la solicitud", "Programó un pago", "Cobró la valorización", etc.</Bullet>
        <Bullet>Diff técnico expandible para forense profundo.</Bullet>

        <Footer />
      </Page>

      {/* 14. NOTIFICACIONES */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>15. Notificaciones push</Text>
        <Text style={s.p}>
          Sistema de notificaciones móviles vía Web Push (VAPID). Funciona en Chrome Android y
          Safari iOS 16.4+ con PWA instalada.
        </Text>

        <Text style={s.h2}>15.1 Activación</Text>
        <Step n={1}>
          <Text style={s.p}>Abre la PWA instalada en tu celular.</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}>En /inicio busca la tarjeta "Notificaciones" → tap "Activar notificaciones".</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}>El navegador pide permiso → "Permitir".</Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}>Tu suscripción queda registrada en la BD. Confirmas con un push de bienvenida.</Text>
        </Step>

        <Text style={s.h2}>15.2 Eventos que disparan push</Text>
        <View style={s.tableHead}>
          <Text style={{ flex: 2 }}>Acción</Text>
          <Text style={{ flex: 2 }}>Quién recibe</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 2 }}>Crear solicitud de pago</Text>
          <Text style={{ flex: 2 }}>Todos los aprobadores con PWA activa</Text>
        </View>
        <View style={[s.tableRow, s.tableRowAlt]}>
          <Text style={{ flex: 2 }}>Aprobar / Rechazar solicitud</Text>
          <Text style={{ flex: 2 }}>El solicitante</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 2 }}>Programar pago</Text>
          <Text style={{ flex: 2 }}>El solicitante</Text>
        </View>
        <View style={[s.tableRow, s.tableRowAlt]}>
          <Text style={{ flex: 2 }}>Subir voucher (pago ejecutado)</Text>
          <Text style={{ flex: 2 }}>El solicitante</Text>
        </View>

        <Text style={s.h2}>15.3 Endpoints de diagnóstico</Text>
        <Bullet><Text style={s.mono}>/api/push/test</Text> — envía push de prueba al usuario logueado.</Bullet>
        <Bullet><Text style={s.mono}>/api/push/diag</Text> — diagnóstico de VAPID, suscripciones y prueba real.</Bullet>

        <Footer />
      </Page>

      {/* 15. TIPO DE CAMBIO */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>16. Tipo de cambio SUNAT</Text>
        <Text style={s.p}>
          En el listado y el detalle de cotizaciones verás un banner con el tipo de cambio
          USD/PEN actual. El sistema usa una cascada de fuentes:
        </Text>
        <View style={s.tableHead}>
          <Text style={{ flex: 1 }}>Orden</Text>
          <Text style={{ flex: 3 }}>Fuente</Text>
          <Text style={{ flex: 1 }}>Badge</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1 }}>1</Text>
          <Text style={{ flex: 3 }}>apis.net.pe SUNAT v2</Text>
          <Text style={{ flex: 1, color: BRAND.success, fontWeight: 700 }}>Oficial</Text>
        </View>
        <View style={[s.tableRow, s.tableRowAlt]}>
          <Text style={{ flex: 1 }}>2</Text>
          <Text style={{ flex: 3 }}>apis.net.pe SUNAT v1</Text>
          <Text style={{ flex: 1, color: BRAND.success, fontWeight: 700 }}>Oficial</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1 }}>3</Text>
          <Text style={{ flex: 3 }}>open.er-api.com (mercado internacional)</Text>
          <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>Mercado</Text>
        </View>
        <View style={[s.tableRow, s.tableRowAlt]}>
          <Text style={{ flex: 1 }}>4</Text>
          <Text style={{ flex: 3 }}>api.exchangerate-api.com (fallback)</Text>
          <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>Mercado</Text>
        </View>
        <View style={s.noteInfo}>
          <Text>
            El tipo de cambio se cachea por 1 hora. Si todas las fuentes fallan, el banner
            simplemente no se muestra (nunca valores inventados).
          </Text>
        </View>

        <Footer />
      </Page>

      {/* 17. REPORTES FINANCIEROS */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>17. Reportes financieros y exportaciones</Text>
        <Text style={s.p}>
          AZUR genera reportes en Excel y PDF para análisis y entrega al cliente. Acceso desde
          /finanzas/reportes o desde el detalle de cada documento.
        </Text>

        <Text style={s.h2}>17.1 Reportes Excel (/finanzas/reportes)</Text>
        <View style={s.tableHead}>
          <Text style={{ flex: 1 }}>Reporte</Text>
          <Text style={{ flex: 3 }}>Contenido</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>Semanal</Text>
          <Text style={{ flex: 3 }}>
            Solicitudes y pagos de los últimos 7 días con totales por proyecto y categoría.
          </Text>
        </View>
        <View style={[s.tableRow, s.tableRowAlt]}>
          <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>Quincenal</Text>
          <Text style={{ flex: 3 }}>
            Últimos 15 días — sincronizado con valorizaciones quincenales.
          </Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 1, color: BRAND.red, fontWeight: 700 }}>Mensual</Text>
          <Text style={{ flex: 3 }}>Mes actual hasta hoy, multi-proyecto.</Text>
        </View>
        <Text style={s.pMuted}>
          Generados con ExcelJS. Incluyen autoformato, totales, filtros nativos de Excel.
        </Text>

        <Text style={s.h2}>17.2 PDFs disponibles</Text>
        <Bullet>
          <Text style={{ fontWeight: 700 }}>Cotización profesional:</Text> botón "Descargar PDF"
          en el detalle de cada cotización. Logo, partidas, APU, totales, validez.
        </Bullet>
        <Bullet>
          <Text style={{ fontWeight: 700 }}>Valorización quincenal:</Text> botón en el detalle de
          la valorización. Formato sector construcción.
        </Bullet>
        <Bullet>
          <Text style={{ fontWeight: 700 }}>Voucher de pago:</Text> URL pública generada al subir
          el comprobante. Lista para WhatsApp.
        </Bullet>
        <Bullet>
          <Text style={{ fontWeight: 700 }}>Manual de usuario:</Text> /manual o /api/manual/pdf
          (este documento).
        </Bullet>

        <Text style={s.h2}>17.3 Dashboard ejecutivo (interactivo)</Text>
        <Text style={s.p}>
          /dashboard es el "reporte vivo" que actualiza KPIs en tiempo real (cartera, alertas,
          avance vs gasto, gasto por categoría). No es descargable pero refleja siempre el
          estado actual del sistema.
        </Text>

        <Footer />
      </Page>

      {/* 18. FLUJO E2E */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>18. Flujo end-to-end de una obra</Text>
        <Text style={s.p}>
          Caso real desde la cotización hasta el cierre del proyecto, indicando qué rol hace qué.
        </Text>

        <Text style={s.h2}>Fase 1 · Comercial</Text>
        <Step n={1}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Comercial:</Text> crea cliente nuevo en /clientes (si no existe).</Text>
        </Step>
        <Step n={2}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Jefe Presupuestos:</Text> arma APU en /comercial/apu para cada partida del scope.</Text>
        </Step>
        <Step n={3}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Comercial:</Text> crea cotización en /comercial/cotizaciones/nueva, asigna cliente, agrega partidas, descarga PDF.</Text>
        </Step>
        <Step n={4}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Comercial:</Text> envía PDF al cliente vía email/WhatsApp. Cambia estado a "enviada".</Text>
        </Step>
        <Step n={5}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Cliente aprueba:</Text> Comercial cambia estado a "aprobada" → el sistema crea automáticamente el Proyecto con código PRY-NNNN-NNNN y copia las partidas.</Text>
        </Step>

        <Text style={s.h2}>Fase 2 · Setup del proyecto</Text>
        <Step n={6}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Jefe Proyectos:</Text> configura ubicación GPS del proyecto (ubigeo + mapa + radio geofence).</Text>
        </Step>
        <Step n={7}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Gerencia:</Text> en /usuarios asigna al residente al proyecto en la tabla "Asignaciones".</Text>
        </Step>
        <Step n={8}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Administrador:</Text> compra materiales/herramientas iniciales en /inventario (form "Registrar compra"). El stock central sube.</Text>
        </Step>

        <Text style={s.h2}>Fase 3 · Ejecución</Text>
        <Step n={9}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Residente:</Text> instala la PWA, activa notificaciones, hace check-in al llegar a obra.</Text>
        </Step>
        <Step n={10}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Residente:</Text> registra salida de herramientas del almacén (con validación de stock).</Text>
        </Step>
        <Step n={11}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Residente:</Text> sube parte diario (RDO) al final del día + evidencias fotográficas + charla SST.</Text>
        </Step>
        <Step n={12}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Residente:</Text> cuando necesita pagar a proveedor, crea solicitud de pago desde PWA con foto del comprobante.</Text>
        </Step>
        <Step n={13}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Aprobadores:</Text> reciben push, revisan en /finanzas/aprobaciones, aprueban.</Text>
        </Step>
        <Step n={14}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Administrador:</Text> programa el pago (banco + número operación), realiza la transferencia.</Text>
        </Step>
        <Step n={15}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Administrador:</Text> sube voucher → estado pasa a "pagada" → residente recibe push y URL para WhatsApp.</Text>
        </Step>

        <Text style={s.h2}>Fase 4 · Valorización y cobro</Text>
        <Step n={16}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Jefe Proyectos:</Text> cada 15 días genera valorización en /proyectos/[id]/valorizaciones con avances reales.</Text>
        </Step>
        <Step n={17}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Gerencia:</Text> aprueba valorización, descarga PDF, envía al cliente.</Text>
        </Step>
        <Step n={18}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Cliente paga:</Text> Administrador marca como "pagada" → auto-movimiento a caja central.</Text>
        </Step>

        <Text style={s.h2}>Fase 5 · Cierre</Text>
        <Step n={19}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Residente:</Text> devuelve herramientas al almacén central.</Text>
        </Step>
        <Step n={20}>
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Gerencia:</Text> cambia estado del proyecto a "cerrado". El sistema bloquea nuevas solicitudes.</Text>
        </Step>

        <Footer />
      </Page>

      {/* 17. FAQ */}
      <Page size="A4" style={s.page}>
        <HeaderBar />
        <Text style={s.h1}>19. FAQ y resolución de problemas</Text>

        <Text style={s.h2}>"No me llegan notificaciones push"</Text>
        <Bullet>Verifica que la PWA esté instalada (no solo abierta en navegador).</Bullet>
        <Bullet>Permisos de notificaciones del SO activos para AZUR.</Bullet>
        <Bullet>En MIUI/Xiaomi: Ajustes → Apps → AZUR → Batería → "Sin restricciones" y Autoinicio activado.</Bullet>
        <Bullet>Visita /api/push/diag desde el celular para diagnóstico completo.</Bullet>

        <Text style={s.h2}>"El check-in dice 'fuera del rango'"</Text>
        <Bullet>El proyecto no tiene GPS configurado, o el radio es muy chico, o realmente estás fuera.</Bullet>
        <Bullet>Pide a gerencia que ajuste coordenadas o suba el radio en /proyectos/[id] → Ubicación.</Bullet>

        <Text style={s.h2}>"El sistema bloquea mi salida de almacén"</Text>
        <Bullet>No hay suficiente stock en el central de ese insumo.</Bullet>
        <Bullet>Coordina con administrador para registrar la compra antes.</Bullet>

        <Text style={s.h2}>"No puedo aprobar una solicitud"</Text>
        <Bullet>Tu rol no es aprobador (solo gerencia, jefe proyectos, jefe presupuestos, administrador).</Bullet>
        <Bullet>La solicitud ya está en otro estado (rechazada, cancelada, pagada).</Bullet>

        <Text style={s.h2}>"El PDF de cotización no genera"</Text>
        <Bullet>La cotización no tiene partidas — agrega al menos una.</Bullet>
        <Bullet>Verifica que tienes sesión activa (puede haberse cerrado por inactividad).</Bullet>

        <Text style={s.h2}>"Las horas se ven raras"</Text>
        <Bullet>El sistema fuerza zona horaria America/Lima en toda la UI.</Bullet>
        <Bullet>Si ves desfase, refresca con Ctrl+Shift+R (forzar recarga sin caché).</Bullet>

        <Text style={s.h2}>"¿Cómo cambio mi contraseña?"</Text>
        <Bullet>Por ahora se gestiona desde Supabase Auth. Próxima versión incluirá flujo de cambio desde la UI.</Bullet>

        <Text style={s.h2}>"Olvidé mi contraseña"</Text>
        <Bullet>Contacta al administrador del sistema (gerencia general) para reset desde Supabase.</Bullet>

        <Text style={s.h2}>Soporte y mejoras</Text>
        <View style={s.card}>
          <Text style={s.cardLabel}>Desarrollado por</Text>
          <Text style={s.cardTitle}>Promptive</Text>
          <Text style={s.cardText}>
            Contacto: Luigi Bravo · bravo.a.camus@gmail.com{'\n'}
            Reporta bugs y sugerencias al canal interno de la empresa.{'\n'}
            Repositorio: github.com/bravoacamus-droid/AZUR-ERP
          </Text>
        </View>

        <View style={[s.noteSuccess, { marginTop: 16 }]}>
          <Text>
            Este manual se genera dinámicamente desde el código en producción. Para descargarlo de
            nuevo, ve a /manual o ejecuta /api/manual/pdf desde tu navegador con sesión activa.
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}

// ------------ Datos verificados desde el código ------------

const USERS_DEV = [
  { email: 'gerencia@azur.dev', rol: 'gerencia_general', nombre: 'Juan Valiente Pizarro' },
  { email: 'jefeproy@azur.dev', rol: 'jefe_proyectos', nombre: 'Carlos Mendoza Ríos' },
  { email: 'jefepres@azur.dev', rol: 'jefe_presupuestos', nombre: 'Lucía Quispe Torres' },
  { email: 'admin@azur.dev', rol: 'administrador', nombre: 'María Salazar Vega' },
  { email: 'comercial@azur.dev', rol: 'comercial', nombre: 'Diego Paredes Núñez' },
  { email: 'residente@azur.dev', rol: 'residente', nombre: 'Pedro Huamán Cusi' },
];

const ROLES = [
  { rol: 'gerencia_general', home: '/dashboard', accesos: 'Todo: dashboard, proyectos, cotizaciones, clientes, catálogo, finanzas completas, cajas, reportes, usuarios, auditoría, almacén' },
  { rol: 'jefe_proyectos', home: '/proyectos', accesos: 'Proyectos, finanzas (aprobaciones/solicitudes/pagos/reportes), almacén, clientes' },
  { rol: 'jefe_presupuestos', home: '/proyectos', accesos: 'Comercial (cotizaciones, catálogo, APU), proyectos, clientes' },
  { rol: 'administrador', home: '/finanzas/aprobaciones', accesos: 'Finanzas (aprobaciones, solicitudes, pagos, cajas, reportes), almacén, clientes' },
  { rol: 'comercial', home: '/comercial/cotizaciones', accesos: 'Comercial (cotizaciones, catálogo, APU), clientes' },
  { rol: 'residente', home: '/inicio', accesos: 'PWA solamente: check-in, RDO, evidencias, solicitudes, SST, almacén, documentos' },
];

// componente auxiliar
function Toc({ n, titulo }: { n: string; titulo: string }) {
  return (
    <View style={s.tocItem}>
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <Text style={s.tocNum}>{n}</Text>
        <Text style={s.tocText}>{titulo}</Text>
      </View>
    </View>
  );
}

