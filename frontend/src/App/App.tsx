import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "../components/Layout";
import ProjectsPage from "../pages/ProjectsPage";
import ProjectDetailsPage from "../pages/ProjectDetailsPage";
import AdminLoginPage from "../pages/AdminLoginPage";
import AdminHomePage from "../pages/AdminHomePage";
import AdminProjectDetailsPage from "../pages/AdminProjectDetailsPage";
import HomeRedirect from "../pages/HomeRedirect";
import RequireAuth from "../RequireAuth";

/**
 * App Component
 *
 * Structure:
 * - Public routes: projects + project details
 * - Admin routes: login (public) + admin pages (protected)
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Root redirect */}
        <Route path="/" element={<HomeRedirect />} />

        {/* PUBLIC ROUTES */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailsPage />} />

        {/* ADMIN ROUTES (login is public) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin dashboard */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminHomePage />
            </RequireAuth>
          }
        />

        {/* Admin project editor page */}
        <Route
          path="/admin/projects/:slug"
          element={
            <RequireAuth>
              <AdminProjectDetailsPage />
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}