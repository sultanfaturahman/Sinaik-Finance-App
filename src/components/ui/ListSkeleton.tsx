import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const ListSkeleton = ({ rows = 4, columns = 1, className }: ListSkeletonProps) => (
  <div className={cn("space-y-3", className)}>
    <div className="space-y-3 md:hidden">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={`mobile-${index}`} className="h-20 rounded-2xl" />
      ))}
    </div>
    <div className="hidden space-y-0 md:block">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`desktop-${rowIndex}`}
          className="grid gap-3 border-b border-border/70 px-4 py-3 last:border-none"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 w-full rounded-md" />
          ))}
        </div>
      ))}
    </div>
  </div>
);
