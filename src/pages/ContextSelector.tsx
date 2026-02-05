 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useSession, SystemType } from '@/context/SessionContext';
 import { useAuth } from '@/hooks/useAuth';
 import { Client } from '@/hooks/useClients';
 import { SystemTypeModal } from '@/components/context/SystemTypeModal';
 import { ClientsManagementModal } from '@/components/context/ClientsManagementModal';
 import { User, Briefcase, ChevronRight } from 'lucide-react';
 import sufoxLogo from '@/assets/sufox-logo-new.png';
 import { useIsMobile } from '@/hooks/use-mobile';
 
 export default function ContextSelector() {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { setPersonalContext, setClientContext } = useSession();
   const isMobile = useIsMobile();
   
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
     <div className="min-h-screen bg-[#0a0a0c] relative overflow-hidden flex items-center justify-center">
       {/* Deep background gradient */}
       <div 
         className="absolute inset-0"
         style={{
           background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(30, 58, 95, 0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 50%, rgba(180, 140, 60, 0.08) 0%, transparent 50%)',
         }}
       />
 
       {/* Subtle dot pattern */}
       <div 
         className="absolute inset-0 opacity-[0.03]"
         style={{
           backgroundImage: 'radial-gradient(circle, hsl(40, 60%, 70%) 0.5px, transparent 0.5px)',
           backgroundSize: '32px 32px',
         }}
       />
 
       {/* User email - top right, minimal */}
       <div 
         className="absolute top-6 right-6 md:top-8 md:right-8 text-[10px] md:text-[11px] tracking-wide text-white/30 animate-fade-in max-w-[200px] truncate"
         style={{ animationDelay: '0.8s', animationFillMode: 'backwards' }}
       >
         {user?.email}
       </div>
 
       {/* Main orbital composition - vertical on mobile, horizontal on desktop */}
       <div className="relative flex flex-col md:flex-row items-center justify-center px-6 md:px-0">
         
         {/* Orbital rings - centered on logo position */}
         <div className="absolute flex items-center justify-center pointer-events-none" style={{ top: isMobile ? '0' : '50%', left: '50%', transform: isMobile ? 'translateX(-50%)' : 'translate(-50%, -50%)' }}>
           {/* Innermost glow */}
           <div 
             className="absolute w-[160px] h-[160px] md:w-[220px] md:h-[220px] rounded-full"
             style={{
               background: 'radial-gradient(circle, rgba(180, 140, 60, 0.12) 0%, transparent 70%)',
               animation: 'pulse 4s ease-in-out infinite',
             }}
           />
           
           {/* Ring 1 - closest to logo */}
           <div 
             className="absolute w-[200px] h-[200px] md:w-[280px] md:h-[280px] rounded-full border border-[rgba(180,140,60,0.15)]"
             style={{ animation: 'spin 80s linear infinite' }}
           />
           
           {/* Ring 2 */}
           <div 
             className="absolute w-[280px] h-[280px] md:w-[400px] md:h-[400px] rounded-full border border-[rgba(60,100,160,0.1)]"
             style={{ animation: 'spin 120s linear infinite reverse' }}
           />
           
           {/* Ring 3 - outermost */}
           <div 
             className="absolute w-[380px] h-[380px] md:w-[540px] md:h-[540px] rounded-full border border-[rgba(180,140,60,0.06)]"
             style={{ animation: 'spin 180s linear infinite' }}
           />
           
           {/* Ambient outer glow */}
           <div 
             className="absolute w-[420px] h-[420px] md:w-[620px] md:h-[620px] rounded-full"
             style={{
               background: 'radial-gradient(circle, rgba(60,100,160,0.05) 0%, transparent 60%)',
             }}
           />
         </div>
 
         {/* Central Logo - the visual anchor */}
         <div 
           className="relative z-20 animate-scale-in mb-10 md:mb-0"
           style={{ animationDuration: '0.6s' }}
         >
           {/* Breathing glow behind logo */}
           <div 
             className="absolute inset-0 blur-2xl rounded-full scale-150"
             style={{
               background: 'radial-gradient(circle, rgba(180, 140, 60, 0.25) 0%, transparent 70%)',
               animation: 'pulse 6s ease-in-out infinite',
             }}
           />
           
           {/* Logo container */}
           <div className="relative p-5 md:p-7 rounded-full bg-gradient-to-br from-[rgba(30,30,35,0.9)] to-[rgba(20,20,25,0.8)] border border-[rgba(180,140,60,0.25)] backdrop-blur-xl shadow-[0_0_60px_rgba(180,140,60,0.15)]">
             <img 
               src={sufoxLogo} 
               alt="SUFOX Capital" 
               className="h-14 w-14 md:h-20 md:w-20 object-contain"
               style={{ filter: 'drop-shadow(0 0 8px rgba(180, 140, 60, 0.3))' }}
             />
           </div>
         </div>
 
         {/* Cards container - stacked on mobile, absolute on desktop */}
         <div className="flex flex-col md:contents gap-4 w-full md:w-auto max-w-[320px] md:max-w-none">
         
         {/* Personal Account Card */}
         <button
           onClick={handleEnterPersonal}
           className="group md:absolute z-10 animate-fade-in w-full md:w-auto"
           style={{ 
             left: isMobile ? undefined : '-380px',
             animationDelay: '0.3s', 
             animationFillMode: 'backwards',
           }}
         >
           {/* Hover glow */}
           <div 
             className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
             style={{
               background: 'radial-gradient(ellipse at 80% 50%, rgba(180, 140, 60, 0.2) 0%, transparent 60%)',
               filter: 'blur(20px)',
             }}
           />
           
           {/* Card with curved inner edge */}
           <div 
             className="relative flex items-center gap-4 md:gap-6 px-6 md:px-10 py-5 md:py-7 backdrop-blur-xl border border-[rgba(180,140,60,0.15)] group-hover:border-[rgba(180,140,60,0.35)] transition-all duration-500 md:group-hover:-translate-x-2 group-hover:shadow-[0_0_40px_rgba(180,140,60,0.1)]"
             style={{
               background: 'linear-gradient(135deg, rgba(25,25,30,0.85) 0%, rgba(20,20,25,0.75) 100%)',
               borderRadius: isMobile ? '20px' : '24px 100px 100px 24px',
               minWidth: isMobile ? undefined : '280px',
             }}
           >
             {/* Icon */}
             <div className="relative flex-shrink-0">
               <div 
                 className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                 style={{
                   background: 'radial-gradient(circle, rgba(180, 140, 60, 0.3) 0%, transparent 70%)',
                   filter: 'blur(12px)',
                   transform: 'scale(2)',
                 }}
               />
               <div className="relative p-4 rounded-full bg-gradient-to-br from-[rgba(180,140,60,0.2)] to-[rgba(180,140,60,0.05)] border border-[rgba(180,140,60,0.25)] group-hover:border-[rgba(180,140,60,0.45)] transition-colors duration-500">
                 <User className="h-5 w-5 md:h-7 md:w-7 text-[#c4a54d]" />
               </div>
             </div>
             
             {/* Text */}
             <div className="flex-1 text-left">
               <h2 className="text-base md:text-lg font-medium text-white/90 tracking-wide mb-0.5 md:mb-1">Personal</h2>
               <p className="text-[11px] md:text-xs text-white/40 tracking-wide">Your portfolio & research</p>
             </div>
             
             {/* Arrow indicator */}
             <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-[#c4a54d]/50 group-hover:text-[#c4a54d] group-hover:translate-x-1 transition-all duration-300" />
           </div>
         </button>
 
         {/* Clients Card */}
         <button
           onClick={() => setShowClientsModal(true)}
           className="group md:absolute z-10 animate-fade-in w-full md:w-auto"
           style={{ 
             right: isMobile ? undefined : '-380px',
             animationDelay: '0.4s', 
             animationFillMode: 'backwards',
           }}
         >
           {/* Hover glow */}
           <div 
             className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
             style={{
               background: 'radial-gradient(ellipse at 20% 50%, rgba(60, 120, 180, 0.2) 0%, transparent 60%)',
               filter: 'blur(20px)',
             }}
           />
           
           {/* Card with curved inner edge (mirrored) */}
           <div 
             className="relative flex items-center gap-4 md:gap-6 px-6 md:px-10 py-5 md:py-7 backdrop-blur-xl border border-[rgba(60,120,180,0.15)] group-hover:border-[rgba(60,120,180,0.35)] transition-all duration-500 md:group-hover:translate-x-2 group-hover:shadow-[0_0_40px_rgba(60,120,180,0.1)]"
             style={{
               background: 'linear-gradient(225deg, rgba(25,25,30,0.85) 0%, rgba(20,20,25,0.75) 100%)',
               borderRadius: isMobile ? '20px' : '100px 24px 24px 100px',
               minWidth: isMobile ? undefined : '280px',
             }}
           >
             {/* Arrow indicator (on left for symmetry - desktop only) */}
             {!isMobile && <ChevronRight className="h-5 w-5 text-[#5a9bd4]/50 group-hover:text-[#5a9bd4] group-hover:-translate-x-1 transition-all duration-300 rotate-180" />}
             
             {/* Icon - shown first on mobile */}
             {isMobile && (
               <div className="relative flex-shrink-0">
                 <div 
                   className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{
                     background: 'radial-gradient(circle, rgba(60, 120, 180, 0.3) 0%, transparent 70%)',
                     filter: 'blur(12px)',
                     transform: 'scale(2)',
                   }}
                 />
                 <div className="relative p-4 rounded-full bg-gradient-to-br from-[rgba(60,120,180,0.2)] to-[rgba(60,120,180,0.05)] border border-[rgba(60,120,180,0.25)] group-hover:border-[rgba(60,120,180,0.45)] transition-colors duration-500">
                   <Briefcase className="h-5 w-5 text-[#5a9bd4]" />
                 </div>
               </div>
             )}
             
             {/* Text */}
             <div className={`flex-1 ${isMobile ? 'text-left' : 'text-right'}`}>
               <h2 className="text-base md:text-lg font-medium text-white/90 tracking-wide mb-0.5 md:mb-1">Clients</h2>
               <p className="text-[11px] md:text-xs text-white/40 tracking-wide">Manage client portfolios</p>
             </div>
             
             {/* Icon - shown last on desktop */}
             {!isMobile && (
               <div className="relative flex-shrink-0">
                 <div 
                   className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{
                     background: 'radial-gradient(circle, rgba(60, 120, 180, 0.3) 0%, transparent 70%)',
                     filter: 'blur(12px)',
                     transform: 'scale(2)',
                   }}
                 />
                 <div className="relative p-4 rounded-full bg-gradient-to-br from-[rgba(60,120,180,0.2)] to-[rgba(60,120,180,0.05)] border border-[rgba(60,120,180,0.25)] group-hover:border-[rgba(60,120,180,0.45)] transition-colors duration-500">
                   <Briefcase className="h-7 w-7 text-[#5a9bd4]" />
                 </div>
               </div>
             )}
             
             {/* Arrow indicator - mobile */}
             {isMobile && <ChevronRight className="h-4 w-4 text-[#5a9bd4]/50 group-hover:text-[#5a9bd4] group-hover:translate-x-1 transition-all duration-300" />}
           </div>
         </button>
         
         </div>
       </div>

       {/* Footer caption */}
       <p 
         className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-white/20 animate-fade-in"
         style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}
       >
         Context-scoped data isolation
       </p>

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