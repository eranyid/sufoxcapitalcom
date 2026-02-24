import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { QuantIcon } from "@/components/icons/QuantIcon";
import { Database, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const subModules = [
  {
    path: '/quant/data',
    label: 'Data',
    icon: Database,
    description: 'Market data ingestion, stock universe, session monitoring, and data governance.',
  },
];

export default function Quant() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/quant';

  if (!isLanding) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quant')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <QuantIcon className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Quant</h1>
          </button>
          <span className="text-muted-foreground text-2xl font-light">/</span>
          <span className="text-2xl font-semibold text-muted-foreground">
            {subModules.find(m => location.pathname.startsWith(m.path))?.label}
          </span>
        </div>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <QuantIcon className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Quant</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card
              key={mod.path}
              className="group cursor-pointer border-border/50 hover:border-primary/50 transition-colors bg-card/80"
              onClick={() => navigate(mod.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-lg mt-3">{mod.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {mod.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
