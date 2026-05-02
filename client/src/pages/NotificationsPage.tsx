import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, MessageSquare, RefreshCcw, Search, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/shared/PageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dashboardService } from "@/services/dashboardService";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { ActivityItem, ReminderItem } from "@/types";

type NotificationKind = "all" | "deadline" | "comment" | "assignment" | "completed" | "activity";

interface NotificationViewItem {
  id: string;
  kind: Exclude<NotificationKind, "all">;
  title: string;
  message: string;
  time: string;
  href: string;
  tone: string;
  icon: LucideIcon;
}

const kindLabels: Record<NotificationKind, string> = {
  all: "All notifications",
  deadline: "Deadlines",
  comment: "Comments",
  assignment: "Assignments",
  completed: "Completed",
  activity: "Activity"
};

function buildNotifications(reminders: ReminderItem[], activity: ActivityItem[]): NotificationViewItem[] {
  const reminderItems = reminders.map((reminder) => {
    if (reminder.type === "overdue" || reminder.type === "today" || reminder.type === "tomorrow") {
      return {
        id: `reminder-${reminder.id}`,
        kind: "deadline" as const,
        title: reminder.type === "overdue" ? "Overdue alert" : reminder.type === "today" ? "Due today" : "Due tomorrow",
        message: reminder.message,
        time: formatDate(reminder.dueDate),
        href: `/tasks/${reminder.id}`,
        tone: reminder.type === "overdue" ? "bg-rose-50 text-rose-600" : "bg-orange-50 text-orange-600",
        icon: AlertTriangle
      };
    }

    return {
      id: `reminder-${reminder.id}`,
      kind: "assignment" as const,
      title: "Assigned task",
      message: reminder.message,
      time: formatDate(reminder.dueDate),
      href: `/tasks/${reminder.id}`,
      tone: "bg-violet-50 text-violet-600",
      icon: Sparkles
    };
  });

  const activityItems = activity.map((item) => {
    const action = item.action.toLowerCase();

    if (action.includes("comment")) {
      return {
        id: `activity-${item.id}`,
        kind: "comment" as const,
        title: "Comment notification",
        message: item.action,
        time: formatRelativeTime(item.createdAt),
        href: item.task?.id ? `/tasks/${item.task.id}` : item.project?.id ? `/projects/${item.project.id}` : "/dashboard",
        tone: "bg-sky-50 text-sky-600",
        icon: MessageSquare
      };
    }

    if (action.includes("done") || action.includes("completed")) {
      return {
        id: `activity-${item.id}`,
        kind: "completed" as const,
        title: "Completed update",
        message: item.action,
        time: formatRelativeTime(item.createdAt),
        href: item.task?.id ? `/tasks/${item.task.id}` : "/dashboard",
        tone: "bg-emerald-50 text-emerald-600",
        icon: CheckCircle2
      };
    }

    return {
      id: `activity-${item.id}`,
      kind: "activity" as const,
      title: "Workspace activity",
      message: item.action,
      time: formatRelativeTime(item.createdAt),
      href: item.task?.id ? `/tasks/${item.task.id}` : item.project?.id ? `/projects/${item.project.id}` : "/dashboard",
      tone: "bg-blue-50 text-blue-600",
      icon: Bell
    };
  });

  return [...reminderItems, ...activityItems];
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<NotificationKind>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    const [nextReminders, nextActivity] = await Promise.all([
      dashboardService.getReminders(),
      dashboardService.getActivity()
    ]);
    setReminders(nextReminders);
    setActivity(nextActivity);
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      try {
        await loadNotifications();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  const notifications = useMemo(() => buildNotifications(reminders, activity), [activity, reminders]);
  const filteredNotifications = useMemo(
    () =>
      notifications.filter((item) => {
        const matchesFilter = filter === "all" ? true : item.kind === filter;
        const matchesSearch =
          !search.trim() ||
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.message.toLowerCase().includes(search.toLowerCase());

        return matchesFilter && matchesSearch;
      }),
    [filter, notifications, search]
  );

  const counts = useMemo(
    () => ({
      deadline: notifications.filter((item) => item.kind === "deadline").length,
      comment: notifications.filter((item) => item.kind === "comment").length,
      assignment: notifications.filter((item) => item.kind === "assignment").length,
      completed: notifications.filter((item) => item.kind === "completed").length
    }),
    [notifications]
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading notifications..." />;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Notifications</p>
          <h1 className="page-heading">Workspace notification center</h1>
          <p className="max-w-3xl page-subtle">Review deadline alerts, comments, assignments, and completed work updates from live project activity.</p>
        </div>
        <Button variant="outline" className="h-11 rounded-2xl" disabled={refreshing} onClick={() => void handleRefresh()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <NotificationMetric label="Deadline alerts" value={counts.deadline} tone="bg-rose-50 text-rose-600" />
        <NotificationMetric label="Comments" value={counts.comment} tone="bg-sky-50 text-sky-600" />
        <NotificationMetric label="Assignments" value={counts.assignment} tone="bg-violet-50 text-violet-600" />
        <NotificationMetric label="Completed updates" value={counts.completed} tone="bg-emerald-50 text-emerald-600" />
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-border bg-card p-5 shadow-sm lg:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notifications..." className="h-12 rounded-2xl pl-11" />
        </div>

        <Select value={filter} onValueChange={(value) => setFilter(value as NotificationKind)}>
          <SelectTrigger className="h-12 rounded-2xl">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(kindLabels) as NotificationKind[]).map((kind) => (
              <SelectItem key={kind} value={kind}>
                {kindLabels[kind]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {filteredNotifications.length ? (
        <section className="grid gap-4">
          {filteredNotifications.map((notification) => {
            const Icon = notification.icon;

            return (
              <button
                key={notification.id}
                type="button"
                className="rounded-[1.5rem] border border-border bg-card p-5 text-left shadow-sm transition hover:border-primary/30 hover:bg-secondary"
                onClick={() => navigate(notification.href)}
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-2xl p-3 ${notification.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{notification.title}</p>
                      <span className="text-sm text-muted-foreground">{notification.time}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      ) : (
        <EmptyState icon={Bell} title="No notifications found" description="Try a different filter or refresh the notification feed." />
      )}
    </div>
  );
}

function NotificationMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="rounded-[1.6rem] border-border shadow-sm">
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`rounded-2xl p-3 ${tone}`}>
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
