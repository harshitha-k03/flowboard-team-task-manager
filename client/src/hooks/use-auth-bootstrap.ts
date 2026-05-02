import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

export function useAuthBootstrap() {
  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);
}
