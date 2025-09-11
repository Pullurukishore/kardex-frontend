'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Menu, LogOut, User, Settings, Bell, ChevronDown } from 'lucide-react';
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

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

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
    <header
      className={cn(
        'relative z-50 border-b border-slate-700/20 shadow-xl',
        'bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl',
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-600/5 before:via-pink-600/5 before:to-indigo-600/5 before:pointer-events-none',
        className
      )}
    >
      <div className="relative flex h-20 items-center justify-between px-4 md:px-6">
        {/* Left section (menu + title) */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 rounded-xl hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full shadow-sm" />
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Kardex Ticket Management
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-wider -mt-1">
                SERVICE MANAGEMENT SYSTEM
              </p>
            </div>
          </div>
        </div>

        {/* Right section (notifications + user menu) */}
        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-4 mr-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">System Online</span>
            </div>
          </div>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-xl hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-300 hover:scale-110"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-xs font-bold text-white flex items-center justify-center shadow-lg animate-pulse">
              3
            </span>
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-12 px-3 rounded-xl hover:bg-slate-700/50 transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 ring-2 ring-purple-400/40 group-hover:ring-purple-400/60 transition-all duration-300">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-sm">
                      {getEmailInitial()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-white truncate max-w-32">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-32">
                      {getRoleDisplayName(user?.role)}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-purple-400/40">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-lg">
                      {getEmailInitial()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-slate-400 truncate">
                        {user.email}
                      </p>
                    )}
                    {user?.role && (
                      <Badge variant="outline" className="mt-1 text-xs border-purple-400/30 text-purple-300">
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className="bg-slate-700/50" />
              
              <div className="p-2 space-y-1">
                <DropdownMenuItem asChild>
                  <a href="/profile" className="flex w-full items-center px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                    <User className="mr-3 h-4 w-4" />
                    <span>Profile Settings</span>
                  </a>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <a href="/settings" className="flex w-full items-center px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                    <Settings className="mr-3 h-4 w-4" />
                    <span>Preferences</span>
                  </a>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <a href="/notifications" className="flex w-full items-center px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                    <Bell className="mr-3 h-4 w-4" />
                    <span>Notifications</span>
                    <Badge className="ml-auto bg-pink-500 text-white text-xs">3</Badge>
                  </a>
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator className="bg-slate-700/50" />
              
              <div className="p-2">
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer flex w-full items-center px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
