import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-background px-6 py-12 text-center text-sm text-muted-foreground",
      className
    )}
  >
    {icon && <div className="text-brand">{icon}</div>}
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {action && <div className="grid w-full max-w-xs gap-2">{action}</div>}
  </div>
);

