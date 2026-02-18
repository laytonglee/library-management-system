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

const data = {
  user: {
    name: "Admin",
    email: "admin@library.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "School Library",
      logo: GalleryVerticalEnd,
      plan: "Management System",
    },
  ],
  navMain: [
    {
      title: "General",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Dashboard", url: "/dashboard" },
        { title: "Search Catalog", url: "/search" },
        { title: "My History", url: "/history" },
      ],
    },
    {
      title: "Circulation",
      url: "/checkout",
      icon: ArrowLeftRight,
      items: [
        { title: "Checkout Book", url: "/checkout" },
        { title: "Return Book", url: "/return" },
        { title: "Overdue Books", url: "/overdue" },
      ],
    },
    {
      title: "Management",
      url: "/catalog",
      icon: BookCopy,
      items: [
        { title: "Catalog", url: "/catalog" },
        { title: "Users", url: "/users" },
      ],
    },
    {
      title: "Analytics",
      url: "/reports",
      icon: BarChart3,
      items: [
        { title: "Reports", url: "/reports" },
        { title: "Audit Logs", url: "/audit-logs" },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [{ title: "Borrowing Policies", url: "/settings" }],
    },
  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
