import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Link2, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { calculateSuggestedPriority, generateTaskSubtasks } from "@/lib/utils";
import { taskService } from "@/services/taskService";
import type { Project, Task, TaskAttachment, TaskPayload, TaskStatus } from "@/types";
import { PriorityBadge } from "@/components/shared/EntityBadges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const taskStatuses: TaskStatus[] = ["Todo", "In Progress", "In Review", "Done", "Blocked"];

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  task?: Task | null;
  defaultProjectId?: string;
  onSaved: (task: Task) => void;
}

type TaskDialogErrors = Partial<Record<keyof TaskPayload, string>>;

const createInitialSubtask = () => ({
  title: "",
  completed: false
});

const createInitialAttachment = (): TaskAttachment => ({
  name: "",
  url: ""
});

const createInitialState = (task?: Task | null, defaultProjectId?: string): TaskPayload => ({
  title: task?.title || "",
  description: task?.description || "",
  projectId: task?.projectId || defaultProjectId || "",
  assignedTo: task?.assignedTo.id || "",
  status: task?.status || "Todo",
  dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
  estimatedHours: task?.estimatedHours || 4,
  subtasks: task?.subtasks?.length ? task.subtasks.map((subtask) => ({ title: subtask.title, completed: subtask.completed })) : [createInitialSubtask()],
  attachments: task?.attachments?.length ? task.attachments.map((attachment) => ({ name: attachment.name, url: attachment.url })) : [createInitialAttachment()]
});

