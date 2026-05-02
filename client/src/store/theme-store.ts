import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const resolveInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("flowboard-theme");

  if (storedTheme) {
    try {
      const parsed = JSON.parse(storedTheme) as { state?: { theme?: ThemeMode } };

      if (parsed.state?.theme === "dark" || parsed.state?.theme === "light") {
        return parsed.state.theme;
      }
    } catch {
      // Ignore invalid persisted state and fall back to the system preference.
    }
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: resolveInitialTheme(),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark"
        }))
    }),
    {
      name: "flowboard-theme"
    }
  )
);
