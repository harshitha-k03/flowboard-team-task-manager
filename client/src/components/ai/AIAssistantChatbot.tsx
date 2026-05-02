import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, MessageCircle, RefreshCcw, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardService } from "@/services/dashboardService";
import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";
import { teamService } from "@/services/teamService";
import { useAuthStore } from "@/store/auth-store";
import type { Project, ReminderItem, Task, TeamSummary } from "@/types";
import { cn, formatDate, getDueLabel, getDueType, isOverdue } from "@/lib/utils";

interface AssistantContext {
  tasks: Task[];
  projects: Project[];
  reminders: ReminderItem[];
  team: TeamSummary | null;
}

interface AssistantMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const quickPrompts = [
  "Summarize my work",
  "Today focus",
  "Overdue risks",
  "Project health",
  "Team workload",
  "Make it simple"
];

function createMessage(role: AssistantMessage["role"], text: string): AssistantMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    text
  };
}

function isOpenTask(task: Task) {
  return task.status !== "Done";
}

function priorityWeight(priority: Task["priority"]) {
  switch (priority) {
    case "Critical":
      return 4;
    case "High":
      return 3;
    case "Medium":
      return 2;
    default:
      return 1;
  }
}

function sortByUrgency(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const leftOverdue = isOverdue(left.dueDate, left.status) ? 1 : 0;
    const rightOverdue = isOverdue(right.dueDate, right.status) ? 1 : 0;
    const overdueDifference = rightOverdue - leftOverdue;

    if (overdueDifference) {
      return overdueDifference;
    }

    const priorityDifference = priorityWeight(right.priority) - priorityWeight(left.priority);

    if (priorityDifference) {
      return priorityDifference;
    }

    return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
  });
}

function taskLine(task: Task, index: number) {
  const projectTitle = task.project?.title || "No project";
  const assignee = task.assignedTo?.name || "Unassigned";

  return `${index + 1}. ${task.title} - ${projectTitle} - ${assignee} - ${getDueLabel(task.dueDate, task.status)} - ${task.priority}`;
}

function projectLine(project: Project, index: number) {
  return `${index + 1}. ${project.title} - ${project.health} - ${project.progress}% complete - due ${formatDate(project.dueDate)}`;
}

function buildSummary(context: AssistantContext, firstName?: string) {
  const openTasks = context.tasks.filter(isOpenTask);
  const completedTasks = context.tasks.filter((task) => task.status === "Done");
  const overdueTasks = openTasks.filter((task) => isOverdue(task.dueDate, task.status));
  const dueTodayTasks = openTasks.filter((task) => getDueType(task.dueDate, task.status) === "today");
  const highPriorityTasks = openTasks.filter((task) => task.priority === "Critical" || task.priority === "High");
  const blockedTasks = openTasks.filter((task) => task.status === "Blocked");
  const nextTasks = sortByUrgency([...overdueTasks, ...dueTodayTasks, ...highPriorityTasks, ...blockedTasks]).slice(0, 4);
  const delayedProjects = context.projects.filter((project) => project.health === "Delayed" || project.status === "At Risk");

  if (!context.tasks.length) {
    return "I do not see tasks in this workspace yet. Create a few tasks with assignees and due dates, then I can summarize the plan.";
  }

  const greeting = firstName ? `Hi ${firstName}, here is the simple version.` : "Here is the simple version.";
  const lines = [
    greeting,
    "",
    `Workspace snapshot: ${openTasks.length} open tasks, ${completedTasks.length} completed tasks, ${overdueTasks.length} overdue, ${dueTodayTasks.length} due today, and ${highPriorityTasks.length} critical/high priority.`,
    `Project status: ${context.projects.length} projects total, ${delayedProjects.length} need attention.`,
    "",
    "Best next steps:"
  ];

  if (nextTasks.length) {
    lines.push(...nextTasks.map(taskLine));
  } else {
    lines.push("1. No urgent task risk right now. Review upcoming deadlines and keep statuses updated.");
  }

  lines.push("", "Simple rule: clear overdue first, finish today's tasks second, then move high-priority work forward.");

  return lines.join("\n");
}

