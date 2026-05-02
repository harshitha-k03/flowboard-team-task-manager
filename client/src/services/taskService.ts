import { api, unwrapResponse } from "@/lib/api";
import type { Task, TaskDetails, TaskFilters, TaskPayload, TaskStatus } from "@/types";

export const taskService = {
  async list(filters: TaskFilters = {}) {
    const params = {
      status: filters.status && filters.status !== "all" ? filters.status : undefined,
      priority: filters.priority && filters.priority !== "all" ? filters.priority : undefined,
      dueDate: filters.dueDate && filters.dueDate !== "all" ? filters.dueDate : undefined,
      project: filters.project && filters.project !== "all" ? filters.project : undefined,
      assignee: filters.assignee && filters.assignee !== "all" ? filters.assignee : undefined,
      search: filters.search?.trim() || undefined
    };
    const response = await api.get("/tasks", { params });
    return unwrapResponse<Task[]>(response);
  },
  async getById(taskId: string) {
    const response = await api.get(`/tasks/${taskId}`);
    return unwrapResponse<TaskDetails>(response);
  },
  async create(payload: TaskPayload) {
    const response = await api.post("/tasks", payload);
    return unwrapResponse<Task>(response);
  },
  async update(taskId: string, payload: Partial<TaskPayload>) {
    const response = await api.put(`/tasks/${taskId}`, payload);
    return unwrapResponse<Task>(response);
  },
  async remove(taskId: string) {
    const response = await api.delete(`/tasks/${taskId}`);
    return unwrapResponse<{ deleted: boolean }>(response);
  },
  async patchStatus(taskId: string, status: TaskStatus) {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return unwrapResponse<Task>(response);
  },
  async addComment(taskId: string, text: string) {
    const response = await api.post(`/tasks/${taskId}/comments`, { text });
    return unwrapResponse<Task>(response);
  }
};
