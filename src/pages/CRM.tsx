import { Link } from 'react-router-dom';
import { CheckSquare, Building2, Landmark, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const hubItems = [
  {
    path: '/crm/tasks',
    icon: CheckSquare,
    title: 'Tasks',
    description: 'Manage operational tasks and personal workflow',
  },
  {
    path: '/crm/companies',
    icon: Building2,
    title: 'Potential Companies',
    description: 'Track and evaluate potential investment targets',
  },
  {
    path: '/crm/funds',
    icon: Landmark,
    title: 'Potential Funds',
    description: 'Monitor fund opportunities and due diligence pipeline',
  },
];

export default function CRM() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">CRM</h1>
        <p className="text-sm text-muted-foreground mt-1">Centralized management hub for tasks, companies, and funds</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hubItems.map(({ path, icon: Icon, title, description }) => (
          <Link key={path} to={path}>
            <Card className="h-full border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded bg-primary/10">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
