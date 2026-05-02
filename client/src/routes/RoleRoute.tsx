import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import type { Role } from "@/types";

interface RoleRouteProps {
  roles: Role[];
}

export function RoleRoute({ roles }: RoleRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
