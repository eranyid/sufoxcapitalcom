import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PortfolioProvider } from "./context/PortfolioContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Overview from "./pages/Overview";
import Performance from "./pages/Performance";
import Risk from "./pages/Risk";
import XRay from "./pages/XRay";
import Management from "./pages/Management";
import Transactions from "./pages/Transactions";
import Valuations from "./pages/Valuations";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PortfolioProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Overview />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/risk" element={<Risk />} />
              <Route path="/xray" element={<XRay />} />
              <Route path="/management" element={<Management />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/valuations" element={<Valuations />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </PortfolioProvider>
  </QueryClientProvider>
);

export default App;
