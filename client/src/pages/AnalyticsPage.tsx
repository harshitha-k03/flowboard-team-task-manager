import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, TrendingUp } from "lucide-react";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageLoader } from "@/components/shared/PageLoader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { downloadTextFile } from "@/lib/utils";
import { analyticsService } from "@/services/analyticsService";
import type { ProductivityAnalytics, WeeklyAnalytics } from "@/types";

const pieColors = ["#22c55e", "#f59e0b", "#ef4444", "#2563eb", "#cbd5e1"];

export function AnalyticsPage() {
  const [weekly, setWeekly] = useState<WeeklyAnalytics | null>(null);
  const [productivity, setProductivity] = useState<ProductivityAnalytics | null>(null);
  const [trendRange, setTrendRange] = useState<"2" | "4">("4");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async () => {
      try {
        const [nextWeekly, nextProductivity] = await Promise.all([analyticsService.getWeekly(), analyticsService.getProductivity()]);

        if (!cancelled) {
          setWeekly(nextWeekly);
          setProductivity(nextProductivity);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleOverdueTrends = useMemo(() => {
    if (!productivity) {
      return [];
    }

    return productivity.overdueTrends.slice(-Number(trendRange));
  }, [productivity, trendRange]);

  if (loading) {
    return <PageLoader label="Loading analytics..." />;
  }

  if (!weekly || !productivity) {
    return <EmptyState icon={TrendingUp} title="Analytics unavailable" description="We couldn't load the weekly analytics data." />;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Analytics</p>
          <h1 className="page-heading">Weekly productivity and delivery trends</h1>
          <p className="max-w-3xl page-subtle">Track performance trends and productivity insights across your team.</p>
        </div>

        <Button
          variant="outline"
          className="h-12 rounded-2xl"
          onClick={() =>
            downloadTextFile(
              "flowboard-analytics.json",
              JSON.stringify(
                {
                  weekly,
                  productivity
                },
                null,
                2
              ),
              "application/json;charset=utf-8"
            )
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Tasks" value={weekly.kpis.totalTasksThisWeek} hint="Created this week" icon={TrendingUp} />
        <StatCard title="Completed" value={weekly.kpis.totalCompletedThisWeek} hint="Finished this week" icon={TrendingUp} accentClassName="bg-emerald-50 text-emerald-600" />
        <StatCard title="Pending" value={Math.max(weekly.kpis.totalTasksThisWeek - weekly.kpis.totalCompletedThisWeek, 0)} hint="Still open" icon={TrendingUp} accentClassName="bg-amber-50 text-amber-600" />
        <StatCard title="Overdue" value={weekly.kpis.overdueTasks} hint="Past due date" icon={TrendingUp} accentClassName="bg-rose-50 text-rose-600" />
        <StatCard title="Weekly Productivity" value={`${weekly.kpis.weeklyProductivity}%`} hint="Completed / total this week" icon={TrendingUp} accentClassName="bg-violet-50 text-violet-600" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr_0.9fr]">
        <ChartCard title="Weekly Productivity" description="Completion percentage across the current week.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly.weeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="productivity" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Task Completion" description="Completed vs pending task volume by day.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly.completionBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="completed" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pending" fill="#cbd5e1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card className="rounded-[1.9rem] border-white shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Project Progress Summary</h2>
                <p className="mt-1 text-sm text-muted-foreground">Healthy delivery across active workspaces.</p>
              </div>
            </div>

            {productivity.projectProgressSummary.length ? (
              productivity.projectProgressSummary.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{project.title}</p>
                      <p className="text-sm text-muted-foreground">{project.status}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} className="h-2.5" />
                </div>
              ))
            ) : (
              <EmptyState icon={TrendingUp} title="No project analytics yet" description="Projects will appear here once workspaces are seeded." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr_0.9fr]">
        <Card className="rounded-[1.9rem] border-white shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Most Productive Members</h2>
                <p className="mt-1 text-sm text-muted-foreground">Top contributors this cycle.</p>
              </div>
            </div>

            {productivity.mostProductiveMembers.length ? (
              productivity.mostProductiveMembers.map((member, index) => (
                <div key={member.id} className="flex items-center justify-between gap-4 rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-primary shadow-sm">{index + 1}</div>
                    <Avatar className="h-11 w-11 border-white">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback name={member.name} />
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.completed} tasks completed</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{member.productivity}%</span>
                </div>
              ))
            ) : (
              <EmptyState icon={TrendingUp} title="No productivity leaders yet" description="Member productivity will show here once tasks are assigned and completed." />
            )}
          </CardContent>
        </Card>

        <ChartCard
          title="Overdue Trends"
          description="How many tasks landed in overdue windows across recent weeks."
          action={
            <select
              value={trendRange}
              onChange={(event) => setTrendRange(event.target.value as "2" | "4")}
              className="h-10 rounded-2xl border border-border bg-white px-3 text-sm"
            >
              <option value="2">Last 2 Weeks</option>
              <option value="4">Last 4 Weeks</option>
            </select>
          }
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibleOverdueTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card className="rounded-[1.9rem] border-white shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Task Distribution</h2>
              <p className="mt-1 text-sm text-muted-foreground">Current spread of tasks by workflow status.</p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={productivity.taskDistribution} dataKey="count" nameKey="name" innerRadius={65} outerRadius={92} paddingAngle={4}>
                    {productivity.taskDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {productivity.taskDistribution.map((entry, index) => {
                const total = productivity.taskDistribution.reduce((sum, item) => sum + item.count, 0);
                const percentage = total ? Math.round((entry.count / total) * 100) : 0;

                return (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                      <span className="text-sm text-foreground">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {entry.count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
