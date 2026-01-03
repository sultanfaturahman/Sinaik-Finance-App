import { ReactNode, Suspense, lazy, useMemo, useState } from "react";

const LazySidebarDrawer = lazy(async () => {
  const module = await import("@/components/layout/SidebarDrawer");
  return { default: module.SidebarDrawer };
});

const LazyTopbar = lazy(async () => {
  const module = await import("@/components/layout/Topbar");
  return { default: module.Topbar };
});

const LazyBottomNav = lazy(async () => {
  const module = await import("@/components/layout/BottomNav");
  return { default: module.BottomNav };
});

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

  const topbarActions = useMemo(() => headerActions, [headerActions]);

  return (
    <div className="relative flex min-h-screen w-full bg-muted/20">
      <Suspense fallback={<SidebarSkeleton />}>
        <LazySidebarDrawer openMobile={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<TopbarSkeleton />}>
          <LazyTopbar
            title={title}
            subtitle={subtitle}
            actions={topbarActions}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
        </Suspense>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[640px] px-3 pb-28 md:max-w-5xl md:px-6 md:pb-6">
            <div className="pt-5 md:pt-8">{children}</div>
          </div>
        </main>
      </div>
      <Suspense fallback={<BottomNavSkeleton />}>
        <LazyBottomNav />
      </Suspense>
      {bottomAction && (
        <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+70px)] z-40 md:hidden">
          {bottomAction}
        </div>
      )}
    </div>
  );
};

const SidebarSkeleton = () => (
  <div className="hidden w-[260px] border-r border-border/70 bg-background/80 px-4 py-6 md:flex md:flex-col md:gap-6">
    <div className="h-12 w-32 rounded-xl bg-muted animate-pulse" />
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={`sidebar-skeleton-${index}`} className="h-10 rounded-xl bg-muted/70 animate-pulse" />
    ))}
  </div>
);

const TopbarSkeleton = () => (
  <header className="border-b border-border/70 bg-background/80 px-4 py-4">
    <div className="h-6 w-40 rounded-lg bg-muted animate-pulse" />
  </header>
);

const BottomNavSkeleton = () => (
  <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-border/70 bg-background/80 md:hidden" />
);
