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
      [_ in never]: never
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

