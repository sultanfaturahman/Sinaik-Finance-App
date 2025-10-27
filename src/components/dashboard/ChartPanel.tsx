import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartPanelProps {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export const ChartPanel = ({ title, description, className, children }: ChartPanelProps) => (
  <Card className={cn("rounded-2xl border bg-card shadow-sm", className)}>
    <CardHeader>
      <CardTitle className="text-base font-semibold leading-tight md:text-lg">{title}</CardTitle>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </CardHeader>
    <CardContent>
      <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted md:aspect-[16/8]">
        <div className="h-full w-full">{children}</div>
      </div>
    </CardContent>
  </Card>
);

