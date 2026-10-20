import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState } from "react";

const CaptureSheet = lazy(() => import("../components/capture/CaptureSheet"));
const ModalContext = createContext(null);

/**
 * Opens the capture sheet from anywhere (dashboard CTA, mobile mic button,
 * transaction list…):
 *   openCapture({ mode: "voice" | "text", text? })
 *   openManual({ type? })
 *   openEdit(transaction)
 */
export function ModalProvider({ children }) {
  const [request, setRequest] = useState(null);

  const openCapture = useCallback((options = {}) => setRequest({ mode: "voice", ...options, at: Date.now() }), []);
  const openManual = useCallback((options = {}) => setRequest({ mode: "manual", ...options, at: Date.now() }), []);
  const openEdit = useCallback((transaction) => setRequest({ mode: "edit", transaction, at: Date.now() }), []);
  const close = useCallback(() => setRequest(null), []);

  const value = useMemo(() => ({ openCapture, openManual, openEdit, close }), [openCapture, openManual, openEdit, close]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {request && (
        <Suspense fallback={null}>
          <CaptureSheet open={Boolean(request)} request={request} onClose={close} />
        </Suspense>
      )}
    </ModalContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal harus digunakan di dalam ModalProvider");
  return ctx;
}
