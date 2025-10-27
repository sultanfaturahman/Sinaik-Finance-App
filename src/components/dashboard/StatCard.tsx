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
      : "bg-muted/60";

  return (
    <Card data-testid="stat-card" className="rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3 sm:pb-4 sm:px-5">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={cn("text-2xl font-bold", tone)}>{value}</div>
        </div>
        {icon && (
          <span className={cn("rounded-xl p-2", toneBg)}>
            <span className={cn("block h-5 w-5", variant === "default" && "text-secondary-foreground")}>
              {icon}
            </span>
          </span>
        )}
      </CardHeader>
      {helper && (
        <CardContent>
          <CardDescription className="text-xs text-muted-foreground">{helper}</CardDescription>
        </CardContent>
      )}
    </Card>
  );
};

