export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abonos_cliente: {
        Row: {
          created_at: string
          created_by: string | null
          cuenta_origen: string | null
          es_adelanto: boolean
          factura_id: string | null
          fecha: string
          id: string
          metodo: string | null
          monto: number
          proyecto_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cuenta_origen?: string | null
          es_adelanto?: boolean
          factura_id?: string | null
          fecha?: string
          id?: string
          metodo?: string | null
          monto: number
          proyecto_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cuenta_origen?: string | null
          es_adelanto?: boolean
          factura_id?: string | null
          fecha?: string
          id?: string
          metodo?: string | null
          monto?: number
          proyecto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abonos_cliente_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonos_cliente_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonos_cliente_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonos_cliente_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      adelantos: {
        Row: {
          concepto: string
          created_at: string
          created_by: string | null
          fecha: string
          id: string
          monto: number
          proyecto_id: string
          tipo: string
        }
        Insert: {
          concepto: string
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          monto?: number
          proyecto_id: string
          tipo?: string
        }
        Update: {
          concepto?: string
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          monto?: number
          proyecto_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "adelantos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adelantos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adelantos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      adicionales_deductivos: {
        Row: {
          aprobado_por: string | null
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["estado_adicional"]
          id: string
          monto: number
          proyecto_id: string
          proyecto_item_id: string | null
          solicitado_por: string | null
          sustento_url: string | null
          tipo: Database["public"]["Enums"]["tipo_adicional"]
        }
        Insert: {
          aprobado_por?: string | null
          created_at?: string
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_adicional"]
          id?: string
          monto?: number
          proyecto_id: string
          proyecto_item_id?: string | null
          solicitado_por?: string | null
          sustento_url?: string | null
          tipo: Database["public"]["Enums"]["tipo_adicional"]
        }
        Update: {
          aprobado_por?: string | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_adicional"]
          id?: string
          monto?: number
          proyecto_id?: string
          proyecto_item_id?: string | null
          solicitado_por?: string | null
          sustento_url?: string | null
          tipo?: Database["public"]["Enums"]["tipo_adicional"]
        }
        Relationships: [
          {
            foreignKeyName: "adicionales_deductivos_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adicionales_deductivos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adicionales_deductivos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
          {
            foreignKeyName: "adicionales_deductivos_proyecto_item_id_fkey"
            columns: ["proyecto_item_id"]
            isOneToOne: false
            referencedRelation: "proyecto_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adicionales_deductivos_solicitado_por_fkey"
            columns: ["solicitado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas: {
        Row: {
          created_at: string
          detalle: string | null
          id: string
          proyecto_id: string | null
          resuelta: boolean
          severidad: Database["public"]["Enums"]["severidad_alerta"]
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          detalle?: string | null
          id?: string
          proyecto_id?: string | null
          resuelta?: boolean
          severidad?: Database["public"]["Enums"]["severidad_alerta"]
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          detalle?: string | null
          id?: string
          proyecto_id?: string | null
          resuelta?: boolean
          severidad?: Database["public"]["Enums"]["severidad_alerta"]
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      apu_componentes: {
        Row: {
          cantidad: number
          cotizacion_item_id: string
          created_at: string
          cuadrilla: number | null
          descripcion: string
          id: string
          orden: number
          precio: number
          rendimiento: number | null
          tipo: Database["public"]["Enums"]["apu_tipo"]
          unidad: string | null
        }
        Insert: {
          cantidad?: number
          cotizacion_item_id: string
          created_at?: string
          cuadrilla?: number | null
          descripcion: string
          id?: string
          orden?: number
          precio?: number
          rendimiento?: number | null
          tipo?: Database["public"]["Enums"]["apu_tipo"]
          unidad?: string | null
        }
        Update: {
          cantidad?: number
          cotizacion_item_id?: string
          created_at?: string
          cuadrilla?: number | null
          descripcion?: string
          id?: string
          orden?: number
          precio?: number
          rendimiento?: number | null
          tipo?: Database["public"]["Enums"]["apu_tipo"]
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apu_componentes_cotizacion_item_id_fkey"
            columns: ["cotizacion_item_id"]
            isOneToOne: false
            referencedRelation: "cotizacion_items"
            referencedColumns: ["id"]
          },
        ]
      }
      apu_proyecto: {
        Row: {
          cantidad: number
          created_at: string
          cuadrilla: number | null
          descripcion: string
          id: string
          orden: number
          precio: number
          proyecto_item_id: string
          rendimiento: number | null
          tipo: Database["public"]["Enums"]["apu_tipo"]
          unidad: string | null
        }
        Insert: {
          cantidad?: number
          created_at?: string
          cuadrilla?: number | null
          descripcion: string
          id?: string
          orden?: number
          precio?: number
          proyecto_item_id: string
          rendimiento?: number | null
          tipo?: Database["public"]["Enums"]["apu_tipo"]
          unidad?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          cuadrilla?: number | null
          descripcion?: string
          id?: string
          orden?: number
          precio?: number
          proyecto_item_id?: string
          rendimiento?: number | null
          tipo?: Database["public"]["Enums"]["apu_tipo"]
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apu_proyecto_proyecto_item_id_fkey"
            columns: ["proyecto_item_id"]
            isOneToOne: false
            referencedRelation: "proyecto_items"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencias: {
        Row: {
          id: string
          lat: number | null
          lng: number | null
          profile_id: string | null
          proyecto_id: string | null
          registrado_at: string
          tipo: Database["public"]["Enums"]["tipo_asistencia"]
        }
        Insert: {
          id?: string
          lat?: number | null
          lng?: number | null
          profile_id?: string | null
          proyecto_id?: string | null
          registrado_at?: string
          tipo: Database["public"]["Enums"]["tipo_asistencia"]
        }
        Update: {
          id?: string
          lat?: number | null
          lng?: number | null
          profile_id?: string | null
          proyecto_id?: string | null
          registrado_at?: string
          tipo?: Database["public"]["Enums"]["tipo_asistencia"]
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      audit_log: {
        Row: {
          accion: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          registro_id: string | null
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          registro_id?: string | null
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          registro_id?: string | null
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      cajas: {
        Row: {
          activa: boolean
          asignacion_semanal: number
          created_at: string
          id: string
          modalidad: Database["public"]["Enums"]["modalidad_cobro"] | null
          monto_maximo: number | null
          nombre: string
          proyecto_id: string | null
          responsable_id: string | null
          saldo_inicial: number | null
          tipo: Database["public"]["Enums"]["tipo_caja"]
        }
        Insert: {
          activa?: boolean
          asignacion_semanal?: number
          created_at?: string
          id?: string
          modalidad?: Database["public"]["Enums"]["modalidad_cobro"] | null
          monto_maximo?: number | null
          nombre: string
          proyecto_id?: string | null
          responsable_id?: string | null
          saldo_inicial?: number | null
          tipo?: Database["public"]["Enums"]["tipo_caja"]
        }
        Update: {
          activa?: boolean
          asignacion_semanal?: number
          created_at?: string
          id?: string
          modalidad?: Database["public"]["Enums"]["modalidad_cobro"] | null
          monto_maximo?: number | null
          nombre?: string
          proyecto_id?: string | null
          responsable_id?: string | null
          saldo_inicial?: number | null
          tipo?: Database["public"]["Enums"]["tipo_caja"]
        }
        Relationships: [
          {
            foreignKeyName: "cajas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cajas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
          {
            foreignKeyName: "cajas_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo_apu: {
        Row: {
          cantidad: number
          catalogo_partida_id: string
          cuadrilla: number | null
          descripcion: string
          id: string
          orden: number
          precio: number
          rendimiento: number | null
          tipo: Database["public"]["Enums"]["apu_tipo"]
          unidad: string | null
        }
        Insert: {
          cantidad?: number
          catalogo_partida_id: string
          cuadrilla?: number | null
          descripcion: string
          id?: string
          orden?: number
          precio?: number
          rendimiento?: number | null
          tipo?: Database["public"]["Enums"]["apu_tipo"]
          unidad?: string | null
        }
        Update: {
          cantidad?: number
          catalogo_partida_id?: string
          cuadrilla?: number | null
          descripcion?: string
          id?: string
          orden?: number
          precio?: number
          rendimiento?: number | null
          tipo?: Database["public"]["Enums"]["apu_tipo"]
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_apu_catalogo_partida_id_fkey"
            columns: ["catalogo_partida_id"]
            isOneToOne: false
            referencedRelation: "catalogo_partidas"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo_insumos: {
        Row: {
          codigo: string | null
          created_at: string
          id: string
          nombre: string
          precio: number | null
          tipo: string | null
          unidad: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          id?: string
          nombre: string
          precio?: number | null
          tipo?: string | null
          unidad?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          id?: string
          nombre?: string
          precio?: number | null
          tipo?: string | null
          unidad?: string | null
        }
        Relationships: []
      }
      catalogo_partidas: {
        Row: {
          codigo: string | null
          costo_referencial: number | null
          created_at: string
          descripcion: string
          id: string
          linea_id: string | null
          unidad: string | null
        }
        Insert: {
          codigo?: string | null
          costo_referencial?: number | null
          created_at?: string
          descripcion: string
          id?: string
          linea_id?: string | null
          unidad?: string | null
        }
        Update: {
          codigo?: string | null
          costo_referencial?: number | null
          created_at?: string
          descripcion?: string
          id?: string
          linea_id?: string | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_partidas_linea_id_fkey"
            columns: ["linea_id"]
            isOneToOne: false
            referencedRelation: "lineas_negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          banco: string | null
          cci: string | null
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          created_at: string
          cuenta: string | null
          cuenta_detraccion: string | null
          id: string
          lat: number | null
          lng: number | null
          origen: Database["public"]["Enums"]["origen_lead"] | null
          razon_social: string
          recomendado_por: string | null
          ruc_dni: string | null
          tipo_doc: string
          ubicacion: string | null
        }
        Insert: {
          banco?: string | null
          cci?: string | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          cuenta?: string | null
          cuenta_detraccion?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          origen?: Database["public"]["Enums"]["origen_lead"] | null
          razon_social: string
          recomendado_por?: string | null
          ruc_dni?: string | null
          tipo_doc?: string
          ubicacion?: string | null
        }
        Update: {
          banco?: string | null
          cci?: string | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          cuenta?: string | null
          cuenta_detraccion?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          origen?: Database["public"]["Enums"]["origen_lead"] | null
          razon_social?: string
          recomendado_por?: string | null
          ruc_dni?: string | null
          tipo_doc?: string
          ubicacion?: string | null
        }
        Relationships: []
      }
      contrapartes: {
        Row: {
          banco: string | null
          cci: string | null
          contacto: string | null
          created_at: string
          cuenta: string | null
          cuenta_detraccion: string | null
          especialidad: string | null
          id: string
          razon_social: string
          ruc_dni: string | null
          telefono: string | null
          tipo: Database["public"]["Enums"]["tipo_contraparte"]
        }
        Insert: {
          banco?: string | null
          cci?: string | null
          contacto?: string | null
          created_at?: string
          cuenta?: string | null
          cuenta_detraccion?: string | null
          especialidad?: string | null
          id?: string
          razon_social: string
          ruc_dni?: string | null
          telefono?: string | null
          tipo?: Database["public"]["Enums"]["tipo_contraparte"]
        }
        Update: {
          banco?: string | null
          cci?: string | null
          contacto?: string | null
          created_at?: string
          cuenta?: string | null
          cuenta_detraccion?: string | null
          especialidad?: string | null
          id?: string
          razon_social?: string
          ruc_dni?: string | null
          telefono?: string | null
          tipo?: Database["public"]["Enums"]["tipo_contraparte"]
        }
        Relationships: []
      }
      cotizacion_formas_pago: {
        Row: {
          concepto: string
          cotizacion_id: string
          es_adelanto: boolean
          id: string
          orden: number
          porcentaje: number
        }
        Insert: {
          concepto: string
          cotizacion_id: string
          es_adelanto?: boolean
          id?: string
          orden?: number
          porcentaje?: number
        }
        Update: {
          concepto?: string
          cotizacion_id?: string
          es_adelanto?: boolean
          id?: string
          orden?: number
          porcentaje?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_formas_pago_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizacion_items: {
        Row: {
          cantidad: number | null
          costo_formula: string | null
          costo_unitario: number | null
          cotizacion_id: string
          created_at: string
          es_hoja: boolean
          id: string
          item_codigo: string | null
          margen_pct: number | null
          nivel: number
          orden: number
          parent_id: string | null
          tiene_apu: boolean
          titulo: string
          unidad: string | null
        }
        Insert: {
          cantidad?: number | null
          costo_formula?: string | null
          costo_unitario?: number | null
          cotizacion_id: string
          created_at?: string
          es_hoja?: boolean
          id?: string
          item_codigo?: string | null
          margen_pct?: number | null
          nivel?: number
          orden?: number
          parent_id?: string | null
          tiene_apu?: boolean
          titulo: string
          unidad?: string | null
        }
        Update: {
          cantidad?: number | null
          costo_formula?: string | null
          costo_unitario?: number | null
          cotizacion_id?: string
          created_at?: string
          es_hoja?: boolean
          id?: string
          item_codigo?: string | null
          margen_pct?: number | null
          nivel?: number
          orden?: number
          parent_id?: string | null
          tiene_apu?: boolean
          titulo?: string
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cotizacion_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizacion_versiones: {
        Row: {
          cotizacion_id: string
          created_at: string
          id: string
          justificacion: string | null
          snapshot: Json
          total: number | null
          usuario_id: string | null
          version: number
        }
        Insert: {
          cotizacion_id: string
          created_at?: string
          id?: string
          justificacion?: string | null
          snapshot: Json
          total?: number | null
          usuario_id?: string | null
          version: number
        }
        Update: {
          cotizacion_id?: string
          created_at?: string
          id?: string
          justificacion?: string | null
          snapshot?: Json
          total?: number | null
          usuario_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_versiones_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_versiones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          asunto: string | null
          cliente_id: string | null
          codigo: string | null
          condiciones: string | null
          correlativo: number
          created_at: string
          descripcion: string | null
          descuento_activo: boolean
          descuento_pct: number | null
          es_plantilla: boolean
          estado: Database["public"]["Enums"]["estado_cotizacion"]
          fecha: string
          ga_pct: number | null
          garantia: string | null
          garantia_activa: boolean
          gg_pct: number | null
          id: string
          igv_pct: number | null
          lat: number | null
          linea_id: string | null
          lng: number | null
          margen_min_pct: number | null
          moneda: Database["public"]["Enums"]["moneda_enum"]
          mostrar_equiv_pen: boolean
          mostrar_ga: boolean
          mostrar_gg: boolean
          mostrar_igv: boolean
          mostrar_utilidad: boolean
          motivo_rechazo: string | null
          origen: Database["public"]["Enums"]["origen_lead"] | null
          plantilla_id: string | null
          plazo_tipo: Database["public"]["Enums"]["plazo_tipo"] | null
          plazo_valor: number | null
          proyecto_id: string | null
          proyecto_nombre: string
          recomendado_por: string | null
          responsable_id: string | null
          revision_at: string | null
          revision_estado: string | null
          revision_nota: string | null
          revision_por: string | null
          revision_solicitada_por: string | null
          servicios_incluidos: string | null
          servicios_omitidos: string | null
          tipo_cambio: number | null
          tipo_cotizacion: Database["public"]["Enums"]["tipo_cotizacion"]
          tipo_proyecto: Database["public"]["Enums"]["tipo_proyecto"]
          ubicacion: string | null
          updated_at: string
          utilidad_pct: number | null
          version: number
          vigencia_dias: number | null
        }
        Insert: {
          asunto?: string | null
          cliente_id?: string | null
          codigo?: string | null
          condiciones?: string | null
          correlativo?: never
          created_at?: string
          descripcion?: string | null
          descuento_activo?: boolean
          descuento_pct?: number | null
          es_plantilla?: boolean
          estado?: Database["public"]["Enums"]["estado_cotizacion"]
          fecha?: string
          ga_pct?: number | null
          garantia?: string | null
          garantia_activa?: boolean
          gg_pct?: number | null
          id?: string
          igv_pct?: number | null
          lat?: number | null
          linea_id?: string | null
          lng?: number | null
          margen_min_pct?: number | null
          moneda?: Database["public"]["Enums"]["moneda_enum"]
          mostrar_equiv_pen?: boolean
          mostrar_ga?: boolean
          mostrar_gg?: boolean
          mostrar_igv?: boolean
          mostrar_utilidad?: boolean
          motivo_rechazo?: string | null
          origen?: Database["public"]["Enums"]["origen_lead"] | null
          plantilla_id?: string | null
          plazo_tipo?: Database["public"]["Enums"]["plazo_tipo"] | null
          plazo_valor?: number | null
          proyecto_id?: string | null
          proyecto_nombre: string
          recomendado_por?: string | null
          responsable_id?: string | null
          revision_at?: string | null
          revision_estado?: string | null
          revision_nota?: string | null
          revision_por?: string | null
          revision_solicitada_por?: string | null
          servicios_incluidos?: string | null
          servicios_omitidos?: string | null
          tipo_cambio?: number | null
          tipo_cotizacion?: Database["public"]["Enums"]["tipo_cotizacion"]
          tipo_proyecto?: Database["public"]["Enums"]["tipo_proyecto"]
          ubicacion?: string | null
          updated_at?: string
          utilidad_pct?: number | null
          version?: number
          vigencia_dias?: number | null
        }
        Update: {
          asunto?: string | null
          cliente_id?: string | null
          codigo?: string | null
          condiciones?: string | null
          correlativo?: never
          created_at?: string
          descripcion?: string | null
          descuento_activo?: boolean
          descuento_pct?: number | null
          es_plantilla?: boolean
          estado?: Database["public"]["Enums"]["estado_cotizacion"]
          fecha?: string
          ga_pct?: number | null
          garantia?: string | null
          garantia_activa?: boolean
          gg_pct?: number | null
          id?: string
          igv_pct?: number | null
          lat?: number | null
          linea_id?: string | null
          lng?: number | null
          margen_min_pct?: number | null
          moneda?: Database["public"]["Enums"]["moneda_enum"]
          mostrar_equiv_pen?: boolean
          mostrar_ga?: boolean
          mostrar_gg?: boolean
          mostrar_igv?: boolean
          mostrar_utilidad?: boolean
          motivo_rechazo?: string | null
          origen?: Database["public"]["Enums"]["origen_lead"] | null
          plantilla_id?: string | null
          plazo_tipo?: Database["public"]["Enums"]["plazo_tipo"] | null
          plazo_valor?: number | null
          proyecto_id?: string | null
          proyecto_nombre?: string
          recomendado_por?: string | null
          responsable_id?: string | null
          revision_at?: string | null
          revision_estado?: string | null
          revision_nota?: string | null
          revision_por?: string | null
          revision_solicitada_por?: string | null
          servicios_incluidos?: string | null
          servicios_omitidos?: string | null
          tipo_cambio?: number | null
          tipo_cotizacion?: Database["public"]["Enums"]["tipo_cotizacion"]
          tipo_proyecto?: Database["public"]["Enums"]["tipo_proyecto"]
          ubicacion?: string | null
          updated_at?: string
          utilidad_pct?: number | null
          version?: number
          vigencia_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_linea_id_fkey"
            columns: ["linea_id"]
            isOneToOne: false
            referencedRelation: "lineas_negocio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_cotizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma_cobros: {
        Row: {
          concepto: string
          condicion_tipo: Database["public"]["Enums"]["condicion_armada"]
          condicion_valor: number | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_armada"]
          factura_id: string | null
          fecha_esperada: string | null
          id: string
          monto: number | null
          orden: number
          porcentaje: number
          proyecto_id: string
        }
        Insert: {
          concepto: string
          condicion_tipo?: Database["public"]["Enums"]["condicion_armada"]
          condicion_valor?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_armada"]
          factura_id?: string | null
          fecha_esperada?: string | null
          id?: string
          monto?: number | null
          orden?: number
          porcentaje?: number
          proyecto_id: string
        }
        Update: {
          concepto?: string
          condicion_tipo?: Database["public"]["Enums"]["condicion_armada"]
          condicion_valor?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_armada"]
          factura_id?: string | null
          fecha_esperada?: string | null
          id?: string
          monto?: number | null
          orden?: number
          porcentaje?: number
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_cobros_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_cobros_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      cuentas_bancarias: {
        Row: {
          banco: string
          cci: string | null
          cliente_id: string | null
          contraparte_id: string | null
          created_at: string
          cuenta: string | null
          es_detraccion: boolean
          id: string
          moneda: string
        }
        Insert: {
          banco: string
          cci?: string | null
          cliente_id?: string | null
          contraparte_id?: string | null
          created_at?: string
          cuenta?: string | null
          es_detraccion?: boolean
          id?: string
          moneda?: string
        }
        Update: {
          banco?: string
          cci?: string | null
          cliente_id?: string | null
          contraparte_id?: string | null
          created_at?: string
          cuenta?: string | null
          es_detraccion?: boolean
          id?: string
          moneda?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuentas_bancarias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuentas_bancarias_contraparte_id_fkey"
            columns: ["contraparte_id"]
            isOneToOne: false
            referencedRelation: "contrapartes"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          carpeta: string
          created_at: string
          created_by: string | null
          id: string
          nombre: string
          proyecto_id: string | null
          tipo: string | null
          url: string
          visibilidad: Database["public"]["Enums"]["visibilidad_doc"]
        }
        Insert: {
          carpeta?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nombre: string
          proyecto_id?: string | null
          tipo?: string | null
          url: string
          visibilidad?: Database["public"]["Enums"]["visibilidad_doc"]
        }
        Update: {
          carpeta?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nombre?: string
          proyecto_id?: string | null
          tipo?: string | null
          url?: string
          visibilidad?: Database["public"]["Enums"]["visibilidad_doc"]
        }
        Relationships: [
          {
            foreignKeyName: "documentos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      evidencias: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          id: string
          lat: number | null
          lng: number | null
          proyecto_id: string
          proyecto_item_id: string | null
          rdo_id: string | null
          tomada_en: string | null
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          proyecto_id: string
          proyecto_item_id?: string | null
          rdo_id?: string | null
          tomada_en?: string | null
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          proyecto_id?: string
          proyecto_item_id?: string | null
          rdo_id?: string | null
          tomada_en?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
          {
            foreignKeyName: "evidencias_proyecto_item_id_fkey"
            columns: ["proyecto_item_id"]
            isOneToOne: false
            referencedRelation: "proyecto_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "partes_diarios"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          armada_id: string | null
          cliente_id: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_factura"]
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          monto: number
          monto_cobrado: number
          numero: string | null
          proyecto_id: string | null
        }
        Insert: {
          armada_id?: string | null
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          monto?: number
          monto_cobrado?: number
          numero?: string | null
          proyecto_id?: string | null
        }
        Update: {
          armada_id?: string | null
          cliente_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          monto?: number
          monto_cobrado?: number
          numero?: string | null
          proyecto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_armada_id_fkey"
            columns: ["armada_id"]
            isOneToOne: false
            referencedRelation: "cronograma_cobros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      hitos: {
        Row: {
          created_at: string
          cumplido: boolean
          fecha_comprometida: string
          id: string
          nombre: string
          proyecto_id: string
        }
        Insert: {
          created_at?: string
          cumplido?: boolean
          fecha_comprometida: string
          id?: string
          nombre: string
          proyecto_id: string
        }
        Update: {
          created_at?: string
          cumplido?: boolean
          fecha_comprometida?: string
          id?: string
          nombre?: string
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hitos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hitos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      inventario_items: {
        Row: {
          codigo: string | null
          created_at: string
          id: string
          nombre: string
          stock: number
          tipo: Database["public"]["Enums"]["tipo_inventario"]
          unidad: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          id?: string
          nombre: string
          stock?: number
          tipo?: Database["public"]["Enums"]["tipo_inventario"]
          unidad?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          id?: string
          nombre?: string
          stock?: number
          tipo?: Database["public"]["Enums"]["tipo_inventario"]
          unidad?: string | null
        }
        Relationships: []
      }
      lineas_negocio: {
        Row: {
          activo: boolean
          codigo: string
          color: string
          created_at: string
          id: string
          logo_url: string | null
          nombre: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          color?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          nombre: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          color?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          nombre?: string
        }
        Relationships: []
      }
      medios_pago_empresa: {
        Row: {
          banco: string
          cci_dolares: string | null
          cci_soles: string | null
          created_at: string
          cuenta_dolares: string | null
          cuenta_soles: string | null
          es_detraccion: boolean
          id: string
          logo_url: string | null
          mostrar_cotizacion: boolean
          mostrar_liquidacion: boolean
          mostrar_valorizacion: boolean
          orden: number
          titular: string
        }
        Insert: {
          banco: string
          cci_dolares?: string | null
          cci_soles?: string | null
          created_at?: string
          cuenta_dolares?: string | null
          cuenta_soles?: string | null
          es_detraccion?: boolean
          id?: string
          logo_url?: string | null
          mostrar_cotizacion?: boolean
          mostrar_liquidacion?: boolean
          mostrar_valorizacion?: boolean
          orden?: number
          titular: string
        }
        Update: {
          banco?: string
          cci_dolares?: string | null
          cci_soles?: string | null
          created_at?: string
          cuenta_dolares?: string | null
          cuenta_soles?: string | null
          es_detraccion?: boolean
          id?: string
          logo_url?: string | null
          mostrar_cotizacion?: boolean
          mostrar_liquidacion?: boolean
          mostrar_valorizacion?: boolean
          orden?: number
          titular?: string
        }
        Relationships: []
      }
      movimientos_almacen: {
        Row: {
          cantidad: number
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          proyecto_id: string | null
          proyecto_item_id: string | null
          tipo: Database["public"]["Enums"]["tipo_mov_almacen"]
        }
        Insert: {
          cantidad: number
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          proyecto_id?: string | null
          proyecto_item_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_mov_almacen"]
        }
        Update: {
          cantidad?: number
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          proyecto_id?: string | null
          proyecto_item_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_mov_almacen"]
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_almacen_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_almacen_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventario_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_almacen_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_almacen_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
          {
            foreignKeyName: "movimientos_almacen_proyecto_item_id_fkey"
            columns: ["proyecto_item_id"]
            isOneToOne: false
            referencedRelation: "proyecto_items"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_caja: {
        Row: {
          caja_id: string
          concepto: string | null
          created_at: string
          created_by: string | null
          fecha: string
          id: string
          metodo: Database["public"]["Enums"]["metodo_pago"] | null
          monto: number
          num_operacion: string | null
          proyecto_id: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: Database["public"]["Enums"]["tipo_mov_caja"]
          voucher_url: string | null
        }
        Insert: {
          caja_id: string
          concepto?: string | null
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pago"] | null
          monto: number
          num_operacion?: string | null
          proyecto_id?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: Database["public"]["Enums"]["tipo_mov_caja"]
          voucher_url?: string | null
        }
        Update: {
          caja_id?: string
          concepto?: string | null
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pago"] | null
          monto?: number
          num_operacion?: string | null
          proyecto_id?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_mov_caja"]
          voucher_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_caja_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "v_cajas_saldos"
            referencedColumns: ["caja_id"]
          },
          {
            foreignKeyName: "movimientos_caja_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string
          cuerpo: string | null
          id: string
          leida: boolean
          tipo: string | null
          titulo: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          cuerpo?: string | null
          id?: string
          leida?: boolean
          tipo?: string | null
          titulo: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          cuerpo?: string | null
          id?: string
          leida?: boolean
          tipo?: string | null
          titulo?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partes_diarios: {
        Row: {
          clima: string | null
          created_at: string
          created_by: string | null
          equipos: string | null
          fecha: string
          id: string
          incidencias: string | null
          materiales_recibidos: string | null
          observaciones: string | null
          personal_count: number | null
          proyecto_id: string
        }
        Insert: {
          clima?: string | null
          created_at?: string
          created_by?: string | null
          equipos?: string | null
          fecha?: string
          id?: string
          incidencias?: string | null
          materiales_recibidos?: string | null
          observaciones?: string | null
          personal_count?: number | null
          proyecto_id: string
        }
        Update: {
          clima?: string | null
          created_at?: string
          created_by?: string | null
          equipos?: string | null
          fecha?: string
          id?: string
          incidencias?: string | null
          materiales_recibidos?: string | null
          observaciones?: string | null
          personal_count?: number | null
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partes_diarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partes_diarios_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partes_diarios_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      plantillas_cotizacion: {
        Row: {
          condiciones: string | null
          created_at: string
          garantia: string | null
          id: string
          linea_id: string | null
          nombre: string
          servicios_incluidos: string | null
          servicios_omitidos: string | null
        }
        Insert: {
          condiciones?: string | null
          created_at?: string
          garantia?: string | null
          id?: string
          linea_id?: string | null
          nombre: string
          servicios_incluidos?: string | null
          servicios_omitidos?: string | null
        }
        Update: {
          condiciones?: string | null
          created_at?: string
          garantia?: string | null
          id?: string
          linea_id?: string | null
          nombre?: string
          servicios_incluidos?: string | null
          servicios_omitidos?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_cotizacion_linea_id_fkey"
            columns: ["linea_id"]
            isOneToOne: false
            referencedRelation: "lineas_negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuesto_tipo_gasto: {
        Row: {
          created_at: string
          id: string
          monto_proyectado: number
          proyecto_id: string
          tipo: Database["public"]["Enums"]["tipo_solicitud"]
        }
        Insert: {
          created_at?: string
          id?: string
          monto_proyectado?: number
          proyecto_id: string
          tipo: Database["public"]["Enums"]["tipo_solicitud"]
        }
        Update: {
          created_at?: string
          id?: string
          monto_proyectado?: number
          proyecto_id?: string
          tipo?: Database["public"]["Enums"]["tipo_solicitud"]
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_tipo_gasto_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_tipo_gasto_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_enum"]
          rol_personalizado_id: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["rol_enum"]
          rol_personalizado_id?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_enum"]
          rol_personalizado_id?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      roles_personalizados: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          permisos: Json
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          permisos?: Json
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          permisos?: Json
        }
        Relationships: []
      }
      proyecto_equipo: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          proyecto_id: string
          rol_obra: Database["public"]["Enums"]["rol_obra"]
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          proyecto_id: string
          rol_obra: Database["public"]["Enums"]["rol_obra"]
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          proyecto_id?: string
          rol_obra?: Database["public"]["Enums"]["rol_obra"]
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_equipo_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_equipo_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_equipo_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      proyecto_items: {
        Row: {
          cantidad: number | null
          contratista_id: string | null
          costo_formula: string | null
          costo_unitario: number | null
          created_at: string
          duracion_dias: number | null
          es_hoja: boolean
          estado_override: Database["public"]["Enums"]["estado_tarea"] | null
          estado_tarea: Database["public"]["Enums"]["estado_tarea"]
          fecha_entrega: string | null
          fecha_inicio: string | null
          id: string
          item_codigo: string | null
          nivel: number
          orden: number
          parent_id: string | null
          prioridad: Database["public"]["Enums"]["prioridad_enum"]
          proyecto_id: string
          tiene_apu: boolean
          titulo: string
          total_costo: number | null
          unidad: string | null
        }
        Insert: {
          cantidad?: number | null
          contratista_id?: string | null
          costo_formula?: string | null
          costo_unitario?: number | null
          created_at?: string
          duracion_dias?: number | null
          es_hoja?: boolean
          estado_override?: Database["public"]["Enums"]["estado_tarea"] | null
          estado_tarea?: Database["public"]["Enums"]["estado_tarea"]
          fecha_entrega?: string | null
          fecha_inicio?: string | null
          id?: string
          item_codigo?: string | null
          nivel?: number
          orden?: number
          parent_id?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad_enum"]
          proyecto_id: string
          tiene_apu?: boolean
          titulo: string
          total_costo?: number | null
          unidad?: string | null
        }
        Update: {
          cantidad?: number | null
          contratista_id?: string | null
          costo_formula?: string | null
          costo_unitario?: number | null
          created_at?: string
          duracion_dias?: number | null
          es_hoja?: boolean
          estado_override?: Database["public"]["Enums"]["estado_tarea"] | null
          estado_tarea?: Database["public"]["Enums"]["estado_tarea"]
          fecha_entrega?: string | null
          fecha_inicio?: string | null
          id?: string
          item_codigo?: string | null
          nivel?: number
          orden?: number
          parent_id?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad_enum"]
          proyecto_id?: string
          tiene_apu?: boolean
          titulo?: string
          total_costo?: number | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_items_contratista_id_fkey"
            columns: ["contratista_id"]
            isOneToOne: false
            referencedRelation: "contrapartes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "proyecto_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_items_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_items_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      proyectos: {
        Row: {
          adelanto_pct: number | null
          base_valorizacion: string
          caja_maximo: number | null
          cliente_id: string | null
          codigo: string | null
          contrato_total: number | null
          correlativo: number
          cotizacion_id: string | null
          created_at: string
          dias_laborables: string
          direccion: string | null
          estado: Database["public"]["Enums"]["estado_proyecto"]
          fecha_fin: string | null
          fecha_inicio: string | null
          ga_pct: number | null
          gg_pct: number | null
          id: string
          igv_pct: number | null
          itemizado_propio: boolean
          jefe_id: string | null
          linea_id: string | null
          modalidad_cobro: Database["public"]["Enums"]["modalidad_cobro"]
          nombre: string
          tipo_proyecto: Database["public"]["Enums"]["tipo_proyecto"]
          updated_at: string
          utilidad_pct: number | null
        }
        Insert: {
          adelanto_pct?: number | null
          base_valorizacion?: string
          caja_maximo?: number | null
          cliente_id?: string | null
          codigo?: string | null
          contrato_total?: number | null
          correlativo?: never
          cotizacion_id?: string | null
          created_at?: string
          dias_laborables?: string
          direccion?: string | null
          estado?: Database["public"]["Enums"]["estado_proyecto"]
          fecha_fin?: string | null
          fecha_inicio?: string | null
          ga_pct?: number | null
          gg_pct?: number | null
          id?: string
          igv_pct?: number | null
          itemizado_propio?: boolean
          jefe_id?: string | null
          linea_id?: string | null
          modalidad_cobro?: Database["public"]["Enums"]["modalidad_cobro"]
          nombre: string
          tipo_proyecto?: Database["public"]["Enums"]["tipo_proyecto"]
          updated_at?: string
          utilidad_pct?: number | null
        }
        Update: {
          adelanto_pct?: number | null
          base_valorizacion?: string
          caja_maximo?: number | null
          cliente_id?: string | null
          codigo?: string | null
          contrato_total?: number | null
          correlativo?: never
          cotizacion_id?: string | null
          created_at?: string
          dias_laborables?: string
          direccion?: string | null
          estado?: Database["public"]["Enums"]["estado_proyecto"]
          fecha_fin?: string | null
          fecha_inicio?: string | null
          ga_pct?: number | null
          gg_pct?: number | null
          id?: string
          igv_pct?: number | null
          itemizado_propio?: boolean
          jefe_id?: string | null
          linea_id?: string | null
          modalidad_cobro?: Database["public"]["Enums"]["modalidad_cobro"]
          nombre?: string
          tipo_proyecto?: Database["public"]["Enums"]["tipo_proyecto"]
          updated_at?: string
          utilidad_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_jefe_id_fkey"
            columns: ["jefe_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_linea_id_fkey"
            columns: ["linea_id"]
            isOneToOne: false
            referencedRelation: "lineas_negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      push_log: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          sent: number | null
          source: string | null
          status: string | null
          target_user_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          sent?: number | null
          source?: string | null
          status?: string | null
          target_user_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          sent?: number | null
          source?: string | null
          status?: string | null
          target_user_id?: string | null
          title?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rdo_actividades: {
        Row: {
          avance_pct: number | null
          descripcion: string
          foto_url: string | null
          id: string
          proyecto_item_id: string | null
          rdo_id: string
        }
        Insert: {
          avance_pct?: number | null
          descripcion: string
          foto_url?: string | null
          id?: string
          proyecto_item_id?: string | null
          rdo_id: string
        }
        Update: {
          avance_pct?: number | null
          descripcion?: string
          foto_url?: string | null
          id?: string
          proyecto_item_id?: string | null
          rdo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_actividades_proyecto_item_id_fkey"
            columns: ["proyecto_item_id"]
            isOneToOne: false
            referencedRelation: "proyecto_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_actividades_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "partes_diarios"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_mantenimiento: {
        Row: {
          categoria: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          dias_aviso: number
          estado: string
          fecha_planificada: string
          id: string
          monto: number | null
          proyecto_id: string
          recurrencia: Database["public"]["Enums"]["recurrencia_enum"]
        }
        Insert: {
          categoria: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          dias_aviso?: number
          estado?: string
          fecha_planificada: string
          id?: string
          monto?: number | null
          proyecto_id: string
          recurrencia?: Database["public"]["Enums"]["recurrencia_enum"]
        }
        Update: {
          categoria?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          dias_aviso?: number
          estado?: string
          fecha_planificada?: string
          id?: string
          monto?: number | null
          proyecto_id?: string
          recurrencia?: Database["public"]["Enums"]["recurrencia_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "servicios_mantenimiento_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_mantenimiento_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_mantenimiento_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      solicitudes_cambio: {
        Row: {
          created_at: string
          descripcion: string
          estado: string
          id: string
          motivo: string | null
          payload: Json
          proyecto_id: string
          referencia_id: string | null
          resuelto_at: string | null
          resuelto_nombre: string | null
          resuelto_por: string | null
          rol_aprobador: string
          solicitado_nombre: string | null
          solicitado_por: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: string
          id?: string
          motivo?: string | null
          payload?: Json
          proyecto_id: string
          referencia_id?: string | null
          resuelto_at?: string | null
          resuelto_nombre?: string | null
          resuelto_por?: string | null
          rol_aprobador: string
          solicitado_nombre?: string | null
          solicitado_por?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: string
          id?: string
          motivo?: string | null
          payload?: Json
          proyecto_id?: string
          referencia_id?: string | null
          resuelto_at?: string | null
          resuelto_nombre?: string | null
          resuelto_por?: string | null
          rol_aprobador?: string
          solicitado_nombre?: string | null
          solicitado_por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_cambio_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_cambio_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
          {
            foreignKeyName: "solicitudes_cambio_resuelto_por_fkey"
            columns: ["resuelto_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_cambio_solicitado_por_fkey"
            columns: ["solicitado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_pago: {
        Row: {
          aprobado_at: string | null
          aprobado_gerencia_por: string | null
          aprobado_por: string | null
          banco_origen: string | null
          beneficiario_nombre: string | null
          categoria_etapa: string | null
          codigo: string | null
          constancia: Database["public"]["Enums"]["constancia_enum"] | null
          contraparte_id: string | null
          correlativo: number
          created_at: string
          cta_bancaria: string | null
          descripcion: string | null
          detraccion_monto: number | null
          especialidad: string | null
          fecha_programada: string | null
          fecha_registro: string
          gestor_id: string | null
          id: string
          linea_id: string | null
          metodo: Database["public"]["Enums"]["metodo_pago"] | null
          moneda: string
          monto: number
          motivo_rechazo: string | null
          num_comprobante: string | null
          num_operacion: string | null
          pagado_at: string | null
          pagado_por: string | null
          partida_ppto: string | null
          programado_at: string | null
          programado_por: string | null
          proyecto_id: string | null
          proyecto_item_id: string | null
          razon_social: string | null
          requiere_gerencia: boolean
          ruc_dni: string | null
          solicitado_por: string | null
          status: Database["public"]["Enums"]["status_solicitud"]
          sustento_url: string | null
          tipo: Database["public"]["Enums"]["tipo_solicitud"]
          voucher_url: string | null
        }
        Insert: {
          aprobado_at?: string | null
          aprobado_gerencia_por?: string | null
          aprobado_por?: string | null
          banco_origen?: string | null
          beneficiario_nombre?: string | null
          categoria_etapa?: string | null
          codigo?: string | null
          constancia?: Database["public"]["Enums"]["constancia_enum"] | null
          contraparte_id?: string | null
          correlativo?: never
          created_at?: string
          cta_bancaria?: string | null
          descripcion?: string | null
          detraccion_monto?: number | null
          especialidad?: string | null
          fecha_programada?: string | null
          fecha_registro?: string
          gestor_id?: string | null
          id?: string
          linea_id?: string | null
          metodo?: Database["public"]["Enums"]["metodo_pago"] | null
          moneda?: string
          monto?: number
          motivo_rechazo?: string | null
          num_comprobante?: string | null
          num_operacion?: string | null
          pagado_at?: string | null
          pagado_por?: string | null
          partida_ppto?: string | null
          programado_at?: string | null
          programado_por?: string | null
          proyecto_id?: string | null
          proyecto_item_id?: string | null
          razon_social?: string | null
          requiere_gerencia?: boolean
          ruc_dni?: string | null
          solicitado_por?: string | null
          status?: Database["public"]["Enums"]["status_solicitud"]
          sustento_url?: string | null
          tipo: Database["public"]["Enums"]["tipo_solicitud"]
          voucher_url?: string | null
        }
        Update: {
          aprobado_at?: string | null
          aprobado_gerencia_por?: string | null
          aprobado_por?: string | null
          banco_origen?: string | null
          beneficiario_nombre?: string | null
          categoria_etapa?: string | null
          codigo?: string | null
          constancia?: Database["public"]["Enums"]["constancia_enum"] | null
          contraparte_id?: string | null
          correlativo?: never
          created_at?: string
          cta_bancaria?: string | null
          descripcion?: string | null
          detraccion_monto?: number | null
          especialidad?: string | null
          fecha_programada?: string | null
          fecha_registro?: string
          gestor_id?: string | null
          id?: string
          linea_id?: string | null
          metodo?: Database["public"]["Enums"]["metodo_pago"] | null
          moneda?: string
          monto?: number
          motivo_rechazo?: string | null
          num_comprobante?: string | null
          num_operacion?: string | null
          pagado_at?: string | null
          pagado_por?: string | null
          partida_ppto?: string | null
          programado_at?: string | null
          programado_por?: string | null
          proyecto_id?: string | null
          proyecto_item_id?: string | null
          razon_social?: string | null
          requiere_gerencia?: boolean
          ruc_dni?: string | null
          solicitado_por?: string | null
          status?: Database["public"]["Enums"]["status_solicitud"]
          sustento_url?: string | null
          tipo?: Database["public"]["Enums"]["tipo_solicitud"]
          voucher_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_pago_aprobado_gerencia_por_fkey"
            columns: ["aprobado_gerencia_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_contraparte_id_fkey"
            columns: ["contraparte_id"]
            isOneToOne: false
            referencedRelation: "contrapartes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_linea_id_fkey"
            columns: ["linea_id"]
            isOneToOne: false
            referencedRelation: "lineas_negocio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_pagado_por_fkey"
            columns: ["pagado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_programado_por_fkey"
            columns: ["programado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
          {
            foreignKeyName: "solicitudes_pago_proyecto_item_id_fkey"
            columns: ["proyecto_item_id"]
            isOneToOne: false
            referencedRelation: "proyecto_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_solicitado_por_fkey"
            columns: ["solicitado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sst_charlas: {
        Row: {
          asistentes: string | null
          created_at: string
          created_by: string | null
          fecha: string
          id: string
          proyecto_id: string | null
          tema: string
        }
        Insert: {
          asistentes?: string | null
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          proyecto_id?: string | null
          tema: string
        }
        Update: {
          asistentes?: string | null
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          proyecto_id?: string | null
          tema?: string
        }
        Relationships: [
          {
            foreignKeyName: "sst_charlas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sst_charlas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sst_charlas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      sst_incidentes: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string
          foto_url: string | null
          gravedad: string | null
          id: string
          proyecto_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion: string
          foto_url?: string | null
          gravedad?: string | null
          id?: string
          proyecto_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string
          foto_url?: string | null
          gravedad?: string | null
          id?: string
          proyecto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sst_incidentes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sst_incidentes_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sst_incidentes_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      sst_observaciones: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string
          foto_url: string | null
          id: string
          proyecto_id: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion: string
          foto_url?: string | null
          id?: string
          proyecto_id?: string | null
          tipo?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string
          foto_url?: string | null
          id?: string
          proyecto_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "sst_observaciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sst_observaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sst_observaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      tareo: {
        Row: {
          created_at: string
          created_by: string | null
          fecha: string
          horas: number | null
          id: string
          presente: boolean
          proyecto_id: string | null
          trabajador_nombre: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fecha?: string
          horas?: number | null
          id?: string
          presente?: boolean
          proyecto_id?: string | null
          trabajador_nombre: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fecha?: string
          horas?: number | null
          id?: string
          presente?: boolean
          proyecto_id?: string | null
          trabajador_nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareo_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareo_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareo_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
      valorizacion_items: {
        Row: {
          id: string
          pct_avance: number
          proyecto_item_id: string
          total: number
          valorizacion_id: string
        }
        Insert: {
          id?: string
          pct_avance?: number
          proyecto_item_id: string
          total?: number
          valorizacion_id: string
        }
        Update: {
          id?: string
          pct_avance?: number
          proyecto_item_id?: string
          total?: number
          valorizacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valorizacion_items_proyecto_item_id_fkey"
            columns: ["proyecto_item_id"]
            isOneToOne: false
            referencedRelation: "proyecto_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valorizacion_items_valorizacion_id_fkey"
            columns: ["valorizacion_id"]
            isOneToOne: false
            referencedRelation: "valorizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      valorizaciones: {
        Row: {
          amortizacion_adelanto: number | null
          cobro_neto: number | null
          created_at: string
          created_by: string | null
          estado: string
          fecha_corte: string
          id: string
          monto_valorizado: number | null
          notas: string | null
          numero: number
          proyecto_id: string
          reabierta: boolean
          semana: number
        }
        Insert: {
          amortizacion_adelanto?: number | null
          cobro_neto?: number | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_corte?: string
          id?: string
          monto_valorizado?: number | null
          notas?: string | null
          numero: number
          proyecto_id: string
          reabierta?: boolean
          semana: number
        }
        Update: {
          amortizacion_adelanto?: number | null
          cobro_neto?: number | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_corte?: string
          id?: string
          monto_valorizado?: number | null
          notas?: string | null
          numero?: number
          proyecto_id?: string
          reabierta?: boolean
          semana?: number
        }
        Relationships: [
          {
            foreignKeyName: "valorizaciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valorizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valorizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
        ]
      }
    }
    Views: {
      v_cajas_saldos: {
        Row: {
          asignacion_semanal: number | null
          caja_id: string | null
          monto_maximo: number | null
          movimientos: number | null
          nombre: string | null
          proyecto_id: string | null
          responsable_id: string | null
          responsable_nombre: string | null
          saldo_actual: number | null
          saldo_inicial: number | null
          tipo: Database["public"]["Enums"]["tipo_caja"] | null
        }
        Relationships: [
          {
            foreignKeyName: "cajas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cajas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_proyecto"
            referencedColumns: ["proyecto_id"]
          },
          {
            foreignKeyName: "cajas_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dashboard_proyecto: {
        Row: {
          codigo: string | null
          estado: Database["public"]["Enums"]["estado_proyecto"] | null
          gasto: number | null
          linea_id: string | null
          nombre: string | null
          pagos: number | null
          proyectado: number | null
          proyecto_id: string | null
          tipo_proyecto: Database["public"]["Enums"]["tipo_proyecto"] | null
          valorizado: number | null
        }
        Insert: {
          codigo?: string | null
          estado?: Database["public"]["Enums"]["estado_proyecto"] | null
          gasto?: never
          linea_id?: string | null
          nombre?: string | null
          pagos?: never
          proyectado?: number | null
          proyecto_id?: string | null
          tipo_proyecto?: Database["public"]["Enums"]["tipo_proyecto"] | null
          valorizado?: never
        }
        Update: {
          codigo?: string | null
          estado?: Database["public"]["Enums"]["estado_proyecto"] | null
          gasto?: never
          linea_id?: string | null
          nombre?: string | null
          pagos?: never
          proyectado?: number | null
          proyecto_id?: string | null
          tipo_proyecto?: Database["public"]["Enums"]["tipo_proyecto"] | null
          valorizado?: never
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_linea_id_fkey"
            columns: ["linea_id"]
            isOneToOne: false
            referencedRelation: "lineas_negocio"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_enum"]
      }
      es_gerencia_admin: { Args: never; Returns: boolean }
      es_mando: { Args: never; Returns: boolean }
      es_miembro: { Args: { p: string }; Returns: boolean }
    }
    Enums: {
      apu_tipo:
        | "mano_obra"
        | "materiales"
        | "equipos"
        | "subcontratos"
        | "gastos_generales"
      condicion_armada: "avance" | "fecha"
      constancia_enum: "factura" | "boleta" | "rhe"
      estado_adicional: "solicitado" | "aprobado" | "rechazado"
      estado_armada: "pendiente" | "por_facturar" | "facturado" | "cobrado"
      estado_cotizacion:
        | "borrador"
        | "enviada"
        | "en_negociacion"
        | "aceptada"
        | "vencida"
        | "rechazada"
      estado_factura: "emitida" | "vencida" | "parcial" | "cobrada" | "anulada"
      estado_proyecto:
        | "planeacion"
        | "en_ejecucion"
        | "pausado"
        | "cerrado"
        | "liquidado"
      estado_tarea:
        | "completado"
        | "en_progreso"
        | "detenido"
        | "en_espera"
        | "pendiente"
        | "retrasado"
        | "cancelado"
      metodo_pago:
        | "transferencia"
        | "efectivo"
        | "yape"
        | "plin"
        | "deposito"
        | "cheque"
        | "tarjeta"
        | "otro"
      modalidad_cobro: "contado" | "credito"
      moneda_enum: "PEN" | "USD"
      origen_lead: "directo" | "recomendacion" | "oficina" | "llamada"
      plazo_tipo: "calendario" | "util" | "semanas" | "meses"
      prioridad_enum: "muy_baja" | "baja" | "media" | "alta" | "muy_alta"
      recurrencia_enum:
        | "unica"
        | "semanal"
        | "quincenal"
        | "mensual"
        | "trimestral"
        | "semestral"
      rol_enum:
        | "gerencia"
        | "jefe_proyectos"
        | "presupuestos"
        | "administrador"
        | "comercial"
        | "residente"
        | "prevencionista"
        | "logistico"
      rol_obra: "jefe" | "residente" | "prevencionista" | "logistico"
      severidad_alerta: "info" | "advertencia" | "critica"
      status_solicitud:
        | "solicitada"
        | "aprobada"
        | "programada"
        | "pagada"
        | "conciliada"
        | "rechazada"
        | "devuelta"
      tipo_adicional: "adicional" | "deductivo"
      tipo_asistencia: "checkin" | "checkout"
      tipo_caja: "central" | "chica"
      tipo_contraparte: "contratista" | "proveedor" | "ambos"
      tipo_cotizacion: "unica" | "programada" | "recurrencia"
      tipo_inventario: "herramienta" | "material" | "consumible"
      tipo_mov_almacen: "ingreso" | "salida" | "devolucion"
      tipo_mov_caja: "abono" | "egreso" | "traslado" | "reposicion" | "ajuste"
      tipo_proyecto: "grande" | "chico"
      tipo_solicitud:
        | "contratistas"
        | "proveedores"
        | "caja_chica"
        | "servicios"
        | "honorarios"
      visibilidad_doc: "publica" | "mando" | "gerencia"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      apu_tipo: [
        "mano_obra",
        "materiales",
        "equipos",
        "subcontratos",
        "gastos_generales",
      ],
      condicion_armada: ["avance", "fecha"],
      constancia_enum: ["factura", "boleta", "rhe"],
      estado_adicional: ["solicitado", "aprobado", "rechazado"],
      estado_armada: ["pendiente", "por_facturar", "facturado", "cobrado"],
      estado_cotizacion: [
        "borrador",
        "enviada",
        "en_negociacion",
        "aceptada",
        "vencida",
        "rechazada",
      ],
      estado_factura: ["emitida", "vencida", "parcial", "cobrada", "anulada"],
      estado_proyecto: [
        "planeacion",
        "en_ejecucion",
        "pausado",
        "cerrado",
        "liquidado",
      ],
      estado_tarea: [
        "completado",
        "en_progreso",
        "detenido",
        "en_espera",
        "pendiente",
        "retrasado",
        "cancelado",
      ],
      metodo_pago: [
        "transferencia",
        "efectivo",
        "yape",
        "plin",
        "deposito",
        "cheque",
        "tarjeta",
        "otro",
      ],
      modalidad_cobro: ["contado", "credito"],
      moneda_enum: ["PEN", "USD"],
      origen_lead: ["directo", "recomendacion", "oficina", "llamada"],
      plazo_tipo: ["calendario", "util", "semanas", "meses"],
      prioridad_enum: ["muy_baja", "baja", "media", "alta", "muy_alta"],
      recurrencia_enum: [
        "unica",
        "semanal",
        "quincenal",
        "mensual",
        "trimestral",
        "semestral",
      ],
      rol_enum: [
        "gerencia",
        "jefe_proyectos",
        "presupuestos",
        "administrador",
        "comercial",
        "residente",
        "prevencionista",
        "logistico",
      ],
      rol_obra: ["jefe", "residente", "prevencionista", "logistico"],
      severidad_alerta: ["info", "advertencia", "critica"],
      status_solicitud: [
        "solicitada",
        "aprobada",
        "programada",
        "pagada",
        "conciliada",
        "rechazada",
        "devuelta",
      ],
      tipo_adicional: ["adicional", "deductivo"],
      tipo_asistencia: ["checkin", "checkout"],
      tipo_caja: ["central", "chica"],
      tipo_contraparte: ["contratista", "proveedor", "ambos"],
      tipo_cotizacion: ["unica", "programada", "recurrencia"],
      tipo_inventario: ["herramienta", "material", "consumible"],
      tipo_mov_almacen: ["ingreso", "salida", "devolucion"],
      tipo_mov_caja: ["abono", "egreso", "traslado", "reposicion", "ajuste"],
      tipo_proyecto: ["grande", "chico"],
      tipo_solicitud: [
        "contratistas",
        "proveedores",
        "caja_chica",
        "servicios",
        "honorarios",
      ],
      visibilidad_doc: ["publica", "mando", "gerencia"],
    },
  },
} as const
