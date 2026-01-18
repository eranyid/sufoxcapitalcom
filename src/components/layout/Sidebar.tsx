import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Shield, ArrowRightLeft, Calendar, Settings, ChevronLeft, ChevronRight, Scan, LogOut, Layers, FileCheck, Users, FlaskConical, Building2, HelpCircle, FileText, Banknote, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import sufoxLogo from '@/assets/sufox-logo.png';
import { LabIcon } from '@/components/icons/LabIcon';

const navItems = [{
  path: '/',
  icon: LayoutDashboard,
  label: 'OVERVIEW'
}, {
  path: '/performance',
  icon: TrendingUp,
  label: 'PERFORMANCE'
}, {
  path: '/risk',
  icon: Shield,
  label: 'RISK'
}, {
  path: '/scenarios',
  icon: Layers,
  label: 'SCENARIOS'
}, {
  path: '/xray',
  icon: Scan,
  label: 'X-RAY'
}, {
  path: '/research',
  icon: FlaskConical,
  label: 'RESEARCH'
}, {
  path: '/transactions',
  icon: ArrowRightLeft,
  label: 'TRANSACTIONS'
}, {
  path: '/valuations',
  icon: Calendar,
  label: 'VALUATIONS'
}, {
  path: '/fx-rates',
  icon: Banknote,
  label: 'FX RATES'
}, {
  path: '/policy',
  icon: FileCheck,
  label: 'POLICY'
}, {
  path: '/reports',
  icon: FileText,
  label: 'REPORTS'
}, {
  path: '/charts',
  icon: BarChart3,
  label: 'CHARTS'
}, {
  path: '/lab',
  icon: LabIcon,
  label: 'LAB'
}, {
  path: '/backoffice',
  icon: Building2,
  label: 'BACK OFFICE'
}, {
  path: '/settings',
  icon: Settings,
  label: 'SETTINGS'
}, {
  path: '/help',
  icon: HelpCircle,
  label: 'HELP'
}];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    user,
    signOut,
    isAdmin
  } = useAuth();
  return <aside className={cn("h-screen bg-sidebar flex flex-col transition-all duration-200 hidden md:flex", collapsed ? "w-12" : "w-56")}>
      {/* Bloomberg gradient bar */}
      <div className="bloomberg-gradient-bar" />
      
      {/* Logo */}
      <div className={cn("px-4 py-6 border-b border-sidebar-border flex items-center justify-center", collapsed && "justify-center")}>
        {!collapsed && <div className="flex items-center justify-center w-full">
            <img alt="SUFOX Capital" className="h-20 w-20 object-contain" src="/lovable-uploads/02339762-cdfe-438f-8e95-2f033c67710b.png" />
            
          </div>}
        {collapsed && <img alt="SUFOX" className="h-6 w-6 object-contain" src="/lovable-uploads/1e09c6ce-0760-4af9-bce3-47cfd7593a82.png" />}
        <button onClick={() => setCollapsed(!collapsed)} className={cn("p-1 hover:bg-sidebar-accent text-muted-foreground hover:text-primary transition-colors", collapsed && "absolute left-12 top-4 bg-sidebar border border-sidebar-border z-10")}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({
        path,
        icon: Icon,
        label
      }) => <NavLink key={path} to={path} className={({
        isActive
      }) => cn("nav-link mx-1", isActive && "active")}>
            <Icon size={14} />
            {!collapsed && <span className="text-[11px] tracking-wide">{label}</span>}
          </NavLink>)}
        
        {/* Admin Link - only visible to admin */}
        {isAdmin && <NavLink to="/admin/users" className={({
        isActive
      }) => cn("nav-link mx-1 mt-2 border-t border-sidebar-border pt-2", isActive && "active")}>
            <Users size={14} />
            {!collapsed && <span className="text-[11px] tracking-wide text-primary">ADMIN</span>}
          </NavLink>}
      </nav>

      {/* User & Sign Out */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {!collapsed && user && <div className="px-2 py-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signed in as</p>
            <p className="text-xs text-foreground truncate font-mono">{user.email}</p>
          </div>}
        <button onClick={signOut} className={cn("w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded", collapsed && "justify-center")}>
          <LogOut size={14} />
          {!collapsed && <span className="text-[11px] tracking-wide">SIGN OUT</span>}
        </button>
      </div>

      {/* Footer */}
      {!collapsed && <div className="px-2 py-2 border-t border-sidebar-border">
          <p className="text-[9px] text-primary font-mono text-center tracking-widest">
            TERMINAL v1.0
          </p>
          <p className="text-[8px] text-muted-foreground font-mono text-center mt-0.5">
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}
          </p>
        </div>}
    </aside>;
}