export function TaskDialog({ open, onOpenChange, projects, task, defaultProjectId, onSaved }: TaskDialogProps) {
  const [form, setForm] = useState<TaskPayload>(createInitialState(task, defaultProjectId));
  const [errors, setErrors] = useState<TaskDialogErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(createInitialState(task, defaultProjectId));
      setErrors({});
    }
  }, [defaultProjectId, open, task]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) ?? projects.find((project) => project.id === defaultProjectId),
    [defaultProjectId, form.projectId, projects]
  );
  const assignees = selectedProject?.members || [];
  const suggestedPriority = calculateSuggestedPriority({ dueDate: form.dueDate, status: form.status });

  const setField = <K extends keyof TaskPayload>(field: K, value: TaskPayload[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    setForm((current) => ({
      ...current,
      projectId,
      assignedTo: project?.members.some((member) => member.id === current.assignedTo) ? current.assignedTo : project?.members[0]?.id || ""
    }));
    setErrors((current) => ({ ...current, projectId: undefined, assignedTo: undefined }));
  };

  const updateSubtask = (index: number, nextTitle: string) => {
    setForm((current) => ({
      ...current,
      subtasks: current.subtasks.map((subtask, subtaskIndex) => (subtaskIndex === index ? { ...subtask, title: nextTitle } : subtask))
    }));
  };

  const updateAttachment = (index: number, field: keyof TaskAttachment, value: string) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.map((attachment, attachmentIndex) =>
        attachmentIndex === index ? { ...attachment, [field]: value } : attachment
      )
    }));
  };

  const handleGenerateSubtasks = () => {
    const generated = generateTaskSubtasks(form.title || task?.title || "");
    setForm((current) => ({
      ...current,
      subtasks: generated.map((title) => ({ title, completed: false }))
    }));
    notify.info("Suggested subtasks generated.");
  };

  const handleSubmit = async () => {
    const nextErrors: TaskDialogErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Task title is required.";
    }

    if (!form.projectId) {
      nextErrors.projectId = "Please select a project.";
    }

    if (!form.assignedTo) {
      nextErrors.assignedTo = "Please assign this task to a team member.";
    }

    if (!form.dueDate) {
      nextErrors.dueDate = "Task due date is required.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      notify.error("Please fix the highlighted task fields.");
      return;
    }

    setSaving(true);

    try {
      const payload: TaskPayload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        subtasks: form.subtasks.filter((subtask) => subtask.title.trim()).map((subtask) => ({ ...subtask, title: subtask.title.trim() })),
        attachments: form.attachments
          .filter((attachment) => attachment.name.trim() && attachment.url.trim())
          .map((attachment) => ({ name: attachment.name.trim(), url: attachment.url.trim() }))
      };

      const savedTask = task ? await taskService.update(task.id, payload) : await taskService.create(payload);
      notify.success(task ? "Task updated successfully." : "Task created and assigned.");
      onSaved(savedTask);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[2rem] border-border bg-white">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Create task"}</DialogTitle>
          <DialogDescription>Assign work, set a deadline, and keep the execution plan crisp.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="rounded-[1.5rem] border border-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#64748B]">Smart priority</p>
                <p className="mt-1 text-sm text-[#94A3B8]">Auto-calculated from due date and status.</p>
              </div>
              <PriorityBadge priority={suggestedPriority} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-title">Task title</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="Implement dashboard layout"
              className={errors.title ? "border-[#F87171] focus-visible:ring-[#F87171]/30" : ""}
            />
            {errors.title ? <p className="text-sm text-[#DC2626]">{errors.title}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Add goals, constraints, and delivery notes."
              className="bg-white"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={handleProjectChange}>
                <SelectTrigger className={errors.projectId ? "border-[#F87171]" : ""}>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((projectItem) => (
                    <SelectItem key={projectItem.id} value={projectItem.id}>
                      {projectItem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId ? <p className="text-sm text-[#DC2626]">{errors.projectId}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label>Assignee</Label>
              <Select value={form.assignedTo} onValueChange={(value) => setField("assignedTo", value)}>
                <SelectTrigger className={errors.assignedTo ? "border-[#F87171]" : ""}>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignedTo ? <p className="text-sm text-[#DC2626]">{errors.assignedTo}</p> : null}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setField("status", value as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {taskStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-due-date">Due date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => setField("dueDate", event.target.value)}
                className={errors.dueDate ? "border-[#F87171] focus-visible:ring-[#F87171]/30" : ""}
              />
              {errors.dueDate ? <p className="text-sm text-[#DC2626]">{errors.dueDate}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estimated-hours">Estimated hours</Label>
              <Input
                id="estimated-hours"
                type="number"
                min={1}
                value={form.estimatedHours}
                onChange={(event) => setField("estimatedHours", Math.max(1, Number(event.target.value) || 1))}
              />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label>Subtasks</Label>
                <p className="mt-1 text-sm text-muted-foreground">Break execution into clear steps.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-[#C4B5FD] text-[#6D28D9] hover:bg-[#F5F3FF] hover:text-[#5B21B6]"
                  onClick={handleGenerateSubtasks}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Subtasks
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setField("subtasks", [...form.subtasks, createInitialSubtask()])}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add subtask
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {form.subtasks.map((subtask, index) => (
                <div key={`${index}-${subtask.title}`} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-white text-primary">
                    <CheckSquare className="h-3.5 w-3.5" />
                  </div>
                  <Input value={subtask.title} onChange={(event) => updateSubtask(index, event.target.value)} placeholder={`Subtask ${index + 1}`} className="border-none px-0 shadow-none focus-visible:ring-0" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setField("subtasks", form.subtasks.filter((_, currentIndex) => currentIndex !== index))}
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Attachments</Label>
                <p className="mt-1 text-sm text-muted-foreground">Add helpful reference links or assets for this task.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setField("attachments", [...form.attachments, createInitialAttachment()])}>
                <Link2 className="mr-2 h-4 w-4" />
                Add attachment
              </Button>
            </div>

            <div className="space-y-3">
              {form.attachments.map((attachment, index) => (
                <div key={`${index}-${attachment.url}`} className="grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-[1fr_1.5fr_auto]">
                  <Input
                    value={attachment.name}
                    onChange={(event) => updateAttachment(index, "name", event.target.value)}
                    placeholder="Spec, file, or board name"
                  />
                  <Input
                    value={attachment.url}
                    onChange={(event) => updateAttachment(index, "url", event.target.value)}
                    placeholder="https://example.com/reference"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="justify-self-end"
                    onClick={() => setField("attachments", form.attachments.filter((_, currentIndex) => currentIndex !== index))}
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {task ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
