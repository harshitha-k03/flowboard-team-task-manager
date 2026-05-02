import { api, unwrapResponse } from "@/lib/api";
import type { DemoWorkspaceResult } from "@/types";

export const demoService = {
  async loadWorkspace() {
    const response = await api.post("/demo/load");
    return unwrapResponse<DemoWorkspaceResult>(response);
  }
};
