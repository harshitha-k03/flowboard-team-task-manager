import { api, unwrapResponse } from "@/lib/api";
import type { ProductivityAnalytics, WeeklyAnalytics } from "@/types";

export const analyticsService = {
  async getWeekly() {
    const response = await api.get("/analytics/weekly");
    return unwrapResponse<WeeklyAnalytics>(response);
  },
  async getProductivity() {
    const response = await api.get("/analytics/productivity");
    return unwrapResponse<ProductivityAnalytics>(response);
  }
};
