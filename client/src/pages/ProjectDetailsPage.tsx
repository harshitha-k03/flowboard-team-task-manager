import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, CalendarDays, CheckSquare, Circle, FolderKanban, Plus, Users2 } from "lucide-react";
import { Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, CartesianGrid } from "recharts";
import { Link, useParams } from "react-router-dom";
import { notify } from "@/lib/notify";
import { EmptyState } from "@/components/EmptyState";
import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { ProjectStatusBadge } from "@/components/shared/EntityBadges";
import { PageLoader } from "@/components/shared/PageLoader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskTable } from "@/components/tasks/TaskTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";
import { useAuthStore } from "@/store/auth-store";
import type { ProjectDetails, Task, TaskStatus } from "@/types";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "team", label: "Team" },
  { id: "activity", label: "Activity" }
] as const;

const pieColors = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#cbd5e1"];

type ProjectTab = (typeof tabs)[number]["id"];

export function ProjectDetailsPage() {
  const { projectId = "" } = useParams();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProjectTab>("overview");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadProject = useCallback(async () => {
    setLoading(true);

    try {
      const nextDetails = await projectService.getById(projectId);
      setDetails(nextDetails);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const taskStatusData = useMemo(
    () =>
      details?.metrics.tasksByStatus.map((item) => ({
        status: item.status,
        count: item.count
      })) || [],
    [details]
  );

  const progressSeries = useMemo(() => {
    if (!details) {
      return [];
    }

    const source = details.tasks.slice(0, 7);
    if (!source.length) {
      return [];
    }

    return source.map((task, index) => ({
      label: `P${index + 1}`,
      progress: Math.min(100, Math.max(15, task.status === "Done" ? 100 : task.status === "In Progress" ? 68 : task.status === "In Review" ? 82 : 40))
    }));
  }, [details]);

  const handleTaskStatusChange = async (task: Task, status: TaskStatus) => {
    await taskService.patchStatus(task.id, status);
    if (status === "Done") {
      notify.success("Task completed.");
    } else if (status === "In Review") {
      notify.info("Task sent to review.");
    } else if (status === "Blocked") {
      notify.warning("Task marked as blocked.");
    } else {
      notify.info("Task status updated.");
    }
    await loadProject();
  };

  const handleTaskDelete = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }

    await taskService.remove(task.id);
    notify.success("Task deleted.");
    await loadProject();
  };

  if (loading) {
    return <PageLoader label="Loading project details..." />;
  }

  if (!details) {
    return <EmptyState icon={FolderKanban} title="Project not found" description="The project may have been removed or you may no longer have access." />;
  }

  return (
    <div className="space-y-8">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-1 items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-primary/10 text-primary">
              <FolderKanban className="h-8 w-8" />
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="page-heading">{details.project.title}</h1>
                <p className="mt-3 max-w-3xl page-subtle">{details.project.description || "No description added yet."}</p>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <ProjectStatusBadge status={details.project.status} />
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Due {formatDate(details.project.dueDate)}
                </span>
                <span>{details.project.members.length} team members</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[440px]">
            <MetaCard label="Due Date" value={formatDate(details.project.dueDate)} />
            <div className="rounded-[1.6rem] bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Team</p>
              <div className="mt-3">
                <AvatarGroup users={details.project.members} />
              </div>
            </div>
            <div className="rounded-[1.6rem] bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{details.metrics.progress}%</p>
              <ProgressBar value={details.metrics.progress} className="mt-3 h-2.5" />
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition",
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === "overview" ? (
        <div className="space-y-4">
          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Milestones</h2>
                </div>

                {details.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-4">
                    <div className={cn(
                      "mt-1 flex h-7 w-7 items-center justify-center rounded-full border",
                      milestone.status === "done"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                        : milestone.status === "active"
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-slate-200 bg-white text-slate-400"
                    )}>
                      <Circle className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <div className="flex-1 border-l border-dashed border-border pl-4">
                      <p className="font-medium text-foreground">{milestone.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDate(milestone.date)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-white shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Progress Overview</h2>
                  <p className="mt-1 text-sm text-muted-foreground">A quick signal on momentum across active work items.</p>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Line type="monotone" dataKey="progress" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Tasks by Status</h2>
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={taskStatusData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={78} paddingAngle={4}>
                        {taskStatusData.map((entry, index) => (
                          <Cell key={entry.status} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {taskStatusData.map((item, index) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                        <span className="text-sm text-foreground">{item.status}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>

                <ProgressBar value={details.metrics.progress} className="h-2.5" />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.85fr]">
            <Card className="rounded-[1.9rem] border-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
                {details.activity.length ? (
                  details.activity.slice(0, 5).map((item) => (
                    <div key={item.id} className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState icon={Activity} title="No activity yet" description="Activity will populate as tasks and updates happen in this project." />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-xl font-semibold text-foreground">Team Workload</h2>
                {details.team.length ? (
                  details.team.map((member) => (
                    <div key={member.id} className="rounded-3xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.openTasks} open tasks</p>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{member.productivity}%</span>
                      </div>
                      <ProgressBar value={member.productivity} className="mt-3 h-2.5" />
                    </div>
                  ))
                ) : (
                  <EmptyState icon={Users2} title="No team workload yet" description="Assign tasks to members to build a workload view here." />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                <MetaCard label="Project Owner" value={details.project.createdBy.name} />
                <MetaCard label="Start Date" value={formatDate(details.project.createdAt)} />
                <MetaCard label="Last Updated" value={formatDate(details.project.updatedAt)} />
                <MetaCard label="Open Tasks" value={`${details.metrics.pendingTasks}`} />
              </CardContent>
            </Card>
          </section>
        </div>
      ) : null}

      {activeTab === "tasks" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-heading">Project tasks</h2>
              <p className="mt-1 text-sm text-muted-foreground">Track every task attached to this workspace.</p>
            </div>
            {isAdmin ? (
              <Button
                onClick={() => {
                  setSelectedTask(null);
                  setTaskDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            ) : null}
          </div>

          {details.tasks.length ? (
            <TaskTable
              tasks={details.tasks}
              isAdmin={isAdmin}
              showProject={false}
              onEdit={(task) => {
                setSelectedTask(task);
                setTaskDialogOpen(true);
              }}
              onDelete={(task) => void handleTaskDelete(task)}
              onStatusChange={handleTaskStatusChange}
            />
          ) : (
            <EmptyState icon={CheckSquare} title="No tasks yet" description="Create the first task for this project to start moving work." />
          )}
        </div>
      ) : null}

      {activeTab === "team" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {details.project.members.map((member) => {
            const workload = details.team.find((item) => item.id === member.id);
            return (
              <Card key={member.id} className="rounded-[1.8rem] border-white shadow-sm">
                <CardContent className="space-y-4 p-6">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MetaCard label="Open Tasks" value={`${workload?.openTasks ?? 0}`} compact />
                    <MetaCard label="Productivity" value={`${workload?.productivity ?? 0}%`} compact />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {activeTab === "activity" ? (
        <Card className="rounded-[1.9rem] border-white shadow-sm">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold text-foreground">Project activity feed</h2>
            {details.activity.length ? (
              details.activity.map((item) => (
                <div key={item.id} className="rounded-3xl bg-slate-50 p-4">
                  <p className="font-medium text-foreground">{item.action}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.user?.name || "Unknown"} • {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState icon={Activity} title="No project activity yet" description="Once updates happen here, this feed will show them in order." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {isAdmin ? (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          projects={[details.project]}
          task={selectedTask}
          defaultProjectId={details.project.id}
          onSaved={async () => {
            await loadProject();
            setSelectedTask(null);
          }}
        />
      ) : null}
    </div>
  );
}

function MetaCard({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={cn("rounded-[1.6rem] bg-slate-50 p-4", compact && "rounded-3xl")}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
