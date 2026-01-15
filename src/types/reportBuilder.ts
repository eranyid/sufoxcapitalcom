// WYSIWYG Report Builder Types

export type ReportBlockType = 
  | 'logo_header'
  | 'title'
  | 'subtitle'
  | 'free_text'
  | 'portfolio_overview'
  | 'performance_summary'
  | 'performance_calendar'
  | 'contribution_chart'
  | 'top_movers'
  | 'asset_allocation'
  | 'currency_exposure'
  | 'geographic_allocation'
  | 'xray_architecture'
  | 'risk_metrics'
  | 'risk_return_scatter'
  | 'drawdown_chart'
  | 'factor_exposure'
  | 'scenarios_snapshot'
  | 'holdings_table'
  | 'transactions_summary'
  | 'footer'
  | 'page_break'
  | 'spacer';

export interface ReportBlockConfig {
  // Text content
  title?: string;
  subtitle?: string;
  text?: string;
  
  // Logo/Image
  logoUrl?: string;
  logoAlignment?: 'left' | 'center' | 'right';
  logoSize?: 'small' | 'medium' | 'large';
  showOnAllPages?: boolean;
  
  // Styling
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  showBackground?: boolean;
  
  // Border & Shadow options
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  borderWidth?: 'none' | 'thin' | 'medium' | 'thick';
  borderColor?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Data display options
  showLabels?: boolean;
  showTable?: boolean;
  showChart?: boolean;
  maxItems?: number;
  
  // Footer specific
  showPageNumbers?: boolean;
  showDate?: boolean;
  analystName?: string;
  confidentialWatermark?: boolean;
  footerText?: string;
}

export interface ReportBlock {
  id: string;
  type: ReportBlockType;
  // Grid position (row-based)
  row: number;
  // Span across columns (1-12 grid system)
  colSpan: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  // Column start position (0-11)
  colStart: number;
  // Height in grid units (each unit ~40px)
  height: number;
  // Block-specific configuration
  config: ReportBlockConfig;
  // Is this block visible
  enabled: boolean;
  // Page number (for multi-page reports)
  page: number;
}

export interface ReportLayout {
  id: string;
  name: string;
  description?: string;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  blocks: ReportBlock[];
  branding: ReportBranding;
  createdAt: string;
  updatedAt: string;
}

export interface ReportBranding {
  logoUrl?: string;
  // Primary colors
  accentColor: string;
  backgroundColor: string;
  // Text colors
  textColor?: string;
  headingColor?: string;
  mutedTextColor?: string;
  // Chart colors
  chartPrimaryColor?: string;
  chartSecondaryColor?: string;
  chartPositiveColor?: string;
  chartNegativeColor?: string;
  // Table colors
  tableHeaderBgColor?: string;
  tableHeaderTextColor?: string;
  tableRowAltBgColor?: string;
  tableBorderColor?: string;
  // Content
  headerTitle?: string;
  headerSubtitle?: string;
  footerText?: string;
  analystName?: string;
  clientName?: string;
  showPageNumbers: boolean;
  showConfidentialWatermark: boolean;
  dateFormat: 'short' | 'medium' | 'long';
  
  // Typography settings
  headingFont?: string;
  bodyFont?: string;
  baseFontSize?: number;
  headingScale?: number;
  lineHeight?: number;
  uppercaseHeadings?: boolean;
  boldNumbers?: boolean;
  letterSpacing?: 'tight' | 'normal' | 'wide' | 'wider';
  
  // Effects settings
  globalBorderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  globalShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  globalBlur?: number;
  headerGradient?: string;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  cornerStyle?: 'square' | 'rounded' | 'pill';
  glassmorphism?: boolean;
  subtlePatterns?: boolean;
  accentBorders?: boolean;
  effectsOpacity?: number;
  
  // Page options
  showDateInHeader?: boolean;
  showTableOfContents?: boolean;
  
  // Export options
  exportQuality?: 'draft' | 'standard' | 'high';
  embedFonts?: boolean;
  compressImages?: boolean;
  
  // Data settings
  numberFormat?: 'us' | 'eu' | 'ch';
  currencyDisplay?: 'symbol' | 'code' | 'none';
  
  // Accessibility
  highContrastMode?: boolean;
  screenReaderTags?: boolean;
}

