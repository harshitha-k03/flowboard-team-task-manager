import type { ReactNode } from "react";
import type { ReminderItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { ReminderTypeBadge } from "@/components/shared/EntityBadges";
import { Card, CardContent } from "@/components/ui/card";

interface ReminderCardProps {
  reminder: ReminderItem;
  action?: ReactNode;
}

export function ReminderCard({ reminder, action }: ReminderCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <ReminderTypeBadge type={reminder.type} />
          <span className="text-xs font-medium text-muted-foreground">{formatDate(reminder.dueDate)}</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{reminder.title}</h3>
          <p className="text-sm text-muted-foreground">{reminder.message}</p>
          <p className="text-xs text-muted-foreground">Project: {reminder.projectTitle}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