function buildTodayFocus(context: AssistantContext) {
  const openTasks = context.tasks.filter(isOpenTask);
  const focusTasks = sortByUrgency(
    openTasks.filter(
      (task) =>
        getDueType(task.dueDate, task.status) === "today" ||
        isOverdue(task.dueDate, task.status) ||
        task.priority === "Critical" ||
        task.priority === "High"
    )
  ).slice(0, 6);

  if (!focusTasks.length) {
    return "No urgent focus task found. Good place to be. Pick one medium-priority task, move it to In Progress, and avoid starting too many new tasks.";
  }

  return ["Today's focus list:", "", ...focusTasks.map(taskLine), "", "Keep it simple: choose the first task, update its status, then leave a comment when progress changes."].join("\n");
}

function buildOverdueResponse(context: AssistantContext) {
  const overdueTasks = sortByUrgency(context.tasks.filter((task) => isOpenTask(task) && isOverdue(task.dueDate, task.status))).slice(0, 8);

  if (!overdueTasks.length) {
    return "No overdue tasks right now. The team is not behind on deadlines. Keep watching tasks due today and tomorrow.";
  }

  return ["Overdue risks to handle first:", "", ...overdueTasks.map(taskLine), "", "Recommended move: reschedule if the date is no longer realistic, or mark the task Done if it is already complete."].join("\n");
}

function buildProjectHealth(context: AssistantContext) {
  if (!context.projects.length) {
    return "No projects found yet. Add projects so I can track health, progress, and deadline risk.";
  }

  const projects = [...context.projects].sort((left, right) => {
    const rank = { Delayed: 3, "At Risk": 2, "On Track": 1 };
    return (rank[right.health] || 0) - (rank[left.health] || 0);
  });

  return ["Project health summary:", "", ...projects.slice(0, 6).map(projectLine), "", "Watch projects marked At Risk or Delayed. They usually need fewer active tasks, clearer owners, or a deadline adjustment."].join("\n");
}

function buildTeamWorkload(context: AssistantContext) {
  if (!context.team) {
    return "Team workload is available to admins. If you are a member, focus on My Tasks and today's priorities.";
  }

  const members = context.team.members;
  const available = members.filter((member) => (member.availability || "Available") === "Available").length;
  const busy = members.filter((member) => member.availability === "Busy").length;
  const onLeave = members.filter((member) => member.availability === "On Leave").length;
  const overloaded = members.filter((member) => member.loadStatus === "Overloaded").length;

  const lines = [
    "Team workload summary:",
    "",
    `${context.team.activeMembers} active members, ${available} available, ${busy} busy, ${onLeave} on leave, and ${overloaded} overloaded.`,
    "",
    "Simple team rule: avoid assigning new urgent tasks to Busy or On Leave members."
  ];

  if (context.team.reassignmentSuggestions.length) {
    lines.push("", "Suggested reassignments:");
    lines.push(
      ...context.team.reassignmentSuggestions.slice(0, 3).map((suggestion, index) => {
        return `${index + 1}. Move ${suggestion.task.title} from ${suggestion.from.name} to ${suggestion.to.name}. ${suggestion.reason}`;
      })
    );
  }

  return lines.join("\n");
}

function buildSimplePlan(context: AssistantContext) {
  const openTasks = sortByUrgency(context.tasks.filter(isOpenTask));
  const firstTask = openTasks[0];

  if (!firstTask) {
    return "Everything looks clear. No open tasks need action right now.";
  }

  return [
    "Simple tracking plan:",
    "",
    `1. Start with: ${firstTask.title}.`,
    `2. Owner: ${firstTask.assignedTo?.name || "Unassigned"}.`,
    `3. Deadline: ${getDueLabel(firstTask.dueDate, firstTask.status)}.`,
    "4. Update status before starting and after finishing.",
    "5. Add one short comment if blocked.",
    "",
    "This keeps everyone on track without overthinking the whole workspace."
  ].join("\n");
}

