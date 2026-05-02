import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, CircleDot, Database, Plane, Search, UserCheck, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/shared/PageLoader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { demoService } from "@/services/demoService";
import { teamService } from "@/services/teamService";
import { useAuthStore } from "@/store/auth-store";
import type { Availability, TeamSummary, TeamWorkloadItem } from "@/types";

type WorkloadSegment = TeamWorkloadItem["loadStatus"];
type WorkloadFilter = "all" | WorkloadSegment;

const workloadSegments: WorkloadSegment[] = ["Balanced", "Overloaded", "Underutilized"];
const workloadPalette: Record<WorkloadSegment, { fill: string; soft: string; text: string; border: string }> = {
  Balanced: {
    fill: "#22C55E",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200"
  },
  Overloaded: {
    fill: "#F97316",
    soft: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200"
  },
  Underutilized: {
    fill: "#94A3B8",
    soft: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200"
  }
};
const donutColors = workloadSegments.map((segment) => workloadPalette[segment].fill);
const availabilityTone: Record<Availability, string> = {
  Available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Busy: "border-amber-200 bg-amber-50 text-amber-700",
  "On Leave": "border-slate-200 bg-slate-100 text-slate-700"
};

const loadTone = {
  Balanced: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Overloaded: "border-orange-200 bg-orange-50 text-orange-700",
  Underutilized: "border-slate-200 bg-slate-100 text-slate-700"
} as const;

