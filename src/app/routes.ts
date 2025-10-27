import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Receipt,
  FileBarChart,
  ArrowDownToLine,
  Award,
  Settings,
  NotebookPen,
  Sparkles,
} from "lucide-react";

export interface AppRoute {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  showInSidebar?: boolean;
  showInBottomNav?: boolean;
}

export const APP_ROUTES: AppRoute[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    path: "/transactions",
    label: "Transaksi",
    icon: Receipt,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    path: "/notes",
    label: "Catatan",
    icon: NotebookPen,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    path: "/ai-strategy",
    label: "AI Strategi",
    icon: Sparkles,
    showInSidebar: true,
  },
  {
    path: "/import-export",
    label: "Import / Export",
    icon: ArrowDownToLine,
    showInSidebar: true,
  },
  {
    path: "/reports",
    label: "Laporan",
    icon: FileBarChart,
    showInSidebar: true,
    showInBottomNav: true,
  },
  {
    path: "/status",
    label: "Status UMKM",
    icon: Award,
    showInSidebar: true,
  },
  {
    path: "/settings",
    label: "Settings",
    icon: Settings,
    showInSidebar: true,
  },
];
