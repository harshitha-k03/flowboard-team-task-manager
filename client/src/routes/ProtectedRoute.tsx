import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";

export function ProtectedRoute() {
  const location = useLocation();
  const { token, user, hydrated, bootstrapping } = useAuthStore();

  if (!hydrated || bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="w-full max-w-md">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading your FlowBoard workspace...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
