/**
 * Risk Model Dashboard - Salesforce-style visual analytics
 * Main shell component with header, tabs, and global filters
 */

import { useState, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Lightbulb, Calendar, TrendingUp } from 'lucide-react';
import { RiskModelFilters, getDefaultDateRange } from '@/lib/riskModelData';
import { RiskSummaryTab } from './tabs/RiskSummaryTab';
import { RiskFactorTab } from './tabs/RiskFactorTab';
import { FactorAttributionTab } from './tabs/FactorAttributionTab';
import { ScenarioAnalysisTab } from './tabs/ScenarioAnalysisTab';
import { RiskExposureTab } from './tabs/RiskExposureTab';
import { RiskDecompositionTab } from './tabs/RiskDecompositionTab';
import { RiskForecastTab } from './tabs/RiskForecastTab';
import { RiskPremiumTab } from './tabs/RiskPremiumTab';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const BENCHMARK_OPTIONS = [
  { value: 'SPY', label: 'S&P 500' },
  { value: '60_40', label: '60/40 Portfolio' },
  { value: 'TA125', label: 'TA-125' },
  { value: 'none', label: 'No Benchmark' },
] as const;

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
] as const;

export function RiskModelDashboard() {
  const { transactions, valuations } = usePortfolio();
  const [activeTab, setActiveTab] = useState('summary');
  
  // Global filters
  const defaultRange = useMemo(() => getDefaultDateRange(valuations), [valuations]);
  const [filters, setFilters] = useState<RiskModelFilters>({
    benchmark: 'SPY',
    dateRange: defaultRange,
    frequency: 'monthly',
  });
  
  const updateFilter = <K extends keyof RiskModelFilters>(key: K, value: RiskModelFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const hasData = transactions.length > 0 && valuations.length > 0;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Dashboard Header */}
      <div className="bloomberg-panel">
        <div className="p-3 flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Title Section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 border border-primary/30">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-primary tracking-wide uppercase truncate">
                Risk Model Dashboard
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono">
                Portfolio Analytics • {filters.dateRange.start} to {filters.dateRange.end}
              </p>
            </div>
          </div>
          
          {/* Global Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Benchmark Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Benchmark</span>
              <Select
                value={filters.benchmark}
                onValueChange={(v) => updateFilter('benchmark', v as RiskModelFilters['benchmark'])}
              >
                <SelectTrigger className="h-7 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BENCHMARK_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Frequency Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Freq</span>
              <Select
                value={filters.frequency}
                onValueChange={(v) => updateFilter('frequency', v as RiskModelFilters['frequency'])}
              >
                <SelectTrigger className="h-7 w-[90px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Range Display */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary border border-border rounded text-[10px] font-mono">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>{filters.dateRange.start}</span>
              <span className="text-muted-foreground">→</span>
              <span>{filters.dateRange.end}</span>
            </div>
            
            {/* Insights Button (Placeholder) */}
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" disabled>
              <Lightbulb className="h-3 w-3" />
              Insights
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Horizontal scrollable tabs for mobile */}
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-9 w-max min-w-full bg-secondary/50 border border-border p-0.5 gap-0.5">
            <TabsTrigger 
              value="summary" 
              className="h-8 px-3 text-[11px] font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm"
            >
              Risk Summary
            </TabsTrigger>
            <TabsTrigger 
              value="factor"
              className="h-8 px-3 text-[11px] font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm"
            >
              Risk Factor
            </TabsTrigger>
            <TabsTrigger 
              value="attribution"
              className="h-8 px-3 text-[11px] font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm"
            >
              Factor Attribution
            </TabsTrigger>
            <TabsTrigger 
              value="scenario"
              className="h-8 px-3 text-[11px] font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm"
            >
              Scenario Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="exposure"
              className="h-8 px-3 text-[11px] font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm"
            >
              Risk Exposure
            </TabsTrigger>
            <TabsTrigger 
              value="decomposition"
              className="h-8 px-3 text-[11px] font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm"
            >
              Risk Decomposition
            </TabsTrigger>
            <TabsTrigger 
              value="forecast"
              className="h-8 px-3 text-[11px] font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm"
            >
              Risk Forecast
            </TabsTrigger>
            <TabsTrigger 
              value="premium"
              className="h-8 px-3 text-[11px] font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm"
            >
              Risk Premium
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        {/* Tab Content */}
        <div className="mt-3">
          <TabsContent value="summary" className="m-0">
            <RiskSummaryTab 
              transactions={transactions} 
              valuations={valuations} 
              filters={filters}
              hasData={hasData}
            />
          </TabsContent>
          
          <TabsContent value="factor" className="m-0">
            <RiskFactorTab 
              transactions={transactions} 
              valuations={valuations} 
              filters={filters}
              hasData={hasData}
            />
          </TabsContent>
          
          <TabsContent value="attribution" className="m-0">
            <FactorAttributionTab 
              transactions={transactions} 
              valuations={valuations} 
              filters={filters}
              hasData={hasData}
            />
          </TabsContent>
          
          <TabsContent value="scenario" className="m-0">
            <ScenarioAnalysisTab 
              transactions={transactions} 
              valuations={valuations} 
              filters={filters}
              hasData={hasData}
            />
          </TabsContent>
          
          <TabsContent value="exposure" className="m-0">
            <RiskExposureTab 
              transactions={transactions} 
              valuations={valuations} 
              filters={filters}
              hasData={hasData}
            />
          </TabsContent>
          
          <TabsContent value="decomposition" className="m-0">
            <RiskDecompositionTab 
              transactions={transactions} 
              valuations={valuations} 
              filters={filters}
              hasData={hasData}
            />
          </TabsContent>
          
          <TabsContent value="forecast" className="m-0">
            <RiskForecastTab 
              transactions={transactions} 
              valuations={valuations} 
              filters={filters}
              hasData={hasData}
            />
          </TabsContent>
          
          <TabsContent value="premium" className="m-0">
            <RiskPremiumTab 
              transactions={transactions} 
              valuations={valuations} 
              filters={filters}
              hasData={hasData}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
