import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminRoute from "./components/AdminRoute";
import Coproprietes from "./pages/Coproprietes";
import Categories from "./pages/Categories";
import ASLAndSuperadminRoute from "./components/ASLAndSuperadminRoute";
import Gestion from "./pages/Gestion";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/gestion" element={<ASLAndSuperadminRoute><Gestion /></ASLAndSuperadminRoute>} />
            <Route path="/coproprietes" element={<ASLAndSuperadminRoute><Coproprietes /></ASLAndSuperadminRoute>} />
            <Route path="/categories" element={<ASLAndSuperadminRoute><Categories /></ASLAndSuperadminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;