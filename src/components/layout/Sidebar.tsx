import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, TrendingUp, Shield, ArrowRightLeft, Calendar, Settings, 
  ChevronLeft, ChevronRight, Scan, LogOut, Layers, FileCheck, Users, 
  FlaskConical, Building2, HelpCircle, FileText, Banknote, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LabIcon } from '@/components/icons/LabIcon';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  icon: LucideIcon | typeof LabIcon;
  label: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'ANALYTICS',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Overview' },
      { path: '/performance', icon: TrendingUp, label: 'Performance' },
      { path: '/risk', icon: Shield, label: 'Risk' },
      { path: '/xray', icon: Scan, label: 'X-Ray' },
    ],
  },
  {
    title: 'RESEARCH',
    items: [
      { path: '/research', icon: FlaskConical, label: 'Research' },
      { path: '/lab', icon: LabIcon, label: 'Lab' },
      { path: '/charts', icon: BarChart3, label: 'Charts' },
      { path: '/scenarios', icon: Layers, label: 'Scenarios' },
    ],
  },
  {
    title: 'DATA',
    items: [
      { path: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
      { path: '/valuations', icon: Calendar, label: 'Valuations' },
      { path: '/fx-rates', icon: Banknote, label: 'FX Rates' },
    ],
  },
  {
    title: 'REPORTING',
    items: [
      { path: '/reports', icon: FileText, label: 'Reports' },
      { path: '/policy', icon: FileCheck, label: 'Policy' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { path: '/backoffice', icon: Building2, label: 'Back Office' },
      { path: '/settings', icon: Settings, label: 'Settings' },
      { path: '/help', icon: HelpCircle, label: 'Help' },
    ],
  },
];

function NavGroupSection({ 
  group, 
  collapsed,
  isFirst
}: { 
  group: NavGroup; 
  collapsed: boolean;
  isFirst: boolean;
}) {
  if (collapsed) {
    return (
      <>
        {!isFirst && <div className="mx-2 my-1.5 border-t border-sidebar-border/30" />}
        <div className="py-0.5 space-y-0.5">
          {group.items.map(({ path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center h-8 w-8 mx-auto rounded-md transition-all duration-200",
                  "hover:bg-primary/10 hover:text-primary",
                  isActive && "bg-primary/15 text-primary shadow-sm shadow-primary/20"
                )
              }
            >
              <Icon size={14} />
            </NavLink>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {!isFirst && <div className="mx-3 my-1.5 border-t border-sidebar-border/30" />}
      <div className="space-y-0.5 py-0.5">
        {group.items.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 mx-1.5 px-2.5 py-2 rounded-md text-[11px] font-medium tracking-wide transition-all duration-200",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                isActive && "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border-l-2 border-primary shadow-sm"
              )
            }
          >
            <Icon size={14} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut, isAdmin } = useAuth();

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar flex flex-col transition-all duration-300 hidden md:flex relative",
        "border-r border-sidebar-border/50",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

      {/* Logo */}
      <div
        className={cn(
          "px-2 py-2 border-b border-sidebar-border/50 flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div className="relative">
            <img
              alt="SUFOX"
              className={cn(
                "object-contain transition-all duration-300",
                collapsed ? "h-6 w-6" : "h-8 w-8"
              )}
              src="/lovable-uploads/1e09c6ce-0760-4af9-bce3-47cfd7593a82.png"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-sidebar animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-tight text-foreground">SUFOX</span>
              <span className="text-[8px] text-muted-foreground font-mono tracking-widest">CAPITAL</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-primary transition-all duration-200",
            collapsed && "absolute -right-3 top-4 bg-sidebar border border-sidebar-border shadow-lg z-10 rounded-full"
          )}
        >
          {collapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/30">
        {navGroups.map((group, index) => (
          <NavGroupSection key={group.title} group={group} collapsed={collapsed} isFirst={index === 0} />
        ))}

        {/* Admin Link */}
        {isAdmin && (
          <div className="pt-1 mt-1 border-t border-sidebar-border/50">
            {collapsed ? (
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-center h-7 w-7 mx-auto rounded-md transition-all duration-200",
                    "hover:bg-primary/10 text-primary",
                    isActive && "bg-primary/15 shadow-sm shadow-primary/20"
                  )
                }
              >
                <Users size={14} />
              </NavLink>
            ) : (
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 mx-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium tracking-wide transition-all duration-200",
                    "text-primary hover:bg-primary/10",
                    isActive && "bg-primary/15 border-l-2 border-primary"
                  )
                }
              >
                <Users size={13} className="shrink-0" />
                <span>Admin</span>
              </NavLink>
            )}
          </div>
        )}
      </nav>

      {/* User & Sign Out */}
      <div className="border-t border-sidebar-border/50 p-2 space-y-1 bg-gradient-to-t from-muted/5 to-transparent">
        {!collapsed && user && (
          <div className="px-1 py-0.5">
            <p className="text-[8px] text-muted-foreground/60 uppercase tracking-widest">Signed in</p>
            <p className="text-[10px] text-foreground truncate font-mono">{user.email}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-destructive",
            "hover:bg-destructive/10 transition-all duration-200 rounded-md font-medium",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={12} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="px-2 py-1.5 border-t border-sidebar-border/30 bg-muted/5">
          <div className="flex items-center justify-between text-[8px] text-muted-foreground/50 font-mono">
            <span className="tracking-widest">v1.0</span>
            <span>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
