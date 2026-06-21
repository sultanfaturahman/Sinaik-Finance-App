import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const Section = ({
  title,
  description,
  actions,
  className,
  children,
}: SectionProps) => (
  <section
    className={cn(
      "rounded-xl border border-border/50 bg-card shadow-sm p-5 md:p-6",
      className
    )}
  >
    {(title || description || actions) && (
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          {typeof title === "string" ? (
            <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl">{title}</h2>
          ) : (
            title
          )}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className="space-y-4">{children}</div>
  </section>
);
