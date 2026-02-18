import { useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { logout } from "@/services/authService";
import { AppSidebar } from "@/components/app-sidebar";
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

const NOTIFICATIONS = [
  { id: 1, text: "New book return request", time: "2m ago", unread: true },
  {
    id: 2,
    text: "Overdue reminder sent to 3 users",
    time: "1h ago",
    unread: true,
  },
  { id: 3, text: "New member registered", time: "3h ago", unread: false },
];

function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
}

export default function DashboardLayout() {
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // even if API call fails, clear local state
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleThemeChange = useCallback((theme) => {
    setActiveTheme(theme);
    applyTheme(theme);
  }, []);

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <SidebarProvider>
      <AppSidebar />
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
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {unreadCount} unread
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {NOTIFICATIONS.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
                  >
                    <div className="flex w-full items-start gap-2">
                      {n.unread && (
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                      )}
                      <span
                        className={`text-sm leading-snug ${
                          n.unread
                            ? "font-medium"
                            : "font-normal text-muted-foreground"
                        }`}
                      >
                        {n.text}
                      </span>
                    </div>
                    <span className="pl-3.5 text-xs text-muted-foreground">
                      {n.time}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-sm text-muted-foreground cursor-pointer">
                  View all notifications
                </DropdownMenuItem>
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
                    <AvatarImage src="/avatars/shadcn.jpg" alt="Admin" />
                    <AvatarFallback className="text-xs font-semibold">
                      AD
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/avatars/shadcn.jpg" alt="Admin" />
                      <AvatarFallback className="rounded-lg text-xs">
                        AD
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid text-left text-sm leading-tight">
                      <span className="truncate font-medium">Admin</span>
                      <span className="truncate text-xs text-muted-foreground">
                        admin@library.com
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
