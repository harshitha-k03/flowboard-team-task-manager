import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { projectService } from "@/services/projectService";
import type { Project, ProjectPayload, ProjectStatus, UserSummary } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";

const projectStatuses: ProjectStatus[] = ["Planning", "In Progress", "On Track", "At Risk", "Completed"];

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: UserSummary[];
  project?: Project | null;
  onSaved: (project: Project) => void;
}

const createInitialState = (project?: Project | null): ProjectPayload => ({
  title: project?.title || "",
  description: project?.description || "",
  status: project?.status || "Planning",
  dueDate: project?.dueDate ? project.dueDate.slice(0, 10) : "",
  memberIds: project?.members.map((member) => member.id) || []
});

export function ProjectDialog({ open, onOpenChange, members, project, onSaved }: ProjectDialogProps) {
  const [form, setForm] = useState<ProjectPayload>(createInitialState(project));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(createInitialState(project));
    }
  }, [open, project]);

  const memberIds = useMemo(() => new Set(form.memberIds), [form.memberIds]);

  const toggleMember = (memberId: string) => {
    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(memberId)
        ? current.memberIds.filter((id) => id !== memberId)
        : [...current.memberIds, memberId]
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      notify.error("Project title is required.");
      return;
    }

    if (!form.dueDate) {
      notify.error("Project due date is required.");
      return;
    }

    setSaving(true);

    try {
      const payload: ProjectPayload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim()
      };
      const savedProject = project ? await projectService.update(project.id, payload) : await projectService.create(payload);
      notify.success(project ? "Project updated successfully." : "Project created.");
      onSaved(savedProject);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "Create project"}</DialogTitle>
          <DialogDescription>Set the team, due date, and project health for this workspace.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="project-title">Project title</Label>
            <Input
              id="project-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Website Redesign"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Share the goal, scope, and delivery details."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as ProjectStatus }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-due-date">Due date</Label>
              <Input
                id="project-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3">
            <div>
              <Label>Team members</Label>
              <p className="mt-1 text-sm text-muted-foreground">Admins can add or remove members from the project workspace.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {members.map((member) => {
                const selected = memberIds.has(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border p-4 text-left transition",
                      selected ? "border-primary bg-primary/5" : "border-border bg-slate-50 hover:border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback name={member.name} />
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className={cn("rounded-full p-2", selected ? "bg-primary text-primary-foreground" : "bg-white text-slate-300")}>
                      <Check className="h-4 w-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {project ? "Save changes" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
