import { useCallback, useEffect, useMemo, useState } from "react";
import { Kanban, Plus, Search, Share2, SquareKanban, Table2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { notify } from "@/lib/notify";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/shared/PageLoader";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskTable } from "@/components/tasks/TaskTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { copyText } from "@/lib/utils";
import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";
import { useAuthStore } from "@/store/auth-store";
import type { Project, Task, TaskFilters, TaskPriority, TaskStatus, UserSummary } from "@/types";

const taskStatuses: Array<TaskStatus | "all"> = ["all", "Todo", "In Progress", "In Review", "Done", "Blocked"];
const taskPriorities: Array<TaskPriority | "all"> = ["all", "Critical", "High", "Medium", "Low"];
const dueDateFilters: Array<TaskFilters["dueDate"]> = ["all", "today", "week", "overdue"];

const initialFilters = (search = ""): TaskFilters => ({
  status: "all",
  priority: "all",
  dueDate: "all",
  project: "all",
  assignee: "all",
  search
});

export function TasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [filters, setFilters] = useState<TaskFilters>(initialFilters(searchParams.get("search") || ""));

  const assignees = useMemo(() => {
    const map = new Map<string, UserSummary>();
    projects.forEach((project) => {
      project.members.forEach((member) => {
        map.set(member.id, member);
      });
    });
    return Array.from(map.values());
  }, [projects]);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [nextTasks, nextProjects] = await Promise.all([taskService.list(filters), projectService.list()]);
      setTasks(nextTasks);
      setProjects(nextProjects);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }

    await taskService.remove(task.id);
    notify.success("Task deleted.");
    await loadData();
  };

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

    await loadData();
  };

  const activeChips = useMemo(
    () => [
      filters.status !== "all" ? { key: "status", label: `Status: ${filters.status}` } : null,
      filters.priority !== "all" ? { key: "priority", label: `Priority: ${filters.priority}` } : null,
      filters.dueDate !== "all" ? { key: "dueDate", label: `Due: ${filters.dueDate}` } : null,
      filters.project !== "all"
        ? { key: "project", label: `Project: ${projects.find((project) => project.id === filters.project)?.title || "Selected"}` }
        : null,
      filters.assignee !== "all"
        ? { key: "assignee", label: `Assignee: ${assignees.find((member) => member.id === filters.assignee)?.name || "Selected"}` }
        : null,
      filters.search?.trim() ? { key: "search", label: `Search: ${filters.search}` } : null
    ].filter(Boolean) as Array<{ key: keyof TaskFilters; label: string }>,
    [assignees, filters, projects]
  );

  if (loading) {
    return <PageLoader label="Loading tasks..." />;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Tasks</p>
          <h1 className="page-heading">Manage and track all your tasks in one place.</h1>
          <p className="max-w-3xl page-subtle">Use smart filters, status actions, and kanban drag-and-drop to keep delivery moving.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center rounded-2xl border border-border bg-card p-1 shadow-sm">
            <Button variant={view === "table" ? "default" : "ghost"} size="icon" className="h-10 w-10 rounded-xl" onClick={() => setView("table")}>
              <Table2 className="h-4 w-4" />
            </Button>
            <Button variant={view === "kanban" ? "default" : "ghost"} size="icon" className="h-10 w-10 rounded-xl" onClick={() => setView("kanban")}>
              <Kanban className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            className="h-12 rounded-2xl"
            onClick={async () => {
              await copyText(window.location.href);
              notify.info("Tasks page link copied.");
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>

          {isAdmin ? (
            <Button
              className="h-12 rounded-2xl px-5"
              onClick={() => {
                setSelectedTask(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-border bg-card p-5 shadow-sm xl:grid-cols-6">
        <Select value={filters.status || "all"} onValueChange={(value) => setFilters((current) => ({ ...current, status: value as TaskStatus | "all" }))}>
          <SelectTrigger className="h-12 rounded-2xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {taskStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.priority || "all"} onValueChange={(value) => setFilters((current) => ({ ...current, priority: value as TaskPriority | "all" }))}>
          <SelectTrigger className="h-12 rounded-2xl">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {taskPriorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority === "all" ? "All priorities" : priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.dueDate || "all"} onValueChange={(value) => setFilters((current) => ({ ...current, dueDate: value as TaskFilters["dueDate"] }))}>
          <SelectTrigger className="h-12 rounded-2xl">
            <SelectValue placeholder="Due date" />
          </SelectTrigger>
          <SelectContent>
            {dueDateFilters.map((option) => (
              <SelectItem key={option} value={option || "all"}>
                {option === "all" ? "Anytime" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.project || "all"} onValueChange={(value) => setFilters((current) => ({ ...current, project: value }))}>
          <SelectTrigger className="h-12 rounded-2xl">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin ? (
          <Select value={filters.assignee || "all"} onValueChange={(value) => setFilters((current) => ({ ...current, assignee: value }))}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              {assignees.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center rounded-2xl bg-secondary px-4 text-sm text-muted-foreground">
            Showing only tasks assigned to you.
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search || ""}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search tasks..."
            className="h-12 rounded-2xl pl-11"
          />
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        {[
          { label: "Overdue", value: "overdue" },
          { label: "Due Today", value: "today" },
          { label: "Due This Week", value: "week" }
        ].map((chip) => {
          const active = filters.dueDate === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilters((current) => ({ ...current, dueDate: active ? "all" : (chip.value as TaskFilters["dueDate"]) }))}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? "bg-[#DBEAFE] text-[#1D4ED8]" : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {chip.label}
            </button>
          );
        })}

        {activeChips.length ? (
          <>
            {activeChips.map((chip) => (
              <span key={chip.label} className="rounded-full bg-[#DBEAFE] px-4 py-2 text-sm font-medium text-[#1D4ED8]">
                {chip.label}
              </span>
            ))}
            <Button variant="outline" className="rounded-full" onClick={() => setFilters(initialFilters(""))}>
              Clear Filters
            </Button>
          </>
        ) : null}
      </section>

      {tasks.length ? (
        view === "table" ? (
          <TaskTable
            tasks={tasks}
            isAdmin={isAdmin}
            onEdit={(task) => {
              setSelectedTask(task);
              setDialogOpen(true);
            }}
            onDelete={(task) => void handleDelete(task)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <KanbanBoard
            tasks={tasks}
            onOpenTask={(taskId) => navigate(`/tasks/${taskId}`)}
            onStatusChange={handleStatusChange}
          />
        )
      ) : (
        <EmptyState
          icon={SquareKanban}
          title="No tasks found"
          description="Try adjusting the smart filters or create a new task to start filling the board."
          action={
            isAdmin ? (
              <Button
                onClick={() => {
                  setSelectedTask(null);
                  setDialogOpen(true);
                }}
              >
                Create task
              </Button>
            ) : null
          }
        />
      )}

      {isAdmin ? (
        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          projects={projects}
          task={selectedTask}
          onSaved={async () => {
            await loadData();
            setSelectedTask(null);
          }}
        />
      ) : null}
    </div>
  );
}
