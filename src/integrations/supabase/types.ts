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
      cash_balances: {
        Row: {
          created_at: string
          eur: number | null
          id: string
          ils: number | null
          updated_at: string
          usd: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          eur?: number | null
          id?: string
          ils?: number | null
          updated_at?: string
          usd?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          eur?: number | null
          id?: string
          ils?: number | null
          updated_at?: string
          usd?: number | null
          user_id?: string
        }
        Relationships: []
      }
      custom_scenarios: {
        Row: {
          created_at: string
          description: string | null
          horizon: string
          id: string
          name: string
          shocks: Json
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          horizon?: string
          id?: string
          name: string
          shocks?: Json
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          horizon?: string
          id?: string
          name?: string
          shocks?: Json
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_policies: {
        Row: {
          alternatives_max_pct: number | null
          alternatives_min_pct: number | null
          cash_min_pct: number | null
          created_at: string
          equity_max_pct: number | null
          equity_min_pct: number | null
          fixed_income_max_pct: number | null
          fixed_income_min_pct: number | null
          geographic_limits: Json | null
          id: string
          investment_horizon_years: number | null
          leverage_allowed: boolean | null
          max_leverage_ratio: number | null
          max_sector_allocation_pct: number | null
          max_single_position_pct: number | null
          min_liquid_assets_pct: number | null
          risk_tolerance: string | null
          special_constraints: string | null
          strategy_philosophy: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alternatives_max_pct?: number | null
          alternatives_min_pct?: number | null
          cash_min_pct?: number | null
          created_at?: string
          equity_max_pct?: number | null
          equity_min_pct?: number | null
          fixed_income_max_pct?: number | null
          fixed_income_min_pct?: number | null
          geographic_limits?: Json | null
          id?: string
          investment_horizon_years?: number | null
          leverage_allowed?: boolean | null
          max_leverage_ratio?: number | null
          max_sector_allocation_pct?: number | null
          max_single_position_pct?: number | null
          min_liquid_assets_pct?: number | null
          risk_tolerance?: string | null
          special_constraints?: string | null
          strategy_philosophy?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alternatives_max_pct?: number | null
          alternatives_min_pct?: number | null
          cash_min_pct?: number | null
          created_at?: string
          equity_max_pct?: number | null
          equity_min_pct?: number | null
          fixed_income_max_pct?: number | null
          fixed_income_min_pct?: number | null
          geographic_limits?: Json | null
          id?: string
          investment_horizon_years?: number | null
          leverage_allowed?: boolean | null
          max_leverage_ratio?: number | null
          max_sector_allocation_pct?: number | null
          max_single_position_pct?: number | null
          min_liquid_assets_pct?: number | null
          risk_tolerance?: string | null
          special_constraints?: string | null
          strategy_philosophy?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      passkey_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_type: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      portfolio_settings: {
        Row: {
          base_currency: string | null
          benchmark_returns: Json | null
          created_at: string
          id: string
          risk_free_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_currency?: string | null
          benchmark_returns?: Json | null
          created_at?: string
          id?: string
          risk_free_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_currency?: string | null
          benchmark_returns?: Json | null
          created_at?: string
          id?: string
          risk_free_rate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          asset_name: string
          asset_type: string
          created_at: string
          currency: string
          date: string
          fees: number | null
          geography: string
          id: string
          inception_year: number | null
          price_per_unit: number
          quantity: number
          ticker: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_name: string
          asset_type?: string
          created_at?: string
          currency?: string
          date: string
          fees?: number | null
          geography?: string
          id?: string
          inception_year?: number | null
          price_per_unit: number
          quantity: number
          ticker: string
          transaction_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_name?: string
          asset_type?: string
          created_at?: string
          currency?: string
          date?: string
          fees?: number | null
          geography?: string
          id?: string
          inception_year?: number | null
          price_per_unit?: number
          quantity?: number
          ticker?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      valuations: {
        Row: {
          asset_id: string | null
          asset_name: string
          created_at: string
          fx_rate: number | null
          id: string
          month: string
          price_per_unit: number
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          asset_name: string
          created_at?: string
          fx_rate?: number | null
          id?: string
          month: string
          price_per_unit: number
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string | null
          asset_name?: string
          created_at?: string
          fx_rate?: number | null
          id?: string
          month?: string
          price_per_unit?: number
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
