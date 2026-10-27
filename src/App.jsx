import { lazy, Suspense, useSyncExternalStore } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute, { PublicOnlyRoute } from "./components/layouts/ProtectedRoute";
import AppShell from "./components/layouts/AppShell";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import ScrollToTop from "./components/layouts/ScrollToTop";
import RouteMeta from "./components/layouts/RouteMeta";
import SceneHost from "./components/scene/SceneHost";
import LoadingScreen from "./components/scene/LoadingScreen";
import { useAuth } from "./context/AuthContext";
import { ModalProvider } from "./context/ModalContext";
import { bootStore } from "./lib/bootLoader";
// The landing is the first page most visitors see: bundled with the app shell
// (no extra round-trip before the first heading can paint).
import Landing from "./pages/Landing";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const SavingsGoals = lazy(() => import("./pages/SavingsGoals"));
const AIChatPage = lazy(() => import("./pages/AIChatPage"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// "/SI-MAUNG/" in production, "/" in dev.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

function Home() {
  const { status } = useAuth();
  if (status === "loading") return <LoadingSpinner message="Memuat SI-MAUNG…" />;
  if (status === "signedIn") return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

export default function App() {
  const booting = useSyncExternalStore(bootStore.subscribe, () => bootStore.getState().phase !== "done", () => true);
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <ModalProvider>
        <RouteMeta />
        <SceneHost />
        {/* The page behind the loading screen is out of reach for keyboard and screen readers. */}
        <div className="app-root" inert={booting ? true : undefined}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route index element={<Home />} />
              <Route path="login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="savings" element={<SavingsGoals />} />
                <Route path="ai" element={<AIChatPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
        <LoadingScreen />
      </ModalProvider>
    </BrowserRouter>
  );
}
