'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/user.types';

interface DashboardClientWrapperProps {
  children: React.ReactNode;
  userRole: UserRole;
}

export function DashboardClientWrapper({ children, userRole }: DashboardClientWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageKey, setPageKey] = useState(0);
  const pathname = usePathname();

  // Close mobile sidebar on route change and handle page transitions
  useEffect(() => {
    setSidebarOpen(false);
    setIsLoading(true);
    setPageKey(prev => prev + 1);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  // Initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={cn(
        "lg:block",
        sidebarOpen ? "block" : "hidden lg:block"
      )}>
        <Sidebar 
          userRole={userRole}
          collapsed={isCollapsed}
          setCollapsed={setIsCollapsed}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
      {/* Main content */}
      <div 
        className={cn(
          "flex flex-col min-h-screen transition-all duration-500 ease-out",
          isCollapsed ? "lg:ml-16" : "lg:ml-64" // Responsive margins based on sidebar state
        )}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6 px-4 sm:px-6 lg:px-8 min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={pageKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
