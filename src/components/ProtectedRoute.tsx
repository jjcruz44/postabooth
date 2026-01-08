import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipTourRedirect?: boolean;
}

export function ProtectedRoute({ children, skipTourRedirect = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user should see the welcome tour (first access)
  const hideTour = localStorage.getItem("hideTour");
  const isOnWelcomePage = location.pathname === "/welcome";
  
  if (!skipTourRedirect && !hideTour && !isOnWelcomePage) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}
