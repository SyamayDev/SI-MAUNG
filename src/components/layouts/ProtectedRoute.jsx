import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../ui/LoadingSpinner";

function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <LoadingSpinner message="Memuat SI MAUNG..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If we have a user but their profile is not fully loaded yet, wait.
  // This can happen for a brief moment after login.
  if (!profile) {
     return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <LoadingSpinner message="Memuat profil pengguna..." />
      </div>
    );
  }

  // If user has not completed onboarding, redirect them,
  // unless they are already on the onboarding page.
  if (!profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If user HAS completed onboarding and tries to access the onboarding page,
  // redirect them to the dashboard.
  if (profile.onboarding_completed && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;