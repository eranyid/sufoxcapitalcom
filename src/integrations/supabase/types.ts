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
      calendar_integrations: {
        Row: {
          created_at: string
          ics_url: string | null
          id: string
          last_synced_at: string | null
          provider: string
          sync_error: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ics_url?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ics_url?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      capital_ledger: {
        Row: {
          amount: number
          amount_base: number | null
          base_currency: string | null
          client_id: string | null
          created_at: string
          currency: string
          description: string | null
          entry_type: string
          fx_rate_used: number | null
          id: string
          metadata: Json | null
          running_balance: number | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          amount_base?: number | null
          base_currency?: string | null
          client_id?: string | null
          created_at?: string
          currency: string
          description?: string | null
          entry_type: string
          fx_rate_used?: number | null
          id?: string
          metadata?: Json | null
          running_balance?: number | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          amount_base?: number | null
          base_currency?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          entry_type?: string
          fx_rate_used?: number | null
          id?: string
          metadata?: Json | null
          running_balance?: number | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_ledger_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_balances: {
        Row: {
          chf: number | null
          client_id: string | null
          created_at: string
          eur: number | null
          gbp: number | null
          id: string
          ils: number | null
          jpy: number | null
          updated_at: string
          usd: number | null
          user_id: string
        }
        Insert: {
          chf?: number | null
          client_id?: string | null
          created_at?: string
          eur?: number | null
          gbp?: number | null
          id?: string
          ils?: number | null
          jpy?: number | null
          updated_at?: string
          usd?: number | null
          user_id: string
        }
        Update: {
          chf?: number | null
          client_id?: string | null
          created_at?: string
          eur?: number | null
          gbp?: number | null
          id?: string
          ils?: number | null
          jpy?: number | null
          updated_at?: string
          usd?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_balances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_workspaces: {
        Row: {
          client_id: string | null
          client_name: string | null
          created_at: string
          current_version: number
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          current_version?: number
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          current_version?: number
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workspaces_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_decisions: {
        Row: {
          catalyst_timeline: string | null
          company_id: string
          confidence: number | null
          created_at: string
          decision_date: string
          decision_type: string
          direction: string | null
          expected_outcome: string | null
          id: string
          key_assumptions: string | null
          rationale: string
          risks_breaks_thesis: string | null
          size_change: number | null
          size_unit: string | null
          tags: string[] | null
          ticker: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          catalyst_timeline?: string | null
          company_id: string
          confidence?: number | null
          created_at?: string
          decision_date?: string
          decision_type: string
          direction?: string | null
          expected_outcome?: string | null
          id?: string
          key_assumptions?: string | null
          rationale: string
          risks_breaks_thesis?: string | null
          size_change?: number | null
          size_unit?: string | null
          tags?: string[] | null
          ticker?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          catalyst_timeline?: string | null
          company_id?: string
          confidence?: number | null
          created_at?: string
          decision_date?: string
          decision_type?: string
          direction?: string | null
          expected_outcome?: string | null
          id?: string
          key_assumptions?: string | null
          rationale?: string
          risks_breaks_thesis?: string | null
          size_change?: number | null
          size_unit?: string | null
          tags?: string[] | null
          ticker?: string | null
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
      company_files: {
        Row: {
          category: string | null
          company_id: string
          content_type: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          order_index: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          company_id: string
          content_type?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          order_index?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          company_id?: string
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          order_index?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_research_entries: {
        Row: {
          calculator_type: string | null
          company_id: string | null
          created_at: string
          entry_type: string
          id: string
          inputs_json: Json | null
          output_summary: string | null
          outputs_json: Json | null
          question_text: string | null
          related_holding_id: string | null
          tags: string[] | null
          ticker: string | null
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          calculator_type?: string | null
          company_id?: string | null
          created_at?: string
          entry_type?: string
          id?: string
          inputs_json?: Json | null
          output_summary?: string | null
          outputs_json?: Json | null
          question_text?: string | null
          related_holding_id?: string | null
          tags?: string[] | null
          ticker?: string | null
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          calculator_type?: string | null
          company_id?: string | null
          created_at?: string
          entry_type?: string
          id?: string
          inputs_json?: Json | null
          output_summary?: string | null
          outputs_json?: Json | null
          question_text?: string | null
          related_holding_id?: string | null
          tags?: string[] | null
          ticker?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_research_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
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
          asset_type: string | null
          business_description: string | null
          client_id: string | null
          company_name: string
          confidence_level: string | null
          created_at: string
          deleted_at: string | null
          employee_count: number | null
          exit_criteria: string | null
          geography: string | null
          group_name: string
          id: string
          inception_year: number | null
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
          asset_type?: string | null
          business_description?: string | null
          client_id?: string | null
          company_name: string
          confidence_level?: string | null
          created_at?: string
          deleted_at?: string | null
          employee_count?: number | null
          exit_criteria?: string | null
          geography?: string | null
          group_name?: string
          id?: string
          inception_year?: number | null
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
          asset_type?: string | null
          business_description?: string | null
          client_id?: string | null
          company_name?: string
          confidence_level?: string | null
          created_at?: string
          deleted_at?: string | null
          employee_count?: number | null
          exit_criteria?: string | null
          geography?: string | null
          group_name?: string
          id?: string
          inception_year?: number | null
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
            foreignKeyName: "crm_companies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
          actual_hours: number | null
          company_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          linked_project_id: string | null
          owner: string | null
          project_id: string | null
          status: string
          tags: string[] | null
          task_name: string
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          company_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          linked_project_id?: string | null
          owner?: string | null
          project_id?: string | null
          status?: string
          tags?: string[] | null
          task_name: string
          updated_at?: string
          urgency?: string
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          company_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          linked_project_id?: string | null
          owner?: string | null
          project_id?: string | null
          status?: string
          tags?: string[] | null
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
            foreignKeyName: "crm_tasks_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "custom_scenarios_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      external_events: {
        Row: {
          created_at: string
          description: string | null
          end_at: string
          external_uid: string
          id: string
          is_all_day: boolean | null
          location: string | null
          provider: string
          raw_payload: Json | null
          start_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_at: string
          external_uid: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          provider?: string
          raw_payload?: Json | null
          start_at: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_at?: string
          external_uid?: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          provider?: string
          raw_payload?: Json | null
          start_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          client_id: string | null
          created_at: string
          from_currency: string
          id: string
          rate: number
          rate_date: string
          source: string | null
          to_currency: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          from_currency: string
          id?: string
          rate: number
          rate_date: string
          source?: string | null
          to_currency: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          from_currency?: string
          id?: string
          rate?: number
          rate_date?: string
          source?: string | null
          to_currency?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fx_rates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings_snapshot: {
        Row: {
          asset_currency: string
          asset_name: string
          avg_cost_base: number
          avg_cost_local: number
          base_currency: string
          client_id: string | null
          created_at: string
          fx_rate_at_entry: number | null
          id: string
          last_updated: string
          quantity: number
          ticker: string
          total_cost_base: number
          user_id: string
        }
        Insert: {
          asset_currency: string
          asset_name: string
          avg_cost_base: number
          avg_cost_local: number
          base_currency?: string
          client_id?: string | null
          created_at?: string
          fx_rate_at_entry?: number | null
          id?: string
          last_updated?: string
          quantity: number
          ticker: string
          total_cost_base: number
          user_id: string
        }
        Update: {
          asset_currency?: string
          asset_name?: string
          avg_cost_base?: number
          avg_cost_local?: number
          base_currency?: string
          client_id?: string | null
          created_at?: string
          fx_rate_at_entry?: number | null
          id?: string
          last_updated?: string
          quantity?: number
          ticker?: string
          total_cost_base?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_snapshot_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_events: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          end_at: string
          id: string
          is_all_day: boolean | null
          location: string | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          reminder_minutes: number | null
          start_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_at: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          reminder_minutes?: number | null
          start_at: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_at?: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          reminder_minutes?: number | null
          start_at?: string
          title?: string
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
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "investment_policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          client_id: string | null
          close: number
          created_at: string
          currency: string
          high: number | null
          id: string
          low: number | null
          market: string
          open: number | null
          price_date: string
          source: string
          symbol: string
          updated_at: string
          user_id: string
          volume: number | null
        }
        Insert: {
          client_id?: string | null
          close: number
          created_at?: string
          currency?: string
          high?: number | null
          id?: string
          low?: number | null
          market?: string
          open?: number | null
          price_date: string
          source?: string
          symbol: string
          updated_at?: string
          user_id: string
          volume?: number | null
        }
        Update: {
          client_id?: string | null
          close?: number
          created_at?: string
          currency?: string
          high?: number | null
          id?: string
          low?: number | null
          market?: string
          open?: number | null
          price_date?: string
          source?: string
          symbol?: string
          updated_at?: string
          user_id?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_prices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          analysis_id: string | null
          analysis_snapshot: Json | null
          analysis_title: string | null
          analysis_type: string | null
          content: string | null
          conversation_id: string
          created_at: string
          file_content_type: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          message_type: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          analysis_id?: string | null
          analysis_snapshot?: Json | null
          analysis_title?: string | null
          analysis_type?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string
          file_content_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          message_type?: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          analysis_id?: string | null
          analysis_snapshot?: Json | null
          analysis_title?: string | null
          analysis_type?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string
          file_content_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          message_type?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      needs_profile: {
        Row: {
          answers_json: Json
          created_at: string
          id: string
          profile_type: string
          risk_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answers_json?: Json
          created_at?: string
          id?: string
          profile_type?: string
          risk_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          answers_json?: Json
          created_at?: string
          id?: string
          profile_type?: string
          risk_score?: number
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
      policy_target_holdings: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          name: string | null
          target_weight: number
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          name?: string | null
          target_weight?: number
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          name?: string | null
          target_weight?: number
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_target_holdings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_settings: {
        Row: {
          base_currency: string | null
          benchmark_returns: Json | null
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "portfolio_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      project_updates: {
        Row: {
          author_user_id: string
          created_at: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["project_health"]
          text: string
          user_id: string
        }
        Insert: {
          author_user_id: string
          created_at?: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["project_health"]
          text: string
          user_id: string
        }
        Update: {
          author_user_id?: string
          created_at?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["project_health"]
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          health_status: Database["public"]["Enums"]["project_health"]
          id: string
          labels: string[] | null
          lead_user_id: string | null
          name: string
          priority: Database["public"]["Enums"]["project_priority"]
          start_date: string | null
          status: string
          target_date: string | null
          team: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          health_status?: Database["public"]["Enums"]["project_health"]
          id?: string
          labels?: string[] | null
          lead_user_id?: string | null
          name: string
          priority?: Database["public"]["Enums"]["project_priority"]
          start_date?: string | null
          status?: string
          target_date?: string | null
          team?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          health_status?: Database["public"]["Enums"]["project_health"]
          id?: string
          labels?: string[] | null
          lead_user_id?: string | null
          name?: string
          priority?: Database["public"]["Enums"]["project_priority"]
          start_date?: string | null
          status?: string
          target_date?: string | null
          team?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quant_analytics_cache: {
        Row: {
          cache_key: string
          computed_at: string
          result: Json
          valid_until: string
        }
        Insert: {
          cache_key: string
          computed_at?: string
          result: Json
          valid_until: string
        }
        Update: {
          cache_key?: string
          computed_at?: string
          result?: Json
          valid_until?: string
        }
        Relationships: []
      }
      quant_ingestion_logs: {
        Row: {
          created_at: string
          error_details: Json | null
          id: string
          latency_ms: number | null
          minute_utc: string
          retry_count: number
          session_id: string
          status: string | null
          symbols_attempted: string[]
          symbols_failed: string[] | null
          symbols_succeeded: string[] | null
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          id?: string
          latency_ms?: number | null
          minute_utc: string
          retry_count?: number
          session_id: string
          status?: string | null
          symbols_attempted: string[]
          symbols_failed?: string[] | null
          symbols_succeeded?: string[] | null
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          id?: string
          latency_ms?: number | null
          minute_utc?: string
          retry_count?: number
          session_id?: string
          status?: string | null
          symbols_attempted?: string[]
          symbols_failed?: string[] | null
          symbols_succeeded?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "quant_ingestion_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quant_ingestion_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quant_ingestion_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          cursor_position: number
          early_close: boolean
          early_close_note: string | null
          failure_rate_pct: number | null
          id: string
          is_trading_day: boolean
          market_close_utc: string | null
          notes: string | null
          quotes_collected: number
          quotes_target: number
          session_date: string
          started_at: string | null
          status: string
          updated_at: string
          window_end_utc: string | null
          window_start_utc: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          cursor_position?: number
          early_close?: boolean
          early_close_note?: string | null
          failure_rate_pct?: number | null
          id?: string
          is_trading_day: boolean
          market_close_utc?: string | null
          notes?: string | null
          quotes_collected?: number
          quotes_target?: number
          session_date: string
          started_at?: string | null
          status?: string
          updated_at?: string
          window_end_utc?: string | null
          window_start_utc?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          cursor_position?: number
          early_close?: boolean
          early_close_note?: string | null
          failure_rate_pct?: number | null
          id?: string
          is_trading_day?: boolean
          market_close_utc?: string | null
          notes?: string | null
          quotes_collected?: number
          quotes_target?: number
          session_date?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          window_end_utc?: string | null
          window_start_utc?: string | null
        }
        Relationships: []
      }
      quant_metadata_refresh_log: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          refresh_date: string
          status: string | null
          symbols_added: number | null
          symbols_deactivated: number | null
          symbols_total: number | null
          symbols_updated: number | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          refresh_date: string
          status?: string | null
          symbols_added?: number | null
          symbols_deactivated?: number | null
          symbols_total?: number | null
          symbols_updated?: number | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          refresh_date?: string
          status?: string | null
          symbols_added?: number | null
          symbols_deactivated?: number | null
          symbols_total?: number | null
          symbols_updated?: number | null
        }
        Relationships: []
      }
      quant_quotes: {
        Row: {
          api_response_time_ms: number | null
          company_name: string
          created_at: string
          id: string
          ingestion_latency_ms: number | null
          market_cap: number | null
          market_cap_rank: number | null
          market_timezone: string | null
          price: number
          sector: string | null
          symbol: string
          timestamp_minute: string
          timestamp_utc: string
        }
        Insert: {
          api_response_time_ms?: number | null
          company_name: string
          created_at?: string
          id?: string
          ingestion_latency_ms?: number | null
          market_cap?: number | null
          market_cap_rank?: number | null
          market_timezone?: string | null
          price: number
          sector?: string | null
          symbol: string
          timestamp_minute: string
          timestamp_utc: string
        }
        Update: {
          api_response_time_ms?: number | null
          company_name?: string
          created_at?: string
          id?: string
          ingestion_latency_ms?: number | null
          market_cap?: number | null
          market_cap_rank?: number | null
          market_timezone?: string | null
          price?: number
          sector?: string | null
          symbol?: string
          timestamp_minute?: string
          timestamp_utc?: string
        }
        Relationships: []
      }
      quant_universe: {
        Row: {
          company_name: string
          created_at: string
          currency: string
          exchange: string | null
          id: string
          is_active: boolean
          last_metadata_refresh: string | null
          last_price: number | null
          last_price_date: string | null
          market_cap: number | null
          market_cap_rank: number | null
          market_timezone: string
          sector: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          currency?: string
          exchange?: string | null
          id?: string
          is_active?: boolean
          last_metadata_refresh?: string | null
          last_price?: number | null
          last_price_date?: string | null
          market_cap?: number | null
          market_cap_rank?: number | null
          market_timezone?: string
          sector?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          currency?: string
          exchange?: string | null
          id?: string
          is_active?: boolean
          last_metadata_refresh?: string | null
          last_price?: number | null
          last_price_date?: string | null
          market_cap?: number | null
          market_cap_rank?: number | null
          market_timezone?: string
          sector?: string | null
          symbol?: string
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
      reports: {
        Row: {
          branding: Json
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          page_size: string
          sections: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          branding?: Json
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          page_size?: string
          sections?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          branding?: Json
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          page_size?: string
          sections?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      research_watchlist: {
        Row: {
          asset_class: string | null
          client_id: string | null
          created_at: string
          display_name: string | null
          id: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_class?: string | null
          client_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_class?: string | null
          client_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_watchlist_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      target_allocation_lines: {
        Row: {
          created_at: string
          dimension_type: Database["public"]["Enums"]["target_dimension_type"]
          id: string
          key: string
          metadata_json: Json | null
          parent_key: string | null
          target_id: string
          target_weight: number
        }
        Insert: {
          created_at?: string
          dimension_type: Database["public"]["Enums"]["target_dimension_type"]
          id?: string
          key: string
          metadata_json?: Json | null
          parent_key?: string | null
          target_id: string
          target_weight?: number
        }
        Update: {
          created_at?: string
          dimension_type?: Database["public"]["Enums"]["target_dimension_type"]
          id?: string
          key?: string
          metadata_json?: Json | null
          parent_key?: string | null
          target_id?: string
          target_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "target_allocation_lines_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "target_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      target_allocations: {
        Row: {
          client_id: string | null
          constraints_json: Json
          created_at: string
          horizon: string
          id: string
          is_active: boolean
          name: string
          needs_profile_id: string | null
          objective: string
          risk_level: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          constraints_json?: Json
          created_at?: string
          horizon?: string
          id?: string
          is_active?: boolean
          name?: string
          needs_profile_id?: string | null
          objective?: string
          risk_level?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          constraints_json?: Json
          created_at?: string
          horizon?: string
          id?: string
          is_active?: boolean
          name?: string
          needs_profile_id?: string | null
          objective?: string
          risk_level?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_allocations_needs_profile_id_fkey"
            columns: ["needs_profile_id"]
            isOneToOne: false
            referencedRelation: "needs_profile"
            referencedColumns: ["id"]
          },
        ]
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
      task_calendar_links: {
        Row: {
          calendar_id: string
          created_at: string | null
          event_id: string
          id: string
          last_error: string | null
          last_synced_at: string | null
          status: string
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calendar_id?: string
          created_at?: string | null
          event_id: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          status?: string
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calendar_id?: string
          created_at?: string | null
          event_id?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          status?: string
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_calendar_links_task_id_fkey"
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
      task_subtasks: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          order_index: number
          task_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          order_index?: number
          task_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          order_index?: number
          task_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_subtasks_task_id_fkey"
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
          base_currency: string | null
          cash_impact_amount: number | null
          cash_impact_currency: string | null
          client_id: string | null
          cost_base: number | null
          cost_local: number | null
          created_at: string
          currency: string
          date: string
          deleted_at: string | null
          fees: number | null
          fx_rate_at_entry: number | null
          geography: string
          id: string
          inception_year: number | null
          linked_company_id: string | null
          price_per_unit: number
          quantity: number
          realized_fx_pl: number | null
          realized_pl_base: number | null
          ticker: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_name: string
          asset_type?: string
          base_currency?: string | null
          cash_impact_amount?: number | null
          cash_impact_currency?: string | null
          client_id?: string | null
          cost_base?: number | null
          cost_local?: number | null
          created_at?: string
          currency?: string
          date: string
          deleted_at?: string | null
          fees?: number | null
          fx_rate_at_entry?: number | null
          geography?: string
          id?: string
          inception_year?: number | null
          linked_company_id?: string | null
          price_per_unit: number
          quantity: number
          realized_fx_pl?: number | null
          realized_pl_base?: number | null
          ticker: string
          transaction_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_name?: string
          asset_type?: string
          base_currency?: string | null
          cash_impact_amount?: number | null
          cash_impact_currency?: string | null
          client_id?: string | null
          cost_base?: number | null
          cost_local?: number | null
          created_at?: string
          currency?: string
          date?: string
          deleted_at?: string | null
          fees?: number | null
          fx_rate_at_entry?: number | null
          geography?: string
          id?: string
          inception_year?: number | null
          linked_company_id?: string | null
          price_per_unit?: number
          quantity?: number
          realized_fx_pl?: number | null
          realized_pl_base?: number | null
          ticker?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_linked_company_id_fkey"
            columns: ["linked_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_google_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string | null
          scope: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
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
          accrued_interest: number | null
          asset_id: string | null
          asset_name: string
          client_id: string | null
          coupon_rate: number | null
          created_at: string
          deleted_at: string | null
          duration: number | null
          fx_rate: number | null
          id: string
          linked_company_id: string | null
          maturity_date: string | null
          month: string
          price_per_unit: number
          ticker: string
          updated_at: string
          user_id: string
          yield_to_maturity: number | null
        }
        Insert: {
          accrued_interest?: number | null
          asset_id?: string | null
          asset_name: string
          client_id?: string | null
          coupon_rate?: number | null
          created_at?: string
          deleted_at?: string | null
          duration?: number | null
          fx_rate?: number | null
          id?: string
          linked_company_id?: string | null
          maturity_date?: string | null
          month: string
          price_per_unit: number
          ticker: string
          updated_at?: string
          user_id: string
          yield_to_maturity?: number | null
        }
        Update: {
          accrued_interest?: number | null
          asset_id?: string | null
          asset_name?: string
          client_id?: string | null
          coupon_rate?: number | null
          created_at?: string
          deleted_at?: string | null
          duration?: number | null
          fx_rate?: number | null
          id?: string
          linked_company_id?: string | null
          maturity_date?: string | null
          month?: string
          price_per_unit?: number
          ticker?: string
          updated_at?: string
          user_id?: string
          yield_to_maturity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "valuations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuations_linked_company_id_fkey"
            columns: ["linked_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_allocations: {
        Row: {
          created_at: string
          distribution_frequency: string | null
          expected_yield: number | null
          id: string
          level: number
          level_type: string
          liquidity_bucket: string | null
          liquidity_score: number | null
          metadata_json: Json | null
          name: string
          parent_id: string | null
          return_contribution: number | null
          risk_contribution: number | null
          ticker: string | null
          updated_at: string
          user_id: string
          version: number
          weight: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          distribution_frequency?: string | null
          expected_yield?: number | null
          id?: string
          level?: number
          level_type: string
          liquidity_bucket?: string | null
          liquidity_score?: number | null
          metadata_json?: Json | null
          name: string
          parent_id?: string | null
          return_contribution?: number | null
          risk_contribution?: number | null
          ticker?: string | null
          updated_at?: string
          user_id: string
          version?: number
          weight?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          distribution_frequency?: string | null
          expected_yield?: number | null
          id?: string
          level?: number
          level_type?: string
          liquidity_bucket?: string | null
          liquidity_score?: number | null
          metadata_json?: Json | null
          name?: string
          parent_id?: string | null
          return_contribution?: number | null
          risk_contribution?: number | null
          ticker?: string | null
          updated_at?: string
          user_id?: string
          version?: number
          weight?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_allocations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "workspace_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_allocations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "client_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_assumptions: {
        Row: {
          asset_class: string
          confidence_level: number | null
          correlation_group: string | null
          created_at: string
          expected_return: number
          expected_volatility: number
          id: string
          source_notes: string | null
          source_tag: string | null
          strategy: string | null
          sub_strategy: string | null
          updated_at: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          asset_class: string
          confidence_level?: number | null
          correlation_group?: string | null
          created_at?: string
          expected_return: number
          expected_volatility: number
          id?: string
          source_notes?: string | null
          source_tag?: string | null
          strategy?: string | null
          sub_strategy?: string | null
          updated_at?: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          asset_class?: string
          confidence_level?: number | null
          correlation_group?: string | null
          created_at?: string
          expected_return?: number
          expected_volatility?: number
          id?: string
          source_notes?: string | null
          source_tag?: string | null
          strategy?: string | null
          sub_strategy?: string | null
          updated_at?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_assumptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "client_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_audit_log: {
        Row: {
          action: string
          change_reason: string | null
          created_at: string
          entity_id: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          stage: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          action: string
          change_reason?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          stage: string
          user_id: string
          workspace_id: string
        }
        Update: {
          action?: string
          change_reason?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          stage?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_audit_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "client_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_constraints: {
        Row: {
          allowed_currencies: string[] | null
          base_currency: string | null
          created_at: string
          esg_exclusions: string[] | null
          hard_constraints: Json | null
          id: string
          investment_horizon_years: number | null
          liquidity_t0_min_pct: number | null
          liquidity_t30_min_pct: number | null
          liquidity_t90_min_pct: number | null
          max_drawdown: number | null
          max_fx_exposure_pct: number | null
          max_single_asset_pct: number | null
          max_single_geography_pct: number | null
          max_single_strategy_pct: number | null
          regulatory_constraints: Json | null
          soft_constraints: Json | null
          special_constraints: string | null
          target_return_nominal: number | null
          target_return_real: number | null
          updated_at: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          allowed_currencies?: string[] | null
          base_currency?: string | null
          created_at?: string
          esg_exclusions?: string[] | null
          hard_constraints?: Json | null
          id?: string
          investment_horizon_years?: number | null
          liquidity_t0_min_pct?: number | null
          liquidity_t30_min_pct?: number | null
          liquidity_t90_min_pct?: number | null
          max_drawdown?: number | null
          max_fx_exposure_pct?: number | null
          max_single_asset_pct?: number | null
          max_single_geography_pct?: number | null
          max_single_strategy_pct?: number | null
          regulatory_constraints?: Json | null
          soft_constraints?: Json | null
          special_constraints?: string | null
          target_return_nominal?: number | null
          target_return_real?: number | null
          updated_at?: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          allowed_currencies?: string[] | null
          base_currency?: string | null
          created_at?: string
          esg_exclusions?: string[] | null
          hard_constraints?: Json | null
          id?: string
          investment_horizon_years?: number | null
          liquidity_t0_min_pct?: number | null
          liquidity_t30_min_pct?: number | null
          liquidity_t90_min_pct?: number | null
          max_drawdown?: number | null
          max_fx_exposure_pct?: number | null
          max_single_asset_pct?: number | null
          max_single_geography_pct?: number | null
          max_single_strategy_pct?: number | null
          regulatory_constraints?: Json | null
          soft_constraints?: Json | null
          special_constraints?: string | null
          target_return_nominal?: number | null
          target_return_real?: number | null
          updated_at?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_constraints_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "client_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_correlations: {
        Row: {
          asset_class_1: string
          asset_class_2: string
          correlation: number
          created_at: string
          id: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          asset_class_1: string
          asset_class_2: string
          correlation: number
          created_at?: string
          id?: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          asset_class_1?: string
          asset_class_2?: string
          correlation?: number
          created_at?: string
          id?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_correlations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "client_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_narratives: {
        Row: {
          allocation_rationale: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          embedded_charts: Json | null
          executive_summary: string | null
          expected_outcomes: string | null
          governance_rules: string | null
          id: string
          risk_explanation: string | null
          status: string | null
          updated_at: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          allocation_rationale?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          embedded_charts?: Json | null
          executive_summary?: string | null
          expected_outcomes?: string | null
          governance_rules?: string | null
          id?: string
          risk_explanation?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          allocation_rationale?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          embedded_charts?: Json | null
          executive_summary?: string | null
          expected_outcomes?: string | null
          governance_rules?: string | null
          id?: string
          risk_explanation?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_narratives_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "client_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_optimizations: {
        Row: {
          created_at: string
          efficient_frontier_data: Json | null
          expected_return_after: number | null
          expected_return_before: number | null
          expected_volatility_after: number | null
          expected_volatility_before: number | null
          id: string
          input_assumptions: Json
          input_weights: Json
          optimized_weights: Json
          posterior_returns: Json | null
          risk_aversion: number | null
          risk_free_rate: number | null
          sharpe_after: number | null
          sharpe_before: number | null
          tau: number | null
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          efficient_frontier_data?: Json | null
          expected_return_after?: number | null
          expected_return_before?: number | null
          expected_volatility_after?: number | null
          expected_volatility_before?: number | null
          id?: string
          input_assumptions: Json
          input_weights: Json
          optimized_weights: Json
          posterior_returns?: Json | null
          risk_aversion?: number | null
          risk_free_rate?: number | null
          sharpe_after?: number | null
          sharpe_before?: number | null
          tau?: number | null
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          efficient_frontier_data?: Json | null
          expected_return_after?: number | null
          expected_return_before?: number | null
          expected_volatility_after?: number | null
          expected_volatility_before?: number | null
          id?: string
          input_assumptions?: Json
          input_weights?: Json
          optimized_weights?: Json
          posterior_returns?: Json | null
          risk_aversion?: number | null
          risk_free_rate?: number | null
          sharpe_after?: number | null
          sharpe_before?: number | null
          tau?: number | null
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_optimizations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "client_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_scenarios: {
        Row: {
          created_at: string
          id: string
          interpretation: string | null
          parameters: Json
          results: Json
          scenario_name: string
          scenario_type: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interpretation?: string | null
          parameters: Json
          results: Json
          scenario_name: string
          scenario_type: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interpretation?: string | null
          parameters?: Json
          results?: Json
          scenario_name?: string
          scenario_type?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_scenarios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "client_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_versions: {
        Row: {
          allocations_snapshot: Json | null
          assumptions_snapshot: Json | null
          change_summary: string | null
          constraints_snapshot: Json | null
          created_at: string
          created_by: string | null
          id: string
          optimization_snapshot: Json | null
          user_id: string
          version_number: number
          workspace_id: string
        }
        Insert: {
          allocations_snapshot?: Json | null
          assumptions_snapshot?: Json | null
          change_summary?: string | null
          constraints_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          optimization_snapshot?: Json | null
          user_id: string
          version_number: number
          workspace_id: string
        }
        Update: {
          allocations_snapshot?: Json | null
          assumptions_snapshot?: Json | null
          change_summary?: string | null
          constraints_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          optimization_snapshot?: Json | null
          user_id?: string
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "client_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      portfolio_nav_view: {
        Row: {
          asset_currency: string | null
          avg_cost_base: number | null
          base_currency: string | null
          current_fx_rate: number | null
          current_price: number | null
          market_value_base: number | null
          quantity: number | null
          ticker: string | null
          total_cost_base: number | null
          unrealized_pl: number | null
          user_id: string | null
        }
        Relationships: []
      }
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
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      pg_advisory_unlock_quant_ingestion: { Args: never; Returns: boolean }
      pg_try_advisory_lock_quant_ingestion: { Args: never; Returns: boolean }
      quant_daily_closes: {
        Args: { p_from: string; p_symbols?: string[]; p_to: string }
        Returns: {
          close_price: number
          company_name: string
          market_cap: number
          market_cap_rank: number
          sector: string
          symbol: string
          trade_date: string
        }[]
      }
      quant_daily_returns: {
        Args: { p_from: string; p_symbols?: string[]; p_to: string }
        Returns: {
          close_price: number
          company_name: string
          daily_return: number
          market_cap: number
          market_cap_rank: number
          sector: string
          symbol: string
          trade_date: string
        }[]
      }
      quant_intraday_vol_profile: {
        Args: { p_from: string; p_to: string }
        Returns: {
          avg_abs_return: number
          minute_slot: string
          sample_count: number
        }[]
      }
      quant_intraday_window_returns: {
        Args: { p_from: string; p_to: string }
        Returns: {
          avg_return: number
          sample_count: number
          window_label: string
        }[]
      }
      quant_market_breadth: {
        Args: { p_from: string; p_to: string }
        Returns: {
          pct_positive: number
          positive_symbols: number
          total_symbols: number
          trade_date: string
        }[]
      }
      quant_momentum_ranking: {
        Args: { p_to: string }
        Returns: {
          company_name: string
          market_cap: number
          market_cap_rank: number
          momentum_score: number
          return_1m: number
          return_1y: number
          return_3m: number
          return_5d: number
          return_6m: number
          sector: string
          symbol: string
        }[]
      }
      quant_sector_returns: {
        Args: { p_from: string; p_to: string }
        Returns: {
          avg_cum_return: number
          sector: string
          symbol_count: number
          total_market_cap: number
        }[]
      }
      quant_symbol_stats: {
        Args: { p_from: string; p_symbols?: string[]; p_to: string }
        Returns: {
          ann_return: number
          ann_vol: number
          avg_daily_return: number
          company_name: string
          cum_return: number
          cvar_95: number
          kurtosis: number
          market_cap: number
          market_cap_rank: number
          sector: string
          sharpe: number
          skewness: number
          sortino: number
          symbol: string
          trading_days: number
          var_95: number
        }[]
      }
      quant_universe_returns: {
        Args: { p_from: string; p_to: string }
        Returns: {
          market_return: number
          trade_date: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      project_health: "on_track" | "at_risk" | "off_track"
      project_priority: "low" | "medium" | "high"
      target_dimension_type:
        | "geography"
        | "asset_class"
        | "bucket"
        | "alternatives"
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
      project_health: ["on_track", "at_risk", "off_track"],
      project_priority: ["low", "medium", "high"],
      target_dimension_type: [
        "geography",
        "asset_class",
        "bucket",
        "alternatives",
      ],
    },
  },
} as const
