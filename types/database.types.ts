// Generated from Supabase schema — DO NOT EDIT MANUALLY.
// Regenerate with: pnpm db:types

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
      proyectos: {
        Row: {
          cliente: string | null
          codigo: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          estado: string
          fecha_fin_plan: string | null
          fecha_fin_real: string | null
          fecha_inicio: string | null
          id: string
          jefe_proyecto_id: string | null
          latitud: number | null
          longitud: number | null
          moneda: string
          monto_contrato: number | null
          nombre: string
          radio_geofence_m: number | null
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          cliente?: string | null
          codigo: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string | null
          id?: string
          jefe_proyecto_id?: string | null
          latitud?: number | null
          longitud?: number | null
          moneda?: string
          monto_contrato?: number | null
          nombre: string
          radio_geofence_m?: number | null
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          cliente?: string | null
          codigo?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string | null
          id?: string
          jefe_proyecto_id?: string | null
          latitud?: number | null
          longitud?: number | null
          moneda?: string
          monto_contrato?: number | null
          nombre?: string
          radio_geofence_m?: number | null
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: []
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
        ]
      }
    }
    Views: {
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      tiene_proyecto: { Args: { p_proyecto_id: string }; Returns: boolean }
    }
    Enums: {
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
    },
  },
} as const

