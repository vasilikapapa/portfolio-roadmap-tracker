import React from "react";

/**
 * AdminButton
 *
 * Pure styled button.
 *
 * Access control is handled by the page using it
 * (e.g. ProjectDetailsPage decides where to navigate).
 *
 * This keeps logic centralized and prevents forced redirects.
 */

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function AdminButton({ children, style, ...props }: Props) {
  return (
    <button
      {...props}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "rgba(255,255,255,0.10)",
        color: "var(--text)",
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}