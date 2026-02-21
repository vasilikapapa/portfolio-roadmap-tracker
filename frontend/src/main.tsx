import "./styles/app.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

/**
 * Layout wrapper component
 * Provides shared structure (header, footer, container)
 * across all routed pages.
 */
import Layout from "./components/Layout";

/**
 * Page components
 */
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminHomePage from "./pages/AdminHomePage";
import HomeRedirect from "./pages/HomeRedirect";

/**
 * Route protection component
 * Ensures only authenticated users can access
 * protected admin routes.
 */
import RequireAuth from "./RequireAuth";

/**
 * ==========================================
 * Application Entry Point
 * ==========================================
 * - Initializes React root
 * - Wraps app with Router
 * - Defines all application routes
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Enables client-side routing */}
    <BrowserRouter>
      <Routes>

        {/* Shared layout wrapper */}
        <Route element={<Layout />}>

          {/* Root route redirects user appropriately */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Public admin login page */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected admin dashboard */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminHomePage />
              </RequireAuth>
            }
          />

          {/* Protected projects list */}
          <Route
            path="/projects"
            element={
              <RequireAuth>
                <ProjectsPage />
              </RequireAuth>
            }
          />

          {/* Protected project details (dynamic route by slug) */}
          <Route
            path="/projects/:slug"
            element={
              <RequireAuth>
                <ProjectDetailsPage />
              </RequireAuth>
            }
          />

          {/* Fallback route (404 handling) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);