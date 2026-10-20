import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: TriangleAlert, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(1);

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, { type = "info", duration = 4000, action } = {}) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, message, type, action }]);
      timers.current.set(id, setTimeout(() => removeToast(id), duration));
      return id;
    },
    [removeToast]
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* Portaled next to dialogs so toasts stay usable while a modal makes #root inert. */}
      {createPortal(
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div key={t.id} className={`toast toast--${t.type}`}>
              <Icon size={18} aria-hidden="true" className="toast__icon" />
              <span className="toast__message">{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  className="toast__action"
                  onClick={() => {
                    t.action.onClick();
                    removeToast(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" className="toast__close" aria-label="Tutup notifikasi" onClick={() => removeToast(t.id)}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus digunakan di dalam ToastProvider");
  return ctx;
}
