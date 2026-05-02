import { useEffect, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Lock, Mail, ShieldCheck, Sparkles, Users2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { notify } from "@/lib/notify";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emailPattern = /\S+@\S+\.\S+/;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const redirectTo = ((location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard") as string;

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("flowboard-remember-email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleLogin = async (nextEmail = email, nextPassword = password) => {
    setFormError("");

    if (!emailPattern.test(nextEmail)) {
      const message = "Please enter a valid email address.";
      setFormError(message);
      notify.error(message);
      return;
    }

    if (nextPassword.length < 6) {
      const message = "Password must be at least 6 characters.";
      setFormError(message);
      notify.error(message);
      return;
    }

    setSubmitting(true);

    try {
      await login({ email: nextEmail, password: nextPassword });

      if (rememberEmail) {
        window.localStorage.setItem("flowboard-remember-email", nextEmail);
      } else {
        window.localStorage.removeItem("flowboard-remember-email");
      }

      notify.success("Login successful.");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    setFormError("");
    setGoogleSubmitting(true);

    try {
      await googleLogin({ credential });
      notify.success("Signed in with Google.");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="hidden rounded-[2rem] border border-border bg-card p-10 shadow-sm lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <div className="relative h-7 w-7">
                <span className="absolute left-0 top-0 h-2.5 w-7 rounded-full bg-primary" />
                <span className="absolute left-0 top-3 h-2.5 w-5 rounded-full bg-primary" />
                <span className="absolute left-0 top-6 h-2.5 w-3 rounded-full bg-primary" />
              </div>
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">FlowBoard</p>
              <p className="text-sm text-muted-foreground">Team Task Manager</p>
            </div>
          </div>

          <div className="mt-14 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Smarter execution</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight text-foreground">
              Smarter tasks.
              <br />
              <span className="text-primary">Stronger teams.</span>
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Plan projects, manage execution, and stay ahead of delivery risk with a clean, enterprise-ready workspace.
            </p>
          </div>

          <div className="mt-12 grid gap-4">
            <FeatureRow
              icon={Sparkles}
              title="Smart Priorities"
              description="Keep urgent work visible with deadline-aware reminders and productivity signals."
            />
            <FeatureRow
              icon={Users2}
              title="Real-time Collaboration"
              description="Coordinate teams, owners, comments, and workload from a single workspace."
            />
            <FeatureRow
              icon={ShieldCheck}
              title="Role-Based Access"
              description="Give admins control while members stay focused on the work assigned to them."
            />
          </div>

        </section>

        <section className="mx-auto w-full max-w-xl">
          <div className="mb-4 flex justify-end">
            <ThemeToggle className="h-11 w-11 rounded-2xl" />
          </div>
          <Card className="rounded-[2rem] border-border shadow-sm">
            <CardContent className="p-8 sm:p-10">
              <div className="mb-8 flex items-center rounded-2xl border border-border bg-secondary/50 p-1">
                <button type="button" className="flex-1 rounded-xl bg-card px-4 py-3 text-sm font-semibold text-primary shadow-sm">
                  Login
                </button>
                <Link to="/signup" className="flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold text-muted-foreground transition hover:text-foreground">
                  Sign up
                </Link>
              </div>

              <div className="mb-8 space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">Login to FlowBoard</h2>
                <p className="text-sm leading-6 text-muted-foreground">Use your workspace account or jump into the demo roles below.</p>
              </div>

              <div className="space-y-5">
                {formError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{formError}</p> : null}

                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" className="h-12 pl-11" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="h-12 pl-11"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(event) => setRememberEmail(event.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Remember my email
                </label>

                <Button className="h-12 w-full" disabled={submitting} onClick={() => void handleLogin()}>
                  {submitting ? "Signing in..." : "Login to FlowBoard"}
                </Button>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Or continue with</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className={googleSubmitting ? "pointer-events-none opacity-70" : ""}>
                    <GoogleAuthButton disabled={googleSubmitting} text="signin_with" onCredential={handleGoogleLogin} />
                  </div>
                </div>
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Demo access</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="h-12 justify-start rounded-2xl"
                  disabled={submitting}
                  onClick={() => {
                    setEmail("admin@flowboard.com");
                    setPassword("123456");
                    void handleLogin("admin@flowboard.com", "123456");
                  }}
                >
                  <BriefcaseBusiness className="mr-2 h-4 w-4" />
                  Login as Admin
                </Button>
                <Button
                  variant="outline"
                  className="h-12 justify-start rounded-2xl"
                  disabled={submitting}
                  onClick={() => {
                    setEmail("member@flowboard.com");
                    setPassword("123456");
                    void handleLogin("member@flowboard.com", "123456");
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Login as Member
                </Button>
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Need an account?{" "}
                <Link to="/signup" className="font-medium text-primary transition hover:text-primary/80">
                  Create one here
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  description
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-[1.5rem] border border-border bg-card p-5">
      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
