import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Plus, Search, FileText, Clock, TrendingUp,
  Building2, Rocket, CreditCard, Home, Landmark, BarChart3,
  MoreVertical, Trash2, Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewFundAnalysisDialog } from '@/components/alternative/NewFundAnalysisDialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const META: Record<string, { title: string; icon: any; accent: string }> = {
  'private-equity': { title: 'Private Equity', icon: Building2, accent: 'from-emerald-500/20 to-emerald-500/5' },
  'venture-capital': { title: 'Venture Capital', icon: Rocket, accent: 'from-sky-500/20 to-sky-500/5' },
  'private-credit': { title: 'Private Credit', icon: CreditCard, accent: 'from-violet-500/20 to-violet-500/5' },
  'real-estate': { title: 'Real Estate', icon: Home, accent: 'from-amber-500/20 to-amber-500/5' },
  'real-assets': { title: 'Infrastructure', icon: Landmark, accent: 'from-rose-500/20 to-rose-500/5' },
  'hedge-funds-alts': { title: 'Hedge Funds & Alts', icon: BarChart3, accent: 'from-cyan-500/20 to-cyan-500/5' },
};

// Sample saved analyses — will come from DB later
const sampleAnalyses = [
  {
    id: 'demo-1',
    name: 'Blackstone Capital Partners IX',
    manager: 'Blackstone',
    strategy: 'Buyout',
    vintage: 2023,
    status: 'active',
    lastUpdated: '2026-02-10',
    nav: '$128M',
    irr: '18.2%',
  },
  {
    id: 'demo-2',
    name: 'KKR Americas Fund XIII',
    manager: 'KKR',
    strategy: 'Growth Equity',
    vintage: 2022,
    status: 'active',
    lastUpdated: '2026-01-28',
    nav: '$95M',
    irr: '14.5%',
  },
  {
    id: 'demo-3',
    name: 'Apollo Investment Fund X',
    manager: 'Apollo',
    strategy: 'Distressed',
    vintage: 2021,
    status: 'completed',
    lastUpdated: '2025-12-15',
    nav: '$210M',
    irr: '22.1%',
  },
];

export default function AlternativeSelector() {
  const { assetClass } = useParams<{ assetClass: string }>();
  const navigate = useNavigate();
  const meta = META[assetClass || ''];
  const [search, setSearch] = useState('');

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

  const filtered = sampleAnalyses.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.manager.toLowerCase().includes(search.toLowerCase())
  );

  const handleNewFund = () => {
    // Navigate to analysis page with "new" id
    navigate(`/alternative/${assetClass}/new`);
  };

  return (
    <>
      <Helmet>
        <title>{meta.title} — Alternative | SUFOX Capital</title>
      </Helmet>

      <div className="flex-1 flex flex-col p-4 md:p-6 max-w-[1200px] mx-auto overflow-auto pb-20 md:pb-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/alternative')} className="gap-1 text-[10px] h-7 px-2">
              <ArrowLeft size={12} /> Hub
            </Button>
            <div className={cn("p-2 rounded-lg bg-gradient-to-br border border-border/40", meta.accent)}>
              <Icon size={18} className="text-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{meta.title}</h1>
              <p className="text-[10px] text-muted-foreground font-mono">Select an analysis to open or create a new one</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NewFundAnalysisDialog assetClass={meta.title} onSubmit={handleNewFund} />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search analyses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs font-mono bg-muted/20 border-border/50"
          />
        </div>

        {/* Analyses Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((analysis, idx) => (
              <Card
                key={analysis.id}
                className="group cursor-pointer hover:border-primary/40 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                onClick={() => navigate(`/alternative/${assetClass}/${analysis.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[12px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {analysis.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {analysis.manager} · {analysis.strategy}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical size={12} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem className="gap-2 text-[11px]" onClick={e => e.stopPropagation()}>
                          <Copy size={11} /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-[11px] text-destructive" onClick={e => e.stopPropagation()}>
                          <Trash2 size={11} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[8px] text-muted-foreground font-mono">Vintage</p>
                      <p className="text-[11px] font-mono text-foreground">{analysis.vintage}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-muted-foreground font-mono">NAV</p>
                      <p className="text-[11px] font-mono text-foreground">{analysis.nav}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-muted-foreground font-mono">Net IRR</p>
                      <p className="text-[11px] font-mono text-success">{analysis.irr}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/30">
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
                      <Clock size={9} />
                      {analysis.lastUpdated}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[8px]",
                        analysis.status === 'active' ? "border-success/30 text-success" : "border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {analysis.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 rounded-full bg-muted/20 border border-border/30">
              <FileText size={24} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">No analyses found</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {search ? 'Try a different search term or create a new analysis' : 'Create your first fund analysis to get started'}
              </p>
            </div>
            <Button size="sm" className="gap-1.5 text-[10px] h-8 mt-2" onClick={handleNewFund}>
              <Plus size={12} /> Create Analysis
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
