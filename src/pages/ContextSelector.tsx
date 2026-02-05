 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useSession, SystemType } from '@/context/SessionContext';
 import { useAuth } from '@/hooks/useAuth';
 import { Client } from '@/hooks/useClients';
 import { PersonalPanel } from '@/components/context/PersonalPanel';
 import { ClientsPanel } from '@/components/context/ClientsPanel';
 import { SystemTypeModal } from '@/components/context/SystemTypeModal';
 import { DottedGridBackground } from '@/components/DottedGridBackground';
 import sufoxLogo from '@/assets/sufox-logo-new.png';
 
 export default function ContextSelector() {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { setPersonalContext, setClientContext } = useSession();
   
   const [selectedClient, setSelectedClient] = useState<Client | null>(null);
   const [showSystemTypeModal, setShowSystemTypeModal] = useState(false);
 
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
       // Navigate to workspaces for this client - they can create/select a workspace there
       navigate('/workspaces');
     } else {
       // Navigate to main terminal with client context
       navigate('/');
     }
   };
 
   return (
     <div className="min-h-screen bg-background relative">
       <DottedGridBackground />
       
       <div className="relative z-10 min-h-screen flex flex-col">
         {/* Header */}
         <header className="flex items-center justify-between p-6 border-b border-border/50">
           <div className="flex items-center gap-3">
             <img src={sufoxLogo} alt="SUFOX Capital" className="h-8" />
           </div>
           <div className="text-sm text-muted-foreground">
             Operating as <span className="text-foreground font-medium">{user?.email}</span>
           </div>
         </header>
 
         {/* Main Content */}
         <main className="flex-1 flex flex-col items-center justify-center p-6">
           <div className="w-full max-w-5xl">
             {/* Title */}
             <div className="text-center mb-10">
               <h1 className="text-3xl font-semibold text-foreground mb-2">
                 Select Operating Context
               </h1>
               <p className="text-muted-foreground">
                 Choose how you want to work in the platform. All data remains unified across contexts.
               </p>
             </div>
 
             {/* Two Panels */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[480px]">
               <PersonalPanel onEnter={handleEnterPersonal} />
               <ClientsPanel onSelectClient={handleSelectClient} />
             </div>
 
             {/* Footer Note */}
             <p className="text-center text-xs text-muted-foreground mt-8">
               Using your global data library. Context selection controls operating scope, not data access.
             </p>
           </div>
         </main>
       </div>
 
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