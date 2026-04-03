import { useState, useCallback, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";
// TODO: enable when notifications are ready
// import {
//   getNotifications,
//   markAllAsRead,
//   markAsRead,
// } from "@/services/notificationService";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Search,
  Palette,
  Check,
  User,
  Settings,
  LogOut,
} from "lucide-react";

// ─── Theme definitions ───────────────────────────────────────────────────────
const THEMES = [
  {
    name: "Default",
    color: "#09090b",
    vars: {
      "--primary": "oklch(0.21 0.034 264.665)",
      "--primary-foreground": "oklch(0.985 0.002 247.839)",
      "--ring": "oklch(0.707 0.022 261.325)",
      "--sidebar-primary": "oklch(0.21 0.034 264.665)",
      "--sidebar-primary-foreground": "oklch(0.985 0.002 247.839)",
      "--sidebar-ring": "oklch(0.707 0.022 261.325)",
    },
  },
  {
    name: "Ocean",
    color: "#3b82f6",
    vars: {
      "--primary": "oklch(0.6 0.2 240)",
      "--primary-foreground": "oklch(0.98 0.01 240)",
      "--ring": "oklch(0.65 0.18 240)",
      "--sidebar-primary": "oklch(0.6 0.2 240)",
      "--sidebar-primary-foreground": "oklch(0.98 0.01 240)",
      "--sidebar-ring": "oklch(0.65 0.18 240)",
    },
  },
  {
    name: "Forest",
    color: "#22c55e",
    vars: {
      "--primary": "oklch(0.55 0.18 145)",
      "--primary-foreground": "oklch(0.98 0.01 145)",
      "--ring": "oklch(0.6 0.16 145)",
      "--sidebar-primary": "oklch(0.55 0.18 145)",
      "--sidebar-primary-foreground": "oklch(0.98 0.01 145)",
      "--sidebar-ring": "oklch(0.6 0.16 145)",
    },
  },
  {
    name: "Sunset",
    color: "#f97316",
    vars: {
      "--primary": "oklch(0.65 0.22 45)",
      "--primary-foreground": "oklch(0.98 0.01 45)",
      "--ring": "oklch(0.68 0.2 45)",
      "--sidebar-primary": "oklch(0.65 0.22 45)",
      "--sidebar-primary-foreground": "oklch(0.98 0.01 45)",
      "--sidebar-ring": "oklch(0.68 0.2 45)",
    },
  },
  {
    name: "Purple",
    color: "#a855f7",
    vars: {
      "--primary": "oklch(0.6 0.24 300)",
      "--primary-foreground": "oklch(0.98 0.01 300)",
      "--ring": "oklch(0.63 0.22 300)",
      "--sidebar-primary": "oklch(0.6 0.24 300)",
      "--sidebar-primary-foreground": "oklch(0.98 0.01 300)",
      "--sidebar-ring": "oklch(0.63 0.22 300)",
    },
  },
  {
    name: "Rose",
    color: "#f43f5e",
    vars: {
      "--primary": "oklch(0.62 0.24 15)",
      "--primary-foreground": "oklch(0.98 0.01 15)",
      "--ring": "oklch(0.65 0.22 15)",
      "--sidebar-primary": "oklch(0.62 0.24 15)",
      "--sidebar-primary-foreground": "oklch(0.98 0.01 15)",
      "--sidebar-ring": "oklch(0.65 0.22 15)",
    },
  },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
}

export default function DashboardLayout() {
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  // TODO: enable when notifications are ready
  // const [notifications, setNotifications] = useState([]);
  // const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // TODO: enable when notifications are ready
  // useEffect(() => {
  //   if (!user) return;
  //   async function fetchNotifs() {
  //     try {
  //       const { data } = await getNotifications({ limit: 10 });
  //       setNotifications(data.data);
  //       setUnreadCount(data.unreadCount);
  //     } catch {
  //       // silently ignore polling errors
  //     }
  //   }
  //   fetchNotifs();
  //   const interval = setInterval(fetchNotifs, 10000);
  //   return () => clearInterval(interval);
  // }, [user]);

  // TODO: enable when notifications are ready
  // async function handleMarkAllRead() { ... }
  // async function handleMarkOneRead(id) { ... }

  const handleLogout = async () => {
    await logout();
  };

  const handleThemeChange = useCallback((theme) => {
    setActiveTheme(theme);
    applyTheme(theme);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        {/* ── Header ── */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search anything..."
                className="h-9 w-56 rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            {/* Theme Presets */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Theme presets"
                >
                  <Palette className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Theme Presets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {THEMES.map((theme) => (
                  <DropdownMenuItem
                    key={theme.name}
                    onClick={() => handleThemeChange(theme)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="flex-1">{theme.name}</span>
                    {activeTheme.name === theme.name && (
                      <Check className="size-3.5 text-muted-foreground" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Notifications coming soon
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border overflow-hidden hover:ring-2 hover:ring-ring transition-all"
                  aria-label="User profile"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage
                      src="/avatars/shadcn.jpg"
                      alt={user?.fullName || "User"}
                    />
                    <AvatarFallback className="text-xs font-semibold">
                      {user?.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src="/avatars/shadcn.jpg"
                        alt={user?.fullName || "User"}
                      />
                      <AvatarFallback className="rounded-lg text-xs">
                        {user?.fullName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user?.fullName || "User"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email || ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <User className="size-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <Settings className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 text-red-500 focus:text-red-500"
                >
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Page Content (rendered by child route) ── */}
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
