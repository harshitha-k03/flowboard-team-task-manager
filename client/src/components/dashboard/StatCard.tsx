import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  accentClassName?: string;
}

export function StatCard({ title, value, hint, icon: Icon, accentClassName = "bg-primary/10 text-primary" }: StatCardProps) {
  return (
    <Card className="rounded-[1.75rem] border-border shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className={`rounded-2xl p-3 ${accentClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}
