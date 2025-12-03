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
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/performance', icon: TrendingUp, label: 'Performance' },
  { path: '/risk', icon: Shield, label: 'Risk' },
  { path: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
  { path: '/valuations', icon: Calendar, label: 'Valuations' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn(
        "p-4 border-b border-sidebar-border flex items-center",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={sufoxLogo} alt="SUFOX Capital" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-lg font-semibold text-primary tracking-wide">SUFOX</h1>
              <p className="text-xs text-muted-foreground font-mono">CAPITAL</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src={sufoxLogo} alt="SUFOX" className="h-8 w-8 object-contain" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors",
            collapsed && "absolute left-16 top-4 bg-sidebar border border-sidebar-border"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              "nav-link",
              isActive && "active"
            )}
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-primary font-mono text-center tracking-wider">
            TERMINAL v1.0
          </p>
        </div>
      )}
    </aside>
  );
}
