import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PortfolioProvider } from "./context/PortfolioContext";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { lazy, Suspense } from "react";

// Lazy load pages
const Overview = lazy(() => import("./pages/Overview"));
const Performance = lazy(() => import("./pages/Performance"));
const Risk = lazy(() => import("./pages/Risk"));
const ScenarioLab = lazy(() => import("./pages/ScenarioLab"));
const XRay = lazy(() => import("./pages/XRay"));
const Management = lazy(() => import("./pages/Management"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Valuations = lazy(() => import("./pages/Valuations"));
const Settings = lazy(() => import("./pages/Settings"));
const InvestmentPolicy = lazy(() => import("./pages/InvestmentPolicy"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-muted-foreground text-sm font-mono">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PortfolioProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/" element={<Overview />} />
                    <Route path="/performance" element={<Performance />} />
                    <Route path="/risk" element={<Risk />} />
                    <Route path="/scenarios" element={<ScenarioLab />} />
                    <Route path="/xray" element={<XRay />} />
                    <Route path="/management" element={<Management />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/valuations" element={<Valuations />} />
                    <Route path="/policy" element={<InvestmentPolicy />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </PortfolioProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;