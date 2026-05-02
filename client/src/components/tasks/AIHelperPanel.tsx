import { Bot, CircleDot, Sparkles } from "lucide-react";
import type { Task } from "@/types";
import { calculateSuggestedPriority, generateTaskSubtasks } from "@/lib/utils";
import { PriorityBadge } from "@/components/shared/EntityBadges";
import { Card, CardContent } from "@/components/ui/card";

const buildInsights = (task: Task) => {
  const title = task.title.toLowerCase();
  const subtasks = generateTaskSubtasks(task.title);

  if (title.includes("login")) {
    return {
      subtasks,
      estimatedHours: 10,
      risk: "Authentication work often spans validation, API states, and session handling."
    };
  }

  if (title.includes("dashboard")) {
    return {
      subtasks,
      estimatedHours: 12,
      risk: "Dashboard work can expand quickly when charts and data contracts shift together."
    };
  }

  if (title.includes("api")) {
    return {
      subtasks,
      estimatedHours: 9,
      risk: "API tasks often need careful validation, database updates, and clear error handling."
    };
  }

  return {
    subtasks,
    estimatedHours: task.estimatedHours || 6,
    risk: "Scope may drift if the task is not broken into smaller milestones early."
  };
};

const buildAssigneeSuggestion = (task: Task) => {
  if (task.assignedTo.availability === "On Leave") {
    return "Reassign this task before work starts because the current assignee is on leave.";
  }

  if (task.assignedTo.availability === "Busy" && ["Critical", "High"].includes(task.priority)) {
    return "Consider moving this high-priority task to an available teammate if capacity is tight.";
  }

  return `${task.assignedTo.name} is a reasonable assignee based on current availability.`;
};

const buildDelayWarning = (task: Task) => {
  const projectDueDate = task.project?.dueDate ? new Date(task.project.dueDate) : null;
  const taskDueDate = new Date(task.dueDate);
  const isProjectAtRisk = task.project?.status === "At Risk";
  const isTaskLateForProject = Boolean(projectDueDate && taskDueDate > projectDueDate);

  if (isProjectAtRisk || isTaskLateForProject || task.priority === "Critical") {
    return "Project delivery may slip unless this task is moved forward or reassigned.";
  }

  return "Project timing looks manageable if this task keeps its current status cadence.";
};

export function AIHelperPanel({ task }: { task: Task }) {
  const insights = buildInsights(task);
  const suggestedPriority = calculateSuggestedPriority({ dueDate: task.dueDate, status: task.status });
  const assigneeSuggestion = buildAssigneeSuggestion(task);
  const delayWarning = buildDelayWarning(task);

  return (
    <Card className="rounded-[1.9rem] border-border shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-border bg-white p-3 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">AI Task Assistant</h2>
              <span className="rounded-full border border-primary/20 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Beta
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Rule-based task guidance to help you break work down faster.</p>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-border bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Suggested priority</p>
              <div className="mt-3">
                <PriorityBadge priority={suggestedPriority} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Estimated time</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{insights.estimatedHours}h</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-border bg-white p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-semibold text-foreground">AI Suggested Subtasks</p>
          </div>
          <ul className="mt-4 space-y-3">
            {insights.subtasks.map((item) => (
              <li key={item} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground">
                <div className="flex items-center gap-3">
                  <CircleDot className="h-4 w-4 text-slate-300" />
                  <span>{item}</span>
                </div>
                <span className="rounded-full border border-border bg-white px-2 py-1 text-xs font-medium text-primary">
                  {Math.max(1, Math.round(insights.estimatedHours / insights.subtasks.length))}h
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.6rem] border border-border bg-white p-5">
            <p className="text-sm text-muted-foreground">Risk note</p>
            <p className="mt-2 text-sm leading-7 text-foreground">{insights.risk}</p>
          </div>
          <div className="rounded-[1.6rem] border border-border bg-white p-5">
            <p className="text-sm text-muted-foreground">Assignee suggestion</p>
            <p className="mt-2 text-sm leading-7 text-foreground">{assigneeSuggestion}</p>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Delay warning</p>
          <p className="mt-2 text-sm leading-7 text-foreground">{delayWarning}</p>
        </div>

        <div className="rounded-[1.6rem] border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Insight</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-foreground">
              <li>Focus the highest-risk work first.</li>
              <li>Keep comments updated for clean handoffs.</li>
              <li>Use subtasks to track smaller milestones.</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}
