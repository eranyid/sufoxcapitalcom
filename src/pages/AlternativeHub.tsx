import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Upload, Settings, Calculator, FlaskConical,
  Briefcase, FileText
} from 'lucide-react';
import { FundAnalysisSection } from '@/components/alternative/FundAnalysisSection';
import { PortfolioInsightPanel } from '@/components/alternative/PortfolioInsightPanel';
import { DealStructuringSection } from '@/components/alternative/DealStructuringSection';
import { MarketIntelligencePanel } from '@/components/alternative/MarketIntelligencePanel';
import { FutureExtensionsPanel } from '@/components/alternative/FutureExtensionsPanel';

export default function AlternativeHub() {
  return (
    <div className="space-y-5 p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Alternative Investments</h1>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            Private Markets Intelligence & Deal Structuring
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" className="gap-1.5 text-[11px]">
            <Search size={13} /> Analyze Fund
          </Button>
          <Button size="sm" variant="secondary" className="gap-1.5 text-[11px]">
            <Calculator size={13} /> Run Calculator
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5 text-[11px]">
            <Upload size={13} /> Upload DD Materials
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="analysis" className="space-y-5">
        <TabsList className="bg-muted/30 border border-border/50 h-9">
          <TabsTrigger value="analysis" className="text-[11px] gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <Briefcase size={12} /> Private Markets Analysis
          </TabsTrigger>
          <TabsTrigger value="structuring" className="text-[11px] gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <Calculator size={12} /> Deal Structuring & Calculators
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Private Markets Analysis */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            {/* Main content */}
            <FundAnalysisSection />

            {/* Right sidebar */}
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
      </Tabs>
    </div>
  );
}
