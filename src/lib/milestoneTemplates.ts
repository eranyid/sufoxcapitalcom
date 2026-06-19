export interface MilestoneTemplateDef {
  title: string;
  description: string;
  /** Offset in days from project start_date (or created_at if no start). Null = no auto-date. */
  dayOffset: number | null;
}

export interface MilestoneTemplate {
  key: string;
  label: string;
  description: string;
  icon: string;
  milestones: MilestoneTemplateDef[];
}

export const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  {
    key: 'investment_due_diligence',
    label: 'Investment Due Diligence',
    description: 'Standard pipeline for evaluating a new investment opportunity.',
    icon: 'Search',
    milestones: [
      { title: 'Initial Screening', description: 'Preliminary review of opportunity against fund mandate and strategy fit.', dayOffset: 0 },
      { title: 'Quantitative Analysis', description: 'Financial model build-out, valuation, and sensitivity analysis.', dayOffset: 7 },
      { title: 'Qualitative Research', description: 'Management assessment, competitive moat, and industry dynamics review.', dayOffset: 14 },
      { title: 'Risk Assessment', description: 'Downside scenarios, liquidity risk, and correlation analysis.', dayOffset: 21 },
      { title: 'Investment Committee Review', description: 'Present thesis and recommendation to IC for approval.', dayOffset: 28 },
      { title: 'Position Sizing & Execution', description: 'Determine allocation, entry strategy, and execute trades.', dayOffset: 35 },
    ],
  },
  {
    key: 'fund_operations',
    label: 'Fund Operations Setup',
    description: 'Operational milestones for launching or onboarding a new fund vehicle.',
    icon: 'Building2',
    milestones: [
      { title: 'Legal Entity Formation', description: 'Establish fund legal structure, partnership agreements, and regulatory filings.', dayOffset: 0 },
      { title: 'Service Provider Selection', description: 'Engage prime broker, administrator, auditor, and legal counsel.', dayOffset: 14 },
      { title: 'Compliance Framework', description: 'Establish compliance policies, AML/KYC procedures, and regulatory registrations.', dayOffset: 21 },
      { title: 'Technology & Infrastructure', description: 'Set up portfolio management systems, risk analytics, and reporting tools.', dayOffset: 28 },
      { title: 'Investor Documentation', description: 'Prepare PPM, subscription docs, and DDQ templates.', dayOffset: 35 },
      { title: 'Operational Dry Run', description: 'End-to-end test of trade execution, NAV calculation, and reporting workflows.', dayOffset: 42 },
      { title: 'Go Live', description: 'Accept subscriptions and begin trading.', dayOffset: 56 },
    ],
  },
  {
    key: 'portfolio_rebalance',
    label: 'Portfolio Rebalance',
    description: 'Structured rebalance cycle for periodic portfolio optimization.',
    icon: 'RefreshCw',
    milestones: [
      { title: 'Performance Attribution Review', description: 'Analyze return drivers and detractors since last rebalance.', dayOffset: 0 },
      { title: 'Risk Exposure Analysis', description: 'Review sector, geography, factor, and concentration exposures.', dayOffset: 3 },
      { title: 'Target Allocation Update', description: 'Revise model portfolio weights based on updated outlook.', dayOffset: 5 },
      { title: 'Trade List Generation', description: 'Generate buy/sell list with tax-loss harvesting considerations.', dayOffset: 7 },
      { title: 'Execution & Settlement', description: 'Execute trades and confirm settlement.', dayOffset: 10 },
      { title: 'Post-Rebalance Verification', description: 'Verify final positions match target; update risk reports.', dayOffset: 14 },
    ],
  },
  {
    key: 'regulatory_filing',
    label: 'Regulatory Filing',
    description: 'Checklist for periodic regulatory submissions (13F, Form PF, etc.).',
    icon: 'FileCheck',
    milestones: [
      { title: 'Data Collection', description: 'Gather position data, AUM figures, and counterparty information.', dayOffset: 0 },
      { title: 'Internal Review', description: 'Validate data accuracy with portfolio team and operations.', dayOffset: 7 },
      { title: 'Compliance Sign-Off', description: 'CCO review and approval of filing contents.', dayOffset: 14 },
      { title: 'Filing Submission', description: 'Submit to regulatory body (SEC, NFA, etc.).', dayOffset: 21 },
      { title: 'Confirmation & Archival', description: 'Confirm receipt, archive filing, and update compliance calendar.', dayOffset: 28 },
    ],
  },
  {
    key: 'client_onboarding',
    label: 'Client Onboarding',
    description: 'End-to-end process for onboarding a new investor or client.',
    icon: 'UserPlus',
    milestones: [
      { title: 'Initial Meeting & KYC', description: 'Collect investor information, suitability assessment, and KYC documents.', dayOffset: 0 },
      { title: 'Document Review', description: 'Review subscription agreement, side letter terms, and compliance checks.', dayOffset: 7 },
      { title: 'Account Setup', description: 'Create accounts in PMS, custodian, and administrator systems.', dayOffset: 10 },
      { title: 'Fund Transfer', description: 'Process initial subscription and confirm wire receipt.', dayOffset: 14 },
      { title: 'Welcome & Reporting Setup', description: 'Send welcome packet and configure reporting preferences.', dayOffset: 17 },
    ],
  },
  {
    key: 'custom_blank',
    label: 'Custom (Blank)',
    description: 'Start with an empty milestone list and add your own.',
    icon: 'LayoutList',
    milestones: [],
  },
];
