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

// Full navigation items
const navigation: NavItem[] = [
  // Admin
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: [UserRole.ADMIN] },
  { title: "Field Service Analytics", href: "/admin/FSA", icon: BarChart2, roles: [UserRole.ADMIN] },
  { title: "Customers", href: "/admin/customers", icon: Users, roles: [UserRole.ADMIN] },
  { title: "Service Persons", href: "/admin/service-person", icon: Users, roles: [UserRole.ADMIN] },
  { title: "Service Zones", href: "/admin/service-zones", icon: MapPin, roles: [UserRole.ADMIN] },
  { title: "Zone Users", href: "/admin/zone-users", icon: Users, roles: [UserRole.ADMIN] },
  { title: "Assets", href: "/admin/assets", icon: Box, roles: [UserRole.ADMIN] },
  { title: "Tickets", href: "/admin/tickets", icon: ClipboardList, roles: [UserRole.ADMIN] },
  { title: "Reports", href: "/admin/reports", icon: FileText, roles: [UserRole.ADMIN] },

  // Service Person
  { title: "Dashboard", href: "/service-person/dashboard", icon: LayoutDashboard, roles: [UserRole.SERVICE_PERSON] },
  { title: "Assigned Tickets", href: "/service-person/tickets", icon: ClipboardList, roles: [UserRole.SERVICE_PERSON] },
  { title: "Schedule", href: "/service-person/schedule", icon: Calendar, roles: [UserRole.SERVICE_PERSON] },

  // Zone User
  { title: "Dashboard", href: "/zone/dashboard", icon: LayoutDashboard, roles: [UserRole.ZONE_USER] },
  { title: "Field Analytics", href: "/zone/FSA", icon: BarChart2, roles: [UserRole.ZONE_USER] },
  { title: "Assets", href: "/zone/assets", icon: Box, roles: [UserRole.ZONE_USER] },
  { title: "Tickets", href: "/zone/tickets", icon: ClipboardList, roles: [UserRole.ZONE_USER] },
  { title: "Complaints", href: "/zone/complaints", icon: AlertCircle, roles: [UserRole.ZONE_USER] },
  { title: "Reports", href: "/zone/reports", icon: FileText, roles: [UserRole.ZONE_USER] },
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

  // Memoize the filtered navigation items based on user role
  const filteredNavItems = React.useMemo(() => 
    navigation.filter((item) => item.roles.includes(userRole as UserRole)),
    [userRole]
  );

  // Memoize the click handler with stable reference
  const handleItemClick = React.useCallback((e: React.MouseEvent, item: NavItem) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      onClose?.();
    });
  }, [onClose]);

  // Memoize the renderNavItem function with proper dependencies
  const renderNavItem = React.useCallback((item: NavItem) => {
    const isActive = pathname?.startsWith(item.href) ?? false;
    const Icon = item.icon;
    
    // Skip rendering if the item is disabled
    if (item.disabled) {
      return null;
    }

    return (
      <Link
        key={item.href}
        href={item.disabled ? "#" : item.href}
        onClick={(e) => handleItemClick(e, item)}
        prefetch={false}
        replace={isActive}
        shallow={true} // Prevents full page reloads
        scroll={false} // Disables automatic scrolling
        className={cn(
          "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium",
          isActive
            ? "bg-slate-800 text-white"
            : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
          item.disabled && "cursor-not-allowed opacity-60"
        )}
      >
        {/* Active indicator - simplified */}
        {isActive && (
          <div className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-white rounded-r" />
        )}
        
        <div className="flex h-8 w-8 items-center justify-center rounded">
          <Icon
            className={cn(
              "h-5 w-5 flex-shrink-0",
              isActive ? "text-white" : "text-slate-400 group-hover:text-white"
            )}
          />
        </div>
        
        {!collapsed && (
          <div className="ml-3 flex flex-1 items-center justify-between">
            <span className="truncate">{item.title}</span>
            {item.badge && (
              <span className="ml-2 rounded-full bg-pink-600 px-2 py-0.5 text-xs font-bold text-white">
                {item.badge}
              </span>
            )}
          </div>
        )}
        
        {/* Simplified tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full ml-2 hidden group-hover:block z-50">
            <div className="rounded bg-slate-800 px-2 py-1 text-xs text-white border border-slate-700">
              {item.title}
            </div>
          </div>
        )}
      </Link>
    );
  }, [pathname, collapsed, onClose]);

  // Memoize the navigation items with stable references
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
        "relative flex h-screen flex-col bg-slate-900 border-r border-slate-700/30",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo / Header - simplified */}
      <div className="flex h-16 items-center justify-between border-b border-slate-700/30 px-4 bg-slate-800/50">
        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
            <Ticket className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50"
          onClick={() => setCollapsed?.(!collapsed)}
        >
          {collapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Section - simplified */}
      <div className="flex-1 overflow-y-auto py-4">
        {!collapsed && (
          <div className="mb-4 px-4">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Navigation
            </h3>
          </div>
        )}
        <nav className="space-y-1 px-2">
          {navItems}
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="border-t border-slate-700/30 p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30">
        <div className="flex items-center gap-3 group cursor-pointer hover:bg-slate-700/20 rounded-xl p-2 transition-all duration-300">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-purple-400/40 group-hover:ring-purple-400/60 transition-all duration-300">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-sm">
                {userRole
                  ? userRole
                      .split("_")
                      .map((n) => n?.[0] || '')
                      .filter(Boolean)
                      .join("") || 'U'
                  : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-slate-900 shadow-sm" />
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {userRole === UserRole.ADMIN
                  ? "Administrator"
                  : userRole === UserRole.SERVICE_PERSON
                  ? "Service Person"
                  : "Zone User"}
              </p>
              <p className="text-xs text-slate-400 capitalize truncate">
                {userRole ? userRole.toLowerCase().replace("_", " ") : 'user'} • Online
              </p>
            </div>
          )}
          
          {!collapsed && (
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
          )}
        </div>
        
        {/* Quick Actions */}
        {!collapsed && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Help
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
