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

// Import all pages directly to avoid lazy loading issues in dev
import Overview from "./pages/Overview";
import Performance from "./pages/Performance";
import Risk from "./pages/Risk";
import ScenarioLab from "./pages/ScenarioLab";
import XRay from "./pages/XRay";
import Research from "./pages/Research";
import Transactions from "./pages/Transactions";
import Valuations from "./pages/Valuations";
import Settings from "./pages/Settings";
import InvestmentPolicy from "./pages/InvestmentPolicy";
import Auth from "./pages/Auth";
import AdminUsers from "./pages/AdminUsers";
import AlpacaTest from "./pages/AlpacaTest";
import NotFound from "./pages/NotFound";

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
                  <Route path="/research" element={<Research />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/valuations" element={<Valuations />} />
                  <Route path="/policy" element={<InvestmentPolicy />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/alpaca-test" element={<AlpacaTest />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </PortfolioProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;