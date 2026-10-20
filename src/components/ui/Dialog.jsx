import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Page-level effects (inert app root, scroll lock) are shared by all open dialogs.
let openCount = 0;
let savedOverflow = "";
function lockPage() {
  if (openCount++ === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = document.getElementById("root");
    if (root) root.inert = true;
  }
}
function unlockPage() {
  if (--openCount === 0) {
    document.body.style.overflow = savedOverflow;
    const root = document.getElementById("root");
    if (root) root.inert = false;
  }
}

/**
 * Accessible modal dialog (bottom sheet on phones):
 * focus moves in and is trapped, Escape closes, the page behind is inert and
 * does not scroll, and focus returns to the trigger on close.
 */
export default function Dialog({ open, onClose, title, description, children, width = 560, dismissible = true, className = "" }) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  const pressStarted = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  }, [onClose, dismissible]);

  useEffect(() => {
    if (!open) return undefined;
    const returnTo = document.activeElement;
    const node = ref.current;
    lockPage();

    const frame = requestAnimationFrame(() => {
      const target = node.querySelector("[data-autofocus]") || node.querySelector(FOCUSABLE) || node;
      target.focus({ preventScroll: true });
    });

    const onKey = (e) => {
      if (e.key === "Escape" && dismissibleRef.current) {
        e.stopPropagation();
        onCloseRef.current?.();
      } else if (e.key === "Tab") {
        const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      unlockPage();
      if (returnTo?.isConnected && typeof returnTo.focus === "function") returnTo.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="dialog-backdrop"
      onPointerDown={(e) => (pressStarted.current = e.target === e.currentTarget)}
      onClick={(e) => {
        if (dismissible && pressStarted.current && e.target === e.currentTarget) onCloseRef.current?.();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`dialog ${className}`}
        style={{ "--dialog-w": `${width}px` }}
      >
        <div className="dialog__head">
          <div>
            <h2 className="dialog__title" id={titleId}>
              {title}
            </h2>
            {description && (
              <p className="dialog__desc" id={descId}>
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button type="button" className="icon-btn" aria-label="Tutup" onClick={() => onCloseRef.current?.()}>
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="dialog__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
