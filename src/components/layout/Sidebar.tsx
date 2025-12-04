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
  { path: '/', code: 'OVRV', icon: LayoutDashboard },
  { path: '/performance', code: 'PERF', icon: TrendingUp },
  { path: '/risk', code: 'RISK', icon: Shield },
  { path: '/scenarios', code: 'SCN', icon: FlaskConical },
  { path: '/xray', code: 'XRAY', icon: Scan },
  { path: '/transactions', code: 'TXN', icon: ArrowRightLeft },
  { path: '/valuations', code: 'VAL', icon: Calendar },
  { path: '/management', code: 'MGMT', icon: Briefcase },
  { path: '/settings', code: 'SET', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <aside 
      className={cn(
        "h-screen flex flex-col transition-all duration-150",
        collapsed ? "w-14" : "w-40"
      )}
      style={{ backgroundColor: '#000000', borderRight: '1px solid #1E1E1E' }}
    >
      {/* Bloomberg gradient bar */}
      <div className="bloomberg-gradient-bar" />
      
      {/* Logo */}
      <div 
        className={cn(
          "px-2 py-2 flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}
        style={{ borderBottom: '1px solid #1E1E1E' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={sufoxLogo} alt="SUFOX Capital" className="h-6 w-6 object-contain" />
            <div>
              <h1 className="text-xs font-semibold tracking-widest font-mono" style={{ color: '#00FFFF' }}>SUFOX</h1>
              <p className="text-xxs font-mono tracking-widest" style={{ color: '#D0D0D0' }}>CAPITAL</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src={sufoxLogo} alt="SUFOX" className="h-5 w-5 object-contain" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1 transition-colors",
            collapsed && "absolute left-14 top-3 z-10"
          )}
          style={{ 
            color: '#D0D0D0',
            backgroundColor: collapsed ? '#000000' : 'transparent',
            border: collapsed ? '1px solid #1E1E1E' : 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#F4D03F'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#D0D0D0'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-1">
        {navItems.map(({ path, code, icon: Icon }) => (
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
              <span className="font-semibold">{code}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Sign Out */}
      <div className="p-2 space-y-1" style={{ borderTop: '1px solid #1E1E1E' }}>
        {!collapsed && user && (
          <div className="px-2 py-1">
            <p className="text-xxs uppercase tracking-widest font-mono" style={{ color: '#D0D0D0' }}>USER</p>
            <p className="text-xs truncate font-mono" style={{ color: '#FFFFFF' }}>{user.email?.split('@')[0]}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1 text-xs font-mono uppercase tracking-wider transition-colors",
            collapsed && "justify-center"
          )}
          style={{ color: '#D0D0D0' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FF4D4D';
            e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#D0D0D0';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={12} />
          {!collapsed && <span className="text-xxs">LOGOUT</span>}
        </button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="px-2 py-1" style={{ borderTop: '1px solid #1E1E1E' }}>
          <p className="text-xxs font-mono text-center tracking-widest" style={{ color: '#00FFFF' }}>
            TERMINAL v2.0
          </p>
        </div>
      )}
    </aside>
  );
}