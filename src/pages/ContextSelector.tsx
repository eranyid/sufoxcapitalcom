 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useSession, SystemType } from '@/context/SessionContext';
 import { useAuth } from '@/hooks/useAuth';
 import { Client } from '@/hooks/useClients';
 import { SystemTypeModal } from '@/components/context/SystemTypeModal';
 import { ClientsManagementModal } from '@/components/context/ClientsManagementModal';
 import { ChevronRight } from 'lucide-react';
 import ProfileIcon from '@/assets/profile-icon.svg';
 import PeopleIcon from '@/assets/people-icon.svg';
 import MonitorIcon from '@/assets/monitor-icon.svg';
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
     <div className="min-h-screen bg-[#0a0a0c] relative overflow-hidden flex items-center justify-center">
       {/* Animated flowing wave gradient */}
       <div 
         className="absolute inset-0 opacity-30"
         style={{
           background: 'linear-gradient(45deg, transparent 0%, rgba(30, 58, 95, 0.15) 25%, rgba(180, 140, 60, 0.1) 50%, rgba(30, 58, 95, 0.15) 75%, transparent 100%)',
           backgroundSize: '400% 400%',
           animation: 'waveFlow 15s ease-in-out infinite',
         }}
       />
       
       {/* Secondary wave layer for depth */}
       <div 
         className="absolute inset-0 opacity-20"
         style={{
           background: 'linear-gradient(-45deg, transparent 0%, rgba(180, 140, 60, 0.08) 30%, rgba(60, 100, 160, 0.12) 60%, transparent 100%)',
           backgroundSize: '300% 300%',
           animation: 'waveFlow 20s ease-in-out infinite reverse',
         }}
       />

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
         className="absolute top-4 right-4 md:top-8 md:right-8 text-[10px] md:text-[11px] tracking-wide text-white/30 animate-fade-in max-w-[200px] truncate hidden md:block"
         style={{ animationDelay: '0.8s', animationFillMode: 'backwards' }}
       >
         {user?.email}
       </div>
 
       {/* Title - top center */}
       <div 
         className="absolute top-4 left-1/2 -translate-x-1/2 md:top-8 animate-fade-in z-10"
         style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
       >
         <h1 className="text-xs md:text-base tracking-[0.2em] md:tracking-[0.3em] uppercase text-white/50 font-light whitespace-nowrap">
           SUFOX <span className="text-white/30">Terminal</span>
         </h1>
       </div>

       {/* Tagline with monitor icon - top left */}
       <div 
         className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 animate-fade-in hidden md:flex"
         style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
       >
         <img 
           src={MonitorIcon} 
           alt="" 
           className="h-4 w-4 md:h-5 md:w-5 opacity-40"
           style={{ filter: 'brightness(0) invert(1)' }}
         />
         <span className="text-[10px] md:text-xs tracking-[0.15em] uppercase text-white/40 font-light">
           Precision is non-negotiable
         </span>
       </div>

        {/* === MOBILE LAYOUT === */}
        <div className="flex flex-col items-center gap-6 md:hidden w-full max-w-[320px] px-6 relative z-10">
          {/* Personal Card */}
          <button
            onClick={handleEnterPersonal}
            className="group w-full animate-fade-in"
            style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
          >
            <div 
              className="relative flex items-center gap-4 px-6 py-5 backdrop-blur-xl border border-[rgba(180,140,60,0.15)] group-active:border-[rgba(180,140,60,0.35)] transition-all duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(25,25,30,0.85) 0%, rgba(20,20,25,0.75) 100%)',
                borderRadius: '20px',
              }}
            >
              <div className="relative flex-shrink-0">
                <div className="relative p-4 rounded-full bg-gradient-to-br from-[rgba(180,140,60,0.2)] to-[rgba(180,140,60,0.05)] border border-[rgba(180,140,60,0.25)]">
                  <img src={ProfileIcon} alt="" className="h-5 w-5" style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(30%) saturate(600%) hue-rotate(10deg) brightness(95%)' }} />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-base font-medium text-white/90 tracking-wide mb-0.5">Personal</h2>
                <p className="text-[11px] text-white/40 tracking-wide">Your portfolio & research</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#c4a54d]/50" />
            </div>
          </button>

          {/* Logo */}
          <div className="relative animate-scale-in my-2" style={{ animationDuration: '0.6s' }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-[140px] h-[140px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(180, 140, 60, 0.12) 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />
              <div className="absolute w-[140px] h-[140px] rounded-full border border-[rgba(180,140,60,0.15)]" style={{ animation: 'spin 80s linear infinite' }} />
              <div className="absolute w-[200px] h-[200px] rounded-full border border-[rgba(60,100,160,0.1)]" style={{ animation: 'spin 120s linear infinite reverse' }} />
            </div>
            <div className="absolute inset-0 blur-2xl rounded-full scale-150 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(180, 140, 60, 0.25) 0%, transparent 70%)', animation: 'pulse 6s ease-in-out infinite' }} />
            <div className="relative p-5 rounded-full bg-gradient-to-br from-[rgba(30,30,35,0.9)] to-[rgba(20,20,25,0.8)] border border-[rgba(180,140,60,0.25)] backdrop-blur-xl shadow-[0_0_60px_rgba(180,140,60,0.15)]">
              <img src={sufoxLogo} alt="SUFOX Capital" className="h-16 w-16 object-contain" style={{ filter: 'drop-shadow(0 0 8px rgba(180, 140, 60, 0.3))' }} />
            </div>
          </div>

          {/* Clients Card */}
          <button
            onClick={() => setShowClientsModal(true)}
            className="group w-full animate-fade-in"
            style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
          >
            <div 
              className="relative flex items-center gap-4 px-6 py-5 backdrop-blur-xl border border-[rgba(60,120,180,0.15)] group-active:border-[rgba(60,120,180,0.35)] transition-all duration-500"
              style={{
                background: 'linear-gradient(225deg, rgba(25,25,30,0.85) 0%, rgba(20,20,25,0.75) 100%)',
                borderRadius: '20px',
              }}
            >
              <div className="relative flex-shrink-0">
                <div className="relative p-4 rounded-full bg-gradient-to-br from-[rgba(60,120,180,0.2)] to-[rgba(60,120,180,0.05)] border border-[rgba(60,120,180,0.25)]">
                  <img src={PeopleIcon} alt="" className="h-5 w-5" style={{ filter: 'brightness(0) saturate(100%) invert(60%) sepia(50%) saturate(400%) hue-rotate(175deg) brightness(95%)' }} />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-base font-medium text-white/90 tracking-wide mb-0.5">Clients</h2>
                <p className="text-[11px] text-white/40 tracking-wide">Manage client portfolios</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#5a9bd4]/50" />
            </div>
          </button>
        </div>

        {/* === DESKTOP LAYOUT === */}
        <div className="hidden md:flex md:flex-row items-center justify-center relative">
          {/* Central Logo with orbital rings */}
          <div className="relative z-20 animate-scale-in flex items-center justify-center" style={{ animationDuration: '0.6s' }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-[220px] h-[220px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(180, 140, 60, 0.12) 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />
              <div className="absolute w-[280px] h-[280px] rounded-full border border-[rgba(180,140,60,0.15)]" style={{ animation: 'spin 80s linear infinite' }} />
              <div className="absolute w-[400px] h-[400px] rounded-full border border-[rgba(60,100,160,0.1)]" style={{ animation: 'spin 120s linear infinite reverse' }} />
              <div className="absolute w-[540px] h-[540px] rounded-full border border-[rgba(180,140,60,0.06)]" style={{ animation: 'spin 180s linear infinite' }} />
              <div className="absolute w-[620px] h-[620px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(60,100,160,0.05) 0%, transparent 60%)' }} />
            </div>
            <div className="absolute inset-0 blur-2xl rounded-full scale-150" style={{ background: 'radial-gradient(circle, rgba(180, 140, 60, 0.25) 0%, transparent 70%)', animation: 'pulse 6s ease-in-out infinite' }} />
            <div className="relative p-7 rounded-full bg-gradient-to-br from-[rgba(30,30,35,0.9)] to-[rgba(20,20,25,0.8)] border border-[rgba(180,140,60,0.25)] backdrop-blur-xl shadow-[0_0_60px_rgba(180,140,60,0.15)]">
              <img src={sufoxLogo} alt="SUFOX Capital" className="h-20 w-20 object-contain" style={{ filter: 'drop-shadow(0 0 8px rgba(180, 140, 60, 0.3))' }} />
            </div>
          </div>

          {/* Personal Account Card - Left */}
          <button
            onClick={handleEnterPersonal}
            className="group absolute z-10 animate-fade-in"
            style={{ left: '-380px', animationDelay: '0.3s', animationFillMode: 'backwards' }}
          >
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(180, 140, 60, 0.2) 0%, transparent 60%)', filter: 'blur(20px)' }} />
            <div 
              className="relative flex items-center gap-6 px-10 py-7 backdrop-blur-xl border border-[rgba(180,140,60,0.15)] group-hover:border-[rgba(180,140,60,0.35)] transition-all duration-500 group-hover:-translate-x-2 group-hover:shadow-[0_0_40px_rgba(180,140,60,0.1)]"
              style={{ background: 'linear-gradient(135deg, rgba(25,25,30,0.85) 0%, rgba(20,20,25,0.75) 100%)', borderRadius: '24px 100px 100px 24px', minWidth: '280px' }}
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle, rgba(180, 140, 60, 0.3) 0%, transparent 70%)', filter: 'blur(12px)', transform: 'scale(2)' }} />
                <div className="relative p-4 rounded-full bg-gradient-to-br from-[rgba(180,140,60,0.2)] to-[rgba(180,140,60,0.05)] border border-[rgba(180,140,60,0.25)] group-hover:border-[rgba(180,140,60,0.45)] transition-colors duration-500">
                  <img src={ProfileIcon} alt="" className="h-7 w-7" style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(30%) saturate(600%) hue-rotate(10deg) brightness(95%)' }} />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-lg font-medium text-white/90 tracking-wide mb-1">Personal</h2>
                <p className="text-xs text-white/40 tracking-wide">Your portfolio & research</p>
              </div>
              <ChevronRight className="h-5 w-5 text-[#c4a54d]/50 group-hover:text-[#c4a54d] group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>

          {/* Clients Card - Right */}
          <button
            onClick={() => setShowClientsModal(true)}
            className="group absolute z-10 animate-fade-in"
            style={{ right: '-380px', animationDelay: '0.4s', animationFillMode: 'backwards' }}
          >
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(60, 120, 180, 0.2) 0%, transparent 60%)', filter: 'blur(20px)' }} />
            <div 
              className="relative flex items-center gap-6 px-10 py-7 backdrop-blur-xl border border-[rgba(60,120,180,0.15)] group-hover:border-[rgba(60,120,180,0.35)] transition-all duration-500 group-hover:translate-x-2 group-hover:shadow-[0_0_40px_rgba(60,120,180,0.1)]"
              style={{ background: 'linear-gradient(225deg, rgba(25,25,30,0.85) 0%, rgba(20,20,25,0.75) 100%)', borderRadius: '100px 24px 24px 100px', minWidth: '280px' }}
            >
              <ChevronRight className="h-5 w-5 text-[#5a9bd4]/50 group-hover:text-[#5a9bd4] group-hover:-translate-x-1 transition-all duration-300 rotate-180" />
              <div className="flex-1 text-right">
                <h2 className="text-lg font-medium text-white/90 tracking-wide mb-1">Clients</h2>
                <p className="text-xs text-white/40 tracking-wide">Manage client portfolios</p>
              </div>
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle, rgba(60, 120, 180, 0.3) 0%, transparent 70%)', filter: 'blur(12px)', transform: 'scale(2)' }} />
                <div className="relative p-4 rounded-full bg-gradient-to-br from-[rgba(60,120,180,0.2)] to-[rgba(60,120,180,0.05)] border border-[rgba(60,120,180,0.25)] group-hover:border-[rgba(60,120,180,0.45)] transition-colors duration-500">
                  <img src={PeopleIcon} alt="" className="h-7 w-7" style={{ filter: 'brightness(0) saturate(100%) invert(60%) sepia(50%) saturate(400%) hue-rotate(175deg) brightness(95%)' }} />
                </div>
              </div>
            </div>
          </button>
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