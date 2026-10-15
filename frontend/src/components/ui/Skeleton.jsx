export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl ${className}`}
      {...props}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="w-[300px] shrink-0 rounded-2xl border border-border/80 bg-surface/50 p-3.5 space-y-3">
      <div className="flex justify-between items-center px-1">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-6 rounded-full" />
      </div>
      <TaskCardSkeleton />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
    </div>
  );
}

export default Skeleton;
