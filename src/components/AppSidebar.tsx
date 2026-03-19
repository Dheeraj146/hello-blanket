import {
  Shield, LayoutDashboard, AlertTriangle, Server, FileText, BarChart3,
  Mail, Settings, LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const allNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, minRole: "viewer" },
  { title: "Email Monitor", url: "/email-monitor", icon: Mail, minRole: "viewer" },
  { title: "Threats", url: "/threats", icon: AlertTriangle, minRole: "viewer" },
  { title: "Endpoints", url: "/endpoints", icon: Server, minRole: "viewer" },
  { title: "Reports", url: "/reports", icon: FileText, minRole: "supervisor" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, minRole: "supervisor" },
];

const roleHierarchy: Record<string, number> = {
  viewer: 0,
  analyst: 1,
  supervisor: 2,
  admin: 3,
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, isAdmin, roles, signOut, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const initials = profile?.display_name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "U";

  // Get highest role level
  const userRoleLevel = Math.max(0, ...roles.map((r) => roleHierarchy[r] ?? 0));
  const userRoleLabel = isAdmin ? "Admin" : roles.includes("supervisor") ? "Supervisor" : roles.includes("analyst") ? "Analyst" : "Viewer";

  const visibleItems = allNavItems.filter((item) => userRoleLevel >= (roleHierarchy[item.minRole] ?? 0));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-2 px-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider text-primary cyber-glow-text">NAZAR</span>
              <span className="text-[10px] text-muted-foreground">Zero Trust Monitor</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin")} tooltip="Admin Panel">
                    <NavLink to="/admin" end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <Settings className="h-4 w-4" />
                      {!collapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border pt-2">
        <div className="flex items-center gap-2 px-2">
          <Avatar className="h-7 w-7 border border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{profile?.display_name || user?.email}</p>
              <p className="text-[10px] text-muted-foreground truncate">{userRoleLabel}</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
