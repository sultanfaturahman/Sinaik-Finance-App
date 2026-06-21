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
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn("text-xl font-bold tracking-tight sm:text-2xl", styles.value)}>
            {value}
          </div>
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              styles.bg
            )}
          >
            <div className={cn("h-5 w-5", styles.icon)}>
              {icon}
            </div>
          </div>
        )}
      </CardHeader>
      {helper && (
        <CardContent className="px-5 pb-5 pt-0">
          <CardDescription className="text-xs text-muted-foreground">
            {helper}
          </CardDescription>
        </CardContent>
      )}
    </Card>
  );
};

