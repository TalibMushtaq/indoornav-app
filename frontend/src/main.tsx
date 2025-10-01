import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// Import Pages using relative paths
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBuildings from "./pages/AdminBuildings";
import BuildingForm from "./pages/BuildingForm";
import AdminLandmarks from "./pages/AdminLandmarks";
import LandmarkForm from "./pages/LandmarkForm";
import AdminPaths from "./pages/AdminPaths";
import VisitorRegistration from "./pages/VisitorRegistration";
import NavigationPage from "./pages/Navigation";
import NotFound from "./pages/NotFound";

// Create the router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App is now the main layout component
    errorElement: <NotFound />, // A top-level error page
    children: [
      // Public Routes
      { index: true, element: <Index /> },
      { path: "visitor/register", element: <VisitorRegistration /> },
      { path: "navigation", element: <NavigationPage /> },

      // Admin Auth Routes
      { path: "admin/login", element: <AdminLogin /> },
      { path: "admin/signup", element: <AdminSignup /> },
      
      // Protected Admin Routes
      { path: "admin/dashboard", element: <AdminDashboard /> },
      { path: "admin/buildings", element: <AdminBuildings /> },
      { path: "admin/buildings/new", element: <BuildingForm /> },
      { path: "admin/buildings/edit/:buildingId", element: <BuildingForm /> },
      
      { path: "admin/landmarks", element: <AdminLandmarks /> },
      { path: "admin/landmarks/new", element: <LandmarkForm /> },
      { path: "admin/landmarks/edit/:landmarkId", element: <LandmarkForm /> },

      { path: "admin/paths", element: <AdminPaths /> },
    ],
  },
  // You can define other top-level routes here if needed
]);

// Render the app using the RouterProvider
createRoot(document.getElementById("root")!).render(
  <RouterProvider
    router={router}
    future={{
      // Opt-in to the new startTransition behavior
      v7_startTransition: true,
    }}
  />
);