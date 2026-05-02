import { useMemo } from "react";
import { Laptop, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const theme = useThemeStore((state) => state.theme);
  const apiUrl = useMemo(() => import.meta.env.VITE_API_URL || "Not configured", []);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Settings</p>
        <h1 className="page-heading">Account and workspace access</h1>
        <p className="max-w-3xl page-subtle">
          Review the active account, environment, and session details for this FlowBoard workspace.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.75rem] border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoCard icon={UserRound} label="Name" value={user?.name || "Unknown user"} />
            <InfoCard icon={ShieldCheck} label="Role" value={user?.roleLabel || "No role"} />
            <InfoCard icon={Laptop} label="Email" value={user?.email || "No email"} />
            <InfoCard icon={Laptop} label="API URL" value={apiUrl} />
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Session and appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-secondary p-5">
              <p className="text-sm text-muted-foreground">Current access</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{user?.role === "admin" ? "Admin workspace" : "Member workspace"}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your session is stored locally so you can reopen the app without signing in again.
              </p>
            </div>

            <div className="rounded-3xl bg-secondary p-5">
              <p className="text-sm text-muted-foreground">Theme preference</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
                  <p className="text-sm text-muted-foreground">Switch the workspace chrome and surfaces instantly.</p>
                </div>
                <ThemeToggle showLabel />
              </div>
            </div>

            <Button
              className="h-12 w-full justify-center"
              onClick={() => {
                clearSession();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-secondary p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
