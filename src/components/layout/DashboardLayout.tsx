import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { usePortfolio } from '@/context/PortfolioContext';
import { Database } from 'lucide-react';

export function DashboardLayout() {
  const { sampleDataMode } = usePortfolio();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Top status bar like Bloomberg */}
        <div className="bg-secondary border-b border-border px-4 py-1 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-4">
            <span className="text-primary font-semibold tracking-wider">SUFOX CAPITAL</span>
            <span className="text-muted-foreground">Portfolio & Risk Analytics</span>
            {sampleDataMode && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 border border-primary/50 text-primary font-semibold rounded animate-pulse">
                <Database className="h-3 w-3" />
                SAMPLE DATA
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 font-mono text-muted-foreground">
            <span>USD</span>
            <span>{new Date().toLocaleDateString()}</span>
            <span className="text-primary">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
          </div>
        </div>
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
