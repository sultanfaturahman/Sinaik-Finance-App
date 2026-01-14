export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      ai_strategy_runs: {
        Row: {
          id: string;
          user_id: string;
          payload_hash: string;
          profile: Json;
          financial_summary: Json;
          goals: Json;
          strategy: Json;
          raw_response: string | null;
          model: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          payload_hash: string;
          profile: Json;
          financial_summary: Json;
          goals: Json;
          strategy: Json;
          raw_response?: string | null;
          model?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          payload_hash?: string;
          profile?: Json;
          financial_summary?: Json;
          goals?: Json;
          strategy?: Json;
          raw_response?: string | null;
          model?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          created_at: string | null;
          updated_at: string | null;
          onboarding_completed: boolean;
          selected_sector: string | null;
          category_suggestions: string[];
          business_name: string | null;
          business_type: string | null;
          city: string | null;
          phone: string | null;
          profile_completed: boolean | null;
          profile_completed_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          created_at?: string | null;
          updated_at?: string | null;
          onboarding_completed?: boolean;
          selected_sector?: string | null;
          category_suggestions?: string[];
          business_name?: string | null;
          business_type?: string | null;
          city?: string | null;
          phone?: string | null;
          profile_completed?: boolean | null;
          profile_completed_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          created_at?: string | null;
          updated_at?: string | null;
          onboarding_completed?: boolean;
          selected_sector?: string | null;
          category_suggestions?: string[];
          business_name?: string | null;
          business_type?: string | null;
          city?: string | null;
          phone?: string | null;
          profile_completed?: boolean | null;
          profile_completed_at?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["transaction_type"];
          amount: number;
          category: string;
          date: string;
          note: string | null;
          source: Database["public"]["Enums"]["transaction_source"] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["transaction_type"];
          amount: number;
          category: string;
          date?: string;
          note?: string | null;
          source?: Database["public"]["Enums"]["transaction_source"] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["transaction_type"];
          amount?: number;
          category?: string;
          date?: string;
          note?: string | null;
          source?: Database["public"]["Enums"]["transaction_source"] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      umkm_status: {
        Row: {
          id: string;
          user_id: string;
          level: Database["public"]["Enums"]["umkm_level"];
          annual_revenue: number | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          level?: Database["public"]["Enums"]["umkm_level"];
          annual_revenue?: number | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          level?: Database["public"]["Enums"]["umkm_level"];
          annual_revenue?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_income: number;
          total_expense: number;
          net_profit: number;
          transaction_count: number;
        }[];
      };
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      transaction_source: "pwa" | "excel" | "manual";
      transaction_type: "income" | "expense";
      umkm_level: "ultra_mikro" | "super_mikro" | "mikro" | "kecil";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
