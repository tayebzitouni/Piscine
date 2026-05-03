import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Associations from "./pages/Associations";
import Tariffs from "./pages/Tariffs";
import Schedule from "./pages/Schedule";
import Cards from "./pages/Cards";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Payments from "./pages/Payments";
import Stats from "./pages/Stats";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner position="top-center" dir="rtl" />
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoutes />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/members" element={<Members />} />
                <Route path="/associations" element={<Associations />} />
                <Route path="/profile/:type/:id" element={<Profile />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/cards" element={<Cards />} />
                <Route path="/tariffs" element={<Tariffs />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
