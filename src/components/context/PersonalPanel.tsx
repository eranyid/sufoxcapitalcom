 import { User, ArrowRight } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 
 interface PersonalPanelProps {
   onEnter: () => void;
 }
 
 export function PersonalPanel({ onEnter }: PersonalPanelProps) {
   return (
     <Card className="h-full flex flex-col border-border/50 bg-card/80 backdrop-blur-sm">
       <CardHeader className="flex-shrink-0 space-y-4 pb-6">
         <div className="flex items-center gap-3">
           <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
             <User className="h-6 w-6 text-primary" />
           </div>
           <CardTitle className="text-2xl font-semibold">Personal Account</CardTitle>
         </div>
         <CardDescription className="text-base text-muted-foreground leading-relaxed">
           Use the full system for personal research, modeling, and portfolio construction.
           Access all engines and tools within your personal operating context.
         </CardDescription>
       </CardHeader>
       
       <CardContent className="flex-1 flex flex-col justify-between">
         <div className="space-y-4">
           <div className="grid gap-3">
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <div className="w-1.5 h-1.5 rounded-full bg-primary" />
               <span>Full terminal access</span>
             </div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <div className="w-1.5 h-1.5 rounded-full bg-primary" />
               <span>Portfolio construction & analysis</span>
             </div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <div className="w-1.5 h-1.5 rounded-full bg-primary" />
               <span>Research & modeling tools</span>
             </div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <div className="w-1.5 h-1.5 rounded-full bg-primary" />
               <span>Scenarios & optimization</span>
             </div>
           </div>
         </div>
         
         <Button 
           onClick={onEnter} 
           size="lg" 
           className="w-full mt-8 gap-2"
         >
           Enter Personal Terminal
           <ArrowRight className="h-4 w-4" />
         </Button>
       </CardContent>
     </Card>
   );
 }