// Block library metadata
export interface BlockLibraryItem {
  type: ReportBlockType;
  label: string;
  description: string;
  icon: string;
  category: 'header' | 'content' | 'data' | 'layout';
  defaultConfig: Partial<ReportBlockConfig>;
  defaultHeight: number;
  defaultColSpan: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export const BLOCK_LIBRARY: BlockLibraryItem[] = [
  // Header category
  {
    type: 'logo_header',
    label: 'Logo & Header',
    description: 'Company logo with title',
    icon: 'Image',
    category: 'header',
    defaultConfig: { logoAlignment: 'center', logoSize: 'medium' },
    defaultHeight: 3,
    defaultColSpan: 12,
  },
  {
    type: 'title',
    label: 'Title',
    description: 'Large heading text',
    icon: 'Type',
    category: 'header',
    defaultConfig: { fontSize: '2xl', fontWeight: 'bold', textAlign: 'center' },
    defaultHeight: 2,
    defaultColSpan: 12,
  },
  {
    type: 'subtitle',
    label: 'Subtitle',
    description: 'Secondary heading',
    icon: 'Text',
    category: 'header',
    defaultConfig: { fontSize: 'lg', fontWeight: 'medium', textAlign: 'center' },
    defaultHeight: 1,
    defaultColSpan: 12,
  },
  
  // Content category
  {
    type: 'free_text',
    label: 'Free Text',
    description: 'Commentary or notes',
    icon: 'FileText',
    category: 'content',
    defaultConfig: { fontSize: 'sm', textAlign: 'left' },
    defaultHeight: 4,
    defaultColSpan: 12,
  },
  
  // Data category
  {
    type: 'portfolio_overview',
    label: 'Portfolio Overview',
    description: 'Key metrics summary',
    icon: 'LayoutDashboard',
    category: 'data',
    defaultConfig: { showBackground: true },
    defaultHeight: 4,
    defaultColSpan: 12,
  },
  {
    type: 'performance_summary',
    label: 'Performance Summary',
    description: 'Returns and ratios',
    icon: 'TrendingUp',
    category: 'data',
    defaultConfig: { showBackground: true },
    defaultHeight: 3,
    defaultColSpan: 12,
  },
  {
    type: 'performance_calendar',
    label: 'Performance Calendar',
    description: 'Monthly returns heatmap',
    icon: 'Calendar',
    category: 'data',
    defaultConfig: {},
    defaultHeight: 5,
    defaultColSpan: 12,
  },
  {
    type: 'contribution_chart',
    label: 'Contribution Chart',
    description: 'P/L contributors',
    icon: 'BarChart3',
    category: 'data',
    defaultConfig: { maxItems: 10 },
    defaultHeight: 5,
    defaultColSpan: 6,
  },
  {
    type: 'top_movers',
    label: 'Top Movers',
    description: 'Best and worst performers',
    icon: 'ArrowUpDown',
    category: 'data',
    defaultConfig: { maxItems: 5 },
    defaultHeight: 5,
    defaultColSpan: 6,
  },
  {
    type: 'asset_allocation',
    label: 'Asset Allocation',
    description: 'Allocation by type',
    icon: 'PieChart',
    category: 'data',
    defaultConfig: { showChart: true, showTable: true },
    defaultHeight: 5,
    defaultColSpan: 6,
  },
  {
    type: 'currency_exposure',
    label: 'Currency Exposure',
    description: 'Currency breakdown',
    icon: 'Coins',
    category: 'data',
    defaultConfig: { showChart: true },
    defaultHeight: 5,
    defaultColSpan: 6,
  },
  {
    type: 'geographic_allocation',
    label: 'Geographic Allocation',
    description: 'Regional distribution',
    icon: 'Globe',
    category: 'data',
    defaultConfig: { showChart: true },
    defaultHeight: 5,
    defaultColSpan: 6,
  },
  {
    type: 'xray_architecture',
    label: 'X-Ray Architecture',
    description: 'Portfolio structure',
    icon: 'Layers',
    category: 'data',
    defaultConfig: {},
    defaultHeight: 8,
    defaultColSpan: 12,
  },
  {
    type: 'risk_metrics',
    label: 'Risk Metrics',
    description: 'VaR, volatility, beta',
    icon: 'Shield',
    category: 'data',
    defaultConfig: { showBackground: true },
    defaultHeight: 4,
    defaultColSpan: 12,
  },
  {
    type: 'risk_return_scatter',
    label: 'Risk/Return Scatter',
    description: 'Holdings risk vs return',
    icon: 'Scatter',
    category: 'data',
    defaultConfig: {},
    defaultHeight: 6,
    defaultColSpan: 12,
  },
  {
    type: 'scenarios_snapshot',
    label: 'Scenarios Snapshot',
    description: 'Stress test results',
    icon: 'Zap',
    category: 'data',
    defaultConfig: { maxItems: 6 },
    defaultHeight: 4,
    defaultColSpan: 12,
  },
  {
    type: 'holdings_table',
    label: 'Holdings Table',
    description: 'Complete holdings list',
    icon: 'Table',
    category: 'data',
    defaultConfig: { maxItems: 20 },
    defaultHeight: 10,
    defaultColSpan: 12,
  },
  {
    type: 'transactions_summary',
    label: 'Transactions',
    description: 'Recent activity',
    icon: 'ArrowRightLeft',
    category: 'data',
    defaultConfig: { maxItems: 10 },
    defaultHeight: 6,
    defaultColSpan: 12,
  },
  
  // Layout category
  {
    type: 'footer',
    label: 'Footer',
    description: 'Page footer with branding',
    icon: 'PanelBottom',
    category: 'layout',
    defaultConfig: { showPageNumbers: true, showDate: true },
    defaultHeight: 2,
    defaultColSpan: 12,
  },
  {
    type: 'page_break',
    label: 'Page Break',
    description: 'Start new page',
    icon: 'SplitSquareHorizontal',
    category: 'layout',
    defaultConfig: {},
    defaultHeight: 1,
    defaultColSpan: 12,
  },
  {
    type: 'spacer',
    label: 'Spacer',
    description: 'Empty space',
    icon: 'Maximize2',
    category: 'layout',
    defaultConfig: {},
    defaultHeight: 2,
    defaultColSpan: 12,
  },
];

// Default branding - Harmonized color palette
// Base: Warm gold accent (#D4A853) with complementary muted tones
export const DEFAULT_BRANDING: ReportBranding = {
  accentColor: '#D4A853',           // Warm gold - primary accent
  backgroundColor: '#0C0C0E',       // Deep charcoal - slightly warmer than pure black
  textColor: '#E8E6E3',             // Warm off-white
  headingColor: '#FAFAF9',          // Warm white
  mutedTextColor: '#8A8A8A',        // Neutral gray
  chartPrimaryColor: '#D4A853',     // Warm gold - matches accent
  chartSecondaryColor: '#6B8CAE',   // Muted steel blue - complementary
  chartPositiveColor: '#4CAF7C',    // Muted sage green - softer than pure green
  chartNegativeColor: '#C75B5B',    // Muted terracotta - softer than pure red
  tableHeaderBgColor: '#161618',    // Slightly elevated dark
  tableHeaderTextColor: '#D4A853',  // Accent gold
  tableRowAltBgColor: '#111113',    // Subtle row alternation
  tableBorderColor: '#2A2A2E',      // Subtle border
  headerTitle: 'Portfolio Report',
  footerText: 'Confidential - For Internal Use Only',
  showPageNumbers: true,
  showConfidentialWatermark: false,
  dateFormat: 'medium',
  // Typography defaults
  headingFont: 'system-ui, -apple-system, sans-serif',
  bodyFont: 'system-ui, -apple-system, sans-serif',
  baseFontSize: 14,
  headingScale: 1.25,
  lineHeight: 1.5,
  uppercaseHeadings: false,
  boldNumbers: true,
  letterSpacing: 'normal',
  // Effects defaults
  globalBorderRadius: 'md',
  globalShadow: 'none',
  globalBlur: 0,
  borderStyle: 'solid',
  cornerStyle: 'rounded',
  glassmorphism: false,
  subtlePatterns: false,
  accentBorders: false,
  effectsOpacity: 100,
  // Page options defaults
  showDateInHeader: true,
  showTableOfContents: false,
  // Export defaults
  exportQuality: 'standard',
  embedFonts: true,
  compressImages: true,
  // Data settings defaults
  numberFormat: 'us',
  currencyDisplay: 'symbol',
  // Accessibility defaults
  highContrastMode: false,
  screenReaderTags: true,
};

// Page dimensions in mm
export const PAGE_DIMENSIONS = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
};

// Grid constants
export const GRID_COLUMNS = 12;
export const GRID_ROW_HEIGHT = 40; // pixels per row unit
export const GRID_GAP = 8; // pixels between cells