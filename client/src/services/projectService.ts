import { api, unwrapResponse } from "@/lib/api";
import type { Project, ProjectDetails, ProjectFilters, ProjectPayload } from "@/types";

export const projectService = {
  async list(filters: ProjectFilters = {}) {
    const params = {
      search: filters.search?.trim() || undefined,
      status: filters.status && filters.status !== "all" ? filters.status : undefined
    };
    const response = await api.get("/projects", { params });
    return unwrapResponse<Project[]>(response);
  },
  async getById(projectId: string) {
    const response = await api.get(`/projects/${projectId}`);
    return unwrapResponse<ProjectDetails>(response);
  },
  async create(payload: ProjectPayload) {
    const response = await api.post("/projects", payload);
    return unwrapResponse<Project>(response);
  },
  async update(projectId: string, payload: ProjectPayload) {
    const response = await api.put(`/projects/${projectId}`, payload);
    return unwrapResponse<Project>(response);
  },
  async remove(projectId: string) {
    const response = await api.delete(`/projects/${projectId}`);
    return unwrapResponse<{ deleted: boolean }>(response);
  }
};
