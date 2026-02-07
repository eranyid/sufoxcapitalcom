import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { 
   ChevronLeft, ChevronRight, LogOut, Users, HelpCircle, ArrowLeftRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AnalysisIcon } from '@/components/icons/AnalysisIcon';
import { BackOfficeIcon } from '@/components/icons/BackOfficeIcon';
import { CalendarIcon } from '@/components/icons/CalendarIcon';
import { XRayIcon } from '@/components/icons/XRayIcon';
import { TransactionsIcon } from '@/components/icons/TransactionsIcon';
import { SettingsIcon } from '@/components/icons/SettingsIcon';
import { PerformanceIcon } from '@/components/icons/PerformanceIcon';
import { ChartsIcon } from '@/components/icons/ChartsIcon';
import { FxRatesIcon } from '@/components/icons/FxRatesIcon';
import { ValuationsIcon } from '@/components/icons/ValuationsIcon';
import { RiskIcon } from '@/components/icons/RiskIcon';
import { OverviewIcon } from '@/components/icons/OverviewIcon';
import { PolicyIcon } from '@/components/icons/PolicyIcon';
import { ScenariosIcon } from '@/components/icons/ScenariosIcon';
import { ReportsIcon } from '@/components/icons/ReportsIcon';
import { ConstructionIcon } from '@/components/icons/ConstructionIcon';
import { ResearchIcon } from '@/components/icons/ResearchIcon';
import { LabIcon } from '@/components/icons/LabIcon';
import { MessagesIcon } from '@/components/icons/MessagesIcon';
 import { WorkspacesIcon } from '@/components/icons/WorkspacesIcon';
import { LucideIcon } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface NavItem {
  path: string;
  icon: LucideIcon | typeof LabIcon | typeof AnalysisIcon | typeof BackOfficeIcon | typeof CalendarIcon | typeof XRayIcon | typeof TransactionsIcon | typeof SettingsIcon | typeof PerformanceIcon | typeof ChartsIcon | typeof FxRatesIcon | typeof ValuationsIcon | typeof RiskIcon | typeof OverviewIcon | typeof PolicyIcon | typeof ScenariosIcon | typeof ReportsIcon | typeof ConstructionIcon | typeof ResearchIcon;
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
      { path: '/', icon: OverviewIcon, label: 'Overview' },
      { path: '/performance', icon: PerformanceIcon, label: 'Performance' },
      { path: '/risk', icon: RiskIcon, label: 'Risk' },
      { path: '/xray', icon: XRayIcon, label: 'X-Ray' },
    ],
  },
  {
    title: 'RESEARCH',
    items: [
      { path: '/research', icon: ResearchIcon, label: 'Research' },
      
      { path: '/analysis', icon: AnalysisIcon, label: 'Analysis' },
      { path: '/construction', icon: ConstructionIcon, label: 'Construction' },
       { path: '/workspaces', icon: WorkspacesIcon, label: 'Workspaces' },
      { path: '/lab', icon: LabIcon, label: 'Lab' },
       
      { path: '/charts', icon: ChartsIcon, label: 'Charts' },
      { path: '/scenarios', icon: ScenariosIcon, label: 'Scenarios' },
    ],
  },
  {
    title: 'DATA',
    items: [
      { path: '/transactions', icon: TransactionsIcon, label: 'Transactions' },
      { path: '/valuations', icon: ValuationsIcon, label: 'Valuations' },
      { path: '/market', icon: PerformanceIcon, label: 'Market' },
      { path: '/fx-rates', icon: FxRatesIcon, label: 'FX Rates' },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { path: '/messages', icon: MessagesIcon, label: 'Messages' },
      { path: '/backoffice', icon: BackOfficeIcon, label: 'Back Office' },
      { path: '/calendar', icon: CalendarIcon, label: 'Calendar' },
      { path: '/reports', icon: ReportsIcon, label: 'Reports' },
      { path: '/policy', icon: PolicyIcon, label: 'Policy' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { path: '/settings', icon: SettingsIcon, label: 'Settings' },
      { path: '/help', icon: HelpCircle, label: 'Help' },
    ],
  },
];

function NavGroupSection({ 
  group, 
  collapsed,
  isFirst,
  unreadMessages,
}: { 
  group: NavGroup; 
  collapsed: boolean;
  isFirst: boolean;
  unreadMessages?: boolean;
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
                  "relative flex items-center justify-center h-8 w-8 mx-auto rounded-md transition-all duration-200",
                  "hover:bg-primary/10 hover:text-primary",
                  isActive && "bg-primary/15 text-primary shadow-sm shadow-primary/20"
                )
              }
            >
              <Icon size={14} />
              {path === '/messages' && unreadMessages && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-success rounded-full border border-sidebar" />
              )}
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
            {path === '/messages' && unreadMessages && (
              <span className="ml-auto w-2 h-2 bg-success rounded-full animate-pulse" />
            )}
          </NavLink>
        ))}
      </div>
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const { clearContext } = useSession();
  const navigate = useNavigate();
  const hasUnread = useUnreadMessages();
  
  const handleSwitchContext = () => {
    clearContext();
    navigate('/context');
  };

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
                collapsed ? "h-8 w-8" : "h-10 w-10"
              )}
              src="/lovable-uploads/sufox-logo-new.png"
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
          <NavGroupSection key={group.title} group={group} collapsed={collapsed} isFirst={index === 0} unreadMessages={hasUnread} />
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
          onClick={handleSwitchContext}
          className={cn(
             "w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-primary",
             "hover:bg-primary/10 transition-all duration-200 rounded-md font-medium border border-transparent hover:border-primary/30",
            collapsed && "justify-center px-0"
          )}
        >
           <ArrowLeftRight size={12} />
          {!collapsed && <span>Switch Context</span>}
        </button>
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
