"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/user.types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Bell,
  MessageSquare,
  Box,
  ShoppingCart,
  BarChart2,
  AlertCircle,
  ClipboardList,
  MapPin,
  Menu,
  ChevronLeft,
  ChevronDown,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  X,
  Calendar,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  children?: NavItem[];
  disabled?: boolean;
  badge?: string;
};

// Navigation items for each role
const navigation: NavItem[] = [
  // Admin Navigation
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN],
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
    roles: [UserRole.ADMIN],
  },
  {
    title: "Service Persons",
    href: "/admin/service-persons",
    icon: Users,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Assets',
    href: '/admin/assets',
    icon: Box,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Tickets',
    href: '/admin/tickets',
    icon: ClipboardList,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Complaints',
    href: '/admin/complaints',
    icon: AlertCircle,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart2,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'FSA Reports',
    href: '/admin/FSA',
    icon: BarChart2,
    roles: [UserRole.ADMIN],
  },
  // Service Person Navigation
  {
    title: 'Dashboard',
    href: '/service-person/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.SERVICE_PERSON],
  },
  {
    title: 'Assigned Tickets',
    href: '/service-person/tickets',
    icon: ClipboardList,
    roles: [UserRole.SERVICE_PERSON],
  },
  {
    title: 'Schedule',
    href: '/service-person/schedule',
    icon: Calendar,
    roles: [UserRole.SERVICE_PERSON],
  },
  // Zone User Navigation
  {
    title: 'Dashboard',
    href: '/zone/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ZONE_USER],
  },
  {
    title: 'Assets',
    href: '/zone/assets',
    icon: Box,
    roles: [UserRole.ZONE_USER],
  },
  {
    title: 'Tickets',
    href: '/zone/tickets',
    icon: ClipboardList,
    roles: [UserRole.ZONE_USER],
  },
  {
    title: 'Complaints',
    href: '/zone/complaints',
    icon: AlertCircle,
    roles: [UserRole.ZONE_USER],
  },
  {
    title: 'Reports',
    href: '/zone/reports',
    icon: BarChart2,
    roles: [UserRole.ZONE_USER],
  },
];

interface SidebarProps {
  userRole: UserRole;
  onClose?: () => void;
  className?: string;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export function Sidebar({
  userRole,
  onClose,
  className,
  collapsed = false,
  setCollapsed,
}: SidebarProps): JSX.Element {
  const pathname = usePathname();
  
  // Filter navigation items based on user role
  const filteredNavItems = React.useMemo(() => {
    return navigation.filter((item) => item.roles.includes(userRole as UserRole));
  }, [userRole]);

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isAllowed = item.roles.includes(userRole as UserRole);
    const Icon = item.icon;

    if (!isAllowed) return null;

    if (hasChildren) {
      return (
        <div key={item.href} className="space-y-1">
          <div
            className={cn(
              "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              item.disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <div className="flex items-center">
              {Icon && <Icon className="mr-3 h-5 w-5" />}
              {!collapsed && <span>{item.title}</span>}
            </div>
            {!collapsed && (
              <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            )}
          </div>
          {!collapsed && item.children && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map((child) => renderNavItem(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.disabled ? "#" : item.href}
        onClick={onClose}
        className={cn(
          "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
          item.disabled && "cursor-not-allowed opacity-60"
        )}
      >
        {Icon && <Icon className="mr-3 h-5 w-5" />}
        {!collapsed && (
          <>
            <span>{item.title}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link
          href="/"
          className="flex items-center space-x-2 font-bold"
          onClick={onClose}
        >
          <span className={cn("text-xl", collapsed ? "hidden" : "block")}>
            KardexCare
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed?.(!collapsed)}
        >
          {collapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
          <span className="sr-only">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {filteredNavItems.map((item) => (
            <div key={item.href} className="space-y-1">
              {renderNavItem(item)}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {userRole
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium">
                {userRole.split("_").join(" ")}
              </p>
              <p className="text-xs text-muted-foreground">
                {userRole === UserRole.ADMIN
                  ? "Administrator"
                  : userRole === UserRole.SERVICE_PERSON
                  ? "Service Person"
                  : "Zone User"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
