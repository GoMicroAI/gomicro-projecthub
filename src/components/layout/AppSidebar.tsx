import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  Users,
  Megaphone,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";

const navItems = [
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Team", url: "/team", icon: Users },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { role, isAdmin } = useUserRole();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <img src={logo} alt="GoMicro" className="h-10 w-10" />
              <div className="text-sidebar-foreground">
                <span className="font-bold text-sm">ProjectHUB</span>
              </div>
            </div>
          ) : (
            <img src={logo} alt="GoMicro" className="h-8 w-8" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("ml-auto text-sidebar-foreground hover:bg-sidebar-accent", onNavigate && "hidden")}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.title}>
              <Link
                to={item.url}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive(item.url)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed ? "justify-center" : ""
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm">
              {user?.email ? getInitials(user.email) : "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">
                {user?.email}
              </p>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs bg-sidebar-accent/50 text-sidebar-foreground",
                  isAdmin && "bg-status-active text-status-active-foreground"
                )}
              >
                {role || "..."}
              </Badge>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}