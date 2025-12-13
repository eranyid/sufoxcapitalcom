import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Shield, 
  Scan, 
  Search,
  FlaskConical,
  MoreHorizontal,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const primaryNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/performance', icon: TrendingUp, label: 'Perform' },
  { path: '/risk', icon: Shield, label: 'Risk' },
  { path: '/xray', icon: Scan, label: 'X-Ray' },
  { path: '/research', icon: FlaskConical, label: 'Research' },
];

const moreNavItems = [
  { path: '/transactions', label: 'Transactions' },
  { path: '/scenarios', label: 'Scenarios' },
  { path: '/valuations', label: 'Valuations' },
  { path: '/policy', label: 'Policy' },
  { path: '/crm', label: 'CRM' },
  { path: '/settings', label: 'Settings' },
];

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border md:hidden">
      {/* Safe area padding for iOS */}
      <div className="pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryNavItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
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
                moreOpen 
                  ? "text-primary bg-sidebar-accent" 
                  : "text-muted-foreground hover:text-primary hover:bg-sidebar-accent/50"
              )}>
                <MoreHorizontal size={20} strokeWidth={1.5} />
                <span className="text-[10px] font-medium tracking-tight">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-sidebar border-sidebar-border rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="text-primary text-sm tracking-wider">More Options</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 py-6">
                {moreNavItems.map(({ path, label }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center justify-center py-4 px-3 rounded-xl text-sm font-medium transition-colors min-h-[56px]",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    {label}
                  </NavLink>
                ))}
                {isAdmin && (
                  <NavLink
                    to="/admin/users"
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center justify-center gap-2 py-4 px-3 rounded-xl text-sm font-medium transition-colors min-h-[56px]",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-primary/20 text-primary hover:bg-primary/30"
                    )}
                  >
                    <Users size={16} />
                    Admin
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