function buildAssistantResponse(prompt: string, context: AssistantContext, firstName?: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("today") || normalized.includes("focus")) {
    return buildTodayFocus(context);
  }

  if (normalized.includes("overdue") || normalized.includes("risk") || normalized.includes("late")) {
    return buildOverdueResponse(context);
  }

  if (normalized.includes("project") || normalized.includes("health") || normalized.includes("progress")) {
    return buildProjectHealth(context);
  }

  if (normalized.includes("team") || normalized.includes("workload") || normalized.includes("member") || normalized.includes("leave")) {
    return buildTeamWorkload(context);
  }

  if (normalized.includes("simple") || normalized.includes("track") || normalized.includes("plan")) {
    return buildSimplePlan(context);
  }

  return buildSummary(context, firstName);
}

export function AIAssistantChatbot() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [context, setContext] = useState<AssistantContext | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const firstName = useMemo(() => user?.name?.split(" ")[0], [user?.name]);

  useEffect(() => {
    const openAssistant = () => setOpen(true);

    window.addEventListener("flowboard:open-ai-assistant", openAssistant);

    return () => {
      window.removeEventListener("flowboard:open-ai-assistant", openAssistant);
    };
  }, []);

  const loadContext = useCallback(async () => {
    setLoading(true);

    try {
      const [tasks, projects, reminders, team] = await Promise.all([
        taskService.list().catch(() => []),
        projectService.list().catch(() => []),
        dashboardService.getReminders().catch(() => []),
        user?.role === "admin" ? teamService.getTeam().catch(() => null) : Promise.resolve(null)
      ]);

      const nextContext = { tasks, projects, reminders, team };
      setContext(nextContext);
      return nextContext;
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (!open || context || messages.length) {
      return;
    }

    const bootstrapAssistant = async () => {
      const nextContext = await loadContext();
      setMessages([createMessage("assistant", buildSummary(nextContext, firstName))]);
    };

    void bootstrapAssistant();
  }, [context, firstName, loadContext, messages.length, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const askAssistant = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    setInput("");
    setMessages((current) => [...current, createMessage("user", trimmedPrompt)]);

    const nextContext = context || (await loadContext());
    const response = buildAssistantResponse(trimmedPrompt, nextContext, firstName);
    setMessages((current) => [...current, createMessage("assistant", response)]);
  };

  const handleRefresh = async () => {
    const nextContext = await loadContext();
    setMessages((current) => [...current, createMessage("assistant", `I refreshed the workspace.\n\n${buildSummary(nextContext, firstName)}`)]);
  };

  return (
    <>
      {open ? (
        <section className="fixed bottom-5 right-5 z-50 w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-[1.8rem] border border-border bg-card shadow-soft">
          <div className="border-b border-border bg-blue-50 px-5 py-4 dark:bg-blue-950/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-blue-600 p-2.5 text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">AI Track Assistant</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Summarizes tasks and keeps the team on track.</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={scrollRef} className="max-h-[24rem] space-y-3 overflow-y-auto bg-background/70 p-4">
            {loading && !messages.length ? (
              <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                Reading tasks, projects, deadlines, and team workload...
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm leading-6",
                  message.role === "assistant"
                    ? "border-blue-100 bg-white text-foreground dark:border-blue-900/50 dark:bg-card"
                    : "ml-8 border-blue-200 bg-blue-600 text-white"
                )}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
                  disabled={loading}
                  onClick={() => void askAssistant(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void askAssistant(input);
              }}
            >
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask for summary, today focus, risks..."
                className="h-11 rounded-2xl"
              />
              <Button type="submit" size="icon" className="h-11 w-11 rounded-2xl" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-3 flex items-center justify-between gap-3">
              <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground" disabled={loading} onClick={() => void handleRefresh()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate("/tasks")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Tasks
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full border border-blue-200 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Ask AI</span>
          {context?.reminders?.length ? (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{context.reminders.length}</span>
          ) : null}
        </button>
      )}
    </>
  );
}
