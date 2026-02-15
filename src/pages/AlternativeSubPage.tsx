import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KPICard } from '@/components/dashboard/KPICard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Plus, Upload, Download, Filter, Search, Calculator,
  Building2, Rocket, CreditCard, Home, Landmark, BarChart3,
  TrendingUp, Calendar, Users, Target, DollarSign, Clock, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FundAnalysisSection } from '@/components/alternative/FundAnalysisSection';
import { DealStructuringSection } from '@/components/alternative/DealStructuringSection';
import { PortfolioInsightPanel } from '@/components/alternative/PortfolioInsightPanel';
import { MarketIntelligencePanel } from '@/components/alternative/MarketIntelligencePanel';
import { FutureExtensionsPanel } from '@/components/alternative/FutureExtensionsPanel';
import { NewFundAnalysisDialog } from '@/components/alternative/NewFundAnalysisDialog';
import { VintageYearChart } from '@/components/alternative/VintageYearChart';
import { CommitmentPacingTool } from '@/components/alternative/CommitmentPacingTool';

const META: Record<string, {
  title: string;
  intro: string;
  icon: any;
  kpis: { title: string; tooltip?: string }[];
  portfolioCols: string[];
  riskMetrics: string[];
}> = {
  'private-equity': {
    title: 'Private Equity',
    intro: 'Buyouts, growth equity, and secondaries portfolio.',
    icon: Building2,
    kpis: [
      { title: 'Total NAV', tooltip: 'Net Asset Value of all PE holdings' },
      { title: 'Net IRR', tooltip: 'Internal Rate of Return net of fees' },
      { title: 'TVPI', tooltip: 'Total Value to Paid-In Capital' },
      { title: 'DPI', tooltip: 'Distributions to Paid-In Capital' },
      { title: 'RVPI', tooltip: 'Residual Value to Paid-In Capital' },
      { title: 'MOIC', tooltip: 'Multiple on Invested Capital' },
    ],
    portfolioCols: ['Fund Name', 'Vintage', 'Strategy', 'Committed', 'Drawn', 'NAV', 'DPI', 'TVPI'],
    riskMetrics: ['Max Drawdown', 'Volatility', 'J-Curve Depth', 'Loss Ratio', 'Concentration (Top 5)'],
  },
  'venture-capital': {
    title: 'Venture Capital',
    intro: 'Early-stage to late-stage venture investments.',
    icon: Rocket,
    kpis: [
      { title: 'Portfolio Value', tooltip: 'Current fair value of all VC investments' },
      { title: 'Net IRR', tooltip: 'IRR net of management fees and carry' },
      { title: 'TVPI', tooltip: 'Total value relative to paid-in capital' },
      { title: 'DPI', tooltip: 'Cash returned relative to invested' },
      { title: 'Funded', tooltip: 'Total capital called to date' },
      { title: 'Reserves', tooltip: 'Capital reserved for follow-on investments' },
    ],
    portfolioCols: ['Company', 'Stage', 'Round', 'Invested', 'FMV', 'Ownership %', 'Status'],
    riskMetrics: ['Write-Off Rate', 'Follow-On Rate', 'Time to Exit (avg)', 'Concentration (Top 3)', 'Stage Distribution'],
  },
  'private-credit': {
    title: 'Private Credit',
    intro: 'Direct lending, mezzanine, and distressed debt.',
    icon: CreditCard,
    kpis: [
      { title: 'Portfolio Size', tooltip: 'Total loans outstanding' },
      { title: 'Wtd Avg Yield', tooltip: 'Weighted average interest yield' },
      { title: 'Wtd Avg LTV', tooltip: 'Weighted average loan-to-value' },
      { title: 'DSCR', tooltip: 'Debt Service Coverage Ratio' },
      { title: 'Default Rate', tooltip: 'Percentage of loans in default' },
      { title: 'Recovery Rate', tooltip: 'Expected recovery on defaults' },
    ],
    portfolioCols: ['Borrower', 'Type', 'Amount', 'Rate', 'LTV', 'Maturity', 'DSCR', 'Status'],
    riskMetrics: ['Credit Quality Distribution', 'Sector Concentration', 'Maturity Profile', 'Covenant Headroom', 'Interest Rate Sensitivity'],
  },
  'real-estate': {
    title: 'Real Estate',
    intro: 'Core, value-add, and opportunistic real estate.',
    icon: Home,
    kpis: [
      { title: 'GAV', tooltip: 'Gross Asset Value' },
      { title: 'NOI', tooltip: 'Net Operating Income' },
      { title: 'Cap Rate', tooltip: 'Net Operating Income / Asset Value' },
      { title: 'Occupancy', tooltip: 'Average portfolio occupancy rate' },
      { title: 'Leverage', tooltip: 'Loan-to-Value ratio' },
      { title: 'Cash Yield', tooltip: 'Cash distributions / equity invested' },
    ],
    portfolioCols: ['Property', 'Type', 'Location', 'Value', 'NOI', 'Cap Rate', 'LTV', 'Status'],
    riskMetrics: ['Lease Expiry Profile', 'Tenant Concentration', 'Geographic Diversification', 'Refinancing Risk', 'Development Pipeline'],
  },
  'real-assets': {
    title: 'Real Assets / Infrastructure',
    intro: 'Infra, energy, and commodities-linked assets.',
    icon: Landmark,
    kpis: [
      { title: 'Total Value', tooltip: 'Current valuation of all assets' },
      { title: 'Cash Yield', tooltip: 'Annual cash distributions / invested' },
      { title: 'IRR', tooltip: 'Internal Rate of Return' },
      { title: 'MOIC', tooltip: 'Multiple on Invested Capital' },
      { title: 'Contracted %', tooltip: 'Revenue under long-term contracts' },
      { title: 'Avg Maturity', tooltip: 'Average concession/contract duration' },
    ],
    portfolioCols: ['Asset', 'Sector', 'Geography', 'Value', 'Yield', 'Contract Length', 'Status'],
    riskMetrics: ['Regulatory Risk', 'Commodity Price Exposure', 'Counterparty Risk', 'Operational Complexity', 'ESG Score'],
  },
  'hedge-funds-alts': {
    title: 'Hedge Funds / Alternatives',
    intro: 'HFs, liquid alts, and multi-strategy.',
    icon: BarChart3,
    kpis: [
      { title: 'AUM', tooltip: 'Assets Under Management across HF allocations' },
      { title: 'YTD Return', tooltip: 'Year-to-date net returns' },
      { title: 'Sharpe', tooltip: 'Sharpe Ratio (risk-adjusted return)' },
      { title: 'Max DD', tooltip: 'Maximum Drawdown from peak' },
      { title: 'Beta', tooltip: 'Sensitivity to market movements' },
      { title: 'Alpha', tooltip: 'Excess return vs benchmark' },
    ],
    portfolioCols: ['Fund', 'Strategy', 'AUM', 'YTD', '1Y', 'Sharpe', 'Max DD', 'Liquidity'],
    riskMetrics: ['Strategy Concentration', 'Liquidity Terms', 'Manager Tenure', 'Correlation to S&P', 'Volatility (Ann.)'],
  },
};

