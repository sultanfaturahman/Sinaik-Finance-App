import { useEffect, ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <ProfileRedirectBoundary>{children}</ProfileRedirectBoundary>;
};

const ProfileRedirectBoundary = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();

  useEffect(() => {
    if (
      profile &&
      !profile.profile_completed &&
      !location.pathname.startsWith("/profile")
    ) {
      navigate(
        {
          pathname: "/profile",
          search: "?setup=1",
        },
        {
          replace: true,
          state: { from: `${location.pathname}${location.search}` },
        }
      );
    }
  }, [navigate, profile, location.pathname, location.search]);

  return (
    <>
      {children}
      {profileLoading && (
        <div className="fixed bottom-4 right-4 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-lg backdrop-blur">
          Memuat profil...
        </div>
      )}
      {profileError && (
        <div className="fixed bottom-4 right-4 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs text-destructive shadow-lg backdrop-blur">
          Gagal memuat profil
        </div>
      )}
    </>
  );
};
