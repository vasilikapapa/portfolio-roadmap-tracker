import { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  onAdmin: () => void;
  onDemo: () => void;
};

export default function AccessChoiceModal({
  open,
  title = "Edit this project?",
  message = "Choose how you want to continue.",
  onClose,
  onAdmin,
  onDemo,
}: Props) {
  // ESC to close
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  // Render into <body> so it's centered on the page (not inside navbar stacking context)
  return createPortal(
    <div className="acmOverlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="acmModal" onClick={(e) => e.stopPropagation()}>
        <div className="acmHeader">
          <div>
            <div className="acmTitle">{title}</div>
            <div className="acmMsg">{message}</div>
          </div>

          <button className="acmClose" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="acmActions">
          <button className="acmBtn" type="button" onClick={onAdmin}>
            Login as Admin
          </button>

          <button className="acmBtn" type="button" onClick={onDemo}>
            Continue as Demo (Test)
          </button>

          <button className="acmBtn acmBtnGhost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="acmFoot">
          Demo is a sandbox with a reset button. Admin edits the real portfolio data.
        </div>
      </div>
    </div>,
    document.body
  );
}