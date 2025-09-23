"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/user.types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Ticket,
  Zap,
  Activity,
  Sparkles,
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

const navigation: NavItem[] = [
  // Admin
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: [UserRole.ADMIN] },
  { title: "Daily Activity", href: "/admin/attendance", icon: Calendar, roles: [UserRole.ADMIN] },
  { title: "Customers", href: "/admin/customers", icon: Users, roles: [UserRole.ADMIN] },
  { title: "Service Persons", href: "/admin/service-person", icon: Users, roles: [UserRole.ADMIN] },
  { title: "Service Zones", href: "/admin/service-zones", icon: MapPin, roles: [UserRole.ADMIN] },
  { title: "Zone Users", href: "/admin/zone-users", icon: Users, roles: [UserRole.ADMIN] },
  { title: "Tickets", href: "/admin/tickets", icon: ClipboardList, roles: [UserRole.ADMIN] },
  { title: "Reports", href: "/admin/reports", icon: FileText, roles: [UserRole.ADMIN] },

  // Service Person
  { title: "Dashboard", href: "/service-person/dashboard", icon: LayoutDashboard, roles: [UserRole.SERVICE_PERSON] },
  { title: "My Activity", href: "/service-person/activity", icon: Calendar, roles: [UserRole.SERVICE_PERSON] },
  { title: "My Tickets", href: "/service-person/tickets", icon: Ticket, roles: [UserRole.SERVICE_PERSON] },
  { title: "Performance Reports", href: "/service-person/reports", icon: BarChart2, roles: [UserRole.SERVICE_PERSON] },

  // Zone User
  { title: "Dashboard", href: "/zone/dashboard", icon: LayoutDashboard, roles: [UserRole.ZONE_USER] },
  { title: "Daily Activity", href: "/zone/attendence", icon: Calendar, roles: [UserRole.ZONE_USER] },
  { title: "Service Persons", href: "/zone/service-persons", icon: MapPin, roles: [UserRole.ZONE_USER] },
  { title: "Customers", href: "/zone/customers", icon: Users, roles: [UserRole.ZONE_USER] },
  { title: "Tickets", href: "/zone/tickets", icon: ClipboardList, roles: [UserRole.ZONE_USER] },
  { title: "Reports", href: "/zone/reports", icon: FileText, roles: [UserRole.ZONE_USER] },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  userRole?: UserRole;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  onClose?: () => void;
}

const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
};

export function Sidebar({
  userRole,
  onClose,
  className,
  collapsed = false,
  setCollapsed,
}: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const filteredNavItems = React.useMemo(() => {
    if (!userRole) return [];
    return navigation.filter((item) => item.roles.includes(userRole));
  }, [userRole]);

  const handleItemClick = React.useCallback((e: React.MouseEvent, item: NavItem) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    setPendingHref(item.href);
    requestAnimationFrame(() => {
      onClose?.();
    });
  }, [onClose]);

  React.useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const renderNavItem = React.useCallback((item: NavItem) => {
    const isActive = (pathname?.startsWith(item.href) ?? false) || pendingHref === item.href;
    const Icon = item.icon;
    const isHovered = hoveredItem === item.href;

    if (item.disabled) {
      return null;
    }

    return (
      <ClientOnly>
        <Link
          href={item.disabled ? "#" : item.href}
          onClick={(e) => handleItemClick(e, item)}
          onMouseEnter={() => setHoveredItem(item.href)}
          onMouseLeave={() => setHoveredItem(null)}
          prefetch={true}
          replace={isActive}
          shallow={true}
          scroll={false}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            "group relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ease-out overflow-hidden backdrop-blur-sm",
            "before:absolute before:inset-0 before:rounded-xl before:transition-all before:duration-300",
            isActive
              ? "bg-gradient-to-r from-blue-500/90 via-indigo-500/90 to-purple-500/90 text-white shadow-lg shadow-blue-500/25 before:bg-white/10"
              : "text-slate-700 hover:text-slate-900 hover:bg-white/60 hover:shadow-md hover:shadow-slate-200/50 before:bg-transparent hover:before:bg-gradient-to-r hover:before:from-blue-50/80 hover:before:to-indigo-50/80",
            item.disabled && "cursor-not-allowed opacity-60",
            "transform hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white/80 shadow-sm" />
          )}
          
          {/* Hover glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
            isHovered && !isActive && "opacity-100 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"
          )} />
          
          <Icon
            className={cn(
              "h-5 w-5 flex-shrink-0 transition-all duration-300 relative z-10",
              isActive
                ? "text-white drop-shadow-sm transform scale-110"
                : "text-slate-500 group-hover:text-blue-600 group-hover:scale-110"
            )}
          />
          {!collapsed && (
            <span className="ml-3 flex flex-1 items-center justify-between relative z-10">
              <span className="truncate font-medium">{item.title}</span>
              {item.badge && (
                <span
                  className="ml-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg animate-pulse"
                >
                  {item.badge}
                </span>
              )}
            </span>
          )}
        </Link>
      </ClientOnly>
    );
  }, [pathname, collapsed, onClose, hoveredItem]);

  const navItems = React.useMemo(() => {
    return filteredNavItems.map(item => (
      <React.Fragment key={`${item.href}-${item.roles.join('-')}`}>
        {renderNavItem(item)}
      </React.Fragment>
    ));
  }, [filteredNavItems, renderNavItem]);

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col backdrop-blur-xl bg-white/95 border-r border-slate-200/60 shadow-2xl transition-all duration-500 ease-out",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white/90 to-blue-50/60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-blue-500/5 pointer-events-none" />
      
      {/* Subtle animated mesh gradient */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-indigo-400/20 to-transparent rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Modern Header */}
      <div className="flex h-20 items-center justify-between border-b border-slate-200/40 px-4 bg-white/80 backdrop-blur-md relative z-10">
        <ClientOnly>
          {!collapsed && (
            <div className="flex items-center gap-3 transition-all duration-500 ease-out">
              <div className="relative group">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl shadow-blue-500/25 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-blue-500/40 group-hover:scale-105">
                  <Zap className="h-6 w-6 text-white drop-shadow-sm" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 blur-xl scale-110 group-hover:opacity-30 transition-opacity duration-300" />
              </div>
              <div className="transition-all duration-300">
                <h2 className="text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Kardex</h2>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center w-full">
              <div className="relative group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border border-white shadow-sm animate-pulse" />
              </div>
            </div>
          )}
        </ClientOnly>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-white/60 hover:shadow-md rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm"
          onClick={() => setCollapsed?.(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform duration-300" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-transform duration-300" />
          )}
        </Button>
      </div>

      {/* Navigation Section */}
      <ScrollArea className="flex-1 py-6">
        <ClientOnly>
          {!collapsed && (
            <nav className="space-y-1 px-4">
              {navItems}
            </nav>
          )}
        </ClientOnly>
      </ScrollArea>

      {/* Bottom spacing */}
      <div className="h-4"></div>
    </div>
  );
}