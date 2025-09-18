'use server';

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getZoneFSADashboardData } from '@/lib/server/fsa';
import FSAZoneClient from '@/components/dashboard/zone/FSAZoneClient';

// Loading component for Suspense boundary
function FSAZoneLoading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Loading FSA zone dashboard...</p>
      </div>
    </div>
  );
}

// Server Component - runs on the server for initial data fetching
export default async function FSAZonePage() {
  try {
    const cookieStore = cookies();
    const userRole = cookieStore.get('userRole')?.value;
    
    if (!userRole) {
      redirect('/auth/login');
    }

    // Check if user has access to zone FSA dashboard
    const normalizedUserRole = userRole.toLowerCase();
    if (!['zone_user', 'admin', 'super_admin'].includes(normalizedUserRole)) {
      redirect('/auth/unauthorized');
    }

    // Fetch initial data on the server
    const { dashboardData, zoneAnalytics } = await getZoneFSADashboardData();

    return (
      <Suspense fallback={<FSAZoneLoading />}>
        <FSAZoneClient 
          initialDashboardData={dashboardData}
          initialZoneAnalytics={zoneAnalytics}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Failed to load FSA zone dashboard:', error);
    
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
          <h3 className="text-lg font-medium text-red-800">Failed to load FSA zone dashboard</h3>
          <p className="text-red-700">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}