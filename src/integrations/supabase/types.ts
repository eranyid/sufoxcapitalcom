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
      company_decisions: {
        Row: {
          company_id: string
          created_at: string
          decision_date: string
          decision_type: string
          id: string
          rationale: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          decision_date?: string
          decision_type: string
          id?: string
          rationale: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          decision_date?: string
          decision_type?: string
          id?: string
          rationale?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          project_id: string
          source_transaction_id: string | null
          ticker: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          project_id: string
          source_transaction_id?: string | null
          ticker: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          project_id?: string
          source_transaction_id?: string | null
          ticker?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "crm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          business_description: string | null
          company_name: string
          confidence_level: string | null
          created_at: string
          deleted_at: string | null
          exit_criteria: string | null
          geography: string | null
          group_name: string
          id: string
          investment_thesis: string | null
          is_auto_linked: boolean | null
          key_risks: string | null
          market_cap: string | null
          notes: string | null
          project_id: string | null
          sector: string | null
          source_transaction_id: string | null
          status: string
          thesis_summary: string | null
          ticker: string | null
          time_horizon: string | null
          timeline_end: string | null
          timeline_start: string | null
          updated_at: string
          user_id: string
          valuation_logic: string | null
          why_we_own: string | null
        }
        Insert: {
          business_description?: string | null
          company_name: string
          confidence_level?: string | null
          created_at?: string
          deleted_at?: string | null
          exit_criteria?: string | null
          geography?: string | null
          group_name?: string
          id?: string
          investment_thesis?: string | null
          is_auto_linked?: boolean | null
          key_risks?: string | null
          market_cap?: string | null
          notes?: string | null
          project_id?: string | null
          sector?: string | null
          source_transaction_id?: string | null
          status?: string
          thesis_summary?: string | null
          ticker?: string | null
          time_horizon?: string | null
          timeline_end?: string | null
          timeline_start?: string | null
          updated_at?: string
          user_id: string
          valuation_logic?: string | null
          why_we_own?: string | null
        }
        Update: {
          business_description?: string | null
          company_name?: string
          confidence_level?: string | null
          created_at?: string
          deleted_at?: string | null
          exit_criteria?: string | null
          geography?: string | null
          group_name?: string
          id?: string
          investment_thesis?: string | null
          is_auto_linked?: boolean | null
          key_risks?: string | null
          market_cap?: string | null
          notes?: string | null
          project_id?: string | null
          sector?: string | null
          source_transaction_id?: string | null
          status?: string
          thesis_summary?: string | null
          ticker?: string | null
          time_horizon?: string | null
          timeline_end?: string | null
          timeline_start?: string | null
          updated_at?: string
          user_id?: string
          valuation_logic?: string | null
          why_we_own?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_companies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "crm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_funds: {
        Row: {
          asset_class: string | null
          created_at: string
          deleted_at: string | null
          fund_name: string
          geography: string | null
          group_name: string
          id: string
          manager: string | null
          notes: string | null
          priority: string
          project_id: string | null
          status: string
          strategy: string | null
          timeline_end: string | null
          timeline_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_class?: string | null
          created_at?: string
          deleted_at?: string | null
          fund_name: string
          geography?: string | null
          group_name?: string
          id?: string
          manager?: string | null
          notes?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          strategy?: string | null
          timeline_end?: string | null
          timeline_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_class?: string | null
          created_at?: string
          deleted_at?: string | null
          fund_name?: string
          geography?: string | null
          group_name?: string
          id?: string
          manager?: string | null
          notes?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          strategy?: string | null
          timeline_end?: string | null
          timeline_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_funds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "crm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_projects: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          company_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          owner: string | null
          project_id: string | null
          status: string
          task_name: string
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          project_id?: string | null
          status?: string
          task_name: string
          updated_at?: string
          urgency?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          project_id?: string | null
          status?: string
          task_name?: string
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "crm_projects"
            referencedColumns: ["id"]
          },
        ]
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
          cash_max_pct: number | null
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
          max_volatility_pct: number | null
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
          cash_max_pct?: number | null
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
          max_volatility_pct?: number | null
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
          cash_max_pct?: number | null
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
          max_volatility_pct?: number | null
          min_liquid_assets_pct?: number | null
          risk_tolerance?: string | null
          special_constraints?: string | null
          strategy_philosophy?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      news_sources: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          last_test_status: string | null
          last_tested_at: string | null
          name: string | null
          order_index: number
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_test_status?: string | null
          last_tested_at?: string | null
          name?: string | null
          order_index?: number
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_test_status?: string | null
          last_tested_at?: string | null
          name?: string | null
          order_index?: number
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          task_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
        ]
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
          notify_on_assignment: boolean | null
          notify_on_new_update: boolean | null
          notify_on_status_change: boolean | null
          notify_on_urgency_change: boolean | null
          risk_free_rate: number | null
          rss_feed_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_currency?: string | null
          benchmark_returns?: Json | null
          created_at?: string
          id?: string
          notify_on_assignment?: boolean | null
          notify_on_new_update?: boolean | null
          notify_on_status_change?: boolean | null
          notify_on_urgency_change?: boolean | null
          risk_free_rate?: number | null
          rss_feed_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_currency?: string | null
          benchmark_returns?: Json | null
          created_at?: string
          id?: string
          notify_on_assignment?: boolean | null
          notify_on_new_update?: boolean | null
          notify_on_status_change?: boolean | null
          notify_on_urgency_change?: boolean | null
          risk_free_rate?: number | null
          rss_feed_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_approved: boolean
          last_sign_in_at: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_approved?: boolean
          last_sign_in_at?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean
          last_sign_in_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          attempt_count: number
          blocked_until: string | null
          first_attempt_at: string
          id: string
          identifier: string
          last_attempt_at: string
        }
        Insert: {
          action: string
          attempt_count?: number
          blocked_until?: string | null
          first_attempt_at?: string
          id?: string
          identifier: string
          last_attempt_at?: string
        }
        Update: {
          action?: string
          attempt_count?: number
          blocked_until?: string | null
          first_attempt_at?: string
          id?: string
          identifier?: string
          last_attempt_at?: string
        }
        Relationships: []
      }
      research_watchlist: {
        Row: {
          asset_class: string | null
          created_at: string
          display_name: string | null
          id: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_class?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_class?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_activity_log: {
        Row: {
          action: string
          created_at: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_files: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_updates: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ticker_symbols: {
        Row: {
          category: string | null
          created_at: string
          enabled: boolean
          id: string
          label: string
          order_index: number
          tv_symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          label: string
          order_index?: number
          tv_symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          order_index?: number
          tv_symbol?: string
          updated_at?: string
          user_id?: string
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      valuations: {
        Row: {
          asset_id: string | null
          asset_name: string
          created_at: string
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_soft_deleted_items: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
