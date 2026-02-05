 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useSession, SystemType } from '@/context/SessionContext';
 import { useAuth } from '@/hooks/useAuth';
 import { Client } from '@/hooks/useClients';
 import { SystemTypeModal } from '@/components/context/SystemTypeModal';
 import { ClientsManagementModal } from '@/components/context/ClientsManagementModal';
 import { User, Building2, ArrowRight } from 'lucide-react';
 import sufoxLogo from '@/assets/sufox-logo-new.png';
 
 export default function ContextSelector() {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { setPersonalContext, setClientContext } = useSession();
   
   const [selectedClient, setSelectedClient] = useState<Client | null>(null);
   const [showSystemTypeModal, setShowSystemTypeModal] = useState(false);
   const [showClientsModal, setShowClientsModal] = useState(false);
 
   const handleEnterPersonal = () => {
     setPersonalContext();
     navigate('/');
   };
 
   const handleSelectClient = (client: Client) => {
     setSelectedClient(client);
     setShowSystemTypeModal(true);
   };
 
   const handleSelectSystemType = (systemType: SystemType) => {
     if (!selectedClient) return;
     
     setClientContext(selectedClient.id, selectedClient.name, systemType);
     setShowSystemTypeModal(false);
     
     if (systemType === 'client_portfolio') {
       navigate('/workspaces');
     } else {
       navigate('/');
     }
   };
 
   return (
     <div className="min-h-screen bg-background relative overflow-hidden">
       {/* Animated background effects */}
       <div className="absolute inset-0 pointer-events-none">
         {/* Radial gradient from center */}
         <div 
           className="absolute inset-0"
           style={{
             background: 'radial-gradient(circle at 50% 35%, hsl(var(--primary) / 0.08) 0%, transparent 50%)',
           }}
         />
         {/* Subtle grid */}
         <div 
           className="absolute inset-0 opacity-30"
           style={{
             background: 'radial-gradient(circle, hsl(var(--foreground) / 0.04) 1px, transparent 1px)',
             backgroundSize: '24px 24px',
           }}
         />
         {/* Animated orbital rings */}
         <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2">
           <div 
             className="w-[500px] h-[500px] rounded-full border border-primary/10 animate-[spin_60s_linear_infinite]"
           />
         </div>
         <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2">
           <div 
             className="w-[650px] h-[650px] rounded-full border border-accent/5 animate-[spin_90s_linear_infinite_reverse]"
           />
         </div>
       </div>
 
       <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
         {/* User indicator - top right */}
         <div className="absolute top-6 right-6 text-sm text-muted-foreground animate-fade-in">
           <span className="text-foreground/60">{user?.email}</span>
         </div>
 
         {/* Central Hub */}
         <div className="flex flex-col items-center">
           {/* Centered Logo with glow */}
           <div className="relative mb-8 animate-scale-in">
             {/* Glow effect */}
             <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />
             <div className="absolute inset-0 blur-xl bg-primary/10 rounded-full scale-125" />
             
             {/* Logo container */}
             <div className="relative p-6 rounded-full bg-gradient-to-br from-card/80 to-card/40 border border-border/50 backdrop-blur-xl shadow-2xl">
               <img 
                 src={sufoxLogo} 
                 alt="SUFOX Capital" 
                 className="h-20 w-20 object-contain drop-shadow-lg"
               />
             </div>
             
             {/* Pulsing ring */}
             <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '3s' }} />
           </div>
 
           {/* Title */}
           <div className="text-center mb-12 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
             <h1 className="text-2xl font-light text-foreground tracking-wide mb-2">
               Select Context
             </h1>
             <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
           </div>
 
           {/* Semi-circular context cards */}
           <div className="relative flex items-center justify-center gap-8 md:gap-16">
             {/* Personal Account - Left Arc Position */}
             <button
               onClick={handleEnterPersonal}
               className="group relative animate-fade-in"
               style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
             >
               {/* Card glow on hover */}
               <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               
               <div className="relative flex flex-col items-center p-8 rounded-2xl bg-gradient-to-br from-card/60 to-card/30 border border-border/30 backdrop-blur-xl hover:border-primary/50 hover:from-card/80 hover:to-card/50 transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                 {/* Icon with orbital effect */}
                 <div className="relative mb-4">
                   <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 group-hover:border-primary/50 transition-colors">
                     <User className="h-8 w-8 text-primary" />
                   </div>
                 </div>
                 
                 <h2 className="text-lg font-medium text-foreground mb-1">Personal</h2>
                 <p className="text-xs text-muted-foreground mb-4 max-w-[140px] text-center">
                   Your portfolio & research
                 </p>
                 
                 <div className="flex items-center gap-1.5 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                   <span>Enter</span>
                   <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                 </div>
               </div>
             </button>
 
             {/* Decorative center line */}
             <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-border/50 to-transparent" />
 
             {/* Clients - Right Arc Position */}
             <button
               onClick={() => setShowClientsModal(true)}
               className="group relative animate-fade-in"
               style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
             >
               {/* Card glow on hover */}
               <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               
               <div className="relative flex flex-col items-center p-8 rounded-2xl bg-gradient-to-br from-card/60 to-card/30 border border-border/30 backdrop-blur-xl hover:border-accent/50 hover:from-card/80 hover:to-card/50 transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                 {/* Icon with orbital effect */}
                 <div className="relative mb-4">
                   <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   <div className="relative p-4 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 group-hover:border-accent/50 transition-colors">
                     <Building2 className="h-8 w-8 text-accent" />
                   </div>
                 </div>
                 
                 <h2 className="text-lg font-medium text-foreground mb-1">Clients</h2>
                 <p className="text-xs text-muted-foreground mb-4 max-w-[140px] text-center">
                   Manage client portfolios
                 </p>
                 
                 <div className="flex items-center gap-1.5 text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                   <span>Manage</span>
                   <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                 </div>
               </div>
             </button>
           </div>
 
           {/* Footer Note */}
           <p className="text-center text-[10px] text-muted-foreground/50 mt-12 tracking-wide uppercase animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
             Context-scoped data isolation
           </p>
         </div>
       </div>
 
       {/* Clients Management Modal */}
       <ClientsManagementModal
         open={showClientsModal}
         onOpenChange={setShowClientsModal}
         onSelectClient={handleSelectClient}
       />
 
       {/* System Type Modal */}
       <SystemTypeModal
         open={showSystemTypeModal}
         onOpenChange={setShowSystemTypeModal}
         client={selectedClient}
         onSelectType={handleSelectSystemType}
       />
     </div>
   );
 }