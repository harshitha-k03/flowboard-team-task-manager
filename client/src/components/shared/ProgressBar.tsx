import { clampPercent, cn } from "@/lib/utils";

interface ProgressBarProps {
  value?: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}

export function ProgressBar({ value = 0, className, trackClassName, barClassName }: ProgressBarProps) {
  const percent = clampPercent(value);

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-slate-100", trackClassName)}>
        <div
          className={cn("h-full rounded-full bg-primary transition-all duration-300", barClassName)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
