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
      adicionales_deductivos: {
        Row: {
          aprobado: boolean
          aprobado_at: string | null
          aprobado_por: string | null
          codigo: string | null
          created_at: string
          created_by: string | null
          descripcion: string
          fecha: string
          id: string
          monto: number
          numero: number
          proyecto_id: string
          sustento: string | null
          tipo: Database["public"]["Enums"]["addtype"]
        }
        Insert: {
          aprobado?: boolean
          aprobado_at?: string | null
          aprobado_por?: string | null
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          descripcion: string
          fecha?: string
          id?: string
          monto: number
          numero: number
          proyecto_id: string
          sustento?: string | null
          tipo: Database["public"]["Enums"]["addtype"]
        }
        Update: {
          aprobado?: boolean
          aprobado_at?: string | null
          aprobado_por?: string | null
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string
          fecha?: string
          id?: string
          monto?: number
          numero?: number
          proyecto_id?: string
          sustento?: string | null
          tipo?: Database["public"]["Enums"]["addtype"]
        }
        Relationships: [
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adicionales_deductivos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      almacen_movimientos: {
        Row: {
          cantidad: number
          costo_unit: number | null
          created_at: string
          descripcion: string
          fecha: string
          id: string
          insumo_id: string | null
          notas: string | null
          numero_documento: string | null
          proveedor: string | null
          proyecto_id: string | null
          registrado_por: string | null
          responsable: string | null
          tipo: string
          unidad: string
        }
        Insert: {
          cantidad: number
          costo_unit?: number | null
          created_at?: string
          descripcion: string
          fecha?: string
          id?: string
          insumo_id?: string | null
          notas?: string | null
          numero_documento?: string | null
          proveedor?: string | null
          proyecto_id?: string | null
          registrado_por?: string | null
          responsable?: string | null
          tipo: string
          unidad: string
        }
        Update: {
          cantidad?: number
          costo_unit?: number | null
          created_at?: string
          descripcion?: string
          fecha?: string
          id?: string
          insumo_id?: string | null
          notas?: string | null
          numero_documento?: string | null
          proveedor?: string | null
          proyecto_id?: string | null
          registrado_por?: string | null
          responsable?: string | null
          tipo?: string
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "almacen_movimientos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos_maestros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_movimientos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "v_almacen_central_stock"
            referencedColumns: ["insumo_id"]
          },
          {
            foreignKeyName: "almacen_movimientos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_movimientos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_movimientos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_movimientos_unidad_fkey"
            columns: ["unidad"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["codigo"]
          },
        ]
      }
      asistencias_gps: {
        Row: {
          created_at: string
          dentro_geofence: boolean | null
          distancia_obra_m: number | null
          fecha: string
          hora: string
          id: string
          latitud: number
          longitud: number
          observaciones: string | null
          precision_metros: number | null
          proyecto_id: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dentro_geofence?: boolean | null
          distancia_obra_m?: number | null
          fecha?: string
          hora?: string
          id?: string
          latitud: number
          longitud: number
          observaciones?: string | null
          precision_metros?: number | null
          proyecto_id: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          dentro_geofence?: boolean | null
          distancia_obra_m?: number | null
          fecha?: string
          hora?: string
          id?: string
          latitud?: number
          longitud?: number
          observaciones?: string | null
          precision_metros?: number | null
          proyecto_id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_gps_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_gps_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_gps_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          context: Json | null
          diff: Json | null
          id: number
          new_data: Json | null
          occurred_at: string
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          context?: Json | null
          diff?: Json | null
          id?: number
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          context?: Json | null
          diff?: Json | null
          id?: number
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      azur_migrations: {
        Row: {
          applied_at: string
          hash: string
          name: string
        }
        Insert: {
          applied_at?: string
          hash: string
          name: string
        }
        Update: {
          applied_at?: string
          hash?: string
          name?: string
        }
        Relationships: []
      }
      caja_movimientos: {
        Row: {
          caja_id: string
          concepto: string
          created_at: string
          fecha: string
          id: string
          monto: number
          pago_id: string | null
          referencia: string | null
          registrado_por: string | null
          tipo: string
        }
        Insert: {
          caja_id: string
          concepto: string
          created_at?: string
          fecha?: string
          id?: string
          monto: number
          pago_id?: string | null
          referencia?: string | null
          registrado_por?: string | null
          tipo: string
        }
        Update: {
          caja_id?: string
          concepto?: string
          created_at?: string
          fecha?: string
          id?: string
          monto?: number
          pago_id?: string | null
          referencia?: string | null
          registrado_por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "caja_movimientos_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_movimientos_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "v_cajas_saldos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caja_movimientos_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      cajas: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          moneda: string
          nombre: string
          proyecto_id: string | null
          saldo_inicial: number
          tipo: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          moneda?: string
          nombre: string
          proyecto_id?: string | null
          saldo_inicial?: number
          tipo: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          moneda?: string
          nombre?: string
          proyecto_id?: string | null
          saldo_inicial?: number
          tipo?: string
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cajas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          activo: boolean
          contacto: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre_comercial: string | null
          notas: string | null
          razon_social: string
          ruc: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre_comercial?: string | null
          notas?: string | null
          razon_social: string
          ruc?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre_comercial?: string | null
          notas?: string | null
          razon_social?: string
          ruc?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cotizacion_apu: {
        Row: {
          cantidad: number
          categoria: Database["public"]["Enums"]["insumo_categoria"]
          cotizacion_partida_id: string
          created_at: string
          descripcion: string
          id: string
          insumo_id: string | null
          orden: number
          parcial: number | null
          precio_unit: number
          unidad: string
        }
        Insert: {
          cantidad: number
          categoria: Database["public"]["Enums"]["insumo_categoria"]
          cotizacion_partida_id: string
          created_at?: string
          descripcion: string
          id?: string
          insumo_id?: string | null
          orden?: number
          parcial?: number | null
          precio_unit: number
          unidad: string
        }
        Update: {
          cantidad?: number
          categoria?: Database["public"]["Enums"]["insumo_categoria"]
          cotizacion_partida_id?: string
          created_at?: string
          descripcion?: string
          id?: string
          insumo_id?: string | null
          orden?: number
          parcial?: number | null
          precio_unit?: number
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_apu_cotizacion_partida_id_fkey"
            columns: ["cotizacion_partida_id"]
            isOneToOne: false
            referencedRelation: "cotizacion_partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_apu_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos_maestros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_apu_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "v_almacen_central_stock"
            referencedColumns: ["insumo_id"]
          },
          {
            foreignKeyName: "cotizacion_apu_unidad_fkey"
            columns: ["unidad"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["codigo"]
          },
        ]
      }
      cotizacion_partidas: {
        Row: {
          cantidad: number
          codigo: string
          cotizacion_id: string
          created_at: string
          descripcion: string
          id: string
          notas: string | null
          orden: number
          parcial: number | null
          partida_maestra_id: string | null
          precio_unitario: number
          unidad: string
        }
        Insert: {
          cantidad: number
          codigo: string
          cotizacion_id: string
          created_at?: string
          descripcion: string
          id?: string
          notas?: string | null
          orden?: number
          parcial?: number | null
          partida_maestra_id?: string | null
          precio_unitario?: number
          unidad: string
        }
        Update: {
          cantidad?: number
          codigo?: string
          cotizacion_id?: string
          created_at?: string
          descripcion?: string
          id?: string
          notas?: string | null
          orden?: number
          parcial?: number | null
          partida_maestra_id?: string | null
          precio_unitario?: number
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_partidas_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_partidas_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "v_cotizacion_totales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_partidas_partida_maestra_id_fkey"
            columns: ["partida_maestra_id"]
            isOneToOne: false
            referencedRelation: "partidas_maestras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_partidas_unidad_fkey"
            columns: ["unidad"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["codigo"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          aprobado_at: string | null
          cliente_id: string | null
          codigo: string | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          enviado_at: string | null
          estado: Database["public"]["Enums"]["cotizacion_estado"]
          fecha_emision: string
          gastos_generales_porcentaje: number
          id: string
          igv_porcentaje: number
          margen_porcentaje: number
          moneda: string
          notas: string | null
          proyecto_id: string | null
          rechazado_at: string | null
          terminos: string | null
          titulo: string
          ubicacion: string | null
          updated_at: string
          validez_dias: number
        }
        Insert: {
          aprobado_at?: string | null
          cliente_id?: string | null
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          enviado_at?: string | null
          estado?: Database["public"]["Enums"]["cotizacion_estado"]
          fecha_emision?: string
          gastos_generales_porcentaje?: number
          id?: string
          igv_porcentaje?: number
          margen_porcentaje?: number
          moneda?: string
          notas?: string | null
          proyecto_id?: string | null
          rechazado_at?: string | null
          terminos?: string | null
          titulo: string
          ubicacion?: string | null
          updated_at?: string
          validez_dias?: number
        }
        Update: {
          aprobado_at?: string | null
          cliente_id?: string | null
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          enviado_at?: string | null
          estado?: Database["public"]["Enums"]["cotizacion_estado"]
          fecha_emision?: string
          gastos_generales_porcentaje?: number
          id?: string
          igv_porcentaje?: number
          margen_porcentaje?: number
          moneda?: string
          notas?: string | null
          proyecto_id?: string | null
          rechazado_at?: string | null
          terminos?: string | null
          titulo?: string
          ubicacion?: string | null
          updated_at?: string
          validez_dias?: number
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
            foreignKeyName: "cotizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      cuadrilla_componentes: {
        Row: {
          cantidad: number
          cuadrilla_id: string
          insumo_id: string
        }
        Insert: {
          cantidad?: number
          cuadrilla_id: string
          insumo_id: string
        }
        Update: {
          cantidad?: number
          cuadrilla_id?: string
          insumo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuadrilla_componentes_cuadrilla_id_fkey"
            columns: ["cuadrilla_id"]
            isOneToOne: false
            referencedRelation: "cuadrillas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuadrilla_componentes_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos_maestros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuadrilla_componentes_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "v_almacen_central_stock"
            referencedColumns: ["insumo_id"]
          },
        ]
      }
      cuadrillas: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      documentos_proyecto: {
        Row: {
          carpeta: string
          created_at: string
          descripcion: string | null
          id: string
          proyecto_id: string
          storage_path: string
          subido_por: string | null
          tamano_bytes: number | null
          tipo_mime: string | null
          titulo: string
          visibilidad: string
        }
        Insert: {
          carpeta?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          proyecto_id: string
          storage_path: string
          subido_por?: string | null
          tamano_bytes?: number | null
          tipo_mime?: string | null
          titulo: string
          visibilidad?: string
        }
        Update: {
          carpeta?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          proyecto_id?: string
          storage_path?: string
          subido_por?: string | null
          tamano_bytes?: number | null
          tipo_mime?: string | null
          titulo?: string
          visibilidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_proyecto_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_proyecto_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_proyecto_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencias: {
        Row: {
          capturada_por: string | null
          created_at: string
          descripcion: string | null
          id: string
          latitud: number | null
          longitud: number | null
          partida_id: string | null
          proyecto_id: string
          rdo_id: string | null
          storage_path: string
          titulo: string | null
          tomada_en: string
        }
        Insert: {
          capturada_por?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          partida_id?: string | null
          proyecto_id: string
          rdo_id?: string | null
          storage_path: string
          titulo?: string | null
          tomada_en?: string
        }
        Update: {
          capturada_por?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          partida_id?: string | null
          proyecto_id?: string
          rdo_id?: string | null
          storage_path?: string
          titulo?: string | null
          tomada_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "proyecto_partidas"
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdo_partes"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos_maestros: {
        Row: {
          activo: boolean
          categoria: Database["public"]["Enums"]["insumo_categoria"]
          codigo: string
          created_at: string
          created_by: string | null
          descripcion: string
          id: string
          moneda: string
          notas: string | null
          precio_unit: number
          unidad: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria: Database["public"]["Enums"]["insumo_categoria"]
          codigo: string
          created_at?: string
          created_by?: string | null
          descripcion: string
          id?: string
          moneda?: string
          notas?: string | null
          precio_unit?: number
          unidad: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria?: Database["public"]["Enums"]["insumo_categoria"]
          codigo?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string
          id?: string
          moneda?: string
          notas?: string | null
          precio_unit?: number
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insumos_maestros_unidad_fkey"
            columns: ["unidad"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["codigo"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string
          href: string | null
          id: string
          leida: boolean
          mensaje: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          href?: string | null
          id?: string
          leida?: boolean
          mensaje: string
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          href?: string | null
          id?: string
          leida?: boolean
          mensaje?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      pagos: {
        Row: {
          banco_destino: string | null
          banco_origen: string | null
          codigo: string | null
          created_at: string
          cuenta_destino: string | null
          cuenta_origen: string | null
          ejecutado_por: string | null
          fecha_ejecutado: string | null
          fecha_programada: string
          id: string
          moneda: string
          monto: number
          numero_operacion: string | null
          observaciones: string | null
          programado_por: string | null
          solicitud_id: string
          updated_at: string
          voucher_path: string | null
          voucher_token: string | null
        }
        Insert: {
          banco_destino?: string | null
          banco_origen?: string | null
          codigo?: string | null
          created_at?: string
          cuenta_destino?: string | null
          cuenta_origen?: string | null
          ejecutado_por?: string | null
          fecha_ejecutado?: string | null
          fecha_programada?: string
          id?: string
          moneda?: string
          monto: number
          numero_operacion?: string | null
          observaciones?: string | null
          programado_por?: string | null
          solicitud_id: string
          updated_at?: string
          voucher_path?: string | null
          voucher_token?: string | null
        }
        Update: {
          banco_destino?: string | null
          banco_origen?: string | null
          codigo?: string | null
          created_at?: string
          cuenta_destino?: string | null
          cuenta_origen?: string | null
          ejecutado_por?: string | null
          fecha_ejecutado?: string | null
          fecha_programada?: string
          id?: string
          moneda?: string
          monto?: number
          numero_operacion?: string | null
          observaciones?: string | null
          programado_por?: string | null
          solicitud_id?: string
          updated_at?: string
          voucher_path?: string | null
          voucher_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_pago"
            referencedColumns: ["id"]
          },
        ]
      }
      partida_apu_componentes: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          insumo_id: string
          orden: number
          parcial: number | null
          partida_id: string
          precio_unit: number
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          insumo_id: string
          orden?: number
          parcial?: number | null
          partida_id: string
          precio_unit: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          insumo_id?: string
          orden?: number
          parcial?: number | null
          partida_id?: string
          precio_unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "partida_apu_componentes_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos_maestros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partida_apu_componentes_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "v_almacen_central_stock"
            referencedColumns: ["insumo_id"]
          },
          {
            foreignKeyName: "partida_apu_componentes_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas_maestras"
            referencedColumns: ["id"]
          },
        ]
      }
      partidas_maestras: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          cuadrilla_id: string | null
          descripcion: string
          id: string
          notas: string | null
          rendimiento: number | null
          unidad: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          cuadrilla_id?: string | null
          descripcion: string
          id?: string
          notas?: string | null
          rendimiento?: number | null
          unidad: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          cuadrilla_id?: string | null
          descripcion?: string
          id?: string
          notas?: string | null
          rendimiento?: number | null
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partidas_maestras_cuadrilla_id_fkey"
            columns: ["cuadrilla_id"]
            isOneToOne: false
            referencedRelation: "cuadrillas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidas_maestras_unidad_fkey"
            columns: ["unidad"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["codigo"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          avatar_url: string | null
          cargo: string | null
          created_at: string
          dni: string | null
          email: string
          full_name: string
          id: string
          preferencias: Json
          rol: Database["public"]["Enums"]["rol_sistema"]
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          dni?: string | null
          email: string
          full_name?: string
          id: string
          preferencias?: Json
          rol?: Database["public"]["Enums"]["rol_sistema"]
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          dni?: string | null
          email?: string
          full_name?: string
          id?: string
          preferencias?: Json
          rol?: Database["public"]["Enums"]["rol_sistema"]
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          activo: boolean
          banco: string | null
          cci: string | null
          contacto: string | null
          created_at: string
          cuenta: string | null
          detraccion_porcentaje: number | null
          email: string | null
          id: string
          razon_social: string
          ruc: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          banco?: string | null
          cci?: string | null
          contacto?: string | null
          created_at?: string
          cuenta?: string | null
          detraccion_porcentaje?: number | null
          email?: string | null
          id?: string
          razon_social: string
          ruc?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          banco?: string | null
          cci?: string | null
          contacto?: string | null
          created_at?: string
          cuenta?: string | null
          detraccion_porcentaje?: number | null
          email?: string | null
          id?: string
          razon_social?: string
          ruc?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proyecto_etapas: {
        Row: {
          codigo: string
          created_at: string
          fecha_fin_plan: string | null
          fecha_fin_real: string | null
          fecha_inicio_plan: string | null
          fecha_inicio_real: string | null
          id: string
          nombre: string
          orden: number
          porcentaje_avance: number
          proyecto_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio_plan?: string | null
          fecha_inicio_real?: string | null
          id?: string
          nombre: string
          orden?: number
          porcentaje_avance?: number
          proyecto_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio_plan?: string | null
          fecha_inicio_real?: string | null
          id?: string
          nombre?: string
          orden?: number
          porcentaje_avance?: number
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_etapas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_etapas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_etapas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      proyecto_hitos: {
        Row: {
          created_at: string
          estado: string
          fecha_plan: string
          fecha_real: string | null
          id: string
          nombre: string
          notas: string | null
          orden: number
          proyecto_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_plan: string
          fecha_real?: string | null
          id?: string
          nombre: string
          notas?: string | null
          orden?: number
          proyecto_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_plan?: string
          fecha_real?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          orden?: number
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_hitos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_hitos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_hitos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      proyecto_partidas: {
        Row: {
          codigo: string
          cotizacion_partida_id: string | null
          created_at: string
          descripcion: string
          etapa_id: string | null
          id: string
          metrado_contractual: number
          metrado_ejecutado: number
          monto_contractual_costo: number | null
          monto_contractual_venta: number | null
          monto_ejecutado_costo: number | null
          monto_ejecutado_venta: number | null
          orden: number
          parent_id: string | null
          porcentaje_avance: number | null
          precio_unitario_costo: number
          precio_unitario_venta: number
          proyecto_id: string
          unidad: string
          updated_at: string
        }
        Insert: {
          codigo: string
          cotizacion_partida_id?: string | null
          created_at?: string
          descripcion: string
          etapa_id?: string | null
          id?: string
          metrado_contractual?: number
          metrado_ejecutado?: number
          monto_contractual_costo?: number | null
          monto_contractual_venta?: number | null
          monto_ejecutado_costo?: number | null
          monto_ejecutado_venta?: number | null
          orden?: number
          parent_id?: string | null
          porcentaje_avance?: number | null
          precio_unitario_costo?: number
          precio_unitario_venta?: number
          proyecto_id: string
          unidad: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          cotizacion_partida_id?: string | null
          created_at?: string
          descripcion?: string
          etapa_id?: string | null
          id?: string
          metrado_contractual?: number
          metrado_ejecutado?: number
          monto_contractual_costo?: number | null
          monto_contractual_venta?: number | null
          monto_ejecutado_costo?: number | null
          monto_ejecutado_venta?: number | null
          orden?: number
          parent_id?: string | null
          porcentaje_avance?: number | null
          precio_unitario_costo?: number
          precio_unitario_venta?: number
          proyecto_id?: string
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_partidas_cotizacion_partida_id_fkey"
            columns: ["cotizacion_partida_id"]
            isOneToOne: false
            referencedRelation: "cotizacion_partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_partidas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "proyecto_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_partidas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "proyecto_partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_partidas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_partidas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_partidas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_partidas_unidad_fkey"
            columns: ["unidad"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["codigo"]
          },
        ]
      }
      proyectos: {
        Row: {
          adelanto_amortizado: number | null
          adelanto_porcentaje: number | null
          cliente: string | null
          codigo: string
          cotizacion_id: string | null
          created_at: string
          created_by: string | null
          departamento: string | null
          descripcion: string | null
          direccion: string | null
          distrito: string | null
          estado: string
          fecha_fin_plan: string | null
          fecha_fin_real: string | null
          fecha_inicio: string | null
          id: string
          jefe_proyecto_id: string | null
          latitud: number | null
          longitud: number | null
          margen_porcentaje: number | null
          moneda: string
          monto_contrato: number | null
          nombre: string
          presupuesto_costo: number | null
          presupuesto_venta: number | null
          provincia: string | null
          radio_geofence_m: number | null
          ubicacion: string | null
          ubigeo_codigo: string | null
          updated_at: string
        }
        Insert: {
          adelanto_amortizado?: number | null
          adelanto_porcentaje?: number | null
          cliente?: string | null
          codigo: string
          cotizacion_id?: string | null
          created_at?: string
          created_by?: string | null
          departamento?: string | null
          descripcion?: string | null
          direccion?: string | null
          distrito?: string | null
          estado?: string
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string | null
          id?: string
          jefe_proyecto_id?: string | null
          latitud?: number | null
          longitud?: number | null
          margen_porcentaje?: number | null
          moneda?: string
          monto_contrato?: number | null
          nombre: string
          presupuesto_costo?: number | null
          presupuesto_venta?: number | null
          provincia?: string | null
          radio_geofence_m?: number | null
          ubicacion?: string | null
          ubigeo_codigo?: string | null
          updated_at?: string
        }
        Update: {
          adelanto_amortizado?: number | null
          adelanto_porcentaje?: number | null
          cliente?: string | null
          codigo?: string
          cotizacion_id?: string | null
          created_at?: string
          created_by?: string | null
          departamento?: string | null
          descripcion?: string | null
          direccion?: string | null
          distrito?: string | null
          estado?: string
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string | null
          id?: string
          jefe_proyecto_id?: string | null
          latitud?: number | null
          longitud?: number | null
          margen_porcentaje?: number | null
          moneda?: string
          monto_contrato?: number | null
          nombre?: string
          presupuesto_costo?: number | null
          presupuesto_venta?: number | null
          provincia?: string | null
          radio_geofence_m?: number | null
          ubicacion?: string | null
          ubigeo_codigo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "v_cotizacion_totales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_ubigeo_codigo_fkey"
            columns: ["ubigeo_codigo"]
            isOneToOne: false
            referencedRelation: "ubigeos"
            referencedColumns: ["codigo"]
          },
        ]
      }
      push_log: {
        Row: {
          created_at: string
          detail: string | null
          id: number
          source: string
          status: string
          target_user_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: number
          source: string
          status: string
          target_user_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: number
          source?: string
          status?: string
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
        Relationships: []
      }
      rdo_avances: {
        Row: {
          created_at: string
          id: string
          metrado_dia: number
          observaciones: string | null
          partida_id: string
          rdo_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metrado_dia: number
          observaciones?: string | null
          partida_id: string
          rdo_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metrado_dia?: number
          observaciones?: string | null
          partida_id?: string
          rdo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_avances_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "proyecto_partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_avances_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdo_partes"
            referencedColumns: ["id"]
          },
        ]
      }
      rdo_partes: {
        Row: {
          clima: string | null
          codigo: string | null
          created_at: string
          fecha: string
          id: string
          incidencias: string | null
          observaciones: string | null
          personal_total: number | null
          proyecto_id: string
          reportado_por: string | null
          resumen: string | null
          temperatura_c: number | null
          updated_at: string
        }
        Insert: {
          clima?: string | null
          codigo?: string | null
          created_at?: string
          fecha?: string
          id?: string
          incidencias?: string | null
          observaciones?: string | null
          personal_total?: number | null
          proyecto_id: string
          reportado_por?: string | null
          resumen?: string | null
          temperatura_c?: number | null
          updated_at?: string
        }
        Update: {
          clima?: string | null
          codigo?: string | null
          created_at?: string
          fecha?: string
          id?: string
          incidencias?: string | null
          observaciones?: string | null
          personal_total?: number | null
          proyecto_id?: string
          reportado_por?: string | null
          resumen?: string | null
          temperatura_c?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_partes_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_partes_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_partes_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          codigo: Database["public"]["Enums"]["rol_sistema"]
          color: string
          created_at: string
          descripcion: string | null
          icono: string
          nombre: string
          orden: number
          scope: string
        }
        Insert: {
          codigo: Database["public"]["Enums"]["rol_sistema"]
          color?: string
          created_at?: string
          descripcion?: string | null
          icono?: string
          nombre: string
          orden?: number
          scope: string
        }
        Update: {
          codigo?: Database["public"]["Enums"]["rol_sistema"]
          color?: string
          created_at?: string
          descripcion?: string | null
          icono?: string
          nombre?: string
          orden?: number
          scope?: string
        }
        Relationships: []
      }
      solicitudes_pago: {
        Row: {
          adjunto_url: string | null
          aprobada_gerencia_at: string | null
          aprobada_gerencia_por: string | null
          aprobada_jefe_at: string | null
          aprobada_jefe_por: string | null
          beneficiario: string
          categoria: Database["public"]["Enums"]["solicitud_categoria"]
          codigo: string | null
          concepto: string
          created_at: string
          estado: Database["public"]["Enums"]["solicitud_estado"]
          id: string
          moneda: string
          monto: number
          motivo_rechazo: string | null
          notas: string | null
          partida_id: string | null
          proveedor_id: string | null
          proyecto_id: string
          rechazada_at: string | null
          rechazada_por: string | null
          solicitado_por: string | null
          updated_at: string
          urgencia: string
        }
        Insert: {
          adjunto_url?: string | null
          aprobada_gerencia_at?: string | null
          aprobada_gerencia_por?: string | null
          aprobada_jefe_at?: string | null
          aprobada_jefe_por?: string | null
          beneficiario: string
          categoria: Database["public"]["Enums"]["solicitud_categoria"]
          codigo?: string | null
          concepto: string
          created_at?: string
          estado?: Database["public"]["Enums"]["solicitud_estado"]
          id?: string
          moneda?: string
          monto: number
          motivo_rechazo?: string | null
          notas?: string | null
          partida_id?: string | null
          proveedor_id?: string | null
          proyecto_id: string
          rechazada_at?: string | null
          rechazada_por?: string | null
          solicitado_por?: string | null
          updated_at?: string
          urgencia?: string
        }
        Update: {
          adjunto_url?: string | null
          aprobada_gerencia_at?: string | null
          aprobada_gerencia_por?: string | null
          aprobada_jefe_at?: string | null
          aprobada_jefe_por?: string | null
          beneficiario?: string
          categoria?: Database["public"]["Enums"]["solicitud_categoria"]
          codigo?: string | null
          concepto?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["solicitud_estado"]
          id?: string
          moneda?: string
          monto?: number
          motivo_rechazo?: string | null
          notas?: string | null
          partida_id?: string | null
          proveedor_id?: string | null
          proyecto_id?: string
          rechazada_at?: string | null
          rechazada_por?: string | null
          solicitado_por?: string | null
          updated_at?: string
          urgencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_pago_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "proyecto_partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      sst_charlas: {
        Row: {
          asistencia: number
          created_at: string
          fecha: string
          id: string
          notas: string | null
          proyecto_id: string
          reportada_por: string | null
          tema: string
        }
        Insert: {
          asistencia?: number
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          proyecto_id: string
          reportada_por?: string | null
          tema: string
        }
        Update: {
          asistencia?: number
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          proyecto_id?: string
          reportada_por?: string | null
          tema?: string
        }
        Relationships: [
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sst_charlas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      sst_incidentes: {
        Row: {
          acciones: string | null
          created_at: string
          descripcion: string
          evidencia_path: string | null
          fecha: string
          hora: string
          id: string
          involucrados: string | null
          proyecto_id: string
          reportado_por: string | null
          severidad: Database["public"]["Enums"]["sst_inc_severidad"]
        }
        Insert: {
          acciones?: string | null
          created_at?: string
          descripcion: string
          evidencia_path?: string | null
          fecha?: string
          hora?: string
          id?: string
          involucrados?: string | null
          proyecto_id: string
          reportado_por?: string | null
          severidad: Database["public"]["Enums"]["sst_inc_severidad"]
        }
        Update: {
          acciones?: string | null
          created_at?: string
          descripcion?: string
          evidencia_path?: string | null
          fecha?: string
          hora?: string
          id?: string
          involucrados?: string | null
          proyecto_id?: string
          reportado_por?: string | null
          severidad?: Database["public"]["Enums"]["sst_inc_severidad"]
        }
        Relationships: [
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sst_incidentes_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      sst_observaciones: {
        Row: {
          accion_correctiva: string | null
          created_at: string
          descripcion: string
          fecha: string
          id: string
          proyecto_id: string
          reportada_por: string | null
          resuelta: boolean
          tipo: Database["public"]["Enums"]["sst_obs_tipo"]
        }
        Insert: {
          accion_correctiva?: string | null
          created_at?: string
          descripcion: string
          fecha?: string
          id?: string
          proyecto_id: string
          reportada_por?: string | null
          resuelta?: boolean
          tipo: Database["public"]["Enums"]["sst_obs_tipo"]
        }
        Update: {
          accion_correctiva?: string | null
          created_at?: string
          descripcion?: string
          fecha?: string
          id?: string
          proyecto_id?: string
          reportada_por?: string | null
          resuelta?: boolean
          tipo?: Database["public"]["Enums"]["sst_obs_tipo"]
        }
        Relationships: [
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sst_observaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      ubigeos: {
        Row: {
          codigo: string
          departamento: string
          distrito: string
          latitud: number | null
          longitud: number | null
          provincia: string
          tipo: string
        }
        Insert: {
          codigo: string
          departamento: string
          distrito: string
          latitud?: number | null
          longitud?: number | null
          provincia: string
          tipo: string
        }
        Update: {
          codigo?: string
          departamento?: string
          distrito?: string
          latitud?: number | null
          longitud?: number | null
          provincia?: string
          tipo?: string
        }
        Relationships: []
      }
      unidades_medida: {
        Row: {
          codigo: string
          nombre: string
          tipo: string
        }
        Insert: {
          codigo: string
          nombre: string
          tipo: string
        }
        Update: {
          codigo?: string
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
      usuario_proyectos: {
        Row: {
          activo: boolean
          created_at: string
          desde: string
          hasta: string | null
          proyecto_id: string
          rol_obra: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          desde?: string
          hasta?: string | null
          proyecto_id: string
          rol_obra?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          desde?: string
          hasta?: string | null
          proyecto_id?: string
          rol_obra?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_proyectos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_proyectos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_proyectos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      valorizacion_partidas: {
        Row: {
          created_at: string
          id: string
          metrado_acumulado: number | null
          metrado_anterior: number
          metrado_contractual: number
          metrado_periodo: number
          monto_acumulado: number | null
          monto_periodo: number | null
          orden: number
          partida_id: string
          porcentaje_acumulado: number | null
          porcentaje_periodo: number | null
          precio_unitario: number
          valorizacion_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metrado_acumulado?: number | null
          metrado_anterior?: number
          metrado_contractual: number
          metrado_periodo?: number
          monto_acumulado?: number | null
          monto_periodo?: number | null
          orden?: number
          partida_id: string
          porcentaje_acumulado?: number | null
          porcentaje_periodo?: number | null
          precio_unitario: number
          valorizacion_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metrado_acumulado?: number | null
          metrado_anterior?: number
          metrado_contractual?: number
          metrado_periodo?: number
          monto_acumulado?: number | null
          monto_periodo?: number | null
          orden?: number
          partida_id?: string
          porcentaje_acumulado?: number | null
          porcentaje_periodo?: number | null
          precio_unitario?: number
          valorizacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valorizacion_partidas_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "proyecto_partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valorizacion_partidas_valorizacion_id_fkey"
            columns: ["valorizacion_id"]
            isOneToOne: false
            referencedRelation: "v_valorizacion_totales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valorizacion_partidas_valorizacion_id_fkey"
            columns: ["valorizacion_id"]
            isOneToOne: false
            referencedRelation: "valorizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      valorizaciones: {
        Row: {
          amortizacion_adelanto: number
          aprobada_at: string | null
          codigo: string | null
          created_at: string
          created_by: string | null
          enviada_at: string | null
          estado: Database["public"]["Enums"]["valorizacion_estado"]
          id: string
          igv_porcentaje: number
          notas: string | null
          numero: number
          pagada_at: string | null
          periodo_fin: string
          periodo_inicio: string
          proyecto_id: string
          retencion_porcentaje: number
          updated_at: string
        }
        Insert: {
          amortizacion_adelanto?: number
          aprobada_at?: string | null
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          enviada_at?: string | null
          estado?: Database["public"]["Enums"]["valorizacion_estado"]
          id?: string
          igv_porcentaje?: number
          notas?: string | null
          numero: number
          pagada_at?: string | null
          periodo_fin: string
          periodo_inicio: string
          proyecto_id: string
          retencion_porcentaje?: number
          updated_at?: string
        }
        Update: {
          amortizacion_adelanto?: number
          aprobada_at?: string | null
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          enviada_at?: string | null
          estado?: Database["public"]["Enums"]["valorizacion_estado"]
          id?: string
          igv_porcentaje?: number
          notas?: string | null
          numero?: number
          pagada_at?: string | null
          periodo_fin?: string
          periodo_inicio?: string
          proyecto_id?: string
          retencion_porcentaje?: number
          updated_at?: string
        }
        Relationships: [
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valorizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_almacen_central_stock: {
        Row: {
          cantidad_movimientos: number | null
          categoria: string | null
          descripcion: string | null
          insumo_codigo: string | null
          insumo_id: string | null
          stock_disponible: number | null
          total_devoluciones: number | null
          total_ingresos: number | null
          total_salidas: number | null
          ultimo_movimiento: string | null
          unidad: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insumos_maestros_unidad_fkey"
            columns: ["unidad"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["codigo"]
          },
        ]
      }
      v_almacen_stock: {
        Row: {
          cantidad_movimientos: number | null
          categoria: string | null
          descripcion: string | null
          disponible: number | null
          insumo_codigo: string | null
          insumo_id: string | null
          proyecto_codigo: string | null
          proyecto_id: string | null
          proyecto_nombre: string | null
          total_devoluciones: number | null
          total_salidas: number | null
          ultimo_movimiento: string | null
          unidad: string | null
        }
        Relationships: [
          {
            foreignKeyName: "almacen_movimientos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos_maestros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_movimientos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "v_almacen_central_stock"
            referencedColumns: ["insumo_id"]
          },
          {
            foreignKeyName: "almacen_movimientos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_movimientos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_movimientos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_movimientos_unidad_fkey"
            columns: ["unidad"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["codigo"]
          },
        ]
      }
      v_cajas_saldos: {
        Row: {
          entradas: number | null
          id: string | null
          moneda: string | null
          nombre: string | null
          proyecto_id: string | null
          saldo_actual: number | null
          saldo_inicial: number | null
          salidas: number | null
          tipo: string | null
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cajas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      v_cotizacion_totales: {
        Row: {
          codigo: string | null
          costo_directo: number | null
          estado: Database["public"]["Enums"]["cotizacion_estado"] | null
          gastos_generales: number | null
          gastos_generales_porcentaje: number | null
          id: string | null
          igv: number | null
          igv_porcentaje: number | null
          margen_porcentaje: number | null
          moneda: string | null
          subtotal: number | null
          titulo: string | null
          total: number | null
          utilidad: number | null
        }
        Relationships: []
      }
      v_curva_s: {
        Row: {
          fecha: string | null
          monto_acumulado: number | null
          monto_periodo: number | null
          periodo: number | null
          proyecto_id: string | null
        }
        Relationships: [
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valorizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dashboard_actividad_30d: {
        Row: {
          deletes: number | null
          dia: string | null
          inserts: number | null
          total: number | null
          updates: number | null
        }
        Relationships: []
      }
      v_dashboard_avance_vs_gasto: {
        Row: {
          codigo: string | null
          contractual: number | null
          ejecutado_venta: number | null
          estado: string | null
          fecha_fin_plan: string | null
          fecha_fin_real: string | null
          fecha_inicio: string | null
          gastado_real: number | null
          id: string | null
          latitud: number | null
          longitud: number | null
          nombre: string | null
          pct_avance: number | null
          presupuesto_venta: number | null
        }
        Relationships: []
      }
      v_dashboard_cartera: {
        Row: {
          cantidad: number | null
          estado: string | null
          monto_contrato: number | null
        }
        Relationships: []
      }
      v_dashboard_gasto_categoria: {
        Row: {
          cantidad: number | null
          categoria: Database["public"]["Enums"]["solicitud_categoria"] | null
          total: number | null
        }
        Relationships: []
      }
      v_dashboard_solicitudes: {
        Row: {
          cantidad: number | null
          estado: Database["public"]["Enums"]["solicitud_estado"] | null
          total: number | null
        }
        Relationships: []
      }
      v_proyectos_resumen: {
        Row: {
          codigo: string | null
          ejecutado_venta: number | null
          estado: string | null
          fecha_fin_plan: string | null
          fecha_inicio: string | null
          id: string | null
          moneda: string | null
          nombre: string | null
          partidas_count: number | null
          porcentaje_avance: number | null
          presupuesto_costo: number | null
          presupuesto_venta: number | null
          total_partidas_venta: number | null
          ubicacion: string | null
        }
        Relationships: []
      }
      v_valorizacion_totales: {
        Row: {
          amortizacion_adelanto: number | null
          codigo: string | null
          estado: Database["public"]["Enums"]["valorizacion_estado"] | null
          id: string | null
          igv: number | null
          igv_porcentaje: number | null
          monto_a_pagar: number | null
          monto_acumulado: number | null
          monto_periodo: number | null
          numero: number | null
          periodo_fin: string | null
          periodo_inicio: string | null
          proyecto_id: string | null
          retencion: number | null
          retencion_porcentaje: number | null
        }
        Relationships: [
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
            referencedRelation: "v_dashboard_avance_vs_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valorizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "v_proyectos_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_user_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_sistema"]
      }
      es_mando: { Args: never; Returns: boolean }
      es_rol_in: {
        Args: { roles: Database["public"]["Enums"]["rol_sistema"][] }
        Returns: boolean
      }
      fn_crear_proyecto_desde_cotizacion: {
        Args: { p_cotizacion_id: string }
        Returns: string
      }
      fn_generar_valorizacion: {
        Args: {
          p_periodo_fin: string
          p_periodo_inicio: string
          p_proyecto_id: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      tiene_proyecto: { Args: { p_proyecto_id: string }; Returns: boolean }
    }
    Enums: {
      addtype: "adicional" | "deductivo"
      cotizacion_estado:
        | "borrador"
        | "enviada"
        | "en_negociacion"
        | "aprobada"
        | "rechazada"
      insumo_categoria:
        | "mano_obra"
        | "material"
        | "equipo"
        | "subcontrato"
        | "transporte"
        | "gasto_general"
      rol_sistema:
        | "gerencia_general"
        | "jefe_proyectos"
        | "jefe_presupuestos"
        | "administrador"
        | "comercial"
        | "residente"
      solicitud_categoria:
        | "proveedor"
        | "contratista"
        | "jornales"
        | "caja_chica"
        | "agua"
        | "alquiler_equipo"
        | "flete"
        | "servicios"
        | "otros"
      solicitud_estado:
        | "pendiente"
        | "aprobada_jefe"
        | "rechazada"
        | "programada"
        | "pagada"
        | "cancelada"
      sst_inc_severidad: "leve" | "moderado" | "grave" | "critico"
      sst_obs_tipo: "acto_inseguro" | "condicion_insegura" | "sugerencia"
      valorizacion_estado:
        | "borrador"
        | "enviada"
        | "aprobada"
        | "pagada"
        | "rechazada"
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
      addtype: ["adicional", "deductivo"],
      cotizacion_estado: [
        "borrador",
        "enviada",
        "en_negociacion",
        "aprobada",
        "rechazada",
      ],
      insumo_categoria: [
        "mano_obra",
        "material",
        "equipo",
        "subcontrato",
        "transporte",
        "gasto_general",
      ],
      rol_sistema: [
        "gerencia_general",
        "jefe_proyectos",
        "jefe_presupuestos",
        "administrador",
        "comercial",
        "residente",
      ],
      solicitud_categoria: [
        "proveedor",
        "contratista",
        "jornales",
        "caja_chica",
        "agua",
        "alquiler_equipo",
        "flete",
        "servicios",
        "otros",
      ],
      solicitud_estado: [
        "pendiente",
        "aprobada_jefe",
        "rechazada",
        "programada",
        "pagada",
        "cancelada",
      ],
      sst_inc_severidad: ["leve", "moderado", "grave", "critico"],
      sst_obs_tipo: ["acto_inseguro", "condicion_insegura", "sugerencia"],
      valorizacion_estado: [
        "borrador",
        "enviada",
        "aprobada",
        "pagada",
        "rechazada",
      ],
    },
  },
} as const
