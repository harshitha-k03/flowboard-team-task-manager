import { type ClassValue, clsx } from "clsx";
import { differenceInCalendarDays, formatDistanceToNow } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initialsFromName(name?: string) {
  if (!name) {
    return "FB";
  }

  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDate(value?: string) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

export function formatDateTime(value?: string) {
  if (!value) {
    return "No timestamp";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatRelativeTime(value?: string) {
  if (!value) {
    return "Just now";
  }

  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

export function isOverdue(value?: string, status?: string) {
  if (!value || status === "Done") {
    return false;
  }

  return new Date(value).getTime() < Date.now();
}

export function getDueLabel(value?: string, status?: string) {
  if (!value) {
    return "No due date";
  }

  if (status === "Done") {
    return "Completed";
  }

  const days = differenceInCalendarDays(new Date(value), new Date());

  if (days < 0) {
    return `Overdue by ${Math.abs(days)}d`;
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Due tomorrow";
  }

  return `Due in ${days}d`;
}

export function getDueType(value?: string, status?: string) {
  if (!value || status === "Done") {
    return "safe";
  }

  const days = differenceInCalendarDays(new Date(value), new Date());

  if (days < 0) {
    return "overdue";
  }

  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return "tomorrow";
  }

  return "safe";
}

export function splitEmails(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export function clampPercent(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function formatHours(value?: number) {
  if (!value) {
    return "0h";
  }

  return `${value}h`;
}

export function getSubtaskProgress(subtasks: Array<{ completed: boolean }> = []) {
  const total = subtasks.length;
  const completed = subtasks.filter((subtask) => subtask.completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percent
  };
}

export function calculateSuggestedPriority({
  dueDate,
  status
}: {
  dueDate?: string;
  status?: string;
}) {
  if (!dueDate) {
    return "Low";
  }

  if (isOverdue(dueDate, status)) {
    return "Critical";
  }

  const days = differenceInCalendarDays(new Date(dueDate), new Date());

  if (days <= 1) {
    return "High";
  }

  if (days <= 3) {
    return "Medium";
  }

  return "Low";
}

export function generateTaskSubtasks(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("login")) {
    return [
      "Design login UI",
      "Add form validation",
      "Connect login API",
      "Add remember me option",
      "Test login flow"
    ];
  }

  if (normalized.includes("dashboard")) {
    return [
      "Create dashboard layout",
      "Add stat cards",
      "Add charts",
      "Connect dashboard APIs",
      "Test responsive layout"
    ];
  }

  if (normalized.includes("api")) {
    return [
      "Design API endpoint",
      "Add request validation",
      "Connect database model",
      "Add error handling",
      "Test API response"
    ];
  }

  return [
    "Understand requirements",
    "Break task into steps",
    "Implement feature",
    "Test functionality",
    "Review and submit"
  ];
}

export async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

export function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getProjectStatusTone(status?: string) {
  switch (status) {
    case "Completed":
      return "border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]";
    case "On Track":
      return "border-[#93C5FD] bg-[#DBEAFE] text-[#1D4ED8]";
    case "In Progress":
      return "border-[#93C5FD] bg-[#DBEAFE] text-[#1D4ED8]";
    case "At Risk":
      return "border-[#FDBA74] bg-[#FFEDD5] text-[#C2410C]";
    default:
      return "border-[#CBD5E1] bg-[#F1F5F9] text-[#475569]";
  }
}

export function getTaskStatusTone(status?: string) {
  switch (status) {
    case "Done":
      return "border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]";
    case "In Progress":
      return "border-[#93C5FD] bg-[#DBEAFE] text-[#1D4ED8]";
    case "In Review":
      return "border-[#C4B5FD] bg-[#EDE9FE] text-[#6D28D9]";
    case "Blocked":
      return "border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C]";
    default:
      return "border-[#CBD5E1] bg-[#F1F5F9] text-[#475569]";
  }
}

export function getPriorityTone(priority?: string) {
  switch (priority) {
    case "Critical":
      return "border-[#F87171] bg-[#FEE2E2] text-[#B91C1C]";
    case "High":
      return "border-[#FDBA74] bg-[#FFEDD5] text-[#C2410C]";
    case "Medium":
      return "border-[#FCD34D] bg-[#FEF3C7] text-[#B45309]";
    default:
      return "border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]";
  }
}

export function getReminderTone(type?: string) {
  switch (type) {
    case "overdue":
      return "border-[#FCA5A5] bg-[#FEF2F2] text-[#DC2626]";
    case "today":
      return "border-[#FDBA74] bg-[#FFF7ED] text-[#EA580C]";
    case "tomorrow":
      return "border-[#FCD34D] bg-[#FFFBEB] text-[#D97706]";
    default:
      return "border-[#86EFAC] bg-[#F0FDF4] text-[#16A34A]";
  }
}

export function getDeadlineTone(value?: string, status?: string) {
  const type = getDueType(value, status);

  switch (type) {
    case "overdue":
      return "bg-[#FEF2F2] text-[#DC2626]";
    case "today":
      return "bg-[#FFF7ED] text-[#EA580C]";
    case "tomorrow":
      return "bg-[#FFFBEB] text-[#D97706]";
    default:
      return "bg-[#F0FDF4] text-[#16A34A]";
  }
}

export function getDeadlineTextTone(value?: string, status?: string) {
  const type = getDueType(value, status);

  switch (type) {
    case "overdue":
      return "text-[#DC2626]";
    case "today":
      return "text-[#EA580C]";
    case "tomorrow":
      return "text-[#D97706]";
    default:
      return "text-[#16A34A]";
  }
}

export function getPriorityBorderTone(priority?: string) {
  switch (priority) {
    case "Critical":
      return "border-l-[#F87171]";
    case "High":
      return "border-l-[#FDBA74]";
    case "Medium":
      return "border-l-[#FCD34D]";
    default:
      return "border-l-[#86EFAC]";
  }
}
