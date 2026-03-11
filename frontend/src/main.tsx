/**
 * Pre-warm the backend immediately on page load.
 *
 * Render free instances go to sleep after inactivity.
 * This request starts waking the backend while the JS bundle loads,
 * reducing the perceived cold start delay.
 *
 * "fire and forget" — errors are ignored intentionally.
 */
fetch("https://portfolio-tracker-y2gg.onrender.com/actuator/health", {
  method: "GET",
  cache: "no-store",
}).catch(() => {});

import "./styles/app.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";

/**
 * Entry point:
 * - Wrap with AuthProvider
 * - Wrap with BrowserRouter
 * - Render App component
 */

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);