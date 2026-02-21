"use client";

import * as React from "react";
import {
  BookOpen,
  GalleryVerticalEnd,
  LayoutDashboard,
  Search,
  BookCopy,
  ArrowLeftRight,
  AlertTriangle,
  Clock,
  Users,
  BarChart3,
  ScrollText,
  Settings2,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { PERMISSIONS, hasPermission } from "@/constants/permissions";

const teams = [
  {
    name: "School Library",
    logo: GalleryVerticalEnd,
    plan: "Management System",
  },
];

/**
 * Full navigation definition.
 * Each item/sub-item can optionally declare a `permission` key.
 * Items without a permission are visible to everyone.
 */
const allNavItems = [
  {
    title: "General",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        permission: PERMISSIONS.VIEW_DASHBOARD,
      },
      {
        title: "Search Catalog",
        url: "/search",
        icon: Search,
        permission: PERMISSIONS.SEARCH_CATALOG,
      },
      {
        title: "My History",
        url: "/history",
        icon: Clock,
        permission: PERMISSIONS.VIEW_OWN_HISTORY,
      },
    ],
  },
  {
    title: "Circulation",
    url: "/checkout",
    icon: ArrowLeftRight,
    items: [
      {
        title: "Checkout Book",
        url: "/checkout",
        icon: BookOpen,
        permission: PERMISSIONS.CHECKOUT_BOOK,
      },
      {
        title: "Return Book",
        url: "/return",
        icon: ArrowLeftRight,
        permission: PERMISSIONS.RETURN_BOOK,
      },
      {
        title: "Overdue Books",
        url: "/overdue",
        icon: AlertTriangle,
        permission: PERMISSIONS.VIEW_OVERDUE,
      },
    ],
  },
  {
    title: "Management",
    url: "/catalog",
    icon: BookCopy,
    items: [
      {
        title: "Catalog",
        url: "/catalog",
        icon: BookCopy,
        permission: PERMISSIONS.MANAGE_CATALOG,
      },
      {
        title: "Users",
        url: "/users",
        icon: Users,
        permission: PERMISSIONS.MANAGE_USERS,
      },
    ],
  },
  {
    title: "Analytics",
    url: "/reports",
    icon: BarChart3,
    items: [
      {
        title: "Reports",
        url: "/reports",
        icon: BarChart3,
        permission: PERMISSIONS.VIEW_REPORTS,
      },
      {
        title: "Audit Logs",
        url: "/audit-logs",
        icon: ScrollText,
        permission: PERMISSIONS.VIEW_AUDIT_LOGS,
      },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
    items: [
      {
        title: "Borrowing Policies",
        url: "/settings",
        icon: Settings2,
        permission: PERMISSIONS.MANAGE_SETTINGS,
      },
    ],
  },
];

/**
 * Filter nav items based on the user's role.
 * - Sub-items without a matching permission are removed.
 * - Sections with zero visible sub-items are removed entirely.
 */
function getNavForRole(role) {
  if (!role) return [];

  return allNavItems
    .map((section) => {
      const visibleItems = section.items.filter(
        (item) => !item.permission || hasPermission(role, item.permission),
      );
      if (visibleItems.length === 0) return null;
      return { ...section, items: visibleItems };
    })
    .filter(Boolean);
}

export function AppSidebar({ user: authUser, ...props }) {
  const role = authUser?.role?.name ?? null;

  const sidebarUser = authUser
    ? {
        name: authUser.fullName,
        email: authUser.email,
        avatar: "/avatars/shadcn.jpg",
      }
    : { name: "Guest", email: "", avatar: "/avatars/shadcn.jpg" };

  const navItems = React.useMemo(() => getNavForRole(role), [role]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
