import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CheckSquare, Activity, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/backoffice/timeline', label: 'Timeline', icon: Activity },
  { path: '/backoffice', label: 'Issues', icon: CheckSquare, exact: true },
  { path: '/backoffice/projects', label: 'Projects', icon: FolderKanban },
];

export function BackOfficeLayout() {
  const location = useLocation();
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  // Page transition effect
  useEffect(() => {
    setIsPageTransitioning(true);
    const timer = setTimeout(() => {
      setIsPageTransitioning(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Check if current path is a project detail page
  const isProjectDetail = location.pathname.match(/^\/backoffice\/projects\/[^/]+$/);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto pb-px -mb-px scrollbar-hide">
          {tabs.map(({ path, label, icon: Icon, exact }) => {
            // Determine if this tab is active
            const isActive = exact 
              ? location.pathname === path
              : location.pathname.startsWith(path);

            return (
              <NavLink
                key={path}
                to={path}
                end={exact}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Tab Content with transition */}
      <div 
        className={`transition-all duration-200 ease-out ${
          isPageTransitioning 
            ? 'opacity-0 translate-y-2' 
            : 'opacity-100 translate-y-0'
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}
