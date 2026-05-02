import {
  BarChart3,
  Bell,
  CalendarClock,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users2,
  Zap
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const workspaceItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/my-tasks", label: "My Tasks", icon: Zap },
  { to: "/notifications", label: "Notifications", icon: Bell }
];

const adminItems = [
  { to: "/team", label: "Team", icon: Users2 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/deadlines", label: "Smart Deadline", icon: CalendarClock }
];

const utilityItems = [{ to: "/settings", label: "Settings", icon: Settings }];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);

  const primaryItems = user?.role === "admin" ? [...workspaceItems, ...adminItems] : workspaceItems;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/50 transition-opacity lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border/70 bg-card px-5 py-6 shadow-sm transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <div className="relative h-7 w-7">
              <span className="absolute left-0 top-0 h-2.5 w-7 rounded-full bg-primary" />
              <span className="absolute left-0 top-3 h-2.5 w-5 rounded-full bg-primary" />
              <span className="absolute left-0 top-6 h-2.5 w-3 rounded-full bg-primary" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">FlowBoard</p>
            <p className="text-sm text-muted-foreground">Team task manager</p>
          </div>
        </div>

        <div className="mt-8 rounded-[1.7rem] border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-white">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback name={user?.name} className="bg-primary text-sm font-semibold text-primary-foreground" />
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user?.name || "Team Manager"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.roleLabel || "Member"}</p>
            </div>
          </div>
          <p className="mt-3 truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <div className="mt-8 space-y-2">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
          <nav className="space-y-1">
            {primaryItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto space-y-2">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Preferences</p>
          <nav className="space-y-1">
            {utilityItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
