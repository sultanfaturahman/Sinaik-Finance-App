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
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/15 dark:bg-emerald-500/10",
      icon: "text-emerald-600 dark:text-emerald-400",
    },
    negative: {
      text: "text-destructive",
      bg: "bg-destructive/10 dark:bg-destructive/10",
      icon: "text-destructive",
    },
    default: {
      text: "text-primary",
      bg: "bg-primary/10 dark:bg-primary/10",
      icon: "text-primary",
    },
    purple: {
      text: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple/15 dark:bg-purple/10",
      icon: "text-purple-600 dark:text-purple-400",
    },
    orange: {
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange/15 dark:bg-orange/10",
      icon: "text-orange-600 dark:text-orange-400",
    },
    pink: {
      text: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink/15 dark:bg-pink/10",
      icon: "text-pink-600 dark:text-pink-400",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card
      data-testid="stat-card"
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm transition-all duration-300",
        "hover:shadow-md hover:border-border/60 hover:-translate-y-1"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-gradient-to-br pointer-events-none",
          variant === "positive" && "from-emerald-500/5 to-transparent",
          variant === "negative" && "from-destructive/5 to-transparent",
          variant === "default" && "from-primary/5 to-transparent",
          variant === "purple" && "from-purple-500/5 to-transparent",
          variant === "orange" && "from-orange-500/5 to-transparent",
          variant === "pink" && "from-pink-500/5 to-transparent"
        )}
      />
      <CardHeader className="relative flex flex-row items-start justify-between gap-4 pb-4 sm:pb-5">
        <div className="min-w-0 flex-1 space-y-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn("text-3xl font-bold tracking-tight", styles.text)}>
            {value}
          </div>
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
              styles.bg
            )}
          >
            <div className={cn("h-7 w-7", styles.icon)}>
              {icon}
            </div>
          </div>
        )}
      </CardHeader>
      {helper && (
        <CardContent className="relative pt-2">
          <CardDescription className="text-xs text-muted-foreground line-clamp-2">
            {helper}
          </CardDescription>
        </CardContent>
      )}
    </Card>
  );
};

