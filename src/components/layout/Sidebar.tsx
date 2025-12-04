import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Shield, 
  ArrowRightLeft, 
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Scan,
  Briefcase,
  FlaskConical,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import sufoxLogo from '@/assets/sufox-logo.png';

const navItems = [
  { path: '/', code: 'OVRV', icon: LayoutDashboard, label: 'Overview' },
  { path: '/performance', code: 'PERF', icon: TrendingUp, label: 'Performance' },
  { path: '/risk', code: 'RISK', icon: Shield, label: 'Risk Analytics' },
  { path: '/scenarios', code: 'SCN', icon: FlaskConical, label: 'Scenario Builder' },
  { path: '/xray', code: 'XRAY', icon: Scan, label: 'Portfolio X-Ray' },
  { path: '/transactions', code: 'TXN', icon: ArrowRightLeft, label: 'Transactions' },
  { path: '/valuations', code: 'VAL', icon: Calendar, label: 'Valuations' },
  { path: '/management', code: 'MGMT', icon: Briefcase, label: 'Management' },
  { path: '/settings', code: 'SET', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <aside className={cn(
      "h-screen bg-sidebar flex flex-col transition-all duration-150 border-r border-sidebar-border",
      collapsed ? "w-14" : "w-48"
    )}>
      {/* Bloomberg gradient bar */}
      <div className="bloomberg-gradient-bar" />
      
      {/* Logo */}
      <div className={cn(
        "px-2 py-2 border-b border-sidebar-border flex items-center",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={sufoxLogo} alt="SUFOX Capital" className="h-6 w-6 object-contain" />
            <div>
              <h1 className="text-xs font-semibold text-primary tracking-widest font-mono">SUFOX</h1>
              <p className="text-xxs text-muted-foreground font-mono tracking-widest">CAPITAL</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src={sufoxLogo} alt="SUFOX" className="h-5 w-5 object-contain" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1 hover:bg-sidebar-accent text-muted-foreground hover:text-primary transition-colors",
            collapsed && "absolute left-14 top-3 bg-sidebar border border-sidebar-border z-10"
          )}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-1">
        {navItems.map(({ path, code, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              "nav-link mx-1 my-px",
              isActive && "active"
            )}
          >
            <Icon size={12} />
            {!collapsed && (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-primary font-semibold">{code}</span>
                <span className="text-muted-foreground text-xxs truncate">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Sign Out */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {!collapsed && user && (
          <div className="px-2 py-1">
            <p className="text-xxs text-muted-foreground uppercase tracking-widest font-mono">USER</p>
            <p className="text-xs text-foreground truncate font-mono">{user.email?.split('@')[0]}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors font-mono uppercase tracking-wider",
            collapsed && "justify-center"
          )}
        >
          <LogOut size={12} />
          {!collapsed && <span className="text-xxs">LOGOUT</span>}
        </button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="px-2 py-1 border-t border-sidebar-border">
          <p className="text-xxs text-primary font-mono text-center tracking-widest">
            TERMINAL v2.0
          </p>
        </div>
      )}
    </aside>
  );
}