import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Focus, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notify } from "@/lib/notify";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/shared/PageLoader";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/EntityBadges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dashboardService } from "@/services/dashboardService";
import { taskService } from "@/services/taskService";
import { useAuthStore } from "@/store/auth-store";
import { formatDate, formatRelativeTime, getGreeting } from "@/lib/utils";
import type { ReminderItem, Task, TaskStatus } from "@/types";

const quickStatuses: TaskStatus[] = ["Todo", "In Progress", "In Review", "Done"];

const isToday = (value: string) => {
  const target = new Date(value);
  const now = new Date();
  return target.getUTCFullYear() === now.getUTCFullYear() && target.getUTCMonth() === now.getUTCMonth() && target.getUTCDate() === now.getUTCDate();
};

export function FocusModePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const [nextTasks, nextReminders] = await Promise.all([
        taskService.list(user?.role === "admin" ? { assignee: user.id } : {}),
        dashboardService.getReminders()
      ]);

      setTasks(nextTasks);
      setReminders(nextReminders.slice(0, 4));
      setActiveTaskId((current) => current || nextTasks.find((task) => task.status !== "Done")?.id || nextTasks[0]?.id || null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user?.id) {
      void loadTasks();
    }
  }, [loadTasks, user?.id]);

  const todayTasks = useMemo(() => tasks.filter((task) => task.status !== "Done" && isToday(task.dueDate)), [tasks]);
  const highPriorityTasks = useMemo(() => tasks.filter((task) => task.status !== "Done" && ["Critical", "High"].includes(task.priority)), [tasks]);
  const upcomingTasks = useMemo(() => tasks.filter((task) => task.status !== "Done" && !isToday(task.dueDate)).slice(0, 4), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === "Done"), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((task) => task.status === "In Progress"), [tasks]);
  const activeTask = useMemo(() => tasks.find((task) => task.id === activeTaskId) || highPriorityTasks[0] || todayTasks[0] || upcomingTasks[0] || null, [
    activeTaskId,
    highPriorityTasks,
    tasks,
    todayTasks,
    upcomingTasks
  ]);
  const completionRate = useMemo(() => (tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0), [completedTasks.length, tasks.length]);

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
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
    await loadTasks();
  };

  if (loading) {
    return <PageLoader label="Loading your focus mode..." />;
  }

  if (!tasks.length) {
    return <EmptyState icon={Focus} title="No assigned tasks yet" description="Once work is assigned to you, FlowBoard will turn this page into your personal focus zone." />;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="page-heading">
            {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="max-w-3xl page-subtle">Stay close to what matters today with focused worklists, quick status actions, and reminder-aware planning.</p>
        </div>

        <button
          type="button"
          className="flex items-center gap-3 self-start rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"
          onClick={() => setFocusMode((current) => !current)}
        >
          <span className="text-sm font-medium text-foreground">Focus Mode</span>
          <span className={`relative h-6 w-11 rounded-full transition ${focusMode ? "bg-primary" : "bg-slate-200"}`}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${focusMode ? "left-6" : "left-1"}`} />
          </span>
        </button>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="rounded-[1.9rem] border-border shadow-sm">
          <CardContent className="space-y-5 p-6">
            <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ActionTile icon={Zap} label="Start Focus" onClick={() => activeTask && setFocusMode(true)} />
              <ActionTile icon={CalendarDays} label="Open Tasks" onClick={() => navigate("/tasks")} />
              <ActionTile icon={Sparkles} label="Priority Queue" onClick={() => document.getElementById("high-priority")?.scrollIntoView({ behavior: "smooth" })} />
              <ActionTile icon={Clock3} label="View Calendar" onClick={() => navigate(user?.role === "admin" ? "/deadlines" : "/tasks")} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.9rem] border-border shadow-sm">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-4">
            <ProgressMetric label="Complete" value={`${completionRate}%`} />
            <ProgressMetric label="Completed" value={`${completedTasks.length}`} />
            <ProgressMetric label="In Progress" value={`${inProgressTasks.length}`} />
            <ProgressMetric label="Total Tasks" value={`${tasks.length}`} />
          </CardContent>
        </Card>
      </section>

      {focusMode && activeTask ? (
        <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Focus Mode is ON
                </span>
                <TaskStatusBadge status={activeTask.status} />
                <PriorityBadge priority={activeTask.priority} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Current focus</p>
                <h2 className="mt-2 text-3xl font-semibold text-foreground">{activeTask.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{activeTask.description || "No description added for this task."}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickStatuses.map((status) => (
                <Button key={status} variant={activeTask.status === status ? "default" : "outline"} size="sm" onClick={() => void handleStatusChange(activeTask, status)}>
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr_0.8fr]">
        <Card className="rounded-[1.9rem] border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Today&apos;s Tasks</h2>
                <p className="mt-1 text-sm text-muted-foreground">{todayTasks.length} tasks due today</p>
              </div>
            </div>

            {todayTasks.length ? (
              todayTasks.map((task) => (
                <TaskListItem key={task.id} task={task} onOpen={() => setActiveTaskId(task.id)} onStatusChange={handleStatusChange} />
              ))
            ) : (
              <EmptyState icon={Clock3} title="No tasks due today" description="Your focus queue is clear for today." />
            )}
          </CardContent>
        </Card>

        <div id="high-priority" className="space-y-4">
          <Card className="rounded-[1.9rem] border-border shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">High Priority Tasks</h2>
                <p className="mt-1 text-sm text-muted-foreground">Work that needs close attention first.</p>
              </div>
              {highPriorityTasks.length ? (
                highPriorityTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setActiveTaskId(task.id)}
                    className="w-full rounded-[1.5rem] border border-border bg-white p-4 text-left transition hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{task.project?.title || "No project"}</p>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState icon={Sparkles} title="No high priority tasks" description="Nothing urgent is sitting in your queue." />
              )}
            </CardContent>
          </Card>

          {!focusMode ? (
            <Card className="rounded-[1.9rem] border-border shadow-sm">
              <CardContent className="space-y-4 p-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Upcoming</h2>
                  <p className="mt-1 text-sm text-muted-foreground">What&apos;s coming next.</p>
                </div>
                {upcomingTasks.length ? (
                  upcomingTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setActiveTaskId(task.id)}
                      className="w-full rounded-[1.5rem] border border-border bg-white p-4 text-left transition hover:border-slate-300"
                    >
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDate(task.dueDate)}</p>
                    </button>
                  ))
                ) : (
                  <EmptyState icon={CalendarDays} title="No upcoming tasks" description="Everything is already in today’s queue." />
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="rounded-[1.9rem] border-border shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Smart Reminders</h2>
                <p className="mt-1 text-sm text-muted-foreground">Upcoming nudges from your workspace.</p>
              </div>
              {reminders.length ? (
                reminders.map((reminder) => (
                  <button
                    key={reminder.id}
                    type="button"
                    onClick={() => navigate(`/tasks/${reminder.id}`)}
                    className="w-full rounded-[1.5rem] border border-border bg-white p-4 text-left transition hover:border-slate-300"
                  >
                    <p className="font-medium text-foreground">{reminder.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{reminder.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(reminder.dueDate)}</p>
                  </button>
                ))
              ) : (
                <EmptyState icon={Clock3} title="No reminders right now" description="Your reminder queue is currently clear." />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.9rem] border-border shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Smart Priority Engine</h2>
                <p className="mt-1 text-sm text-muted-foreground">A quick read on urgency, load, and impact.</p>
              </div>
              <PriorityInsight label="Deadline urgency" value={`${Math.min(100, highPriorityTasks.length * 24 + todayTasks.length * 18)}%`} />
              <PriorityInsight label="Workload balance" value={`${Math.max(48, 100 - inProgressTasks.length * 8)}%`} />
              <PriorityInsight label="Project impact" value={`${Math.min(100, 60 + highPriorityTasks.length * 10)}%`} />
            </CardContent>
          </Card>
        </div>
      </section>

      {!focusMode ? (
        <Card className="rounded-[1.9rem] border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold text-foreground">Completed recently</h2>
            {completedTasks.length ? (
              completedTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="rounded-[1.5rem] border border-border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.project?.title || "No project"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(task.updatedAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={CheckCircle2} title="No completed tasks yet" description="Completed work will roll up here as you close tasks." />
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ActionTile({
  icon: Icon,
  label,
  onClick
}: {
  icon: typeof Zap;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[1.4rem] border border-border bg-white p-4 text-left transition hover:border-slate-300"
    >
      <div className="w-fit rounded-2xl border border-border bg-white p-3 text-primary shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
    </button>
  );
}

function ProgressMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-white p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function TaskListItem({
  task,
  onOpen,
  onStatusChange
}: {
  task: Task;
  onOpen: () => void;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[1.5rem] border border-border bg-white p-4 text-left transition hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{task.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{task.project?.title || "No project"}</p>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {quickStatuses.map((status) => (
          <Button
            key={status}
            type="button"
            variant={task.status === status ? "default" : "outline"}
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              void onStatusChange(task, status);
            }}
          >
            {status}
          </Button>
        ))}
      </div>
    </button>
  );
}

function PriorityInsight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
    </div>
  );
}
