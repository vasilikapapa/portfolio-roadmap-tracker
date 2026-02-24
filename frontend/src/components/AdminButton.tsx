import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * AdminButton
 *
 * Behavior:
 * - If admin → execute onClick normally
 * - If not admin → redirect to /admin/login
 *
 * UX:
 * - Button is never disabled
 * - Clear access control behavior
 */

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function AdminButton({ onClick, children, ...props }: Props) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!isAdmin) {
      // Redirect to login page
      navigate("/admin/login");
      return;
    }

    // If admin, execute original click handler
    if (onClick) onClick(e);
  }

  return (
    <button
      {...props}
      onClick={handleClick}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "rgba(255,255,255,0.10)",
        color: "var(--text)",
        cursor: "pointer",
        ...(props.style ?? {}),
      }}
    >
      {children}
    </button>
  );
}