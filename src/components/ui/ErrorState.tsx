import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const ErrorState = ({
  title = "Terjadi kesalahan",
  description = "Silakan coba lagi beberapa saat lagi.",
  action,
  className,
}: ErrorStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center text-sm text-destructive",
      className
    )}
  >
    <AlertTriangle className="h-5 w-5" />
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-destructive">{title}</h3>
      {description && <p className="text-sm text-destructive/80">{description}</p>}
    </div>
    {action && <div className="grid w-full max-w-xs gap-2">{action}</div>}
  </div>
);

