import { useEffect, useMemo, useState } from "react";
import { FolderKanban, LayoutGrid, List, Plus, Search } from "lucide-react";
import { notify } from "@/lib/notify";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { PageLoader } from "@/components/shared/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectService } from "@/services/projectService";
import { teamService } from "@/services/teamService";
import { useAuthStore } from "@/store/auth-store";
import type { Project, ProjectStatus, UserSummary } from "@/types";

const projectStatuses: Array<ProjectStatus | "all"> = ["all", "Planning", "In Progress", "On Track", "At Risk", "Completed"];

export function ProjectsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [memberId, setMemberId] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setLoading(true);

      try {
        const [nextProjects, nextMembers] = await Promise.all([
          projectService.list({ search, status }),
          isAdmin ? teamService.getTeam().then((team) => team.members) : Promise.resolve([])
        ]);

        if (!cancelled) {
          setProjects(nextProjects);
          setMembers(nextMembers);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, search, status]);

  const availableMembers = useMemo(() => {
    if (members.length) {
      return members;
    }

    const map = new Map<string, UserSummary>();
    projects.forEach((project) => {
      project.members.forEach((member) => {
        map.set(member.id, member);
      });
    });
    return Array.from(map.values());
  }, [members, projects]);

  const filteredProjects = useMemo(
    () => projects.filter((project) => (memberId === "all" ? true : project.members.some((member) => member.id === memberId))),
    [memberId, projects]
  );

  const refreshProjects = async () => {
    const nextProjects = await projectService.list({ search, status });
    setProjects(nextProjects);
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`Delete "${project.title}"? This will also remove its tasks and activity.`)) {
      return;
    }

    await projectService.remove(project.id);
    notify.success("Project deleted.");
    await refreshProjects();
  };

  if (loading) {
    return <PageLoader label="Loading projects..." />;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Projects</p>
          <h1 className="page-heading">Manage and track all projects across your organization.</h1>
          <p className="max-w-3xl page-subtle">Search active workspaces, filter by delivery status, and keep team ownership visible from one clean portfolio view.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-2xl border border-border bg-white p-1 shadow-sm">
            <Button variant={view === "grid" ? "default" : "ghost"} size="icon" className="h-10 w-10 rounded-xl" onClick={() => setView("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={view === "list" ? "default" : "ghost"} size="icon" className="h-10 w-10 rounded-xl" onClick={() => setView("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>

          {isAdmin ? (
            <Button
              className="h-12 rounded-2xl px-5"
              onClick={() => {
                setSelectedProject(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-white bg-white p-5 shadow-sm lg:grid-cols-[1.25fr_210px_210px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" className="h-12 pl-11" />
        </div>

        <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus | "all")}>
          <SelectTrigger className="h-12 rounded-2xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {projectStatuses.map((statusOption) => (
              <SelectItem key={statusOption} value={statusOption}>
                {statusOption === "all" ? "All statuses" : statusOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger className="h-12 rounded-2xl">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All team members</SelectItem>
            {availableMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {filteredProjects.length ? (
        <section className={view === "grid" ? "grid gap-5 xl:grid-cols-3" : "grid gap-5"}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              compact={view === "list"}
              isAdmin={isAdmin}
              onOpen={(projectId) => navigate(`/projects/${projectId}`)}
              onEdit={(nextProject) => {
                setSelectedProject(nextProject);
                setDialogOpen(true);
              }}
              onDelete={(nextProject) => void handleDelete(nextProject)}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects match your filters"
          description="Try adjusting the search, status, or team filter, or create a new workspace if you're an admin."
          action={
            isAdmin ? (
              <Button
                onClick={() => {
                  setSelectedProject(null);
                  setDialogOpen(true);
                }}
              >
                Create project
              </Button>
            ) : null
          }
        />
      )}

      {isAdmin ? (
        <ProjectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          members={availableMembers}
          project={selectedProject}
          onSaved={async () => {
            await refreshProjects();
            setSelectedProject(null);
          }}
        />
      ) : null}
    </div>
  );
}
