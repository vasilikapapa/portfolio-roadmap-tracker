import { Outlet } from "react-router-dom";
import Navbar from "./Navbar/Navbar";

/**
 * Layout Component
 *
 * Purpose:
 * - Provides a consistent page structure across routes
 * - Displays the Navbar on every page
 * - Uses React Router's <Outlet /> to render child routes dynamically
 */
export default function Layout() {
  return (
    // Main page wrapper with background styling
    <div className="page bgFadeBottom">
      
      {/* Top navigation bar (visible on all pages) */}
      <Navbar />

      {/* Main content area where routed pages render */}
      <div className="pageMain">
        <Outlet /> {/* React Router inserts matched child route here */}
      </div>
      
    </div>
  );
}