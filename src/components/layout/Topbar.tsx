import { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  onOpenMobileNav: () => void;
}

export const Topbar = ({ title, subtitle, actions, onOpenMobileNav }: TopbarProps) => (
  <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
    <div className="mx-auto flex h-16 w-full max-w-[640px] items-center justify-between px-3 md:max-w-5xl md:px-6">
      <div className="flex flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenMobileNav}
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold leading-tight tracking-tight md:text-xl">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="hidden items-center gap-2 md:flex">
          {actions}
        </div>
      )}
    </div>
    {actions && (
      <div className="border-t border-border/50 bg-background/60 px-4 py-2.5 md:hidden">
        <div className="mx-auto flex max-w-[640px] items-center gap-2 overflow-x-auto">
          {actions}
        </div>
      </div>
    )}
  </header>
);
