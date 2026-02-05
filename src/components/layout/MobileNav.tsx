import { NavLink, useLocation } from 'react-router-dom';
import { 
  Contact,
  MoreHorizontal,
  Calendar,
  Users,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { XRayIcon } from '@/components/icons/XRayIcon';
import { TransactionsIcon } from '@/components/icons/TransactionsIcon';
import { SettingsIcon } from '@/components/icons/SettingsIcon';
import { PerformanceIcon } from '@/components/icons/PerformanceIcon';
import { FxRatesIcon } from '@/components/icons/FxRatesIcon';
import { ValuationsIcon } from '@/components/icons/ValuationsIcon';
import { RiskIcon } from '@/components/icons/RiskIcon';
import { OverviewIcon } from '@/components/icons/OverviewIcon';
import { PolicyIcon } from '@/components/icons/PolicyIcon';
import { ScenariosIcon } from '@/components/icons/ScenariosIcon';
import { AnalysisIcon } from '@/components/icons/AnalysisIcon';
import { ResearchIcon } from '@/components/icons/ResearchIcon';
import { ConstructionIcon } from '@/components/icons/ConstructionIcon';
import { LabIcon } from '@/components/icons/LabIcon';
import { ChartsIcon } from '@/components/icons/ChartsIcon';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const primaryNavItems = [
  { path: '/', icon: OverviewIcon, label: 'Overview' },
  { path: '/performance', icon: PerformanceIcon, label: 'Performance' },
  { path: '/risk', icon: RiskIcon, label: 'Risk' },
  { path: '/research', icon: ResearchIcon, label: 'Research' },
];

const moreNavItems = [
  { path: '/analysis', icon: AnalysisIcon, label: 'Analysis' },
  { path: '/construction', icon: ConstructionIcon, label: 'Construction' },
  { path: '/lab', icon: LabIcon, label: 'Lab' },
  { path: '/expected-return-lab', icon: LabIcon, label: 'ER Lab' },
  { path: '/charts', icon: ChartsIcon, label: 'Charts' },
  { path: '/backoffice', icon: Contact, label: 'Back Office' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/scenarios', icon: ScenariosIcon, label: 'Scenarios' },
  { path: '/xray', icon: XRayIcon, label: 'X-Ray' },
  { path: '/fx-rates', icon: FxRatesIcon, label: 'FX Rates' },
  { path: '/policy', icon: PolicyIcon, label: 'Policy' },
  { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  { path: '/help', icon: HelpCircle, label: 'Help' },
];

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { isAdmin } = useAuth();
  const location = useLocation();

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    if (location.pathname === path) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Check if any "more" item is currently active
  const isMoreItemActive = moreNavItems.some(item => location.pathname === item.path) || 
    (isAdmin && location.pathname === '/admin/users');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border md:hidden">
      {/* Safe area padding for iOS */}
      <div className="pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryNavItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={(e) => handleNavClick(path, e)}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[56px] min-h-[44px] rounded-lg transition-colors",
                isActive 
                  ? "text-primary bg-sidebar-accent" 
                  : "text-muted-foreground hover:text-primary hover:bg-sidebar-accent/50"
              )}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px] font-medium tracking-tight">{label}</span>
            </NavLink>
          ))}
          
          {/* More Menu */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[56px] min-h-[44px] rounded-lg transition-colors",
                moreOpen || isMoreItemActive
                  ? "text-primary bg-sidebar-accent" 
                  : "text-muted-foreground hover:text-primary hover:bg-sidebar-accent/50"
              )}>
                <MoreHorizontal size={20} strokeWidth={1.5} />
                <span className="text-[10px] font-medium tracking-tight">More</span>
              </button>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="bg-sidebar border-sidebar-border rounded-t-3xl px-4 pb-8"
            >
              {/* Drag handle indicator */}
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
              
              {/* Menu items */}
              <div className="space-y-1">
                {moreNavItems.map(({ path, icon: Icon, label }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-4 py-3.5 px-4 rounded-xl text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/15 text-primary" 
                        : "text-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon size={20} strokeWidth={1.5} className="text-muted-foreground" />
                    <span>{label}</span>
                  </NavLink>
                ))}
                
                {/* Admin link - only for admins */}
                {isAdmin && (
                  <NavLink
                    to="/admin/users"
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-4 py-3.5 px-4 rounded-xl text-sm font-medium transition-colors mt-2 border-t border-sidebar-border pt-4",
                      isActive 
                        ? "bg-primary/15 text-primary" 
                        : "text-primary hover:bg-primary/10"
                    )}
                  >
                    <Users size={20} strokeWidth={1.5} />
                    <span>Admin</span>
                  </NavLink>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
