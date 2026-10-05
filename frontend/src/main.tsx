/**
 * Pre-warm the backend immediately on page load.
 *
 * Render free instances go to sleep after inactivity.
 * This request starts waking the backend while the JS bundle loads,
 * reducing the perceived cold start delay.
 *
 * Uses the same VITE_API_URL as the API client and the real /health
 * endpoint (the backend has no /actuator, so that URL returned an error).
 *
 * "fire and forget" — errors are ignored intentionally.
 */
const WARMUP_API_URL = import.meta.env.VITE_API_URL as string | undefined;
if (WARMUP_API_URL) {
  fetch(`${WARMUP_API_URL}/health`, { method: "GET", cache: "no-store" }).catch(() => {});
}

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