export default function AlternativeSubPage() {
  const { assetClass } = useParams<{ assetClass: string }>();
  const navigate = useNavigate();
  const meta = META[assetClass || ''];

  if (!meta) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Unknown asset class.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/alternative')} className="mt-4">
          ← Back to Hub
        </Button>
      </div>
    );
  }

  const Icon = meta.icon;

  return (
    <>
      <Helmet>
        <title>{meta.title} — Alternative | SUFOX Capital</title>
      </Helmet>

      <div className="space-y-5 p-4 md:p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/alternative')} className="gap-1 text-[10px] h-7 px-2">
              <ArrowLeft size={12} /> Hub
            </Button>
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-sm">
              <Icon size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{meta.title}</h1>
              <p className="text-[10px] text-muted-foreground font-mono">{meta.intro}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <NewFundAnalysisDialog assetClass={meta.title} />
            <Button size="sm" variant="secondary" className="gap-1.5 text-[10px] h-7">
              <Calculator size={12} /> Run Calculator
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-[10px] h-7">
              <Upload size={12} /> Upload DD
            </Button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {meta.kpis.map((kpi) => (
            <KPICard key={kpi.title} title={kpi.title} value="—" subtitle="Pending data" trend="neutral" tooltip={kpi.tooltip} />
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="analysis" className="space-y-5">
          <TabsList className="bg-muted/30 border border-border/50 h-9">
            <TabsTrigger value="analysis" className="text-[11px] gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Briefcase size={12} /> Fund Analysis & DD
            </TabsTrigger>
            <TabsTrigger value="structuring" className="text-[11px] gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Calculator size={12} /> Deal Structuring
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="text-[11px] gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <BarChart3 size={12} /> Portfolio
            </TabsTrigger>
            <TabsTrigger value="cashflows" className="text-[11px] gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <DollarSign size={12} /> Cash Flows
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Fund Analysis & DD */}
          <TabsContent value="analysis">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-5">
                <FundAnalysisSection />
                <VintageYearChart />
                <CommitmentPacingTool />
              </div>
              <div className="space-y-5">
                <PortfolioInsightPanel />
                <MarketIntelligencePanel />
                <FutureExtensionsPanel />
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Deal Structuring */}
          <TabsContent value="structuring">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <DealStructuringSection />
              <div className="space-y-5">
                <MarketIntelligencePanel />
                <FutureExtensionsPanel />
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Portfolio */}
          <TabsContent value="portfolio" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">
                  <Filter size={10} /> Filter
                </Button>
                <Badge variant="outline" className="text-[9px]">0 items</Badge>
              </div>
              <Button size="sm" className="gap-1.5 text-[10px] h-7">
                <Plus size={12} /> Add Item
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] font-mono">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        {meta.portfolioCols.map((col) => (
                          <th key={col} className="text-left p-2.5 text-muted-foreground font-medium whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                          {meta.portfolioCols.map((col) => (
                            <td key={col} className="p-2.5">
                              <Skeleton className="h-4 w-16 rounded-sm" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground font-mono">No investments added yet. Import or add manually.</p>
                </div>
              </CardContent>
            </Card>

            {/* Risk Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs">Return Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {['IRR (Net)', 'IRR (Gross)', 'MOIC', 'DPI', 'TVPI', 'RVPI', 'PME'].map((m) => (
                    <div key={m} className="flex items-center justify-between text-[10px] py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-muted-foreground font-mono">{m}</span>
                      <Badge variant="secondary" className="text-[9px] font-mono">—</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs">Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {meta.riskMetrics.map((m) => (
                    <div key={m} className="flex items-center justify-between text-[10px] py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-muted-foreground font-mono">{m}</span>
                      <Badge variant="secondary" className="text-[9px] font-mono">—</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 4: Cash Flows */}
          <TabsContent value="cashflows" className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard title="Total Committed" value="—" trend="neutral" tooltip="Total capital committed" />
              <KPICard title="Total Called" value="—" trend="neutral" tooltip="Capital drawn to date" />
              <KPICard title="Total Distributed" value="—" trend="neutral" tooltip="Cash returned to date" />
              <KPICard title="Unfunded" value="—" trend="neutral" tooltip="Remaining commitments" />
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <DollarSign size={12} className="text-primary" /> Capital Activity Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] font-mono">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        {['Date', 'Type', 'Fund', 'Amount', 'Cumulative', 'Notes'].map((col) => (
                          <th key={col} className="text-left p-2.5 text-muted-foreground font-medium whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3].map((i) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-muted/10">
                          {[1, 2, 3, 4, 5, 6].map((j) => (
                            <td key={j} className="p-2.5"><Skeleton className="h-4 w-14 rounded-sm" /></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground font-mono">No cash flow activity recorded.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
