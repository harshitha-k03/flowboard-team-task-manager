import { CalendarDays, ChevronRight, CodeXml, Globe, Megaphone, PencilLine, Smartphone, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Project } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { ProjectStatusBadge } from "@/components/shared/EntityBadges";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  compact?: boolean;
  onOpen: (projectId: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const projectStyles: Array<{
  matches: (title: string) => boolean;
  icon: LucideIcon;
  accent: string;
}> = [
  { matches: (title) => title.includes("website"), icon: Globe, accent: "bg-blue-50 text-blue-600" },
  { matches: (title) => title.includes("mobile"), icon: Smartphone, accent: "bg-emerald-50 text-emerald-600" },
  { matches: (title) => title.includes("marketing"), icon: Megaphone, accent: "bg-violet-50 text-violet-600" },
  { matches: (title) => title.includes("api"), icon: CodeXml, accent: "bg-amber-50 text-amber-600" }
];

const healthTone = {
  "On Track": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "At Risk": "border-amber-200 bg-amber-50 text-amber-700",
  Delayed: "border-rose-200 bg-rose-50 text-rose-700"
} as const;

export function ProjectCard({ project, isAdmin, compact = false, onOpen, onEdit, onDelete }: ProjectCardProps) {
  const style = projectStyles.find((item) => item.matches(project.title.toLowerCase())) || {
    icon: Globe,
    accent: "bg-sky-50 text-sky-600"
  };
  const health = project.health || "On Track";
  const healthScore = project.healthScore ?? project.progress;
  const Icon = style.icon;

  return (
    <Card className={cn("rounded-[1.9rem] border-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", compact && "rounded-[1.5rem]")}>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn("flex h-14 w-14 items-center justify-center rounded-[1.4rem]", style.accent)}>
              <Icon className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <button type="button" onClick={() => onOpen(project.id)} className="text-left text-[1.35rem] font-semibold text-foreground transition hover:text-primary">
                {project.title}
              </button>
              <p className="line-clamp-2 max-w-xl text-sm leading-7 text-muted-foreground">{project.description || "No description added yet."}</p>
            </div>
          </div>

          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl" onClick={() => onEdit(project)}>
                <PencilLine className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-rose-600" onClick={() => onDelete(project)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Due {formatDate(project.dueDate)}
          </span>
          <ProjectStatusBadge status={project.status} />
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${healthTone[health]}`}>
            {health} • {healthScore}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <AvatarGroup users={project.members} />
          <div className="text-right">
            <p className="text-2xl font-semibold text-foreground">{project.progress}%</p>
            <p className="text-xs text-muted-foreground">Completion</p>
          </div>
        </div>

        <div className="space-y-2">
          <ProgressBar value={project.progress} className="h-2.5" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{project.metrics?.completedTasks ?? 0} completed tasks</span>
            <span>{project.metrics?.overdueTasks ?? 0} overdue</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">{project.members.length} team members</span>
          <Button variant="ghost" className="rounded-2xl px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => onOpen(project.id)}>
            Open project
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
