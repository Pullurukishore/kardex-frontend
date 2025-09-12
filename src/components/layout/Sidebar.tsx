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
import { motion, AnimatePresence } from "framer-motion";

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
  { title: "Tickets", href: "/admin/tickets", icon: ClipboardList, roles: [UserRole.ADMIN] },
  { title: "Reports", href: "/admin/reports", icon: FileText, roles: [UserRole.ADMIN] },

  // Service Person
  { title: "Dashboard", href: "/service-person/dashboard", icon: LayoutDashboard, roles: [UserRole.SERVICE_PERSON] },
  { title: "Assigned Tickets", href: "/service-person/tickets", icon: ClipboardList, roles: [UserRole.SERVICE_PERSON] },

  // Zone User
  { title: "Dashboard", href: "/zone/dashboard", icon: LayoutDashboard, roles: [UserRole.ZONE_USER] },
  { title: "Field Analytics", href: "/zone/FSA", icon: BarChart2, roles: [UserRole.ZONE_USER] },
  { title: "Service Persons", href: "/zone/service-persons", icon: MapPin, roles: [UserRole.ZONE_USER] },
  { title: "Customers", href: "/zone/customers", icon: Users, roles: [UserRole.ZONE_USER] },
  { title: "Tickets", href: "/zone/tickets", icon: ClipboardList, roles: [UserRole.ZONE_USER] },
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
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

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
    // Optimistically mark as active for immediate visual feedback
    setPendingHref(item.href);
    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      onClose?.();
    });
  }, [onClose]);

  // Clear pending state after navigation completes
  React.useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  // Enhanced renderNavItem function with animations
  const renderNavItem = React.useCallback((item: NavItem) => {
    const isActive = (pathname?.startsWith(item.href) ?? false) || pendingHref === item.href;
    const Icon = item.icon;
    const isHovered = hoveredItem === item.href;
    
    // Skip rendering if the item is disabled
    if (item.disabled) {
      return null;
    }

    return (
      <motion.div
        key={item.href}
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onHoverStart={() => setHoveredItem(item.href)}
        onHoverEnd={() => setHoveredItem(null)}
      >
        <Link
          href={item.disabled ? "#" : item.href}
          onClick={(e) => handleItemClick(e, item)}
          prefetch={true}
          replace={isActive}
          shallow={true}
          scroll={false}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden",
            isActive
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
              : "text-slate-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-slate-800",
            item.disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {/* Enhanced active indicator */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                exit={{ scaleY: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 bg-white rounded-r-full shadow-sm"
              />
            )}
          </AnimatePresence>
          
          {/* Hover effect background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isHovered && !isActive ? 1 : 0, 
              scale: isHovered && !isActive ? 1 : 0.8 
            }}
            transition={{ duration: 0.2 }}
          />
          
          <motion.div 
            className="flex h-9 w-9 items-center justify-center rounded-lg relative z-10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-all duration-200",
                isActive 
                  ? "text-white drop-shadow-sm" 
                  : "text-slate-500 group-hover:text-slate-700"
              )}
            />
          </motion.div>
          
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="ml-3 flex flex-1 items-center justify-between relative z-10"
              >
                <span className="truncate font-medium">{item.title}</span>
                {item.badge && (
                  <motion.span 
                    className="ml-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Enhanced tooltip for collapsed state */}
          <AnimatePresence>
            {collapsed && isHovered && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute left-full ml-3 z-50 pointer-events-none"
              >
                <div className="rounded-lg bg-slate-800/95 backdrop-blur-sm px-3 py-2 text-sm text-white border border-slate-600/50 shadow-xl">
                  <div className="font-medium">{item.title}</div>
                  {item.badge && (
                    <div className="text-xs text-slate-300 mt-1">New updates available</div>
                  )}
                  {/* Tooltip arrow */}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-600/50" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </motion.div>
    );
  }, [pathname, collapsed, onClose, hoveredItem]);

  // Memoize the navigation items with stable references
  const navItems = React.useMemo(() => {
    return filteredNavItems.map(item => (
      <React.Fragment key={`${item.href}-${item.roles.join('-')}`}>
        {renderNavItem(item)}
      </React.Fragment>
    ));
  }, [filteredNavItems, renderNavItem]);

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative flex h-screen flex-col bg-white border-r border-slate-200/60 shadow-xl",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      {/* Enhanced Logo / Header */}
      <motion.div 
        className="flex h-20 items-center justify-between border-b border-slate-200/60 px-4 bg-gradient-to-r from-white/95 via-slate-50/95 to-white/95 backdrop-blur-sm relative overflow-hidden"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5" />
        
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
                  <Zap className="h-6 w-6 text-white drop-shadow-sm" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
              </motion.div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                  Kardex
                </h2>
                <p className="text-xs text-slate-500 font-medium -mt-0.5">
                  Dashboard
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200 group"
            onClick={() => setCollapsed?.(!collapsed)}
          >
            <motion.div
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 group-hover:scale-110 transition-transform" />
              ) : (
                <ChevronLeft className="h-4 w-4 group-hover:scale-110 transition-transform" />
              )}
            </motion.div>
          </Button>
        </motion.div>
      </motion.div>

      {/* Enhanced Navigation Section */}
      <div className="flex-1 py-4 relative">
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              className="mb-4 px-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3 w-3 text-blue-400" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Navigation
                </h3>
              </div>
              <div className="h-px bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="px-3 pb-4 max-h-full overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
          <motion.nav 
            className="space-y-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {navItems}
          </motion.nav>
        </div>
      </div>

    </motion.div>
  );
}
