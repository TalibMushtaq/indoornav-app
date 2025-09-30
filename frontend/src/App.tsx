import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import Pages using relative paths
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBuildings from "./pages/AdminBuildings";
import BuildingForm from "./pages/BuildingForm";
import AdminLandmarks from "./pages/AdminLandmarks";
import LandmarkForm from "./pages/LandmarkForm"; // Import the landmark form
import AdminPaths from "./pages/AdminPaths";
import VisitorRegistration from "./pages/VisitorRegistration";
import NavigationPage from "./pages/Navigation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/visitor/register" element={<VisitorRegistration />} />
          <Route path="/navigation" element={<NavigationPage />} />

          {/* Admin Auth Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/buildings" element={<AdminBuildings />} />
          <Route path="/admin/buildings/new" element={<BuildingForm />} />
          <Route path="/admin/buildings/edit/:buildingId" element={<BuildingForm />} />
          
          {/* --- ADD THESE ROUTES FOR LANDMARKS --- */}
          <Route path="/admin/landmarks" element={<AdminLandmarks />} />
          <Route path="/admin/landmarks/new" element={<LandmarkForm />} />
          <Route path="/admin/landmarks/edit/:landmarkId" element={<LandmarkForm />} />

          <Route path="/admin/paths" element={<AdminPaths />} />
          
          {/* This catch-all route must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
