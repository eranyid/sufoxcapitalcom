 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Separator } from '@/components/ui/separator';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { Save, GitBranch, Clock, User, FileText, CheckCircle2 } from 'lucide-react';
 import { format } from 'date-fns';
 
 interface VersionsStageProps {
   workspaceId: string;
   onComplete: () => void;
 }
 
 // Mock version history for demo
 const MOCK_VERSIONS = [
   { version: 1, created_at: new Date().toISOString(), created_by: 'System', summary: 'Initial workspace creation', status: 'draft' },
 ];
 
 const MOCK_AUDIT = [
   { id: '1', action: 'create', stage: 'workspace', timestamp: new Date().toISOString(), user: 'User', details: 'Created workspace' },
 ];
 
 export function VersionsStage({ workspaceId, onComplete }: VersionsStageProps) {
   const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
 
   return (
     <div className="space-y-6 p-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold">Version History & Audit Trail</h2>
           <p className="text-muted-foreground mt-1">
             Track all changes with full traceability. Compare versions and roll back if needed.
           </p>
         </div>
         <Button onClick={onComplete}>
           <CheckCircle2 className="h-4 w-4 mr-2" />
           Complete Workspace
         </Button>
       </div>
 
       <div className="grid grid-cols-2 gap-6">
         {/* Version History */}
         <Card>
           <CardHeader className="pb-3">
             <div className="flex items-center gap-2">
               <GitBranch className="h-5 w-5 text-primary" />
               <CardTitle className="text-lg">Version History</CardTitle>
             </div>
             <CardDescription>All saved versions of this workspace</CardDescription>
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="w-[60px]">Version</TableHead>
                   <TableHead>Summary</TableHead>
                   <TableHead className="w-[100px]">Status</TableHead>
                   <TableHead className="w-[140px]">Date</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {MOCK_VERSIONS.map((v) => (
                   <TableRow 
                     key={v.version}
                     className={`cursor-pointer ${selectedVersion === v.version ? 'bg-muted' : ''}`}
                     onClick={() => setSelectedVersion(v.version)}
                   >
                     <TableCell className="font-mono font-medium">v{v.version}</TableCell>
                     <TableCell>{v.summary}</TableCell>
                     <TableCell>
                       <Badge variant="outline">{v.status}</Badge>
                     </TableCell>
                     <TableCell className="text-muted-foreground text-sm">
                       {format(new Date(v.created_at), 'MMM d, HH:mm')}
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
             
             {MOCK_VERSIONS.length === 1 && (
               <div className="text-center py-8 text-muted-foreground text-sm">
                 <p>Only one version exists. New versions are created when you save changes.</p>
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* Audit Trail */}
         <Card>
           <CardHeader className="pb-3">
             <div className="flex items-center gap-2">
               <Clock className="h-5 w-5 text-primary" />
               <CardTitle className="text-lg">Audit Trail</CardTitle>
             </div>
             <CardDescription>Detailed log of all actions</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {MOCK_AUDIT.map((entry) => (
                 <div 
                   key={entry.id}
                   className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                 >
                   <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                     <User className="h-4 w-4 text-primary" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <span className="font-medium">{entry.user}</span>
                       <Badge variant="secondary" className="text-xs">{entry.action}</Badge>
                       <Badge variant="outline" className="text-xs">{entry.stage}</Badge>
                     </div>
                     <p className="text-sm text-muted-foreground mt-0.5">{entry.details}</p>
                     <p className="text-xs text-muted-foreground mt-1">
                       {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm:ss')}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       </div>
 
       <Separator />
 
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-lg">Create New Version</CardTitle>
           <CardDescription>Save current state as a new version with a summary</CardDescription>
         </CardHeader>
         <CardContent>
           <div className="flex gap-4">
             <input
               type="text"
               placeholder="Version summary (e.g., 'Added PE allocation per client request')"
               className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
             />
             <Button className="gap-2">
               <Save className="h-4 w-4" />
               Save Version
             </Button>
           </div>
         </CardContent>
       </Card>
 
       <div className="flex justify-end">
         <Button onClick={onComplete} size="lg" className="gap-2">
           <CheckCircle2 className="h-4 w-4" />
           Complete Workspace
         </Button>
       </div>
     </div>
   );
 }