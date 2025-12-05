import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { usePortfolio } from '@/context/PortfolioContext';
import { useDataWatchdog } from '@/hooks/useDataWatchdog';
import { Database } from 'lucide-react';
import { DataWatchdogStatus } from '@/components/dashboard/DataWatchdogStatus';
import { DataWatchdogPanel } from '@/components/dashboard/DataWatchdogPanel';

export function DashboardLayout() {
  const { sampleDataMode } = usePortfolio();
  const [watchdogPanelOpen, setWatchdogPanelOpen] = useState(false);
  const { 
    validationResult, 
    isValidating, 
    runValidation, 
    status, 
    errorCount, 
    warningCount, 
    infoCount 
  } = useDataWatchdog();

  return (
    <div className="flex flex-col md:flex-row min-h-screen min-h-dvh w-full bg-background overflow-x-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header - visible only on mobile */}
        <div className="md:hidden">
          <MobileHeader 
            status={status}
            errorCount={errorCount}
            warningCount={warningCount}
            onWatchdogClick={() => setWatchdogPanelOpen(true)}
          />
        </div>

        {/* Desktop Top status bar - hidden on mobile */}
        <div className="hidden md:flex bg-secondary border-b border-border px-4 py-1 items-center justify-between text-[10px]">
          <div className="flex items-center gap-4">
            <span className="text-primary font-semibold tracking-wider">SUFOX CAPITAL</span>
            <span className="text-muted-foreground">Portfolio & Risk Analytics</span>
            {sampleDataMode && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 border border-primary/50 text-primary font-semibold rounded animate-pulse">
                <Database className="h-3 w-3" />
                SAMPLE DATA
              </span>
            )}
            <DataWatchdogStatus
              status={status}
              errorCount={errorCount}
              warningCount={warningCount}
              onClick={() => setWatchdogPanelOpen(true)}
            />
          </div>
          <div className="flex items-center gap-4 font-mono text-muted-foreground">
            <span>USD</span>
            <span>{new Date().toLocaleDateString()}</span>
            <span className="text-primary">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-3 md:p-4 pb-20 md:pb-4 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
      
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