import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/fraunces/soft.css";
import "@fontsource-variable/fraunces/soft-italic.css";
import "@fontsource-variable/manrope";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/layout.css";
import "./styles/capture.css";
import "./styles/story.css";
import "./styles/pages.css";
import "./styles/scene.css";
import "./lib/theme.js"; // keeps <html data-theme> and the 3D scene in sync
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FinanceProvider } from "./context/FinanceContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

const root = createRoot(document.getElementById("root"));

// The first render is a transition, so React can yield to the browser while it
// builds the page (no single long task on slow phones); the first-paint screen
// in index.html stays up meanwhile.
startTransition(() => {
  root.render(
    <StrictMode>
      <AuthProvider>
        <FinanceProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </FinanceProvider>
      </AuthProvider>
    </StrictMode>
  );
});
