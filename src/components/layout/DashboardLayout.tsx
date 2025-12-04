import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandBar } from '@/components/terminal/CommandBar';
import { usePortfolio } from '@/context/PortfolioContext';
import { useDataWatchdog } from '@/hooks/useDataWatchdog';
import { Database, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { DataWatchdogStatus } from '@/components/dashboard/DataWatchdogStatus';
import { DataWatchdogPanel } from '@/components/dashboard/DataWatchdogPanel';
import { cn } from '@/lib/utils';

function formatDateTime(date: Date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month} ${day}, ${year}, ${hours}:${minutes}`;
}

export function DashboardLayout() {
  const { sampleDataMode } = usePortfolio();
  const [watchdogPanelOpen, setWatchdogPanelOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { 
    validationResult, 
    isValidating, 
    runValidation, 
    status, 
    errorCount, 
    warningCount, 
    infoCount 
  } = useDataWatchdog();

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#000000' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top status bar - Bloomberg style */}
        <div className="px-3 py-1 flex items-center justify-between text-xxs shrink-0" style={{ backgroundColor: '#121212', borderBottom: '1px solid #1E1E1E' }}>
          <div className="flex items-center gap-4">
            <span className="font-mono font-semibold tracking-widest" style={{ color: '#00FFFF' }}>SUFOX CAPITAL</span>
            <span className="font-mono" style={{ color: '#D0D0D0' }}>│</span>
            <span className="font-mono" style={{ color: '#D0D0D0' }}>Portfolio & Risk Analytics Terminal</span>
            {sampleDataMode && (
              <span className="status-badge status-badge-warning">
                <Database className="h-2.5 w-2.5" />
                SAMPLE DATA
              </span>
            )}
          </div>
          
          {/* Command Bar */}
          <CommandBar />
          
          <div className="flex items-center gap-3 font-mono" style={{ color: '#D0D0D0' }}>
            <DataWatchdogStatus
              status={status}
              errorCount={errorCount}
              warningCount={warningCount}
              onClick={() => setWatchdogPanelOpen(true)}
            />
            <span style={{ color: '#D0D0D0' }}>│</span>
            <span>USD</span>
            <span style={{ color: '#00FFFF' }}>{formatDateTime(currentTime)}</span>
          </div>
        </div>

        {/* Manual data badge */}
        <div className="px-3 py-0.5 flex items-center justify-between text-xxs shrink-0" style={{ backgroundColor: '#121212', borderBottom: '1px solid #1E1E1E' }}>
          <div className="flex items-center gap-2">
            <span className="font-mono" style={{ color: '#D0D0D0' }}>STATUS:</span>
            <span className={cn(
              "status-badge",
              status === 'ok' && "status-badge-ok",
              status === 'warning' && "status-badge-warning",
              status === 'error' && "status-badge-error"
            )}>
              {status === 'ok' && <CheckCircle className="h-2.5 w-2.5" />}
              {status === 'warning' && <AlertTriangle className="h-2.5 w-2.5" />}
              {status === 'error' && <AlertCircle className="h-2.5 w-2.5" />}
              {status.toUpperCase()}
            </span>
            <span className="font-mono" style={{ color: '#D0D0D0' }}>│</span>
            <span className="font-mono" style={{ color: '#D0D0D0' }}>MANUAL MONTHLY UPDATES</span>
          </div>
          <div className="flex items-center gap-2 font-mono" style={{ color: '#D0D0D0' }}>
            <span>Press</span>
            <kbd className="px-1 py-0.5 text-xxs" style={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>/</kbd>
            <span>for command bar</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 overflow-auto" style={{ backgroundColor: '#000000' }}>
          <Outlet />
        </div>
      </main>
      
      <DataWatchdogPanel
        open={watchdogPanelOpen}
        onOpenChange={setWatchdogPanelOpen}
        validationResult={validationResult}
        isValidating={isValidating}
        onRunValidation={runValidation}
        errorCount={errorCount}
        warningCount={warningCount}
        infoCount={infoCount}
      />
    </div>
  );
}