import { Database } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { DataWatchdogStatus } from '@/components/dashboard/DataWatchdogStatus';
import sufoxLogo from '@/assets/sufox-logo.png';
import { useState, useEffect } from 'react';
interface MobileHeaderProps {
  status: 'ok' | 'warning' | 'error';
  errorCount: number;
  warningCount: number;
  onWatchdogClick: () => void;
}
export function MobileHeader({
  status,
  errorCount,
  warningCount,
  onWatchdogClick
}: MobileHeaderProps) {
  const {
    sampleDataMode
  } = usePortfolio();
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border md:hidden">
      {/* Bloomberg gradient bar */}
      <div className="bloomberg-gradient-bar" />
      
      {/* Safe area padding for iOS notch */}
      <div className="pt-safe">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo & Brand */}
          <div className="gap-2 flex items-center justify-center">
            <img alt="SUFOX" className="h-7 w-7 object-contain" src="/lovable-uploads/1273449c-bfbb-4032-9057-0c06b65c76b2.png" />
            <div>
              <h1 className="text-sm font-semibold text-primary tracking-wider">SUFOX</h1>
              <p className="text-[8px] text-muted-foreground font-mono tracking-widest">CAPITAL</p>
            </div>
            <span className="ml-3 text-sm font-mono text-primary font-semibold text-right">
              {time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {sampleDataMode && <span className="flex items-center gap-1 px-2 py-1 bg-primary/20 border border-primary/50 text-primary text-[9px] font-semibold rounded animate-pulse">
                <Database className="h-3 w-3" />
                SAMPLE
              </span>}
            <DataWatchdogStatus status={status} errorCount={errorCount} warningCount={warningCount} onClick={onWatchdogClick} />
          </div>
        </div>
      </div>
    </header>;
}