import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";

import HomeRedirect from "./pages/HomeRedirect";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";

import AdminLoginPage from "./pages/AdminLoginPage";
import AdminProjectDetailsPage from "./pages/AdminProjectDetailsPage";

import DemoLoginPage from "./pages/DemoLoginPage";
import DemoHomePage from "./pages/DemoHomePage";
import DemoProjectDetailsPage from "./pages/DemoProjectsDetailsPage";


// Use ONE admin guard approach
import RequireAuth from "./RequireAuth";



/**
 * Routing
 * - Public: projects
 * - Admin: login + protected admin pages
 * - Demo: login + sandbox pages (protected)
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Home */}
        <Route path="/" element={<HomeRedirect />} />

        {/* PUBLIC */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailsPage />} />


        {/* ADMIN */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/projects/:slug"
          element={
            <RequireAuth allow={["ADMIN"]}>
              <AdminProjectDetailsPage />
            </RequireAuth>
          }
        />

        {/* DEMO */}
       <Route path="/demo/login" element={<DemoLoginPage />} />
        <Route
          path="/demo"
          element={
            <RequireAuth allow={["DEMO"]}>
              <DemoHomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/demo/projects/:slug"
          element={
            <RequireAuth allow={["DEMO"]}>
              <DemoProjectDetailsPage />
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}