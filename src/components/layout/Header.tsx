'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Menu, LogOut, User, Settings, ChevronDown, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Ensure time-dependent UI renders only after mount to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  // Monitor online status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getEmailInitial = () => {
    if (!user?.email) return 'U';
    return user.email[0].toUpperCase();
  };

  const getRoleDisplayName = (role?: UserRole) => {
    if (!role) return 'User';
    return role
      .toLowerCase()
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'relative z-50 border-b border-slate-200/60 shadow-2xl',
        'bg-gradient-to-r from-white/95 via-slate-50/95 to-white/95 backdrop-blur-xl',
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-600/5 before:via-pink-600/5 before:to-indigo-600/5 before:pointer-events-none',
        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-purple-500/20 after:to-transparent',
        className
      )}
    >
      <div className="relative flex h-20 items-center justify-between px-4 md:px-6">
        {/* Left section (menu + title) */}
        <motion.div 
          className="flex items-center gap-4"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 rounded-xl hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition-all duration-300 hover:scale-110 group"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6 group-hover:rotate-180 transition-transform duration-300" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="flex items-center gap-4">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="h-10 w-10 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
            </motion.div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-800 via-purple-700 to-indigo-700 bg-clip-text text-transparent">
                Kardex Ticket Management
              </h1>
              <div className="flex items-center gap-2 -mt-1">
                <p className="text-xs text-slate-500 font-medium tracking-wider">
                  SERVICE PLATFORM
                </p>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                  )} />
                  <span className="text-xs font-medium text-green-700">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right section (notifications + user menu) */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Enhanced Quick Stats */}
          <div className="hidden lg:flex items-center gap-4 mr-4">
            {hasMounted && (
              <motion.div 
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200/60 shadow-sm"
                whileHover={{ scale: 1.02, y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Activity className="h-4 w-4 text-purple-600" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-700">
                    {currentTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </p>
                  <p className="text-xs text-slate-500 -mt-0.5">
                    {currentTime.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
          

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="ghost"
                  className="relative h-12 px-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group border border-transparent hover:border-purple-200/50 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 ring-2 ring-purple-400/40 group-hover:ring-purple-500/60 transition-all duration-300 shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-sm">
                        {getEmailInitial()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 truncate max-w-32 transition-colors">
                        {user?.name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 group-hover:text-slate-600 truncate max-w-32 transition-colors">
                        {getRoleDisplayName(user?.role)}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: 0 }}
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
                    </motion.div>
                  </div>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-xl"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-purple-400/40 shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-lg">
                      {getEmailInitial()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                    )}
                    {user?.role && (
                      <Badge variant="outline" className="mt-1 text-xs border-purple-400/30 text-purple-600 bg-purple-50">
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className="bg-slate-200/60" />
              
              <div className="p-2 space-y-1">
                <DropdownMenuItem asChild>
                  <a href="/profile" className="flex w-full items-center px-3 py-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-purple-50 transition-all duration-200 group">
                    <User className="mr-3 h-4 w-4 group-hover:text-purple-600 transition-colors" />
                    <span>Profile Settings</span>
                  </a>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <a href="/profile" className="flex w-full items-center px-3 py-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-purple-50 transition-all duration-200 group">
                    <Settings className="mr-3 h-4 w-4 group-hover:text-purple-600 transition-colors" />
                    <span>Preferences</span>
                  </a>
                </DropdownMenuItem>
                
              </div>
              
              <DropdownMenuSeparator className="bg-slate-200/60" />
              
              <div className="p-2">
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer flex w-full items-center px-3 py-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 group"
                >
                  <LogOut className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>
    </motion.header>
  );
}