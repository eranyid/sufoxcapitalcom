import { useState } from 'react';
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

  const handleNotificationClick = (notification: Notification) => {
    if (notification.task_id) {
      // Navigate to CRM with task context
      navigate('/crm', { state: { openTaskId: notification.task_id } });
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
            <span>{new Date().toLocaleDateString()}</span>
            <span className="text-primary">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
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
          navigate('/crm', { state: { openActivityLog: true } });
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