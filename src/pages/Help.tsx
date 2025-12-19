import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePortfolio } from '@/context/PortfolioContext';
import { toast } from 'sonner';
import { 
  Keyboard, 
  BookOpen, 
  Database, 
  LayoutDashboard, 
  TrendingUp, 
  Shield, 
  FlaskConical, 
  Scan, 
  Search, 
  ArrowRightLeft, 
  Calendar, 
  FileCheck, 
  Contact, 
  Settings,
  Command,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

const shortcuts = [
  { command: 'main', description: 'Navigate to Overview', icon: LayoutDashboard },
  { command: 'perf', description: 'Navigate to Performance', icon: TrendingUp },
  { command: 'risk', description: 'Navigate to Risk', icon: Shield },
  { command: 'scen', description: 'Navigate to Scenarios', icon: FlaskConical },
  { command: 'x', description: 'Navigate to X-Ray', icon: Scan },
  { command: 'resea', description: 'Navigate to Research', icon: Search },
  { command: 'tran', description: 'Navigate to Transactions', icon: ArrowRightLeft },
  { command: 'value', description: 'Navigate to Valuations', icon: Calendar },
  { command: 'poli', description: 'Navigate to Policy', icon: FileCheck },
  { command: 'crm', description: 'Navigate to CRM', icon: Contact },
  { command: 'set', description: 'Navigate to Settings', icon: Settings },
  { command: 'poli check', description: 'Open Compliance Check modal', icon: CheckCircle },
  { command: 'snapshot AAPL', description: 'Get Alpaca snapshot for ticker', icon: TrendingUp },
  { command: 'price AAPL', description: 'Get latest price for ticker', icon: TrendingUp },
];

const gettingStartedSteps = [
  {
    step: 1,
    title: 'Add Your Transactions',
    description: 'Go to the Transactions page and add your portfolio holdings - buys, sells, and other transactions.',
    tip: 'Use the Command Bar (⌘K) and type "tran" to quickly navigate there.'
  },
  {
    step: 2,
    title: 'Enter Valuations',
    description: 'Add monthly valuations for your assets to track performance over time.',
    tip: 'Type "value" in the Command Bar for quick access.'
  },
  {
    step: 3,
    title: 'Set Your Investment Policy',
    description: 'Define your risk tolerance, allocation limits, and investment constraints.',
    tip: 'Use "poli" in the Command Bar to navigate to Policy settings.'
  },
  {
    step: 4,
    title: 'Explore Analytics',
    description: 'View your portfolio performance, risk metrics, and run scenario analyses.',
    tip: 'Commands like "perf", "risk", and "scen" give you quick access.'
  },
  {
    step: 5,
    title: 'Use Compliance Checks',
    description: 'Before making trades, use "poli check" in the Command Bar to verify compliance.',
    tip: 'This ensures your actions align with your investment policy.'
  },
];

export default function Help() {
  const { sampleDataMode, setSampleDataMode } = usePortfolio();

  const handleSampleDataToggle = (enabled: boolean) => {
    setSampleDataMode(enabled);
    toast.success(enabled ? 'Sample data mode enabled' : 'Showing your data');
  };

  return (
    <div className="section-spacing animate-fade-in max-w-4xl">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-primary uppercase tracking-wide">Help & Guide</h1>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Keyboard shortcuts, getting started, and sample data</p>
      </div>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            Open Command Bar with <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono text-xs">⌘K</kbd> or <kbd className="px-2 py-0.5 bg-muted rounded border border-border font-mono text-xs">Ctrl+K</kbd>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {shortcuts.map(({ command, description, icon: Icon }) => (
              <div 
                key={command} 
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm text-foreground">{description}</span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {command}
                </Badge>
                <span className="text-muted-foreground text-xs">+ Enter</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <Command className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary">Pro Tip</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Commands support prefix matching - type just the first few letters and press Enter for instant navigation.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Follow these steps to set up your portfolio tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gettingStartedSteps.map(({ step, title, description, tip }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-sm">
                    {step}
                  </div>
                </div>
                <div className="flex-1 pb-4 border-b border-border/50 last:border-0">
                  <h3 className="font-medium text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-primary">
                    <Lightbulb className="h-3 w-3" />
                    <span>{tip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sample Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Sample Data Mode
          </CardTitle>
          <CardDescription>
            Explore the system with pre-populated example data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="space-y-1">
              <Label htmlFor="sample-data" className="text-base font-medium">
                Enable Sample Data
              </Label>
              <p className="text-sm text-muted-foreground">
                {sampleDataMode 
                  ? 'Currently viewing sample portfolio data' 
                  : 'Currently viewing your actual data'}
              </p>
            </div>
            <Switch
              id="sample-data"
              checked={sampleDataMode}
              onCheckedChange={handleSampleDataToggle}
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              What's included in sample data?
            </h4>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Diversified portfolio with stocks, bonds, and alternatives
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Historical transactions and valuations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Pre-configured investment policy
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Performance metrics and risk analysis
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Recommended for New Users</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Turn on sample data to explore all features before adding your own portfolio data.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
