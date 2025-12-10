import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Schedule from "./pages/Schedule";
import Financial from "./pages/Financial";
import Onboarding from "./pages/Onboarding";
import Reports from "./pages/Reports";
import StudentRegistration from "./pages/StudentRegistration";
import ScheduleReadOnly from "./pages/ScheduleReadOnly";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter basename="/admin-certificacoes">
          <Routes>
            {/* Login público */}
            <Route path="/login" element={<Login />} />

            {/* Rotas Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AppLayout><Dashboard /></AppLayout>} path="/" />
              <Route element={<AppLayout><Students /></AppLayout>} path="/students" />
              <Route element={<AppLayout><Schedule /></AppLayout>} path="/schedule" />
              <Route element={<AppLayout><Financial /></AppLayout>} path="/financial" />
              <Route element={<AppLayout><Reports /></AppLayout>} path="/reports" />
            </Route>

            {/* Rotas Admin e CX */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'cx']} />}>
              <Route element={<AppLayout><Onboarding /></AppLayout>} path="/onboarding" />
            </Route>

            {/* Rotas Comercial e CX */}
            <Route element={<ProtectedRoute allowedRoles={['comercial', 'cx']} />}>
              <Route element={<AppLayout><ScheduleReadOnly /></AppLayout>} path="/turmas" />
            </Route>

            {/* Rotas Apenas Comercial */}
            <Route element={<ProtectedRoute allowedRoles={['comercial']} />}>
              <Route element={<AppLayout><StudentRegistration /></AppLayout>} path="/cadastro" />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
