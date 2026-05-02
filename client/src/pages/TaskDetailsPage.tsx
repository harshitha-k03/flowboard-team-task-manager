import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Paperclip,
  SquarePen,
  UserRound
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { notify } from "@/lib/notify";
import { AIHelperPanel } from "@/components/tasks/AIHelperPanel";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/EntityBadges";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/shared/PageLoader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatHours, formatRelativeTime, getSubtaskProgress } from "@/lib/utils";
import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";
import { useAuthStore } from "@/store/auth-store";
import type { Project, TaskDetails, TaskStatus } from "@/types";

const quickStatuses: Array<{
  label: string;
  status: TaskStatus;
}> = [
  { label: "Start", status: "In Progress" },
  { label: "Send to Review", status: "In Review" },
  { label: "Mark Done", status: "Done" },
  { label: "Block", status: "Blocked" }
];

const statusActionClass = "border-blue-200 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700";

const tabs = [
  { id: "details", label: "Details" },
  { id: "subtasks", label: "Subtasks" },
  { id: "comments", label: "Comments" },
  { id: "files", label: "Files" },
  { id: "activity", label: "Activity" }
] as const;

type TaskTab = (typeof tabs)[number]["id"];

export function TaskDetailsPage() {
  const { taskId = "" } = useParams();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [details, setDetails] = useState<TaskDetails | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskTab>("details");
  const [statusUpdating, setStatusUpdating] = useState<TaskStatus | null>(null);
  const [subtasksSaving, setSubtasksSaving] = useState(false);

  const task = details?.task || null;
  const subtaskProgress = useMemo(() => getSubtaskProgress(task?.subtasks || []), [task?.subtasks]);

  const loadTask = useCallback(async () => {
    setLoading(true);

    try {
      const [nextDetails, nextProjects] = await Promise.all([taskService.getById(taskId), isAdmin ? projectService.list() : Promise.resolve([])]);
      setDetails(nextDetails);
      setProjects(nextProjects);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, taskId]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task) {
      return;
    }

    setStatusUpdating(status);

    try {
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

      await loadTask();
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleCommentSubmit = async () => {
    if (!task || !comment.trim()) {
      notify.error("Comment text is required.");
      return;
    }

    await taskService.addComment(task.id, comment.trim());
    notify.success("Comment posted.");
    setComment("");
    await loadTask();
  };

  const handleSubtaskToggle = async (subtaskId?: string) => {
    if (!task || !subtaskId) {
      return;
    }

    setSubtasksSaving(true);

    try {
      await taskService.update(task.id, {
        subtasks: task.subtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
        )
      });
      notify.info("Subtask checklist updated.");
      await loadTask();
    } finally {
      setSubtasksSaving(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading task details..." />;
  }

  if (!task || !details) {
    return <EmptyState icon={CheckCircle2} title="Task not found" description="The task may have been removed or is no longer assigned to you." />;
  }

  return (
    <div className="space-y-8">
      <Link to="/tasks" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Task
                </span>
                <div>
                  <h1 className="page-heading">{task.title}</h1>
                  <p className="mt-3 max-w-3xl page-subtle">{task.description || "No description added for this task yet."}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <TaskStatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isAdmin ? (
                  <Button variant="ghost" className="rounded-2xl" onClick={() => setDialogOpen(true)}>
                    <SquarePen className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.8rem] bg-slate-50 p-5 sm:grid-cols-2 xl:grid-cols-5">
              <MetaCard icon={CalendarDays} label="Project" value={task.project?.title || "No project"} />
              <MetaCard icon={UserRound} label="Assignee" value={task.assignedTo.name} />
              <MetaCard icon={CalendarDays} label="Due Date" value={formatDate(task.dueDate)} />
              <MetaCard icon={Clock3} label="Priority" value={task.priority} />
              <MetaCard icon={Clock3} label="Est. Time" value={formatHours(task.estimatedHours)} />
            </div>

            <section className="flex flex-wrap gap-6 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 pb-3 text-sm font-medium transition ${
                    activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {tab.id === "subtasks" ? ` (${task.subtasks.length})` : ""}
                  {tab.id === "comments" ? ` (${task.comments.length})` : ""}
                  {tab.id === "files" ? ` (${task.attachments.length})` : ""}
                </button>
              ))}
            </section>

            {activeTab === "details" ? (
              <div className="rounded-[1.8rem] bg-white">
                <h2 className="text-lg font-semibold text-foreground">Task Details</h2>
                <div className="mt-4 rounded-[1.6rem] bg-slate-50 p-5">
                  <ul className="space-y-2 text-sm leading-7 text-foreground">
                    <li>Project: {task.project?.title || "No project assigned"}</li>
                    <li>Status: {task.status}</li>
                    <li>Priority: {task.priority}</li>
                    <li>Estimated time: {formatHours(task.estimatedHours)}</li>
                    <li>Created by: {task.createdBy.name}</li>
                    <li>Last updated: {formatRelativeTime(task.updatedAt)}</li>
                  </ul>
                </div>
              </div>
            ) : null}

            {activeTab === "subtasks" ? (
              <div className="space-y-4">
                <div className="rounded-[1.6rem] bg-slate-50 p-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-foreground">
                      {subtaskProgress.completed}/{subtaskProgress.total} completed
                    </p>
                    <span className="text-sm font-semibold text-foreground">{subtaskProgress.percent}%</span>
                  </div>
                  <ProgressBar value={subtaskProgress.percent} barClassName={subtaskProgress.percent === 100 ? "bg-[#16A34A]" : undefined} />
                </div>

                {task.subtasks.length ? (
                  task.subtasks.map((subtask) => (
                    <button
                      key={subtask.id || subtask.title}
                      type="button"
                      disabled={subtasksSaving}
                      onClick={() => void handleSubtaskToggle(subtask.id)}
                      className="flex w-full items-center gap-3 rounded-[1.4rem] bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100 disabled:opacity-70"
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                          subtask.completed ? "border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]" : "border-[#93C5FD] bg-white text-[#2563EB]"
                        }`}
                      >
                        {subtask.completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                      </div>
                      <span className={subtask.completed ? "text-sm text-slate-500 line-through" : "text-sm text-foreground"}>{subtask.title}</span>
                    </button>
                  ))
                ) : (
                  <EmptyState icon={CheckCircle2} title="No subtasks yet" description="This task hasn't been broken into smaller steps yet." />
                )}
              </div>
            ) : null}

            {activeTab === "comments" ? (
              <div className="space-y-4">
                <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share a progress update or blocker..." className="bg-white" />
                <Button onClick={() => void handleCommentSubmit()}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Post Comment
                </Button>

                <div className="space-y-3">
                  {task.comments.length ? (
                    task.comments.map((item) => (
                      <div key={item.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-foreground">{item.user.name}</p>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyState icon={MessageSquare} title="No comments yet" description="Use comments to coordinate progress, risks, and handoff notes." />
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === "files" ? (
              <div className="space-y-3">
                {task.attachments.length ? (
                  task.attachments.map((attachment) => (
                    <a
                      key={attachment.id || attachment.url}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[1.5rem] bg-slate-50 px-4 py-4 transition hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{attachment.url}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Open</span>
                    </a>
                  ))
                ) : (
                  <EmptyState icon={Paperclip} title="No attachments yet" description="Reference links and supporting assets will appear here." />
                )}
              </div>
            ) : null}

            {activeTab === "activity" ? (
              <div className="space-y-3">
                {details.activity.length ? (
                  details.activity.map((item) => (
                    <div key={item.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState icon={Clock3} title="No activity yet" description="Task activity will appear here as the task moves through its lifecycle." />
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <AIHelperPanel task={task} />

          <Card className="rounded-[1.9rem] border-white shadow-sm">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-foreground">Quick Status Update</h2>
              <div className="flex flex-wrap gap-2">
                {quickStatuses.map((action) => (
                  <Button
                    key={action.status}
                    variant="outline"
                    size="sm"
                    className={statusActionClass}
                    disabled={Boolean(statusUpdating)}
                    onClick={() => void handleStatusChange(action.status)}
                  >
                    {statusUpdating === action.status ? "Updating..." : action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {isAdmin ? (
        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          projects={projects}
          task={task}
          onSaved={async () => {
            await loadTask();
          }}
        />
      ) : null}
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
