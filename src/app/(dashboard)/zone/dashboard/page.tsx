'use server';

import { Suspense } from 'react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import DashboardErrorFallback from '@/components/dashboard/DashboardErrorFallback';
import { getAllZoneDashboardData } from '@/lib/server/dashboard';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { ZoneDashboardData } from '@/lib/server/dashboard';
import ZoneDashboardClient from '@/components/dashboard/zone/ZoneDashboardClient';

// Loading component for Suspense boundary
function ZoneDashboardLoading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Loading zone dashboard data...</p>
      </div>
    </div>
  );
}

// Server Component - runs on the server for initial data fetching
export default async function ZoneDashboardPage() {
  try {
    const cookieStore = cookies();
    const userRole = cookieStore.get('userRole')?.value;
    
    if (!userRole) {
      redirect('/auth/login');
    }

    // Check if user has access to zone dashboard (case-insensitive check)
    const normalizedUserRole = userRole.toLowerCase();
    if (!['zone_user', 'admin', 'super_admin'].includes(normalizedUserRole)) {
      redirect('/auth/unauthorized');
    }

    // Fetch initial data on the server
    const { zoneDashboardData } = await getAllZoneDashboardData();

    // Ensure we have safe default values
    const safeZoneDashboardData: ZoneDashboardData = zoneDashboardData || {
      zone: {
        id: 0,
        name: 'Unknown Zone',
        description: 'No zone data available',
        totalCustomers: 0,
        totalTechnicians: 0,
        totalAssets: 0
      },
      stats: {
        openTickets: { count: 0, change: 0 },
        unassignedTickets: { count: 0, critical: false },
        inProgressTickets: { count: 0, change: 0 },
        avgResponseTime: { hours: 0, minutes: 0, change: 0, isPositive: false },
        avgResolutionTime: { days: 0, hours: 0, change: 0, isPositive: false },
        avgDowntime: { hours: 0, minutes: 0, change: 0, isPositive: false },
        monthlyTickets: { count: 0, change: 0 },
        activeMachines: { count: 0, change: 0 }
      },
      metrics: {
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        technicianEfficiency: 0,
        avgTravelTime: 0,
        partsAvailability: 0,
        equipmentUptime: 0,
        firstCallResolutionRate: 0,
        customerSatisfactionScore: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0
      },
      trends: {
        resolvedTickets: []
      },
      topIssues: [],
      technicians: [],
      recentActivities: []
    };

    return (
      <DashboardErrorBoundary fallback={DashboardErrorFallback}>
        <Suspense fallback={<ZoneDashboardLoading />}>
          <ZoneDashboardClient initialZoneDashboardData={safeZoneDashboardData} />
        </Suspense>
      </DashboardErrorBoundary>
    );
  } catch (error) {
    console.error('Failed to load zone dashboard:', error);
    
    // Handle authentication errors
    if (error instanceof Error && 
        (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('No access token found'))) {
      redirect('/auth/login');
      return null;
    }

    // Return error state
    return (
      <div className="bg-red-50 rounded-lg p-6 max-w-2xl mx-auto my-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <div className="w-8 h-8 text-red-600">!</div>
          </div>
          <h3 className="text-lg font-medium text-red-800">Failed to load zone dashboard</h3>
          <p className="text-red-700">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}
