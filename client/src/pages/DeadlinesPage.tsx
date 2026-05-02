import { useEffect, useState } from "react";
import { AlertTriangle, BellRing, CalendarClock, CheckCircle2, CalendarDays, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { notify } from "@/lib/notify";
import { ChartCard } from "@/components/ChartCard";
import { ReminderCard } from "@/components/ReminderCard";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/shared/PageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deadlinesService } from "@/services/deadlinesService";
import { taskService } from "@/services/taskService";
import { formatDate } from "@/lib/utils";
import type { DeadlineData, Task } from "@/types";

const neutralBadgeClass = "rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground";
const blueActionClass = "border-blue-200 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700";

export function DeadlinesPage() {
  const [data, setData] = useState<DeadlineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleTask, setRescheduleTask] = useState<Task | null>(null);
  const [nextDueDate, setNextDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDeadlines = async () => {
    setLoading(true);

    try {
      const nextData = await deadlinesService.getAll();
      setData(nextData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDeadlines();
  }, []);

  const handleOpenReschedule = (task: Task) => {
    setRescheduleTask(task);
    setNextDueDate(task.dueDate.slice(0, 10));
  };

  const handleRescheduleSave = async () => {
    if (!rescheduleTask || !nextDueDate) {
      notify.error("Please select a new due date.");
      return;
    }

    setSaving(true);

    try {
      await taskService.update(rescheduleTask.id, { dueDate: nextDueDate });
      notify.success("Task rescheduled successfully.");
      setRescheduleTask(null);
      setNextDueDate("");
      await loadDeadlines();
    } finally {
      setSaving(false);
    }
  };

  const handleRemindTeam = async (task: Task) => {
    await taskService.addComment(task.id, "Deadline reminder sent from FlowBoard.");
    notify.info("Reminder posted to task activity.");
    await loadDeadlines();
  };

  const handleMarkDone = async (task: Task) => {
    await taskService.patchStatus(task.id, "Done");
    notify.success("Task marked as done.");
    await loadDeadlines();
  };

  const handleViewCalendar = () => {
    document.getElementById("deadline-timeline")?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return <PageLoader label="Loading smart deadlines..." />;
  }

  if (!data) {
    return <EmptyState icon={CalendarClock} title="Deadline data unavailable" description="We couldn't load the deadline view right now." />;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Smart deadlines</p>
        <h1 className="page-heading">Stay ahead of due dates and delivery risk</h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          Review what is due today, what slips tomorrow, where overdue work is building, and take quick action without leaving the page.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Due today" value={data.dueToday.length} />
        <MetricCard label="Due tomorrow" value={data.dueTomorrow.length} />
        <MetricCard label="Overdue" value={data.overdue.length} tone="text-[#DC2626]" />
        <MetricCard label="Upcoming 7 days" value={data.upcoming7Days.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ChartCard title="Deadline risk chart" description="A quick breakdown of risk levels in the current window.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.deadlineRiskChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Reminder feed" description="Upcoming nudges generated from live deadline data.">
          <div className="grid gap-4">
            {data.reminders.length ? (
              data.reminders.map((reminder) => <ReminderCard key={reminder.id} reminder={reminder} />)
            ) : (
              <EmptyState icon={BellRing} title="No reminders right now" description="Your deadline queue is currently clear." />
            )}
          </div>
        </ChartCard>
      </section>

      <section id="deadline-timeline">
        <ChartCard title="Timeline overview" description="Task volume forecast across the next seven days.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" tickFormatter={(value: string) => formatDate(value)} />
                <YAxis stroke="#64748b" />
                <Tooltip labelFormatter={(value) => formatDate(String(value))} />
                <Bar dataKey="count" fill="#0F172A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DeadlineBucket
          title="Due today"
          icon={CalendarDays}
          tasks={data.dueToday}
          onReschedule={handleOpenReschedule}
          onRemindTeam={handleRemindTeam}
          onMarkDone={handleMarkDone}
          onViewCalendar={handleViewCalendar}
        />
        <DeadlineBucket
          title="Due tomorrow"
          icon={CalendarClock}
          tasks={data.dueTomorrow}
          onReschedule={handleOpenReschedule}
          onRemindTeam={handleRemindTeam}
          onMarkDone={handleMarkDone}
          onViewCalendar={handleViewCalendar}
        />
        <DeadlineBucket
          title="Overdue tasks"
          icon={AlertTriangle}
          tasks={data.overdue}
          onReschedule={handleOpenReschedule}
          onRemindTeam={handleRemindTeam}
          onMarkDone={handleMarkDone}
          onViewCalendar={handleViewCalendar}
        />
        <DeadlineBucket
          title="Upcoming 7 days"
          icon={CheckCircle2}
          tasks={data.upcoming7Days}
          onReschedule={handleOpenReschedule}
          onRemindTeam={handleRemindTeam}
          onMarkDone={handleMarkDone}
          onViewCalendar={handleViewCalendar}
        />
      </section>

      <Dialog open={Boolean(rescheduleTask)} onOpenChange={(open) => (!open ? setRescheduleTask(null) : null)}>
        <DialogContent className="max-w-lg rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Reschedule Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              Move the task to a new date and FlowBoard will automatically recalculate its priority.
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reschedule-date">New due date</Label>
              <Input id="reschedule-date" type="date" value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRescheduleTask(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleRescheduleSave()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save new date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ label, value, tone = "text-foreground" }: { label: string; value: number; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function DeadlineBucket({
  title,
  icon: Icon,
  tasks,
  onReschedule,
  onRemindTeam,
  onMarkDone,
  onViewCalendar
}: {
  title: string;
  icon: typeof CalendarClock;
  tasks: Task[];
  onReschedule: (task: Task) => void;
  onRemindTeam: (task: Task) => Promise<void>;
  onMarkDone: (task: Task) => Promise<void>;
  onViewCalendar: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>

        {tasks.length ? (
          tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-border bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={neutralBadgeClass}>{task.status}</span>
                <span className={neutralBadgeClass}>{task.priority}</span>
              </div>
              <p className="mt-3 font-semibold text-foreground">{task.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{task.project?.title || "No project"} • Due {formatDate(task.dueDate)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className={blueActionClass} onClick={() => onReschedule(task)}>
                  Reschedule
                </Button>
                <Button size="sm" variant="outline" onClick={() => void onRemindTeam(task)}>
                  Remind Team
                </Button>
                <Button size="sm" variant="outline" className={blueActionClass} onClick={() => void onMarkDone(task)}>
                  Mark Done
                </Button>
                <Button size="sm" variant="ghost" onClick={onViewCalendar}>
                  View Calendar
                </Button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState icon={Icon} title={`No ${title.toLowerCase()}`} description="Nothing is sitting in this deadline bucket right now." />
        )}
      </CardContent>
    </Card>
  );
}
