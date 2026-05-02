import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  toneClassName?: string;
}

export function EmptyState({ icon: Icon, title, description, action, toneClassName = "bg-primary/10 text-primary" }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-5 py-14 text-center">
        <div className={`rounded-2xl p-4 ${toneClassName}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-heading text-2xl text-foreground">{title}</h3>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
