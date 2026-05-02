import { api, unwrapResponse } from "@/lib/api";
import type { DeadlineData } from "@/types";

export const deadlinesService = {
  async getAll() {
    const response = await api.get("/deadlines");
    return unwrapResponse<DeadlineData>(response);
  }
};
