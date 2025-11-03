import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-2 text-center">
          <p className="text-base font-semibold text-foreground">Gagal memuat profil.</p>
          <p className="text-sm text-muted-foreground">Silakan segarkan halaman atau coba lagi nanti.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile && !profile.profile_completed && !location.pathname.startsWith("/profile")) {
    const destination = {
      pathname: "/profile",
      search: "?setup=1",
    };

    return (
      <Navigate
        to={destination}
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }

  return <>{children}</>;
};
