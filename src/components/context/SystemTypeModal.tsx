 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Monitor, Layers, ArrowRight } from 'lucide-react';
 import { Client } from '@/hooks/useClients';
 import { SystemType } from '@/context/SessionContext';
 
 interface SystemTypeModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   client: Client | null;
   onSelectType: (type: SystemType) => void;
 }
 
 export function SystemTypeModal({ open, onOpenChange, client, onSelectType }: SystemTypeModalProps) {
   if (!client) return null;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-2xl">
         <DialogHeader>
           <DialogTitle className="text-xl">
             Choose System Type for <span className="text-primary">{client.name}</span>
           </DialogTitle>
           <DialogDescription>
             Select how you want to operate within this client's context.
           </DialogDescription>
         </DialogHeader>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
           <SystemTypeCard
             icon={Monitor}
             title="Terminal"
             description="Full platform access with all modules enabled. Same experience as the main terminal with client context and governance applied."
             features={[
               'All modules enabled',
               'Full analytics suite',
               'Research & modeling',
               'Governance + audit ON',
             ]}
             onSelect={() => onSelectType('terminal')}
           />
           
           <SystemTypeCard
             icon={Layers}
             title="Client Portfolio"
             description="Focused workspace for portfolio construction pipeline. Expected return, optimization, and scenarios with clean client-facing flow."
             features={[
               'Portfolio construction',
               'Expected return engine',
               'Optimization tools',
               'Scenario testing',
             ]}
             onSelect={() => onSelectType('client_portfolio')}
             accent
           />
         </div>
       </DialogContent>
     </Dialog>
   );
 }
 
 interface SystemTypeCardProps {
   icon: React.ElementType;
   title: string;
   description: string;
   features: string[];
   onSelect: () => void;
   accent?: boolean;
 }
 
 function SystemTypeCard({ icon: Icon, title, description, features, onSelect, accent }: SystemTypeCardProps) {
   return (
     <Card className={`flex flex-col border-border/50 hover:border-border transition-colors ${accent ? 'bg-accent/5' : 'bg-card/80'}`}>
       <CardHeader className="pb-3">
         <div className="flex items-center gap-2">
           <div className={`p-2 rounded-lg ${accent ? 'bg-accent/10 border-accent/20' : 'bg-primary/10 border-primary/20'} border`}>
             <Icon className={`h-5 w-5 ${accent ? 'text-accent' : 'text-primary'}`} />
           </div>
           <CardTitle className="text-lg">{title}</CardTitle>
         </div>
         <CardDescription className="text-sm leading-relaxed">
           {description}
         </CardDescription>
       </CardHeader>
       <CardContent className="flex-1 flex flex-col justify-between pt-0">
         <div className="space-y-2 mb-4">
           {features.map((feature, i) => (
             <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
               <div className={`w-1 h-1 rounded-full ${accent ? 'bg-accent' : 'bg-primary'}`} />
               <span>{feature}</span>
             </div>
           ))}
         </div>
         <Button onClick={onSelect} variant={accent ? 'default' : 'outline'} className="w-full gap-2">
           Enter {title === 'Terminal' ? 'Client Terminal' : 'Workspace'}
           <ArrowRight className="h-4 w-4" />
         </Button>
       </CardContent>
     </Card>
   );
 }