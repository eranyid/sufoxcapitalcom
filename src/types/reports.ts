export type ReportSectionType = 
  | 'portfolio_overview'
  | 'performance_summary'
  | 'asset_allocation'
  | 'currency_exposure'
  | 'architecture'
  | 'risk_metrics'
  | 'scenarios_snapshot'
  | 'transactions_summary'
  | 'holdings_table'
  | 'custom_text'
  | 'logo_header'
  | 'risk_return_scatter'
  | 'drawdown_chart'
  | 'factor_exposure';

export interface ReportSection {
  id: string;
  type: ReportSectionType;
  title: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface ReportBranding {
  logoUrl?: string;
  accentColor?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  footerText?: string;
  analystName?: string;
  showPageNumbers?: boolean;
}

export interface Report {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  sections: ReportSection[];
  branding: ReportBranding;
  page_size: 'A4' | 'Letter';
  created_at: string;
  updated_at: string;
}

export const SECTION_LIBRARY: { type: ReportSectionType; label: string; description: string }[] = [
  { type: 'logo_header', label: 'Logo & Header', description: 'Company logo with report title' },
  { type: 'portfolio_overview', label: 'Portfolio Overview', description: 'Total value, YTD return, key metrics' },
  { type: 'performance_summary', label: 'Performance Summary', description: 'Returns, IRR, Sharpe ratio' },
  { type: 'asset_allocation', label: 'Asset Allocation', description: 'Allocation pie chart and table' },
  { type: 'currency_exposure', label: 'Currency Exposure', description: 'Currency breakdown' },
  { type: 'architecture', label: 'Portfolio Architecture', description: 'Concentric rings visualization' },
  { type: 'risk_metrics', label: 'Risk Metrics', description: 'VaR, volatility, beta' },
  { type: 'risk_return_scatter', label: 'Risk/Return Scatter', description: 'Holdings risk vs return' },
  { type: 'drawdown_chart', label: 'Drawdown Chart', description: 'Historical drawdown analysis' },
  { type: 'factor_exposure', label: 'Factor Exposure', description: 'Factor analysis table' },
  { type: 'scenarios_snapshot', label: 'Scenarios Snapshot', description: 'Stress test results' },
  { type: 'holdings_table', label: 'Holdings Table', description: 'Complete holdings list' },
  { type: 'transactions_summary', label: 'Transactions Summary', description: 'Recent transactions' },
  { type: 'custom_text', label: 'Custom Commentary', description: 'Free-form text section' },
];

export const DEFAULT_BRANDING: ReportBranding = {
  accentColor: '#FFC107',
  headerTitle: 'Portfolio Report',
  headerSubtitle: '',
  footerText: 'Confidential - For Internal Use Only',
  showPageNumbers: true,
};

export const DEFAULT_SECTIONS: ReportSection[] = [
  { id: '1', type: 'logo_header', title: 'Header', enabled: true },
  { id: '2', type: 'portfolio_overview', title: 'Portfolio Overview', enabled: true },
  { id: '3', type: 'performance_summary', title: 'Performance Summary', enabled: true },
  { id: '4', type: 'asset_allocation', title: 'Asset Allocation', enabled: true },
  { id: '5', type: 'holdings_table', title: 'Holdings', enabled: true },
];
