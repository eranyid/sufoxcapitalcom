 // =============================================
 // CLIENT PORTFOLIO MANUFACTURING PLATFORM
 // Type Definitions for 8-Stage Pipeline
 // =============================================
 
 // Stage identifiers
 export type WorkspaceStage = 
   | 'constraints'
   | 'assumptions'
   | 'construction'
   | 'expected-return'
   | 'optimization'
   | 'scenarios'
   | 'narrative'
   | 'versions';
 
 export const WORKSPACE_STAGES: { id: WorkspaceStage; label: string; description: string }[] = [
   { id: 'constraints', label: 'I. Constraints', description: 'Client Intake & Limits' },
   { id: 'assumptions', label: 'II. Assumptions', description: 'Expected Returns Layer' },
   { id: 'construction', label: 'III. Construction', description: 'Hierarchical Allocation' },
   { id: 'expected-return', label: 'IV. Expected Return', description: 'Portfolio Metrics' },
   { id: 'optimization', label: 'V. Optimization', description: 'Black-Litterman' },
   { id: 'scenarios', label: 'VI. Scenarios', description: 'Stress Testing' },
   { id: 'narrative', label: 'VII. Narrative', description: 'Proposal Generation' },
   { id: 'versions', label: 'VIII. Versions', description: 'Audit & History' },
 ];
 
 // Workspace status
 export type WorkspaceStatus = 'draft' | 'active' | 'archived' | 'approved';
 
 // Main workspace container
 export interface ClientWorkspace {
   id: string;
   user_id: string;
   name: string;
   client_name?: string;
   description?: string;
   status: WorkspaceStatus;
   current_version: number;
   created_at: string;
   updated_at: string;
 }
 
 // Stage I: Constraints
 export interface WorkspaceConstraints {
   id: string;
   workspace_id: string;
   user_id: string;
   version: number;
   
   // Target metrics
   target_return_nominal?: number;
   target_return_real?: number;
   max_drawdown?: number;
   investment_horizon_years?: number;
   
   // Concentration limits
   max_single_asset_pct: number;
   max_single_geography_pct: number;
   max_single_strategy_pct: number;
   
   // Liquidity requirements
   liquidity_t0_min_pct: number;
   liquidity_t30_min_pct: number;
   liquidity_t90_min_pct: number;
   
   // Currency constraints
   base_currency: string;
   allowed_currencies: string[];
   max_fx_exposure_pct: number;
   
   // Regulatory / ESG
   regulatory_constraints: ConstraintRule[];
   esg_exclusions: string[];
   special_constraints?: string;
   
   // Hard vs Soft
   hard_constraints: ConstraintRule[];
   soft_constraints: ConstraintRule[];
   
   created_at: string;
   updated_at: string;
 }
 
 export interface ConstraintRule {
   id: string;
   type: 'min' | 'max' | 'exact' | 'exclude' | 'require';
   target: string;
   value?: number;
   description: string;
   is_hard: boolean;
 }
 
 // Stage II: Assumptions
 export type AssumptionSource = 'market_implied' | 'analyst_view' | 'client_view' | 'hybrid';
 
 export interface WorkspaceAssumption {
   id: string;
   workspace_id: string;
   user_id: string;
   version: number;
   
   asset_class: string;
   strategy?: string;
   sub_strategy?: string;
   
   expected_return: number;
   expected_volatility: number;
   confidence_level: number;
   
   source_tag: AssumptionSource;
   source_notes?: string;
   
   correlation_group?: string;
   
   created_at: string;
   updated_at: string;
 }
 
 export interface WorkspaceCorrelation {
   id: string;
   workspace_id: string;
   user_id: string;
   version: number;
   
   asset_class_1: string;
   asset_class_2: string;
   correlation: number;
   
   created_at: string;
 }
 
 // Stage III: Hierarchical Allocation
 export type AllocationLevel = 'asset_class' | 'strategy' | 'geography' | 'vehicle' | 'instrument';
 export type LiquidityBucket = 't0' | 't30' | 't90' | 'locked';
 
 export interface WorkspaceAllocation {
   id: string;
   workspace_id: string;
   user_id: string;
   version: number;
   
   parent_id?: string;
   level: number;
   level_type: AllocationLevel;
   
   name: string;
   ticker?: string;
   weight: number;
   
   risk_contribution?: number;
   return_contribution?: number;
   
   liquidity_bucket: LiquidityBucket;
   liquidity_score?: number;
   
   expected_yield?: number;
   distribution_frequency?: string;
   
   metadata_json: Record<string, unknown>;
   
   created_at: string;
   updated_at: string;
   
   // For tree rendering
   children?: WorkspaceAllocation[];
 }
 
 // Stage V: Optimization
 export interface WorkspaceOptimization {
   id: string;
   workspace_id: string;
   user_id: string;
   version: number;
   
   tau: number;
   risk_aversion: number;
   risk_free_rate: number;
   
   input_weights: Record<string, number>;
   input_assumptions: Record<string, { return: number; volatility: number }>;
   
   optimized_weights: Record<string, number>;
   posterior_returns?: Record<string, number>;
   
   expected_return_before?: number;
   expected_return_after?: number;
   expected_volatility_before?: number;
   expected_volatility_after?: number;
   sharpe_before?: number;
   sharpe_after?: number;
   
   efficient_frontier_data?: { risk: number; return: number }[];
   
   created_at: string;
 }
 
 // Stage VI: Scenarios
 export type ScenarioType = 'regime' | 'monte_carlo' | 'stress' | 'historical';
 
 export interface WorkspaceScenario {
   id: string;
   workspace_id: string;
   user_id: string;
   version: number;
   
   scenario_type: ScenarioType;
   scenario_name: string;
   
   parameters: Record<string, unknown>;
   results: Record<string, unknown>;
   
   interpretation?: string;
   
   created_at: string;
 }
 
 // Stage VII: Narrative
 export type NarrativeStatus = 'draft' | 'review' | 'approved' | 'sent';
 
 export interface WorkspaceNarrative {
   id: string;
   workspace_id: string;
   user_id: string;
   version: number;
   
   executive_summary?: string;
   allocation_rationale?: string;
   risk_explanation?: string;
   expected_outcomes?: string;
   governance_rules?: string;
   
   embedded_charts: { type: string; config: Record<string, unknown> }[];
   
   status: NarrativeStatus;
   approved_by?: string;
   approved_at?: string;
   
   created_at: string;
   updated_at: string;
 }
 
 // Stage VIII: Versions
 export interface WorkspaceVersion {
   id: string;
   workspace_id: string;
   user_id: string;
   version_number: number;
   
   constraints_snapshot?: WorkspaceConstraints;
   assumptions_snapshot?: WorkspaceAssumption[];
   allocations_snapshot?: WorkspaceAllocation[];
   optimization_snapshot?: WorkspaceOptimization;
   
   change_summary?: string;
   created_by?: string;
   
   created_at: string;
 }
 
 // Audit Log
 export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'rebalance';
 
 export interface WorkspaceAuditLog {
   id: string;
   workspace_id: string;
   user_id: string;
   
   action: AuditAction;
   stage: WorkspaceStage;
   entity_id?: string;
   
   old_value?: Record<string, unknown>;
   new_value?: Record<string, unknown>;
   
   change_reason?: string;
   
   created_at: string;
 }
 
 // Computed metrics for Stage IV
 export interface ExpectedPortfolioMetrics {
   expectedReturn: number;
   expectedVolatility: number;
   sharpeRatio: number;
   diversificationBenefit: number;
   
   riskContributions: { asset: string; marginal: number; total: number }[];
   returnContributions: { asset: string; contribution: number }[];
   
   liquidityProfile: {
     t0: number;
     t30: number;
     t90: number;
     locked: number;
   };
   
   constraintViolations: {
     constraint: string;
     current: number;
     limit: number;
     is_hard: boolean;
   }[];
 }