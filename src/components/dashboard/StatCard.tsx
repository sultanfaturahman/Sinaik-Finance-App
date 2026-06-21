import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  helper?: string;
  variant?: "default" | "positive" | "negative" | "purple" | "orange" | "pink";
}

export const StatCard = ({
  title,
  value,
  icon,
  helper,
  variant = "default",
}: StatCardProps) => {
  const variantStyles = {
    positive: {
      value: "text-foreground",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      icon: "text-emerald-600 dark:text-emerald-400",
    },
    negative: {
      value: "text-foreground",
      bg: "bg-red-50 dark:bg-red-500/10",
      icon: "text-red-500 dark:text-red-400",
    },
    default: {
      value: "text-foreground",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      icon: "text-blue-600 dark:text-blue-400",
    },
    purple: {
      value: "text-foreground",
      bg: "bg-violet-50 dark:bg-violet-500/10",
      icon: "text-violet-600 dark:text-violet-400",
    },
    orange: {
      value: "text-foreground",
      bg: "bg-orange-50 dark:bg-orange-500/10",
      icon: "text-orange-500 dark:text-orange-400",
    },
    pink: {
      value: "text-foreground",
      bg: "bg-pink-50 dark:bg-pink-500/10",
      icon: "text-pink-500 dark:text-pink-400",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card
      data-testid="stat-card"
      className="group rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <CardHeader className="p-4 sm:p-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </CardTitle>
          {icon && (
            <div
              className={cn(
                "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg",
                styles.bg
              )}
            >
              <div className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", styles.icon)}>
                {icon}
              </div>
            </div>
          )}
        </div>
        <div className={cn("text-lg sm:text-xl md:text-2xl font-bold tracking-tight", styles.value)}>
          {value}
        </div>
      </CardHeader>
      {helper && (
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
          <CardDescription className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2">
            {helper}
          </CardDescription>
        </CardContent>
      )}
    </Card>
  );
};

