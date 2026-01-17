import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { usePortfolio } from '@/context/PortfolioContext';
import { useDataWatchdog } from '@/hooks/useDataWatchdog';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Database } from 'lucide-react';
import { DataWatchdogStatus } from '@/components/dashboard/DataWatchdogStatus';
import { DataWatchdogPanel } from '@/components/dashboard/DataWatchdogPanel';
import { CommandBar } from '@/components/CommandBar';
import { OnlineStatusIndicator } from '@/components/OnlineStatusIndicator';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationsDrawer } from '@/components/notifications/NotificationsDrawer';
import { getUSMarketSession, getTASEMarketSession, getUSStatusColor, getTASEStatusColor, formatCountdown, TIMEZONE_ISRAEL } from '@/lib/marketSessionEngine';
import { formatInTimeZone } from 'date-fns-tz';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { sampleDataMode } = usePortfolio();
  const [watchdogPanelOpen, setWatchdogPanelOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { 
    validationResult, 
    isValidating, 
    runValidation, 
    status, 
    errorCount, 
    warningCount, 
    infoCount 
  } = useDataWatchdog();
  const { isOnline } = useOnlineStatus();
  const { 
    notifications, 
    unreadCount, 
    isLoading: notificationsLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // Update time every second
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get market sessions
  const usSession = getUSMarketSession(currentTime);
  const taseSession = getTASEMarketSession(currentTime);
  const usColor = getUSStatusColor(usSession.status as any);
  const taseColor = getTASEStatusColor(taseSession.status as any);
  const usCountdown = usSession.nextChange ? formatCountdown(usSession.nextChange, currentTime) : null;
  const taseCountdown = taseSession.nextChange ? formatCountdown(taseSession.nextChange, currentTime) : null;

  // Check if session change is within 5 minutes (300000ms)
  const usChangingSoon = usSession.nextChange && (usSession.nextChange.getTime() - currentTime.getTime()) <= 300000;
  const taseChangingSoon = taseSession.nextChange && (taseSession.nextChange.getTime() - currentTime.getTime()) <= 300000;

  const getStatusDotColor = (color: 'success' | 'warning' | 'muted') => {
    switch (color) {
      case 'success': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'muted': return 'bg-muted-foreground';
    }
  };

  const renderMarketTooltip = (market: 'US' | 'TASE') => {
    const session = market === 'US' ? usSession : taseSession;
    const countdown = market === 'US' ? usCountdown : taseCountdown;
    return (
      <div className="space-y-1 text-xs">
        <div className="font-medium">{market === 'US' ? 'NYSE/Nasdaq' : 'Tel Aviv Stock Exchange'}</div>
        <div className="text-muted-foreground">
          Exchange Time: {session.exchangeTime} {session.exchangeTimezone}
        </div>
        <div className="text-muted-foreground">
          Local Time: {formatInTimeZone(currentTime, TIMEZONE_ISRAEL, 'HH:mm:ss')} IST
        </div>
        {session.nextChange && session.nextStatus && (
          <div className="text-muted-foreground">
            Next: {session.nextStatus} in {countdown}
          </div>
        )}
        {session.holidayName && (
          <div className="text-amber-400">📅 {session.holidayName}</div>
        )}
      </div>
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.task_id) {
      // Navigate to Back Office with task context
      navigate('/backoffice', { state: { openTaskId: notification.task_id } });
      setNotificationsOpen(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen min-h-dvh w-full bg-background overflow-x-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header - visible only on mobile */}
        <div className="md:hidden">
          <MobileHeader 
            status={status}
            errorCount={errorCount}
            warningCount={warningCount}
            onWatchdogClick={() => setWatchdogPanelOpen(true)}
            isOnline={isOnline}
            unreadNotifications={unreadCount}
            onNotificationsClick={() => setNotificationsOpen(true)}
          />
        </div>

        {/* Desktop Top status bar - hidden on mobile */}
        <div className="hidden md:flex bg-secondary border-b border-border px-4 py-1 items-center justify-between text-[10px]">
          <div className="flex items-center gap-4">
            <span className="text-primary font-semibold tracking-wider">SUFOX CAPITAL</span>
            <span className="text-muted-foreground">Portfolio & Risk Analytics</span>
            {sampleDataMode && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 border border-primary/50 text-primary font-semibold rounded animate-pulse">
                <Database className="h-3 w-3" />
                SAMPLE DATA
              </span>
            )}
            <DataWatchdogStatus
              status={status}
              errorCount={errorCount}
              warningCount={warningCount}
              onClick={() => setWatchdogPanelOpen(true)}
            />
            <OnlineStatusIndicator isOnline={isOnline} />
            <NotificationBell 
              unreadCount={unreadCount} 
              onClick={() => setNotificationsOpen(true)} 
            />
          </div>
          <div className="flex items-center gap-4 font-mono text-muted-foreground">
            <kbd className="text-[9px] px-1.5 py-0.5 bg-muted rounded border border-border/50 hidden lg:inline-block">
              ⌘K
            </kbd>
            <span>USD</span>
            <span className="text-foreground font-semibold">{currentTime.toLocaleDateString('en-GB')}</span>
            <span className="text-primary font-bold">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 bg-muted/50 border rounded text-[9px] cursor-pointer hover:bg-muted/70 transition-colors ${usChangingSoon ? 'border-amber-500/50' : 'border-border/50'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(usColor)} ${usChangingSoon ? 'animate-pulse' : ''}`} />
                      <span className="text-muted-foreground">US {usSession.status}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    {renderMarketTooltip('US')}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 bg-muted/50 border rounded text-[9px] cursor-pointer hover:bg-muted/70 transition-colors ${taseChangingSoon ? 'border-amber-500/50' : 'border-border/50'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(taseColor)} ${taseChangingSoon ? 'animate-pulse' : ''}`} />
                      <span className="text-muted-foreground">TASE {taseSession.status}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    {renderMarketTooltip('TASE')}
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-3 md:p-4 pb-20 md:pb-4 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
      
      <DataWatchdogPanel
        open={watchdogPanelOpen}
        onOpenChange={setWatchdogPanelOpen}
        validationResult={validationResult}
        isValidating={isValidating}
        onRunValidation={runValidation}
        errorCount={errorCount}
        warningCount={warningCount}
        infoCount={infoCount}
      />

      {/* Global Command Bar */}
      <CommandBar 
        onOpenActivityLog={() => {
          navigate('/backoffice', { state: { openActivityLog: true } });
        }} 
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onNotificationClick={handleNotificationClick}
        isLoading={notificationsLoading}
      />
    </div>
  );
}