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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      parts: {
        Row: {
          approver: string | null
          assembly: string | null
          cad_model_url: string | null
          cost_per_part: number | null
          cost_sum: number | null
          created_at: string
          created_by: string | null
          department: string
          description: string | null
          designer: string | null
          documentation_url: string | null
          emissions_per_part: number | null
          emissions_sum: number | null
          id: string
          manufactured_purchased: Database["public"]["Enums"]["manufactured_purchased"]
          manufacturing_type: string | null
          material: string | null
          name: string
          part_number: string
          quantity: number | null
          responsible_company: string | null
          responsible_person: string | null
          status: Database["public"]["Enums"]["part_status"]
          sub_assembly: string | null
          system: string | null
          technical_drawing_url: string | null
          updated_at: string
          version: string
        }
        Insert: {
          approver?: string | null
          assembly?: string | null
          cad_model_url?: string | null
          cost_per_part?: number | null
          cost_sum?: number | null
          created_at?: string
          created_by?: string | null
          department: string
          description?: string | null
          designer?: string | null
          documentation_url?: string | null
          emissions_per_part?: number | null
          emissions_sum?: number | null
          id?: string
          manufactured_purchased?: Database["public"]["Enums"]["manufactured_purchased"]
          manufacturing_type?: string | null
          material?: string | null
          name: string
          part_number: string
          quantity?: number | null
          responsible_company?: string | null
          responsible_person?: string | null
          status?: Database["public"]["Enums"]["part_status"]
          sub_assembly?: string | null
          system?: string | null
          technical_drawing_url?: string | null
          updated_at?: string
          version?: string
        }
        Update: {
          approver?: string | null
          assembly?: string | null
          cad_model_url?: string | null
          cost_per_part?: number | null
          cost_sum?: number | null
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string | null
          designer?: string | null
          documentation_url?: string | null
          emissions_per_part?: number | null
          emissions_sum?: number | null
          id?: string
          manufactured_purchased?: Database["public"]["Enums"]["manufactured_purchased"]
          manufacturing_type?: string | null
          material?: string | null
          name?: string
          part_number?: string
          quantity?: number | null
          responsible_company?: string | null
          responsible_person?: string | null
          status?: Database["public"]["Enums"]["part_status"]
          sub_assembly?: string | null
          system?: string | null
          technical_drawing_url?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_history: {
        Row: {
          approver: string | null
          assembly: string | null
          cad_model_url: string | null
          changed_at: string
          changed_by: string | null
          cost_per_part: number | null
          cost_sum: number | null
          department: string
          description: string | null
          designer: string | null
          documentation_url: string | null
          emissions_per_part: number | null
          emissions_sum: number | null
          id: string
          manufactured_purchased: Database["public"]["Enums"]["manufactured_purchased"]
          manufacturing_type: string | null
          material: string | null
          name: string
          part_id: string | null
          part_number: string
          quantity: number | null
          responsible_company: string | null
          responsible_person: string | null
          status: Database["public"]["Enums"]["part_status"]
          sub_assembly: string | null
          system: string | null
          technical_drawing_url: string | null
          version: string
        }
        Insert: {
          approver?: string | null
          assembly?: string | null
          cad_model_url?: string | null
          changed_at?: string
          changed_by?: string | null
          cost_per_part?: number | null
          cost_sum?: number | null
          department: string
          description?: string | null
          designer?: string | null
          documentation_url?: string | null
          emissions_per_part?: number | null
          emissions_sum?: number | null
          id?: string
          manufactured_purchased: Database["public"]["Enums"]["manufactured_purchased"]
          manufacturing_type?: string | null
          material?: string | null
          name: string
          part_id?: string | null
          part_number: string
          quantity?: number | null
          responsible_company?: string | null
          responsible_person?: string | null
          status: Database["public"]["Enums"]["part_status"]
          sub_assembly?: string | null
          system?: string | null
          technical_drawing_url?: string | null
          version: string
        }
        Update: {
          approver?: string | null
          assembly?: string | null
          cad_model_url?: string | null
          changed_at?: string
          changed_by?: string | null
          cost_per_part?: number | null
          cost_sum?: number | null
          department?: string
          description?: string | null
          designer?: string | null
          documentation_url?: string | null
          emissions_per_part?: number | null
          emissions_sum?: number | null
          id?: string
          manufactured_purchased?: Database["public"]["Enums"]["manufactured_purchased"]
          manufacturing_type?: string | null
          material?: string | null
          name?: string
          part_id?: string | null
          part_number?: string
          quantity?: number | null
          responsible_company?: string | null
          responsible_person?: string | null
          status?: Database["public"]["Enums"]["part_status"]
          sub_assembly?: string | null
          system?: string | null
          technical_drawing_url?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_history_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          discord_profile: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          discord_profile?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          discord_profile?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_part_number: { Args: { dept: string }; Returns: string }
    }
    Enums: {
      manufactured_purchased: "gyartott" | "vasarolt"
      part_status:
        | "terv"
        | "gyartas_alatt"
        | "kesz"
        | "jovahagyasra_var"
        | "elutasitva"
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
      manufactured_purchased: ["gyartott", "vasarolt"],
      part_status: [
        "terv",
        "gyartas_alatt",
        "kesz",
        "jovahagyasra_var",
        "elutasitva",
      ],
    },
  },
} as const
