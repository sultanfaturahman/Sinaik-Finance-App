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
    <nav className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+8px)] z-40 md:hidden">
      <div className="rounded-2xl border border-border/40 bg-background/95 shadow-xl shadow-black/15 backdrop-blur-md">
        <ul
          className="grid divide-x divide-border/40 text-xs font-semibold text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  cn(
                    "flex h-14 flex-col items-center justify-center gap-1 px-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    (isActive || location.pathname.startsWith(path)) && "text-primary"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
