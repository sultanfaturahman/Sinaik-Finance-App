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
      ai_strategy_runs: {
        Row: {
          created_at: string
          financial_summary: Json
          goals: Json
          id: string
          model: string | null
          payload_hash: string
          profile: Json
          raw_response: string | null
          strategy: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          financial_summary: Json
          goals: Json
          id?: string
          model?: string | null
          payload_hash: string
          profile: Json
          raw_response?: string | null
          strategy: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          financial_summary?: Json
          goals?: Json
          id?: string
          model?: string | null
          payload_hash?: string
          profile?: Json
          raw_response?: string | null
          strategy?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          created_at: string | null
          error_rows: number | null
          filename: string
          id: string
          status: string | null
          success_rows: number | null
          total_rows: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_rows?: number | null
          filename: string
          id?: string
          status?: string | null
          success_rows?: number | null
          total_rows?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_rows?: number | null
          filename?: string
          id?: string
          status?: string | null
          success_rows?: number | null
          total_rows?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          category_suggestions: string[]
          business_name: string | null
          business_type: string | null
          city: string | null
          email: string
          id: string
          name: string
          onboarding_completed: boolean
          phone: string | null
          profile_completed: boolean
          profile_completed_at: string | null
          selected_sector: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          category_suggestions?: string[]
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          email: string
          id: string
          name: string
          onboarding_completed?: boolean
          phone?: string | null
          profile_completed?: boolean
          profile_completed_at?: string | null
          selected_sector?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          category_suggestions?: string[]
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          email?: string
          id?: string
          name?: string
          onboarding_completed?: boolean
          phone?: string | null
          profile_completed?: boolean
          profile_completed_at?: string | null
          selected_sector?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          created_at: string | null
          frequency: Database["public"]["Enums"]["report_frequency"]
          id: string
          note: string | null
          report_date: string
          total_expense: number | null
          total_income: number | null
          updated_at: string | null
          user_id: string
          income_category: string | null
          expense_category: string | null
        }
        Insert: {
          created_at?: string | null
          frequency: Database["public"]["Enums"]["report_frequency"]
          id?: string
          note?: string | null
          report_date: string
          total_expense?: number | null
          total_income?: number | null
          updated_at?: string | null
          user_id: string
          income_category?: string | null
          expense_category?: string | null
        }
        Update: {
          created_at?: string | null
          frequency?: Database["public"]["Enums"]["report_frequency"]
          id?: string
          note?: string | null
          report_date?: string
          total_expense?: number | null
          total_income?: number | null
          updated_at?: string | null
          user_id?: string
          income_category?: string | null
          expense_category?: string | null
        }
        Relationships: []
      }
      transaction_templates: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          is_recurring: boolean
          name: string
          next_occurrence: string | null
          recurring_frequency: Database["public"]["Enums"]["transaction_recurring_frequency"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          name: string
          next_occurrence?: string | null
          recurring_frequency?: Database["public"]["Enums"]["transaction_recurring_frequency"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          name?: string
          next_occurrence?: string | null
          recurring_frequency?: Database["public"]["Enums"]["transaction_recurring_frequency"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          id: string
          note: string | null
          source: Database["public"]["Enums"]["transaction_source"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date?: string
          id?: string
          note?: string | null
          source?: Database["public"]["Enums"]["transaction_source"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          id?: string
          note?: string | null
          source?: Database["public"]["Enums"]["transaction_source"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      umkm_status: {
        Row: {
          annual_revenue: number | null
          id: string
          level: Database["public"]["Enums"]["umkm_level"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_revenue?: number | null
          id?: string
          level?: Database["public"]["Enums"]["umkm_level"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_revenue?: number | null
          id?: string
          level?: Database["public"]["Enums"]["umkm_level"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "cashier"
      transaction_source: "pwa" | "excel" | "manual"
      transaction_type: "income" | "expense"
      transaction_recurring_frequency: "daily" | "weekly" | "monthly" | "yearly"
      umkm_level: "ultra_mikro" | "super_mikro" | "mikro" | "kecil"
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
      app_role: ["admin", "owner", "cashier"],
      transaction_source: ["pwa", "excel", "manual"],
      transaction_type: ["income", "expense"],
      transaction_recurring_frequency: ["daily", "weekly", "monthly", "yearly"],
      report_frequency: ["daily", "monthly"],
      umkm_level: ["ultra_mikro", "super_mikro", "mikro", "kecil"],
    },
  },
} as const
