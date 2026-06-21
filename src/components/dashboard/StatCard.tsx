import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  helper?: string;
  variant?: "default" | "positive" | "negative";
}

export const StatCard = ({
  title,
  value,
  icon,
  helper,
  variant = "default",
}: StatCardProps) => {
  const tone =
    variant === "positive"
      ? "text-success"
      : variant === "negative"
      ? "text-destructive"
      : "text-foreground";

  const toneBg =
    variant === "positive"
      ? "bg-success/10"
      : variant === "negative"
      ? "bg-destructive/10"
      : "bg-primary/10";

  const accentBorder =
    variant === "positive"
      ? "border-l-success/30"
      : variant === "negative"
      ? "border-l-destructive/30"
      : "border-l-primary/30";

  return (
    <Card
      data-testid="stat-card"
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        accentBorder,
        "border-l-2"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          variant === "positive" && "bg-gradient-to-br from-success/[0.03] to-transparent",
          variant === "negative" && "bg-gradient-to-br from-destructive/[0.03] to-transparent",
          variant === "default" && "bg-gradient-to-br from-primary/[0.03] to-transparent"
        )}
      />
      <CardHeader className="relative flex flex-row items-start justify-between gap-3 pb-3 sm:pb-4 sm:px-5">
        <div className="space-y-1">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
          <div className={cn("text-2xl font-bold tracking-tight", tone)}>{value}</div>
        </div>
        {icon && (
          <span className={cn("rounded-xl p-2.5 transition-colors duration-200", toneBg)}>
            <span className={cn("block h-5 w-5", variant === "default" && "text-primary")}>
              {icon}
            </span>
          </span>
        )}
      </CardHeader>
      {helper && (
        <CardContent className="relative">
          <CardDescription className="text-xs text-muted-foreground">{helper}</CardDescription>
        </CardContent>
      )}
    </Card>
  );
};

