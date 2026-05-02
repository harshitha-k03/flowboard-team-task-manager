import type { UserSummary } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarGroupProps {
  users: UserSummary[];
  max?: number;
}

export function AvatarGroup({ users, max = 4 }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remaining = Math.max(0, users.length - max);

  return (
    <div className="flex items-center">
      {visibleUsers.map((user, index) => (
        <div key={user.id} className={index > 0 ? "-ml-3" : ""}>
          <Avatar className="h-9 w-9 border-2 border-white">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback name={user.name} />
          </Avatar>
        </div>
      ))}
      {remaining > 0 ? (
        <div className="-ml-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-semibold text-slate-600">
          +{remaining}
        </div>
      ) : null}
    </div>
  );
}
