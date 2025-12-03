import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Shield, 
  ArrowRightLeft, 
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import sufoxLogo from '@/assets/sufox-logo.png';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'OVERVIEW' },
  { path: '/performance', icon: TrendingUp, label: 'PERFORMANCE' },
  { path: '/risk', icon: Shield, label: 'RISK' },
  { path: '/transactions', icon: ArrowRightLeft, label: 'TRANSACTIONS' },
  { path: '/valuations', icon: Calendar, label: 'VALUATIONS' },
  { path: '/settings', icon: Settings, label: 'SETTINGS' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-screen bg-sidebar flex flex-col transition-all duration-200",
      collapsed ? "w-12" : "w-56"
    )}>
      {/* Bloomberg gradient bar */}
      <div className="bloomberg-gradient-bar" />
      
      {/* Logo */}
      <div className={cn(
        "px-2 py-3 border-b border-sidebar-border flex items-center",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={sufoxLogo} alt="SUFOX Capital" className="h-7 w-7 object-contain" />
            <div>
              <h1 className="text-sm font-semibold text-primary tracking-wider">SUFOX</h1>
              <p className="text-[9px] text-muted-foreground font-mono tracking-widest">CAPITAL</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src={sufoxLogo} alt="SUFOX" className="h-6 w-6 object-contain" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1 hover:bg-sidebar-accent text-muted-foreground hover:text-primary transition-colors",
            collapsed && "absolute left-12 top-4 bg-sidebar border border-sidebar-border z-10"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-0.5">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              "nav-link mx-1",
              isActive && "active"
            )}
          >
            <Icon size={14} />
            {!collapsed && <span className="text-[11px] tracking-wide">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-2 py-2 border-t border-sidebar-border">
          <p className="text-[9px] text-primary font-mono text-center tracking-widest">
            TERMINAL v1.0
          </p>
          <p className="text-[8px] text-muted-foreground font-mono text-center mt-0.5">
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
      )}
    </aside>
  );
}
