import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom"; // Import Outlet

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Global components like Toasters stay here */}
      <Toaster />
      <Sonner />
      
      {/* The Outlet component renders the active route */}
      <main>
        <Outlet />
      </main>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;