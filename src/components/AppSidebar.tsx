import { Home, Receipt, FileText, TrendingUp, Menu, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar-context';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Transaksi', url: '/transactions', icon: Receipt },
  { title: 'Laporan', url: '/reports', icon: FileText },
  { title: 'Status UMKM', url: '/status', icon: TrendingUp },
  { title: 'AI Strategi', url: '/ai-strategy', icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <img
            src="/sinaik_logo_1 1 (1).png"
            alt="SiNaik"
            className="h-12 w-12 rounded-xl object-contain"
          />
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-foreground">SiNaik</h2>
              <p className="text-sm text-muted-foreground">UMKM Tracker</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
