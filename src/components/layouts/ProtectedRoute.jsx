import { Navigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../ui/LoadingSpinner";
import Button from "../ui/Button";
import ConfigMissing from "./ConfigMissing";

/** Signed-in area. Sends new accounts through onboarding first. */
export default function ProtectedRoute({ children }) {
  const { status, profile, profileStatus, profileError, retryProfile, logout } = useAuth();
  const location = useLocation();

  if (status === "unconfigured") return <ConfigMissing />;
  if (status === "loading") return <LoadingSpinner message="Memuat SI-MAUNG…" />;
  if (status === "signedOut") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (profileStatus === "error") {
    return (
      <div className="page" style={{ maxWidth: 520 }}>
        <div className="panel stack" role="alert">
          <h1 className="panel__title">Profil belum bisa dimuat</h1>
          <p className="muted">{profileError}</p>
          <div className="row">
            <Button variant="primary" onClick={retryProfile}>
              <RefreshCw size={16} aria-hidden="true" /> Coba lagi
            </Button>
            <Button onClick={logout}>Keluar</Button>
          </div>
        </div>
      </div>
    );
  }
  if (profileStatus !== "ready") return <LoadingSpinner message="Memuat profil…" />;

  const onboarded = Boolean(profile?.onboarding_completed);
  if (!onboarded && location.pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
  if (onboarded && location.pathname === "/onboarding") return <Navigate to="/dashboard" replace />;
  return children;
}

/** Login/register: signed-in visitors go straight to the app. */
export function PublicOnlyRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "unconfigured") return <ConfigMissing />;
  if (status === "signedIn") return <Navigate to={location.state?.from || "/dashboard"} replace />;
  return children;
}
