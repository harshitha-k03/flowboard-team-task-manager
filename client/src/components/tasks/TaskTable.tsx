import { useState } from "react";
import { CalendarDays, GripVertical, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Task, TaskStatus } from "@/types";
import { formatDate, getDueLabel } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TaskTableProps {
  tasks: Task[];
  isAdmin: boolean;
  showProject?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, status: TaskStatus) => Promise<void> | void;
}

const quickActions: Array<{
  label: string;
  status: TaskStatus;
}> = [
  { label: "Start", status: "In Progress" },
  { label: "Send to Review", status: "In Review" },
  { label: "Mark Done", status: "Done" },
  { label: "Block", status: "Blocked" }
];

const actionButtonClass = "border-blue-200 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700";
const softPillClass = "inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground";

export function TaskTable({ tasks, isAdmin, showProject = true, onEdit, onDelete, onStatusChange }: TaskTableProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const runStatusAction = async (task: Task, status: TaskStatus) => {
    if (!onStatusChange) {
      return;
    }

    setPendingAction(`${task.id}-${status}`);

    try {
      await onStatusChange(task, status);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      <div className="hidden overflow-hidden rounded-[1.9rem] border border-border bg-card shadow-sm lg:block">
        <table className="min-w-full divide-y divide-border text-left">
          <thead className="bg-secondary">
            <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <th className="w-10 px-4 py-4" />
              <th className="px-6 py-4">Task Name</th>
              {showProject ? <th className="px-6 py-4">Project</th> : null}
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Quick Actions</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => (
              <tr key={task.id} className="align-top">
                <td className="px-4 py-5 text-slate-300">
                  <GripVertical className="h-4 w-4" />
                </td>
                <td className="px-6 py-5">
                  <div className="space-y-1 border-l-4 border-border pl-4">
                    <Link to={`/tasks/${task.id}`} className="text-base font-semibold text-foreground transition hover:text-primary">
                      {task.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{task.description || task.project?.title || "No description"}</p>
                  </div>
                </td>
                {showProject ? <td className="px-6 py-5 text-sm text-muted-foreground">{task.project?.title || "No project"}</td> : null}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-border">
                      <AvatarImage src={task.assignedTo.avatar} alt={task.assignedTo.name} />
                      <AvatarFallback name={task.assignedTo.name} />
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{task.assignedTo.name}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="space-y-2">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {formatDate(task.dueDate)}
                    </p>
                    <span className={softPillClass}>{getDueLabel(task.dueDate, task.status)}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={softPillClass}>{task.priority}</span>
                </td>
                <td className="px-6 py-5">
                  <span className={softPillClass}>{task.status}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                      <Button
                        key={action.status}
                        variant="outline"
                        size="sm"
                        className={actionButtonClass}
                        disabled={!onStatusChange || pendingAction !== null}
                        onClick={() => void runStatusAction(task, action.status)}
                      >
                        {pendingAction === `${task.id}-${action.status}` ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/tasks/${task.id}`}>View</Link>
                    </Button>
                    {isAdmin && onEdit ? (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
                        Edit
                      </Button>
                    ) : null}
                    {isAdmin && onDelete ? (
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => onDelete(task)}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {tasks.map((task) => (
          <Card key={task.id} className="rounded-[1.6rem] border-border shadow-sm">
            <CardContent className="space-y-4 border-l-4 border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={`/tasks/${task.id}`} className="font-semibold text-foreground">
                    {task.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{task.project?.title || "No project"}</p>
                </div>
                <span className={softPillClass}>{task.status}</span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-border">
                  <AvatarImage src={task.assignedTo.avatar} alt={task.assignedTo.name} />
                  <AvatarFallback name={task.assignedTo.name} />
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{task.assignedTo.name}</p>
                  <p className="text-sm text-muted-foreground">{getDueLabel(task.dueDate, task.status)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={softPillClass}>{task.priority}</span>
                <span className={softPillClass}>{formatDate(task.dueDate)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.status}
                    variant="outline"
                    size="sm"
                    className={actionButtonClass}
                    disabled={!onStatusChange || pendingAction !== null}
                    onClick={() => void runStatusAction(task, action.status)}
                  >
                    {pendingAction === `${task.id}-${action.status}` ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                    {action.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/tasks/${task.id}`}>View</Link>
                </Button>
                {isAdmin && onEdit ? (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
                    Edit
                  </Button>
                ) : null}
                {isAdmin && onDelete ? (
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => onDelete(task)}>
                    Delete
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
