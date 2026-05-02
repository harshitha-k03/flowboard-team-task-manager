import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "ghost" | "outline";
  showLabel?: boolean;
}

export function ThemeToggle({
  className,
  size = "icon",
  variant = "outline",
  showLabel = false
}: ThemeToggleProps) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(showLabel && "gap-2 rounded-2xl px-4", className)}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <Icon className="h-4 w-4" />
      {showLabel ? <span>{isDark ? "Light mode" : "Dark mode"}</span> : null}
    </Button>
  );
}
