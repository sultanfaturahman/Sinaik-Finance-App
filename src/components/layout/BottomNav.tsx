import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/app/routes";

export const BottomNav = () => {
  const tabs = APP_ROUTES.filter((route) => route.showInBottomNav);
  const location = useLocation();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-40 md:hidden">
      <div className="rounded-2xl border border-border/60 bg-background/95 shadow-lg shadow-black/10 backdrop-blur">
        <ul
          className="grid divide-x divide-border/60 text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  cn(
                    "flex h-12 flex-col items-center justify-center gap-1 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors",
                    (isActive || location.pathname.startsWith(path)) && "text-brand"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
