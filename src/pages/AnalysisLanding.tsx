import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Layers,
  Gem, 
  BarChart3,
  ArrowRight,
  Sparkles,
  Landmark,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ASSET_TYPE_OPTIONS } from '@/pages/Companies';

interface AssetClassCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  items: string[];
  icon: React.ReactNode;
  gradient: string;
  borderGlow: string;
  accentColor: string;
  path: string;
}

const ASSET_CLASSES: AssetClassCard[] = [
  {
    id: 'equities',
    title: 'Equities',
    subtitle: 'Public Companies',
    description: 'Track and analyze publicly traded stocks and securities',
    items: ['Large Cap', 'Mid Cap', 'Small Cap', 'International'],
    icon: <TrendingUp className="w-10 h-10" />,
    gradient: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
    borderGlow: 'group-hover:shadow-emerald-500/20',
    accentColor: 'text-emerald-400',
    path: '/analysis/equities',
  },
  {
    id: 'funds',
    title: 'Funds',
    subtitle: 'ETFs, Bonds & Mutual Funds',
    description: 'Investment vehicles for diversified market exposure',
    items: ['ETF', 'Bond', 'Mutual Fund', 'Index Funds'],
    icon: <Layers className="w-10 h-10" />,
    gradient: 'from-blue-500/30 via-blue-500/10 to-transparent',
    borderGlow: 'group-hover:shadow-blue-500/20',
    accentColor: 'text-blue-400',
    path: '/analysis/funds',
  },
  {
    id: 'alternatives',
    title: 'Alternatives',
    subtitle: 'Private & Alternative Assets',
    description: 'Hedge funds, private equity, real estate, and more',
    items: ['Hedge Fund', 'Private Equity', 'Real Estate', 'Commodity', 'Crypto'],
    icon: <Gem className="w-10 h-10" />,
    gradient: 'from-purple-500/30 via-purple-500/10 to-transparent',
    borderGlow: 'group-hover:shadow-purple-500/20',
    accentColor: 'text-purple-400',
    path: '/analysis/alternatives',
  },
  {
    id: 'cash',
    title: 'Cash & Deposits',
    subtitle: 'Liquid Instruments',
    description: 'Cash holdings, fixed deposits, and money market instruments',
    items: ['Cash', 'Deposit', 'T-Bill / Makam', 'Money Market'],
    icon: <Landmark className="w-10 h-10" />,
    gradient: 'from-amber-500/30 via-amber-500/10 to-transparent',
    borderGlow: 'group-hover:shadow-amber-500/20',
    accentColor: 'text-amber-400',
    path: '/analysis/cash',
  },
];

export default function AnalysisLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newAssetType, setNewAssetType] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!user || !newCompanyName.trim()) return;

    setCreating(true);
    const { data, error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user.id,
        company_name: newCompanyName.trim(),
        status: 'research',
        asset_type: newAssetType || null,
      })
      .select('id')
      .single();

    if (error) {
      toast.error('Failed to create company');
      console.error(error);
      setCreating(false);
      return;
    }

    setNewCompanyName('');
    setNewAssetType('');
    setCreateOpen(false);
    setCreating(false);
    toast.success('Company created');
    navigate(`/analysis/company/${data.id}`);
  };
  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 blur-3xl -z-10" />
        
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
            <div className="relative p-3 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analysis Hub</h1>
            <p className="text-muted-foreground mt-1">
              Track opportunities across all asset classes
            </p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center gap-6 mt-6 py-4 px-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Quick Actions:</span>
          </div>
          <button
            onClick={() => navigate('/analysis/all')}
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View All Companies
            <ArrowRight className="w-3 h-3" />
          </button>
          <div className="h-4 w-px bg-border" />
          <Button 
            onClick={() => setCreateOpen(true)} 
            size="sm" 
            className="gap-2"
          >
            <Plus size={16} />
            Add Company
          </Button>
        </div>
      </div>

      {/* Asset Class Grid - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
        {ASSET_CLASSES.map((assetClass) => (
          <button
            key={assetClass.id}
            onClick={() => navigate(assetClass.path)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm",
              "p-8 text-left transition-all duration-500",
              "hover:border-border hover:bg-card hover:shadow-2xl",
              "hover:-translate-y-2 hover:scale-[1.02]",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              assetClass.borderGlow
            )}
          >
            {/* Gradient Background */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700",
              assetClass.gradient
            )} />
            
            {/* Animated top line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon with glow */}
              <div className="relative mb-6">
                <div className={cn(
                  "absolute inset-0 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500",
                  assetClass.accentColor.replace('text-', 'bg-')
                )} />
                <div className={cn(
                  "relative transition-all duration-300 transform group-hover:scale-110",
                  assetClass.accentColor
                )}>
                  {assetClass.icon}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mb-4">
                <h3 className="text-2xl font-bold mb-1 transition-colors group-hover:text-foreground">
                  {assetClass.title}
                </h3>
                <p className={cn("text-sm font-medium", assetClass.accentColor)}>
                  {assetClass.subtitle}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {assetClass.description}
              </p>

              {/* Items Grid */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {assetClass.items.map((item) => (
                  <div
                    key={item}
                    className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground border border-border/30 group-hover:border-border/50 transition-colors"
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Explore
                </span>
                <div className={cn(
                  "p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors",
                  assetClass.accentColor
                )}>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Large Background Icon */}
            <div className="absolute -bottom-8 -right-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
              <div className="w-48 h-48">
                {assetClass.icon}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={() => navigate('/analysis/all')}
          className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 border border-primary/30 rounded-xl transition-all duration-300"
        >
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="font-medium">View Complete Analysis Board</span>
          <ArrowRight className="w-4 h-4 text-primary transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                placeholder="Enter company name"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && newCompanyName.trim()) handleCreate();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-type">Asset Class</Label>
              <Select 
                value={newAssetType} 
                onValueChange={setNewAssetType}
              >
                <SelectTrigger id="asset-type">
                  <SelectValue placeholder="Select asset class" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newCompanyName.trim() || creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
