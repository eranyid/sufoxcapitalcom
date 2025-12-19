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

  const handleToggleSampleData = () => {
    setSampleDataMode(!sampleDataMode);
    if (!sampleDataMode) {
      toast.success('Sample data loaded');
    } else {
      toast.success('Sample data cleared');
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
    { command: 'crm companies', description: 'CRM Companies board' },
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
      title: 'הוספת עסקאות',
      description: 'התחל בהוספת עסקאות קנייה ומכירה דרך עמוד Transactions. זה הבסיס לכל הניתוחים.',
      icon: FileText,
    },
    {
      step: 2,
      title: 'עדכון שווי נכסים',
      description: 'עדכן את השווי החודשי של הנכסים בעמוד Valuations כדי לעקוב אחר ביצועים.',
      icon: TrendingUp,
    },
    {
      step: 3,
      title: 'הגדרת מדיניות השקעה',
      description: 'הגדר את מדיניות ההשקעה שלך בעמוד Policy לבדיקות תאימות אוטומטיות.',
      icon: Shield,
    },
    {
      step: 4,
      title: 'ניהול CRM',
      description: 'צור פרויקטים וחברות למעקב אחר הזדמנויות השקעה חדשות.',
      icon: Building2,
    },
    {
      step: 5,
      title: 'ניתוח סיכונים',
      description: 'צפה בניתוחי סיכון, VaR ו-Monte Carlo בעמוד Risk.',
      icon: BarChart3,
    },
  ];

  const features = [
    {
      title: 'Overview',
      description: 'סקירה כללית של הפורטפוליו עם KPIs, הקצאות ומדדי ביצוע',
      icon: Layers,
    },
    {
      title: 'Performance',
      description: 'ניתוח ביצועים מפורט עם השוואה לבנצ\'מרק',
      icon: TrendingUp,
    },
    {
      title: 'Risk',
      description: 'ניתוח סיכונים כולל VaR, Monte Carlo וניתוח תרחישים',
      icon: Shield,
    },
    {
      title: 'Research',
      description: 'מעקב אחר נכסים פוטנציאליים וניתוח מחקר',
      icon: Search,
    },
    {
      title: 'CRM',
      description: 'ניהול קשרים עם חברות, קרנות ומשימות',
      icon: Building2,
    },
    {
      title: 'Scenarios',
      description: 'בדיקת תרחישי קיצון והשפעתם על הפורטפוליו',
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
          <p className="text-sm text-muted-foreground">מדריך שימוש וקיצורי מקלדת</p>
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
            אין לך נתונים? הפעל מצב נתוני דוגמא כדי לראות איך המערכת עובדת עם פורטפוליו לדוגמא.
            הנתונים הם לצורכי הדגמה בלבד ולא ישפיעו על הנתונים האמיתיים שלך.
          </p>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleToggleSampleData}
              variant={sampleDataMode ? "destructive" : "default"}
              className="gap-2"
            >
              {sampleDataMode ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Clear Sample Data
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Load Sample Data
                </>
              )}
            </Button>
            {sampleDataMode && (
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50 animate-pulse">
                Sample Data Active
              </Badge>
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
            Getting Started / איך להתחיל
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
            Features Overview / סקירת תכונות
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
            Quick Tips / טיפים מהירים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              השתמש ב-Command Bar (<kbd className="px-1 py-0.5 text-xs bg-muted rounded">⌘K</kbd>) לניווט מהיר בין עמודים
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              לחץ על Data Watchdog בסרגל העליון לבדיקת תקינות הנתונים
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              ייבא עסקאות מקובץ CSV בעמוד Transactions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              הגדר RSS feeds מותאמים אישית בעמוד Settings
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              השתמש במצב נתוני דוגמא (למעלה) כדי להכיר את המערכת
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
