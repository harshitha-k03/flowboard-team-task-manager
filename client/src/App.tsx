import { Suspense, lazy, useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import { AdminRoute } from "@/routes/AdminRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { Card, CardContent } from "@/components/ui/card";

const AppShell = lazy(() => import("@/components/layout/AppShell").then((module) => ({ default: module.AppShell })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("@/pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage").then((module) => ({ default: module.ProjectsPage })));
const TasksPage = lazy(() => import("@/pages/TasksPage").then((module) => ({ default: module.TasksPage })));
const ProjectDetailsPage = lazy(() =>
  import("@/pages/ProjectDetailsPage").then((module) => ({ default: module.ProjectDetailsPage }))
);
const TaskDetailsPage = lazy(() => import("@/pages/TaskDetailsPage").then((module) => ({ default: module.TaskDetailsPage })));
const FocusModePage = lazy(() => import("@/pages/FocusModePage").then((module) => ({ default: module.FocusModePage })));
const NotificationsPage = lazy(() =>
  import("@/pages/NotificationsPage").then((module) => ({ default: module.NotificationsPage }))
);
const TeamPage = lazy(() => import("@/pages/TeamPage").then((module) => ({ default: module.TeamPage })));
const AnalyticsPage = lazy(() =>
  import("@/pages/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage }))
);
const DeadlinesPage = lazy(() =>
  import("@/pages/DeadlinesPage").then((module) => ({ default: module.DeadlinesPage }))
);
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));

function GuestRoute({ children }: { children: ReactElement }) {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-md">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading FlowBoard...
        </CardContent>
      </Card>
    </div>
  );
}

function RootRedirect() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return <RouteFallback />;
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function ThemeController() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return null;
}

export default function App() {
  useAuthBootstrap();

  return (
    <BrowserRouter>
      <ThemeController />
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route path="/register" element={<Navigate to="/signup" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
              <Route path="/my-tasks" element={<FocusModePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              <Route element={<AdminRoute />}>
                <Route path="/team" element={<TeamPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/deadlines" element={<DeadlinesPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
