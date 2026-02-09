import { lazy, Suspense } from "react";
import { SessionProvider } from "./context/SessionContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { ScrollToTop } from "./components/ScrollToTop";
import { PortfolioProvider } from "./context/PortfolioContext";
import { FxModeProvider } from "./context/FxModeContext";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { BackOfficeLayout } from "./components/layout/BackOfficeLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardLoadingSkeleton, AuthLoadingSkeleton } from "./components/LoadingSkeleton";

// Lazy load pages for code splitting - reduces initial bundle size
const Overview = lazy(() => import("./pages/Overview"));
const Performance = lazy(() => import("./pages/Performance"));
const Risk = lazy(() => import("./pages/Risk"));
const ScenarioLab = lazy(() => import("./pages/ScenarioLab"));
const Construction = lazy(() => import("./pages/Construction"));
const AllocationBuilder = lazy(() => import("./pages/AllocationBuilder"));
const XRay = lazy(() => import("./pages/XRay"));
const Research = lazy(() => import("./pages/Research"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Valuations = lazy(() => import("./pages/Valuations"));
const Settings = lazy(() => import("./pages/Settings"));
const InvestmentPolicy = lazy(() => import("./pages/InvestmentPolicy"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AlpacaTest = lazy(() => import("./pages/AlpacaTest"));
const BackOfficeOverview = lazy(() => import("./pages/BackOfficeOverview"));
const BackOfficeIssues = lazy(() => import("./pages/BackOfficeTasks"));
const BackOfficeTimeline = lazy(() => import("./pages/BackOfficeTimeline"));
const Companies = lazy(() => import("./pages/Companies"));
const AnalysisLanding = lazy(() => import("./pages/AnalysisLanding"));
const CompanyPage = lazy(() => import("./pages/CompanyPage"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Reports = lazy(() => import("./pages/Reports"));
const ReportBuilder = lazy(() => import("./pages/ReportBuilder"));
const Trash = lazy(() => import("./pages/Trash"));
const Help = lazy(() => import("./pages/Help"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FXRates = lazy(() => import("./pages/FXRates"));
const Lab = lazy(() => import("./pages/Lab"));

const Calendar = lazy(() => import("./pages/Calendar"));
const Messages = lazy(() => import("./pages/Messages"));

 const Workspaces = lazy(() => import("./pages/Workspaces"));
 const WorkspaceDetail = lazy(() => import("./pages/WorkspaceDetail"));
const ContextSelector = lazy(() => import("./pages/ContextSelector"));

const Market = lazy(() => import("./pages/Market"));
const Test = lazy(() => import("./pages/Test"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SessionProvider>
            <PortfolioProvider>
              <FxModeProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ErrorBoundary>
                    <ScrollToTop />
              <Routes>
                {/* Context Selector - mandatory after auth */}
                <Route path="/context" element={
                  <ProtectedRoute>
                    <Suspense fallback={<AuthLoadingSkeleton />}>
                      <ContextSelector />
                    </Suspense>
                  </ProtectedRoute>
                } />
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
                  <Route path="/market" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Market />
                    </Suspense>
                  } />
                  <Route path="/analysis" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <AnalysisLanding />
                    </Suspense>
                  } />
                  <Route path="/analysis/all" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Companies />
                    </Suspense>
                  } />
                  <Route path="/analysis/:assetClass" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Companies />
                    </Suspense>
                  } />
                  <Route path="/analysis/company/:companyId" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <CompanyPage />
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
                  <Route path="/fx-rates" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <FXRates />
                    </Suspense>
                  } />
                  <Route path="/lab" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Lab />
                    </Suspense>
                  } />
                  <Route path="/charts" element={<Navigate to="/lab" replace />} />
                  <Route path="/calendar" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Calendar />
                    </Suspense>
                  } />
                  <Route path="/messages" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Messages />
                    </Suspense>
                  } />
                   <Route path="/workspaces" element={
                     <Suspense fallback={<DashboardLoadingSkeleton />}>
                       <Workspaces />
                     </Suspense>
                   } />
                   <Route path="/workspaces/:id" element={
                     <Suspense fallback={<DashboardLoadingSkeleton />}>
                       <WorkspaceDetail />
                     </Suspense>
                   } />
                  <Route path="/construction" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Construction />
                    </Suspense>
                  } />
                  <Route path="/construction/allocation" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <AllocationBuilder />
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
                  
                  {/* Back Office with nested routes */}
                  <Route path="/backoffice" element={<BackOfficeLayout />}>
                    <Route index element={
                      <Suspense fallback={<DashboardLoadingSkeleton />}>
                        <BackOfficeOverview />
                      </Suspense>
                    } />
                    <Route path="issues" element={
                      <Suspense fallback={<DashboardLoadingSkeleton />}>
                        <BackOfficeIssues />
                      </Suspense>
                    } />
                    <Route path="timeline" element={
                      <Suspense fallback={<DashboardLoadingSkeleton />}>
                        <BackOfficeTimeline />
                      </Suspense>
                    } />
                    <Route path="projects" element={
                      <Suspense fallback={<DashboardLoadingSkeleton />}>
                        <Projects />
                      </Suspense>
                    } />
                    <Route path="projects/:id" element={
                      <Suspense fallback={<DashboardLoadingSkeleton />}>
                        <ProjectDetail />
                      </Suspense>
                    } />
                  </Route>
                  
                  <Route path="/reports" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Reports />
                    </Suspense>
                  } />
                  <Route path="/reports/:id" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <ReportBuilder />
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
                  
                  {/* Legacy redirects */}
                  <Route path="/crm" element={<Navigate to="/backoffice" replace />} />
                  <Route path="/crm/*" element={<Navigate to="/backoffice" replace />} />
                  <Route path="/projects" element={<Navigate to="/backoffice/projects" replace />} />
                  <Route path="/projects/:id" element={<Navigate to="/backoffice/projects/:id" replace />} />
                  <Route path="/backoffice/company/:companyId" element={<Navigate to="/analysis/:companyId" replace />} />
                  <Route path="/companies" element={<Navigate to="/analysis" replace />} />
                  <Route path="/companies/:companyId" element={<Navigate to="/analysis/:companyId" replace />} />
                  <Route path="/backoffice/tasks" element={<Navigate to="/backoffice/issues" replace />} />
                  <Route path="/test" element={
                    <Suspense fallback={<DashboardLoadingSkeleton />}>
                      <Test />
                    </Suspense>
                  } />
                </Route>
                {/* Public pages - accessible without auth */}
                <Route path="/disclaimer" element={
                  <Suspense fallback={<AuthLoadingSkeleton />}>
                    <Disclaimer />
                  </Suspense>
                } />
                <Route path="/terms" element={
                  <Suspense fallback={<AuthLoadingSkeleton />}>
                    <Terms />
                  </Suspense>
                } />
                <Route path="/privacy" element={
                  <Suspense fallback={<AuthLoadingSkeleton />}>
                    <Privacy />
                  </Suspense>
                } />
                <Route path="*" element={
                  <Suspense fallback={<AuthLoadingSkeleton />}>
                    <NotFound />
                  </Suspense>
                } />
                    </Routes>
                  </ErrorBoundary>
                </BrowserRouter>
              </TooltipProvider>
              </FxModeProvider>
            </PortfolioProvider>
          </SessionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
