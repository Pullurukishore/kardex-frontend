'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/user.types';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageKey, setPageKey] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route change and handle page transitions
  useEffect(() => {
    setSidebarOpen(false);
    setIsLoading(true);
    setPageKey(prev => prev + 1);
    
    // Remove artificial delay to speed up first and subsequent navigations
    const rAF = requestAnimationFrame(() => setIsLoading(false));
    return () => cancelAnimationFrame(rAF);
  }, [pathname]);
  
  // Initial loading
  useEffect(() => {
    // Remove initial artificial delay
    const rAF = requestAnimationFrame(() => setIsLoading(false));
    return () => cancelAnimationFrame(rAF);
  }, []);
  
  // Track mount to avoid SSR/CSR style mismatches (e.g., window checks)
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(false);
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobileSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Enhanced background with animated patterns */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Mobile sidebar overlay with enhanced animation */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Enhanced Sidebar with smooth animations */}
      <motion.div
        className={cn(
          'fixed inset-y-0 left-0 z-50',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        animate={{
          width: isCollapsed ? 64 : 256,
        }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <Sidebar
          userRole={userRole}
          onClose={() => setSidebarOpen(false)}
          collapsed={isCollapsed}
          setCollapsed={setIsCollapsed}
          className="h-full"
        />
      </motion.div>

      {/* Main content with enhanced animations */}
      <motion.div
        className="flex flex-1 flex-col"
        animate={{
          paddingLeft: isCollapsed ? 64 : 256,
        }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          paddingLeft: hasMounted && typeof window !== 'undefined' && window.innerWidth < 1024 ? 0 : undefined,
        }}
      >
        {/* Header with entrance animation */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Header
            onMenuClick={toggleMobileSidebar}
            className="sticky top-0 z-30"
          />
        </motion.div>

        {/* Page content with enhanced styling and loading states */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Enhanced background patterns */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/20 to-purple-50/30 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))] pointer-events-none" />
          
          {/* Loading overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-purple-50/40 backdrop-blur-sm z-10 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-purple-200 rounded-full animate-spin" />
                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" />
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm font-medium text-slate-600"
                  >
                    Loading...
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="relative mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pageKey}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                  delay: isLoading ? 0.3 : 0,
                }}
                className="min-h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
