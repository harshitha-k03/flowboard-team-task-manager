import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Database, FolderKanban, ListChecks, Plus, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/ChartCard";
import { ReminderCard } from "@/components/ReminderCard";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { ProjectStatusBadge } from "@/components/shared/EntityBadges";
import { PageLoader } from "@/components/shared/PageLoader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getGreeting, formatRelativeTime } from "@/lib/utils";
import { dashboardService } from "@/services/dashboardService";
import { demoService } from "@/services/demoService";
import { notify } from "@/lib/notify";
import { useAuthStore } from "@/store/auth-store";
import type { ActivityItem, DashboardStats, ReminderItem } from "@/types";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const loadDashboard = useCallback(async () => {
    const [nextStats, nextActivity, nextReminders] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getActivity(),
      dashboardService.getReminders()
    ]);

    setStats(nextStats);
    setActivity(nextActivity);
    setReminders(nextReminders);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitialDashboard = async () => {
      try {
        if (!cancelled) {
          await loadDashboard();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialDashboard();

    return () => {
      cancelled = true;
    };
  }, [loadDashboard]);

  const handleLoadDemoWorkspace = async () => {
    if (!window.confirm("Load sample interview workspace? This resets the current demo database.")) {
      return;
    }

    setLoadingDemo(true);

    try {
      const result = await demoService.loadWorkspace();
      setAuth(result.session.token, result.session.user);
      await loadDashboard();
      notify.success(`Demo loaded: ${result.summary.projects} projects, ${result.summary.tasks} tasks.`);
    } finally {
      setLoadingDemo(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading dashboard insights..." />;
  }

  if (!stats) {
    return <EmptyState icon={FolderKanban} title="Dashboard unavailable" description="We couldn't load your workspace data right now." />;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[2rem] border-border shadow-sm">
          <CardContent className="space-y-4 p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Dashboard</p>
                <h1 className="mt-3 text-[2.3rem] font-semibold tracking-tight text-foreground">
                  {getGreeting()}, {user?.name?.split(" ")[0] || "team"}
                </h1>
              </div>
              {user?.role === "admin" ? (
                <Button variant="outline" className="h-11 rounded-2xl" disabled={loadingDemo} onClick={() => void handleLoadDemoWorkspace()}>
                  <Database className="mr-2 h-4 w-4" />
                  {loadingDemo ? "Loading demo..." : "Load Demo Data"}
                </Button>
              ) : null}
            </div>

            <div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Keep delivery health, current throughput, and upcoming risk visible without turning the workspace into noise.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <InlineMetric label="Weekly productivity" value={`${stats.weeklyProductivity}%`} />
              <InlineMetric label="Projects in motion" value={`${stats.totalProjects}`} />
              <InlineMetric label="Smart reminders" value={`${reminders.length}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border shadow-sm">
          <CardContent className="grid gap-4 p-7 sm:grid-cols-2">
            <div className="rounded-[1.6rem] border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Today's focus</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{stats.todayFocus.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">High urgency tasks to review first</p>
            </div>
            <div className="rounded-[1.6rem] border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Attention needed</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{stats.overdueTasks}</p>
              <p className="mt-2 text-sm text-muted-foreground">Tasks currently overdue</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Projects" value={stats.totalProjects} hint="All visible projects" icon={FolderKanban} />
        <StatCard title="Total Tasks" value={stats.totalTasks} hint="All visible tasks in your workspace" icon={ListChecks} />
        <StatCard title="Completed" value={stats.completedTasks} hint="Successfully shipped work" icon={CheckCircle2} accentClassName="bg-emerald-50 text-emerald-600" />
        <StatCard title="Pending" value={stats.pendingTasks} hint="Open work still in motion" icon={Clock3} accentClassName="bg-amber-50 text-amber-600" />
        <StatCard title="Overdue" value={stats.overdueTasks} hint="Needs attention right away" icon={AlertTriangle} accentClassName="bg-rose-50 text-rose-600" />
      </section>

      <section>
        <Card className="rounded-[1.9rem] border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Today's Focus</h2>
            </div>
            {stats.todayFocus.length ? (
              stats.todayFocus.map((task) => (
                <div key={task.id} className="rounded-[1.4rem] border border-border bg-secondary p-4">
                  <p className="font-semibold text-foreground">{task.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{task.project?.title || "No project"} • {task.priority}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-border bg-secondary p-6 text-sm text-muted-foreground">
                No high urgency tasks are due today.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <ChartCard title="Weekly Productivity" description="Completed tasks this week divided by total tasks created this week.">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-4xl font-semibold text-foreground">{stats.weeklyProductivity}%</p>
              <p className="mt-1 text-sm text-muted-foreground">Current weekly productivity</p>
            </div>
            <div className="rounded-2xl border border-border bg-white px-4 py-2 text-sm font-medium text-primary">
              <TrendingUp className="mr-2 inline h-4 w-4" />
              Live trend
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyProductivitySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="productivity" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Workload Balance" description="Open tasks and completed work across the active team.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.workloadBalance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="openTasks" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="completedTasks" fill="#93c5fd" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.9rem] border-border shadow-sm">
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            {stats.projectProgress.length ? (
              stats.projectProgress.map((project) => (
                <div key={project.id} className="rounded-[1.5rem] border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{project.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{project.description || "No description provided."}</p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Health: <span className="text-foreground">{project.health || "On Track"}</span> ({project.healthScore ?? project.progress})
                  </p>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">Completion</span>
                        <span className="text-muted-foreground">{project.progress}%</span>
                      </div>
                      <ProgressBar value={project.progress} className="h-2.5" />
                    </div>
                    <AvatarGroup users={project.members} />
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-2">
                <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to start tracking team progress here." />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.9rem] border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
            {activity.length ? (
              activity.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-border bg-card p-4">
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.user?.name || "Unknown"} {item.project?.title ? `• ${item.project.title}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={ListChecks} title="No recent activity" description="Task and project activity will appear here once work starts moving." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-heading">Smart Reminders</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upcoming and overdue work the team should keep on the radar.</p>
        </div>

        {reminders.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {reminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Clock3} title="All clear" description="No urgent reminders at the moment. You're in a healthy delivery window." />
        )}
      </section>
    </div>
  );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
