import type { ProjectStatus, TaskPriority, TaskStatus } from "@/types";
import { cn, getPriorityTone, getProjectStatusTone, getReminderTone, getTaskStatusTone } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return <Badge className={cn("border", getProjectStatusTone(status), className)}>{status}</Badge>;
}

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return <Badge className={cn("border", getTaskStatusTone(status), className)}>{status}</Badge>;
}

export function PriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  return <Badge className={cn("border", getPriorityTone(priority), className)}>{priority}</Badge>;
}

export function ReminderTypeBadge({
  type,
  className
}: {
  type: "overdue" | "today" | "tomorrow" | "upcoming";
  className?: string;
}) {
  return <Badge className={cn("border capitalize", getReminderTone(type), className)}>{type}</Badge>;
}
