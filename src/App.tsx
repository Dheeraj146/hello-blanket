import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";

import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Threats from "./pages/Threats";
import Endpoints from "./pages/Endpoints";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import EmailMonitor from "./pages/EmailMonitor";
import NotFound from "./pages/NotFound";
import EmailMonitoringFeature from "./pages/features/EmailMonitoringFeature";
import ThreatDetectionFeature from "./pages/features/ThreatDetectionFeature";
import EndpointMonitoringFeature from "./pages/features/EndpointMonitoringFeature";
import ReportsAnalyticsFeature from "./pages/features/ReportsAnalyticsFeature";
import RoleBasedAccessFeature from "./pages/features/RoleBasedAccessFeature";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/features/email-monitoring" element={<EmailMonitoringFeature />} />
              <Route path="/features/threat-detection" element={<ThreatDetectionFeature />} />
              <Route path="/features/endpoint-monitoring" element={<EndpointMonitoringFeature />} />
              <Route path="/features/reports-analytics" element={<ReportsAnalyticsFeature />} />
              <Route path="/features/role-based-access" element={<RoleBasedAccessFeature />} />

              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/email-monitor" element={<EmailMonitor />} />
                <Route path="/threats" element={<Threats />} />
                <Route path="/endpoints" element={<Endpoints />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
