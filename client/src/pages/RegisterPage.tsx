import { useState } from "react";
import { Lock, Mail, ShieldCheck, UserRound, Users2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { notify } from "@/lib/notify";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import type { Role } from "@/types";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const emailPattern = /\S+@\S+\.\S+/;

export function RegisterPage() {
  const navigate = useNavigate();
  const signup = useAuthStore((state) => state.signup);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSignup = async () => {
    setFormError("");

    if (!name.trim()) {
      const message = "Name is required.";
      setFormError(message);
      notify.error(message);
      return;
    }

    if (!emailPattern.test(email)) {
      const message = "Please enter a valid email address.";
      setFormError(message);
      notify.error(message);
      return;
    }

    if (password.length < 6) {
      const message = "Password must be at least 6 characters.";
      setFormError(message);
      notify.error(message);
      return;
    }

    setSubmitting(true);

    try {
      await signup({
        name: name.trim(),
        email,
        password,
        role
      });
      notify.success("Account created successfully.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async (credential: string) => {
    setFormError("");
    setGoogleSubmitting(true);

    try {
      await googleLogin({ credential, role });
      notify.success("Google account connected.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="mx-auto w-full max-w-xl">
          <div className="mb-4 flex justify-end">
            <ThemeToggle className="h-11 w-11 rounded-2xl" />
          </div>
          <Card className="rounded-[2rem] border-border shadow-sm">
            <CardContent className="p-8 sm:p-10">
              <div className="mb-8 flex items-center rounded-2xl border border-border bg-secondary/50 p-1">
                <Link to="/login" className="flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold text-muted-foreground transition hover:text-foreground">
                  Login
                </Link>
                <button type="button" className="flex-1 rounded-xl bg-card px-4 py-3 text-sm font-semibold text-primary shadow-sm">
                  Sign up
                </button>
              </div>

              <div className="mb-8 space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">Create your FlowBoard account</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  New users start with a member-friendly workspace unless you choose admin access for demo purposes.
                </p>
              </div>

              <div className="grid gap-5">
                {formError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{formError}</p> : null}

                <div className="grid gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Aarav Shah" className="h-12 pl-11" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="member@flowboard.com"
                      className="h-12 pl-11"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Minimum 6 characters"
                      className="h-12 pl-11"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Preferred role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="h-12 w-full" disabled={submitting} onClick={() => void handleSignup()}>
                  {submitting ? "Creating account..." : "Create account"}
                </Button>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Or continue with</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className={googleSubmitting ? "pointer-events-none opacity-70" : ""}>
                    <GoogleAuthButton disabled={googleSubmitting} text="signup_with" onCredential={handleGoogleSignup} />
                  </div>
                </div>
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary transition hover:text-primary/80">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>

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
              <p className="text-sm text-muted-foreground">Built for admins and members</p>
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] border border-border bg-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Role-based experience</p>
            <h3 className="mt-4 text-3xl font-semibold text-foreground">The same product, different guardrails.</h3>
            <div className="mt-8 grid gap-4">
              <RoleCard
                icon={ShieldCheck}
                title="Admin"
                description="Create projects, assign members, manage tasks, review analytics, and control deadline risk."
              />
              <RoleCard
                icon={Users2}
                title="Member"
                description="See assigned work, update progress, collaborate in comments, and stay focused on execution."
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  description
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}
