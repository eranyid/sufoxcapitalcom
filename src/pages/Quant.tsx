import { Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { QuantIcon } from "@/components/icons/QuantIcon";
import { Database } from "lucide-react";
import { cn } from "@/lib/utils";

const subNavItems = [
  { path: '/quant/data', label: 'Data', icon: Database },
];

export default function Quant() {
  const location = useLocation();
  const navigate = useNavigate();

  // If user lands on /quant exactly, redirect to /quant/data
  useEffect(() => {
    if (location.pathname === '/quant') {
      navigate('/quant/data', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <QuantIcon className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Quant</h1>
      </div>

      {/* Sub-navigation tabs */}
      <nav className="flex items-center gap-1 border-b border-border">
        {subNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Sub-page content */}
      <Outlet />
    </div>
  );
}
