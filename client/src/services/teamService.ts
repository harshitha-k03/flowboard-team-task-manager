import { api, unwrapResponse } from "@/lib/api";
import type { TeamSummary, TeamWorkloadItem } from "@/types";

export const teamService = {
  async getTeam() {
    const response = await api.get("/team");
    return unwrapResponse<TeamSummary>(response);
  },
  async getWorkload() {
    const response = await api.get("/team/workload");
    return unwrapResponse<TeamWorkloadItem[]>(response);
  }
};