export function TeamPage() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [workload, setWorkload] = useState<TeamWorkloadItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "admin" | "member">("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | Availability>("all");
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const loadTeam = useCallback(async () => {
    const [nextTeam, nextWorkload] = await Promise.all([teamService.getTeam(), teamService.getWorkload()]);
    setTeam(nextTeam);
    setWorkload(nextWorkload);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitialTeam = async () => {
      try {
        if (!cancelled) {
          await loadTeam();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialTeam();

    return () => {
      cancelled = true;
    };
  }, [loadTeam]);

  const handleLoadDemoWorkspace = async () => {
    if (!window.confirm("Load sample interview workspace? This resets the current demo database.")) {
      return;
    }

    setLoadingDemo(true);

    try {
      const result = await demoService.loadWorkspace();
      setAuth(result.session.token, result.session.user);
      await loadTeam();
      notify.success(`Demo loaded: ${result.summary.projects} projects, ${result.summary.tasks} tasks.`);
    } finally {
      setLoadingDemo(false);
    }
  };

  const enrichedWorkload = useMemo(
    () =>
      workload.map((member) => {
        return {
          ...member,
          utilization: member.utilization,
          segment: member.loadStatus
        };
      }),
    [workload]
  );

  const filteredMembers = useMemo(() => {
    if (!team) {
      return [];
    }

    return team.members.filter((member) => {
      const matchesSearch =
        !search ||
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = filter === "all" ? true : member.role === filter;
      const matchesAvailability = availabilityFilter === "all" ? true : (member.availability || "Available") === availabilityFilter;
      return matchesSearch && matchesRole && matchesAvailability;
    });
  }, [availabilityFilter, filter, search, team]);

  const availabilitySummary = useMemo(() => {
    const members = team?.members || [];

    return {
      available: members.filter((member) => (member.availability || "Available") === "Available").length,
      busy: members.filter((member) => member.availability === "Busy").length,
      onLeave: members.filter((member) => member.availability === "On Leave").length
    };
  }, [team]);

  const balanceData = useMemo(() => {
    const groups = enrichedWorkload.reduce(
      (accumulator, member) => {
        const group = accumulator.find((item) => item.name === member.segment);
        if (group) {
          group.value += 1;
        }
        return accumulator;
      },
      workloadSegments.map((segment) => ({ name: segment, value: 0 }))
    );

    return groups;
  }, [enrichedWorkload]);

  const visibleWorkload = useMemo(
    () => (workloadFilter === "all" ? enrichedWorkload : enrichedWorkload.filter((member) => member.segment === workloadFilter)),
    [enrichedWorkload, workloadFilter]
  );

  const averageCapacity = useMemo(() => {
    if (!enrichedWorkload.length) {
      return 0;
    }

    return Math.round(enrichedWorkload.reduce((sum, member) => sum + member.utilization, 0) / enrichedWorkload.length);
  }, [enrichedWorkload]);

  const capacityStatus = averageCapacity >= 70 && averageCapacity <= 100 ? "Balanced" : averageCapacity > 100 ? "Overloaded" : "Underutilized";

  if (loading) {
    return <PageLoader label="Loading team insights..." />;
  }

  if (!team) {
    return <EmptyState icon={Users2} title="Team data unavailable" description="We couldn't load the team workspace right now." />;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Team</p>
          <h1 className="page-heading">Manage team members, roles, and workload distribution.</h1>
          <p className="max-w-3xl page-subtle">Understand who is active, how many projects each member supports, and where workload pressure is building.</p>
        </div>
        <Button variant="outline" className="h-11 rounded-2xl" disabled={loadingDemo} onClick={() => void handleLoadDemoWorkspace()}>
          <Database className="mr-2 h-4 w-4" />
          {loadingDemo ? "Loading demo..." : "Load Demo Data"}
        </Button>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Total Members" value={team.totalMembers} accent="bg-blue-50 text-blue-600" icon={Users2} />
          <MetricCard label="Active Members" value={team.activeMembers} accent="bg-emerald-50 text-emerald-600" icon={UserCheck} />
          <MetricCard label="Available Now" value={availabilitySummary.available} accent="bg-sky-50 text-sky-600" icon={CircleDot} />
          <MetricCard label="On Leave" value={availabilitySummary.onLeave} accent="bg-slate-100 text-slate-700" icon={Plane} />
        </div>

        <Card className="rounded-[1.9rem] border-border bg-gradient-to-br from-white via-white to-blue-50/70 shadow-sm dark:from-card dark:via-card dark:to-slate-900/30">
          <CardContent className="grid gap-4 p-6 md:grid-cols-[0.9fr_1.1fr]">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={balanceData} dataKey="value" innerRadius={65} outerRadius={90} paddingAngle={4} startAngle={90} endAngle={-270}>
                    {balanceData.map((entry, index) => (
                      <Cell key={entry.name} fill={donutColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<BalanceTooltip totalMembers={team.totalMembers} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Workload Balance</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{averageCapacity}%</p>
                <p className={cn("text-sm", workloadPalette[capacityStatus].text)}>{capacityStatus}</p>
                <p className="mt-1 text-xs text-muted-foreground">Click a group below to focus the workload chart.</p>
              </div>

              {balanceData.map((item, index) => {
                const segment = item.name;
                const percentage = team.totalMembers ? Math.round((item.value / team.totalMembers) * 100) : 0;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setWorkloadFilter(segment)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition hover:shadow-sm",
                      workloadFilter === segment
                        ? `${workloadPalette[segment].soft} ${workloadPalette[segment].border}`
                        : "border-transparent bg-white/70 hover:border-border dark:bg-card"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: donutColors[index] }} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{segment}</p>
                        <p className="text-sm text-muted-foreground">{item.value} members</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{percentage}%</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.9rem] border-border shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Team Members</h2>
                <p className="mt-1 text-sm text-muted-foreground">Search across people, roles, and workload.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members..." className="h-11 rounded-2xl pl-11" />
                </div>

                <Select value={filter} onValueChange={(value) => setFilter(value as "all" | "admin" | "member")}>
                  <SelectTrigger className="h-11 w-[160px] rounded-2xl">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={availabilityFilter} onValueChange={(value) => setAvailabilityFilter(value as "all" | Availability)}>
                  <SelectTrigger className="h-11 w-[180px] rounded-2xl">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All availability</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <AvailabilityCard label="Available" value={availabilitySummary.available} tone={availabilityTone.Available} />
              <AvailabilityCard label="Busy" value={availabilitySummary.busy} tone={availabilityTone.Busy} />
              <AvailabilityCard label="On Leave" value={availabilitySummary.onLeave} tone={availabilityTone["On Leave"]} />
            </div>

            {filteredMembers.length ? (
              <div className="overflow-hidden rounded-[1.5rem] border border-border">
                <table className="min-w-full divide-y divide-border text-left">
                  <thead className="bg-slate-50/80">
                    <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="px-5 py-4">Member</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">Email</th>
                      <th className="px-5 py-4">Projects</th>
                      <th className="px-5 py-4">Availability</th>
                      <th className="px-5 py-4">Workload</th>
                      <th className="px-5 py-4">Weekly Productivity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredMembers.map((member) => (
                      <tr key={member.id}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 border-border">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback name={member.name} />
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.roleLabel}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground">{member.roleLabel}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{member.email}</td>
                        <td className="px-5 py-4 text-sm text-foreground">{member.assignedProjectsCount}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${availabilityTone[member.availability || "Available"]}`}>
                            {member.availability || "Available"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-2">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${loadTone[member.loadStatus || "Balanced"]}`}>
                              {member.loadStatus || "Balanced"}
                            </span>
                            <p className="text-xs text-muted-foreground">{member.activeTasks} active tasks</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="min-w-[140px]">
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-medium text-foreground">{member.weeklyProductivity}%</span>
                            </div>
                            <ProgressBar value={member.weeklyProductivity} className="h-2.5" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Users2} title="No members found" description="Try a broader search or clear the role and availability filters." />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.9rem] border-border bg-gradient-to-br from-white to-slate-50 shadow-sm dark:from-card dark:to-slate-900/30">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Workload Distribution</h2>
                <p className="mt-1 text-sm text-muted-foreground">Capacity by member this week. Use the chips to filter the chart.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <WorkloadFilterChip active={workloadFilter === "all"} label="All" onClick={() => setWorkloadFilter("all")} />
                {workloadSegments.map((segment) => (
                  <WorkloadFilterChip
                    key={segment}
                    active={workloadFilter === segment}
                    label={segment}
                    segment={segment}
                    onClick={() => setWorkloadFilter(segment)}
                  />
                ))}
              </div>
            </div>

            {visibleWorkload.length ? (
              <div className="rounded-[1.5rem] border border-border bg-white p-4 dark:bg-card">
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visibleWorkload} margin={{ top: 12, right: 8, left: -16, bottom: 8 }}>
                      <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                      <Tooltip content={<WorkloadTooltip />} cursor={{ fill: "#DBEAFE", opacity: 0.45 }} />
                      <Bar dataKey="utilization" radius={[12, 12, 8, 8]} barSize={34}>
                        {visibleWorkload.map((member) => (
                          <Cell key={member.id} fill={workloadPalette[member.segment].fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <EmptyState icon={Users2} title="No workload data" description="Choose another workload filter to see member capacity." />
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-[1.9rem] border-border shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Suggested Reassignments</h2>
                <p className="mt-1 text-sm text-muted-foreground">Rule-based suggestions from workload and availability signals.</p>
              </div>
            </div>

            {team.reassignmentSuggestions.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {team.reassignmentSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="rounded-[1.5rem] border border-border bg-secondary p-5">
                    <p className="text-sm font-semibold text-foreground">{suggestion.task.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{suggestion.task.projectTitle}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 font-medium text-orange-700">
                        {suggestion.from.name}
                      </span>
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                        {suggestion.to.name}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{suggestion.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={ArrowRightLeft} title="No reassignment needed" description="The current team workload does not need automatic balancing suggestions." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
  icon: Icon = Users2
}: {
  label: string;
  value: number;
  accent: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="rounded-[1.7rem] border-border shadow-sm">
      <CardContent className="flex items-start gap-4 p-6">
        <div className={`rounded-2xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AvailabilityCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function WorkloadFilterChip({
  active,
  label,
  segment,
  onClick
}: {
  active: boolean;
  label: string;
  segment?: WorkloadSegment;
  onClick: () => void;
}) {
  const palette = segment ? workloadPalette[segment] : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active && palette ? `${palette.soft} ${palette.border} ${palette.text}` : null,
        active && !palette ? "border-blue-200 bg-blue-50 text-blue-700" : null,
        !active ? "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground" : null
      )}
    >
      {label}
    </button>
  );
}

function BalanceTooltip({
  active,
  payload,
  totalMembers
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: WorkloadSegment; value: number } }>;
  totalMembers: number;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;
  const percentage = totalMembers ? Math.round((item.value / totalMembers) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
      <p className="text-sm font-semibold text-foreground">{item.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {item.value} members • {percentage}% of team
      </p>
    </div>
  );
}

function WorkloadTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: TeamWorkloadItem & { segment: WorkloadSegment }; value: number }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const member = payload[0].payload;

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
      <p className="text-sm font-semibold text-foreground">{member.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{member.availability}</p>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p>Capacity: {member.utilization}%</p>
        <p>Open tasks: {member.openTasks}</p>
        <p>Projects: {member.assignedProjects}</p>
      </div>
    </div>
  );
}
