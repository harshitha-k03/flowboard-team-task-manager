import { useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import type { Task, TaskStatus } from "@/types";
import { cn, formatDate, getDueLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KanbanBoardProps {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void> | void;
}

const columns: Array<{ status: TaskStatus; title: string; tone: string }> = [
  { status: "Todo", title: "Todo", tone: "bg-secondary text-muted-foreground" },
  { status: "In Progress", title: "In Progress", tone: "bg-secondary text-muted-foreground" },
  { status: "In Review", title: "In Review", tone: "bg-secondary text-muted-foreground" },
  { status: "Done", title: "Done", tone: "bg-secondary text-muted-foreground" },
  { status: "Blocked", title: "Blocked", tone: "bg-secondary text-muted-foreground" }
];

const quickActions: Array<{ label: string; status: TaskStatus; className: string }> = [
  { label: "Start", status: "In Progress", className: "border-blue-200 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700" },
  { label: "Review", status: "In Review", className: "border-blue-200 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700" },
  { label: "Done", status: "Done", className: "border-blue-200 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700" },
  { label: "Block", status: "Blocked", className: "border-blue-200 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700" }
];

const softPillClass = "inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground";

export function KanbanBoard({ tasks, onOpenTask, onStatusChange }: KanbanBoardProps) {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const runStatusAction = async (task: Task, status: TaskStatus) => {
    setPendingAction(`${task.id}-${status}`);

    try {
      await onStatusChange(task, status);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status);

        return (
          <section
            key={column.status}
            className="rounded-[1.9rem] border border-border bg-card p-4 shadow-sm"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              const task = tasks.find((item) => item.id === dragTaskId);
              if (task && task.status !== column.status) {
                void runStatusAction(task, column.status);
              }
              setDragTaskId(null);
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className={cn("rounded-full px-3 py-1 text-xs font-semibold", column.tone)}>{column.title}</div>
              <span className="text-sm text-muted-foreground">{columnTasks.length}</span>
            </div>

            <div className="space-y-3">
              {columnTasks.map((task) => (
                <article
                  key={task.id}
                  draggable
                  onDragStart={() => setDragTaskId(task.id)}
                  onDragEnd={() => setDragTaskId(null)}
                  className={cn(
                    "cursor-grab rounded-[1.5rem] border border-border bg-secondary p-4 transition hover:shadow-sm active:cursor-grabbing",
                    "border-l-4 border-l-border"
                  )}
                >
                  <button type="button" onClick={() => onOpenTask(task.id)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-foreground">{task.title}</h3>
                      <span className={softPillClass}>{task.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{task.project?.title || "No project"}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{formatDate(task.dueDate)}</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-muted-foreground">{getDueLabel(task.dueDate, task.status)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={softPillClass}>{task.priority}</span>
                    </div>
                  </button>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                      <Button
                        key={action.status}
                        variant="outline"
                        size="sm"
                        className={cn("h-8 px-3 text-xs", action.className)}
                        disabled={pendingAction !== null}
                        onClick={() => void runStatusAction(task, action.status)}
                      >
                        {pendingAction === `${task.id}-${action.status}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </article>
              ))}

              {!columnTasks.length ? (
                <div className="rounded-[1.5rem] border border-dashed border-border bg-secondary px-4 py-8 text-center text-sm text-muted-foreground">
                  No tasks in {column.title.toLowerCase()}.
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
