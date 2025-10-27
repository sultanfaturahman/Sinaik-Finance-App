import { ReactNode, useMemo, useState } from "react";
import { SidebarDrawer } from "@/components/layout/SidebarDrawer";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AppShellProps {
  title: string;
  subtitle?: ReactNode;
  headerActions?: ReactNode;
  bottomAction?: ReactNode;
  children: ReactNode;
}

export const AppShell = ({
  title,
  subtitle,
  headerActions,
  bottomAction,
  children,
}: AppShellProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { signOut } = useAuth();

  const topbarActions = useMemo(
    () => (
      <>
        {headerActions}
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={signOut}
          aria-label="Keluar dari aplikasi"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </Button>
      </>
    ),
    [headerActions, signOut]
  );

  return (
    <div className="relative flex min-h-screen w-full bg-muted/20">
      <SidebarDrawer openMobile={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          subtitle={subtitle}
          actions={topbarActions}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[640px] px-3 pb-28 md:max-w-5xl md:px-6 md:pb-6">
            <div className="pt-5 md:pt-8">{children}</div>
          </div>
        </main>
      </div>
      <BottomNav />
      {bottomAction && (
        <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+70px)] z-40 md:hidden">
          {bottomAction}
        </div>
      )}
    </div>
  );
};
