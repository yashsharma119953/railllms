import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import Dashboard from "./pages/Dashboard";
import DashboardSubPage from "./pages/DashboardSubPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/admins" element={<DashboardSubPage page="admins" />} />
            <Route path="/dashboard/users" element={<DashboardSubPage page="users" />} />
            <Route path="/dashboard/content" element={<DashboardSubPage page="content" />} />
            <Route path="/dashboard/exams" element={<DashboardSubPage page="exams" />} />
            <Route path="/dashboard/exams-page" element={<DashboardSubPage page="exams-page" />} />
            <Route path="/dashboard/learning" element={<DashboardSubPage page="learning" />} />
            <Route path="/dashboard/results" element={<DashboardSubPage page="results" />} />
            <Route path="/dashboard/reports" element={<DashboardSubPage page="reports" />} />
            <Route path="/dashboard/scheduling" element={<DashboardSubPage page="scheduling" />} />
            <Route path="/dashboard/profile" element={<DashboardSubPage page="profile" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
