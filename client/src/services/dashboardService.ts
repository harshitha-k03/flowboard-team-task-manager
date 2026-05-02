import { api, unwrapResponse } from "@/lib/api";
import type { ActivityItem, DashboardStats, ReminderItem } from "@/types";

export const dashboardService = {
  async getStats() {
    const response = await api.get("/dashboard/stats");
    return unwrapResponse<DashboardStats>(response);
  },
  async getActivity() {
    const response = await api.get("/dashboard/activity");
    return unwrapResponse<ActivityItem[]>(response);
  },
  async getReminders() {
    const response = await api.get("/dashboard/reminders");
    return unwrapResponse<ReminderItem[]>(response);
  }
};
