import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { dashboardService } from "@/services/dashboardService";
import { useAuthStore } from "@/store/auth-store";
import type { ActivityItem, ReminderItem } from "@/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopbarProps {
  onOpenSidebar: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  href: string;
  time: string;
  tone: string;
  icon: LucideIcon;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setNotificationOpen(false);
    setProfileOpen(false);

    const loadNotifications = async () => {
      try {
        const [nextReminders, nextActivity] = await Promise.all([dashboardService.getReminders(), dashboardService.getActivity()]);
        if (!cancelled) {
          setReminders(nextReminders.slice(0, 4));
          setActivity(nextActivity.slice(0, 4));
        }
      } catch {
        if (!cancelled) {
          setReminders([]);
          setActivity([]);
        }
      }
    };

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const reminderNotifications = reminders.map((reminder) => {
      if (reminder.type === "overdue") {
        return {
          id: `reminder-${reminder.id}`,
          title: "Overdue task",
          message: reminder.message,
          href: `/tasks/${reminder.id}`,
          time: formatDate(reminder.dueDate),
          tone: "bg-[#FEF2F2] text-[#DC2626]",
          icon: AlertTriangle
        };
      }

      if (reminder.type === "today") {
        return {
          id: `reminder-${reminder.id}`,
          title: "Due today",
          message: reminder.message,
          href: `/tasks/${reminder.id}`,
          time: formatDate(reminder.dueDate),
          tone: "bg-[#FFF7ED] text-[#EA580C]",
          icon: AlertTriangle
        };
      }

      return {
        id: `reminder-${reminder.id}`,
        title: "Assigned task",
        message: reminder.message,
        href: `/tasks/${reminder.id}`,
        time: formatDate(reminder.dueDate),
        tone: "bg-[#EDE9FE] text-[#6D28D9]",
        icon: Sparkles
      };
    });

    const activityNotifications = activity.map((item) => {
      if (item.action.toLowerCase().includes("comment")) {
        return {
          id: `activity-${item.id}`,
          title: "New comment",
          message: item.action,
          href: item.task?.id ? `/tasks/${item.task.id}` : item.project?.id ? `/projects/${item.project.id}` : "/dashboard",
          time: formatRelativeTime(item.createdAt),
          tone: "bg-[#EFF6FF] text-[#1D4ED8]",
          icon: MessageSquare
        };
      }

      if (item.action.toLowerCase().includes("done")) {
        return {
          id: `activity-${item.id}`,
          title: "Completed update",
          message: item.action,
          href: item.task?.id ? `/tasks/${item.task.id}` : "/dashboard",
          time: formatRelativeTime(item.createdAt),
          tone: "bg-[#F0FDF4] text-[#16A34A]",
          icon: CheckCircle2
        };
      }

      return {
        id: `activity-${item.id}`,
        title: "Status changed",
        message: item.action,
        href: item.task?.id ? `/tasks/${item.task.id}` : item.project?.id ? `/projects/${item.project.id}` : "/dashboard",
        time: formatRelativeTime(item.createdAt),
        tone: "bg-[#FFF7ED] text-[#EA580C]",
        icon: AlertTriangle
      };
    });

    return [...reminderNotifications, ...activityNotifications].slice(0, 6);
  }, [activity, reminders]);

  const notificationTarget = "/notifications";

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(search.trim() ? `/tasks?search=${encodeURIComponent(search.trim())}` : "/tasks");
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur lg:left-72">
      <div className="flex h-20 items-center gap-4 px-5 sm:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenSidebar}>
          <Menu className="h-5 w-5" />
        </Button>

        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative ml-auto max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks, projects, people..."
              className="h-12 rounded-2xl border-border bg-secondary pl-11 shadow-sm"
            />
          </div>
        </form>

        <ThemeToggle className="h-12 w-12 rounded-2xl" />

        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="relative h-12 w-12 rounded-2xl border-border bg-card"
            onClick={() => {
              setNotificationOpen((open) => !open);
              setProfileOpen(false);
            }}
          >
            <Bell className="h-5 w-5" />
            {notifications.length ? (
              <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {notifications.length}
              </span>
            ) : null}
          </Button>

          {notificationOpen ? (
            <div className="absolute right-0 top-14 w-[22rem] rounded-3xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Notifications</p>
                  <p className="text-xs text-muted-foreground">Workspace updates, reminders, and activity</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(notificationTarget)}>
                  Open
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {notifications.length ? (
                  notifications.map((notification) => {
                    const Icon = notification.icon;

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          setNotificationOpen(false);
                          navigate(notification.href);
                        }}
                        className="flex w-full items-start gap-3 rounded-2xl border border-border bg-secondary p-3 text-left transition hover:border-primary/20 hover:bg-primary/5"
                      >
                        <div className={`rounded-2xl p-2 ${notification.tone}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                            <span className="text-[11px] text-muted-foreground">{notification.time}</span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{notification.message}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No notifications right now.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm transition hover:bg-secondary"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationOpen(false);
            }}
          >
            <Avatar className="h-11 w-11">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback name={user?.name} />
            </Avatar>
            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.roleLabel}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {profileOpen ? (
            <div className="absolute right-0 top-16 w-64 rounded-3xl border border-border bg-card p-4 shadow-soft">
              <div className="pb-3">
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <Button variant="ghost" className="w-full justify-start text-rose-600 hover:text-rose-600" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
