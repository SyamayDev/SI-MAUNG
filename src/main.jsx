import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "inter-ui/inter.css";
import "./index.css";
import "./App.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FinanceProvider } from "./context/FinanceContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <FinanceProvider>
        <ToastProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </ToastProvider>
      </FinanceProvider>
    </AuthProvider>
  </StrictMode>,
);
