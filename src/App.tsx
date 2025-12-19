import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { PortfolioProvider } from "./context/PortfolioContext";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardLoadingSkeleton, AuthLoadingSkeleton } from "./components/LoadingSkeleton";

// Lazy load pages for code splitting - reduces initial bundle size
const Overview = lazy(() => import("./pages/Overview"));
const Performance = lazy(() => import("./pages/Performance"));
const Risk = lazy(() => import("./pages/Risk"));
const ScenarioLab = lazy(() => import("./pages/ScenarioLab"));
const XRay = lazy(() => import("./pages/XRay"));
const Research = lazy(() => import("./pages/Research"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Valuations = lazy(() => import("./pages/Valuations"));
const Settings = lazy(() => import("./pages/Settings"));
const InvestmentPolicy = lazy(() => import("./pages/InvestmentPolicy"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AlpacaTest = lazy(() => import("./pages/AlpacaTest"));
const CRM = lazy(() => import("./pages/CRM"));
const CRMProject = lazy(() => import("./pages/CRMProject"));
const Trash = lazy(() => import("./pages/Trash"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PortfolioProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <ScrollToTop />
              <Routes>
                <Route path="/auth" element={
                  <Suspense fallback={<AuthLoadingSkeleton />}>
                    <Auth />
                  </Suspense>
                } />
                <Route element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Overview />
                    </Suspense>
                  } />
                  <Route path="/overview" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Overview />
                    </Suspense>
                  } />
                  <Route path="/performance" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Performance />
                    </Suspense>
                  } />
                  <Route path="/risk" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Risk />
                    </Suspense>
                  } />
                  <Route path="/scenarios" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <ScenarioLab />
                    </Suspense>
                  } />
                  <Route path="/xray" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <XRay />
                    </Suspense>
                  } />
                  <Route path="/research" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Research />
                    </Suspense>
                  } />
                  <Route path="/transactions" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Transactions />
                    </Suspense>
                  } />
                  <Route path="/valuations" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Valuations />
                    </Suspense>
                  } />
                  <Route path="/policy" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <InvestmentPolicy />
                    </Suspense>
                  } />
                  <Route path="/settings" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Settings />
                    </Suspense>
                  } />
                  <Route path="/admin/users" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <AdminUsers />
                    </Suspense>
                  } />
                  <Route path="/alpaca-test" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <AlpacaTest />
                    </Suspense>
                  } />
                  <Route path="/crm" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <CRM />
                    </Suspense>
                  } />
                  <Route path="/crm/projects/:projectId" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <CRMProject />
                    </Suspense>
                  } />
                  <Route path="/trash" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Trash />
                    </Suspense>
                  } />
                  <Route path="/help" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Help />
                    </Suspense>
                  } />
                </Route>
                <Route path="*" element={
                  <Suspense fallback={<AuthLoadingSkeleton />}>
                    <NotFound />
                  </Suspense>
                } />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </PortfolioProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
