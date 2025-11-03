import { NavLink, useLocation } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/app/routes";

export interface SidebarDrawerProps {
  openMobile: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SidebarDrawer = ({ openMobile, onOpenChange }: SidebarDrawerProps) => {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar openMobile={openMobile} onOpenChange={onOpenChange} />
    </>
  );
};

const DesktopSidebar = () => {
  const location = useLocation();
  const routes = APP_ROUTES.filter((route) => route.showInSidebar);

  return (
    <aside className="hidden w-[260px] border-r border-border/70 bg-background/95 px-4 py-6 md:flex md:flex-col md:gap-8">
      <Brand />
      <nav className="flex flex-1 flex-col gap-1">
        {routes.map((route) => {
          const isActive = location.pathname.startsWith(route.path);
          const Icon = route.icon;
          return (
            <Button
              key={route.path}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "justify-start gap-3 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                isActive && "bg-brand/10 text-brand"
              )}
            >
              <NavLink to={route.path}>
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>{route.label}</span>
                </span>
              </NavLink>
            </Button>
          );
        })}
      </nav>
      <FooterNote />
    </aside>
  );
};

const MobileSidebar = ({ openMobile, onOpenChange }: SidebarDrawerProps) => (
  <Sheet open={openMobile} onOpenChange={onOpenChange}>
    <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
      <div className="flex h-full flex-col px-4 py-6">
        <Brand />
        <nav className="mt-6 flex flex-col gap-1">
          {APP_ROUTES.filter((route) => route.showInSidebar).map((route) => {
            const Icon = route.icon;
            return (
              <Button
                key={route.path}
                variant="ghost"
                asChild
                className="justify-start gap-3 rounded-xl px-4 py-2 text-base text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => onOpenChange(false)}
              >
                <NavLink to={route.path}>
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{route.label}</span>
                  </span>
                </NavLink>
              </Button>
            );
          })}
        </nav>
        <FooterNote className="mt-auto" />
      </div>
    </SheetContent>
  </Sheet>
);

const Brand = () => (
  <div className="flex items-center gap-3">
    <img src="/sinaik_logo_1.png" alt="SiNaik" className="h-10 w-10 rounded-xl object-contain shadow-sm" />
    <div className="space-y-0.5">
      <p className="text-base font-semibold text-foreground">SiNaik</p>
      <p className="text-xs text-muted-foreground">Sistem Informasi Naik Kelas</p>
    </div>
  </div>
);

const FooterNote = ({ className }: { className?: string }) => (
  <div className={cn("rounded-xl border border-dashed border-border/80 p-3 text-xs text-muted-foreground", className)}>
    <p className="font-medium text-foreground">Tips:</p>
    <p>Gunakan tombol tambah di bawah untuk mencatat transaksi harian lebih cepat.</p>
  </div>
);
