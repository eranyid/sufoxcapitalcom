import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket } from 'lucide-react';

const extensions = [
  'Secondaries pricing analyzer',
  'Co-investment underwriting workflow',
  'Fund commitment pacing tool',
  'Liquidity & capital call forecaster',
  'Scenario & stress testing engine',
];

export function FutureExtensionsPanel() {
  return (
    <Card className="opacity-50 hover:opacity-70 transition-opacity">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Rocket size={12} className="text-muted-foreground" />
          <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Future Extensions</p>
        </div>
        <div className="space-y-1.5">
          {extensions.map((ext) => (
            <div key={ext} className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">• {ext}</span>
              <Badge variant="outline" className="text-[7px] h-4">Roadmap</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
