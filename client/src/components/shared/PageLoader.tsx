import { Skeleton } from "@/components/ui/skeleton";

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = "Loading FlowBoard..." }: PageLoaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[1.8rem] border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-4 h-10 w-16" />
            <Skeleton className="mt-6 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.8rem] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
        <div className="rounded-[1.8rem] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
