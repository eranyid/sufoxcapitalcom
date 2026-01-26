import { 
  Keyboard, 
  HelpCircle, 
  Rocket, 
  Database, 
  Terminal,
  MousePointer,
  Navigation,
  Shield,
  TrendingUp,
  FileText,
  Settings,
  Users,
  Building2,
  BarChart3,
  Layers,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePortfolio } from '@/context/PortfolioContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Help() {
  const { sampleDataMode, setSampleDataMode } = usePortfolio();

  const handleLoadSampleData = () => {
    if (!sampleDataMode) {
      setSampleDataMode(true);
      toast.success('Sample data loaded');
    }
  };

  const keyboardShortcuts = [
    { keys: ['⌘', 'K'], description: 'Open Command Bar', category: 'navigation' },
    { keys: ['Ctrl', 'K'], description: 'Open Command Bar (Windows)', category: 'navigation' },
    { keys: ['ESC'], description: 'Close Command Bar / modals', category: 'general' },
    { keys: ['↑', '↓'], description: 'Navigate Command Bar suggestions', category: 'navigation' },
    { keys: ['Enter'], description: 'Execute selected command', category: 'navigation' },
    { keys: ['Tab'], description: 'Autocomplete command', category: 'navigation' },
  ];

  const commandBarCommands = [
    { command: 'overview', description: 'Go to dashboard overview' },
    { command: 'crm', description: 'Open CRM system' },
    { command: 'analysis', description: 'Analysis board' },
    { command: 'crm tasks', description: 'CRM Tasks board' },
    { command: 'crm timeline', description: 'CRM Timeline view' },
    { command: 'performance', description: 'Portfolio performance analytics' },
    { command: 'risk', description: 'Risk analysis and VaR' },
    { command: 'research', description: 'Research and watchlist' },
    { command: 'policy', description: 'Investment policy settings' },
    { command: 'transactions', description: 'Transaction history' },
    { command: 'valuations', description: 'Asset valuations' },
    { command: 'settings', description: 'Application settings' },
    { command: 'admin', description: 'User administration' },
    { command: 'activity', description: 'Open activity log' },
  ];

  const gettingStartedSteps = [
    {
      step: 1,
      title: 'Add Transactions',
      description: 'Start by adding buy and sell transactions in the Transactions page. This is the foundation for all analytics.',
      icon: FileText,
    },
    {
      step: 2,
      title: 'Update Valuations',
      description: 'Update monthly asset valuations in the Valuations page to track performance over time.',
      icon: TrendingUp,
    },
    {
      step: 3,
      title: 'Set Investment Policy',
      description: 'Define your investment policy in the Policy page for automated compliance checks.',
      icon: Shield,
    },
    {
      step: 4,
      title: 'Manage CRM',
      description: 'Create projects and track companies to monitor new investment opportunities.',
      icon: Building2,
    },
    {
      step: 5,
      title: 'Analyze Risk',
      description: 'View risk analysis, VaR, and Monte Carlo simulations in the Risk page.',
      icon: BarChart3,
    },
  ];

  const features = [
    {
      title: 'Overview',
      description: 'Portfolio overview with KPIs, allocations and performance metrics',
      icon: Layers,
    },
    {
      title: 'Performance',
      description: 'Detailed performance analysis with benchmark comparison',
      icon: TrendingUp,
    },
    {
      title: 'Risk',
      description: 'Risk analysis including VaR, Monte Carlo and scenario analysis',
      icon: Shield,
    },
    {
      title: 'Research',
      description: 'Track potential assets and research analysis',
      icon: Search,
    },
    {
      title: 'CRM',
      description: 'Manage relationships with companies, funds and tasks',
      icon: Building2,
    },
    {
      title: 'Scenarios',
      description: 'Test stress scenarios and their impact on the portfolio',
      icon: Layers,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Help & Information</h1>
          <p className="text-sm text-muted-foreground">User guide and keyboard shortcuts</p>
        </div>
      </div>

      {/* Sample Data Section */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            Sample Data Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No data yet? Enable sample data mode to see how the system works with a demo portfolio.
            The data is for demonstration purposes only and will not affect your real data.
          </p>
          <div className="flex items-center gap-4">
            {sampleDataMode ? (
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50 animate-pulse">
                Sample Data Active
              </Badge>
            ) : (
              <Button 
                onClick={handleLoadSampleData}
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                Load Sample Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Keyboard className="h-5 w-5 text-primary" />
              Keyboard Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {keyboardShortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIdx) => (
                      <kbd 
                        key={keyIdx}
                        className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Command Bar Commands */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Terminal className="h-5 w-5 text-primary" />
              Command Bar Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘K</kbd> to open Command Bar
            </p>
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              {commandBarCommands.map((cmd, idx) => (
                <div key={idx} className="flex items-center gap-3 py-1.5">
                  <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded min-w-[100px]">
                    {cmd.command}
                  </code>
                  <span className="text-xs text-muted-foreground">{cmd.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="h-5 w-5 text-primary" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gettingStartedSteps.map((step) => (
              <div 
                key={step.step}
                className="flex gap-3 p-3 rounded-lg border border-border/50 bg-card/50"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {step.step}
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm text-foreground">{step.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Navigation className="h-5 w-5 text-primary" />
            Features Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="p-2 rounded bg-secondary">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-foreground">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MousePointer className="h-5 w-5 text-primary" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Use Command Bar (<kbd className="px-1 py-0.5 text-xs bg-muted rounded">⌘K</kbd>) for quick navigation between pages
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Click on Data Watchdog in the top bar to check data integrity
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Import transactions from CSV file in the Transactions page
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Configure custom RSS feeds in the Settings page
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Use sample data mode (above) to explore the system
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pb-4">
        <p>SUFOX CAPITAL - Portfolio & Risk Analytics Terminal v1.0</p>
      </div>
    </div>
  );
}
