'use server';

import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAllFSAData } from '@/lib/server/fsa';
import FSAClient from '@/components/FSA/FSAClient';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Loading component for Suspense boundary
function FSALoading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Loading FSA dashboard data...</p>
      </div>
    </div>
  );
}

// Error component for error boundaries
function FSAError({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div className="bg-red-50 rounded-lg p-6 max-w-2xl mx-auto my-8">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-3 bg-red-100 rounded-full">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-red-800">Failed to load FSA dashboard</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={retry}
          className="px-4 py-2 border border-red-200 text-red-700 rounded-md hover:bg-red-50 mt-2 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}

interface FSAPageProps {
  searchParams: {
    timeframe?: string;
    zoneId?: string;
    refresh?: string;
  };
}

// Server Component - runs on the server for initial data fetching
export default async function FSAPage({ searchParams }: FSAPageProps) {
  try {
    const cookieStore = cookies();
    const userRole = cookieStore.get('userRole')?.value;
    
    if (!userRole) {
      redirect('/auth/login');
    }

    // Extract search parameters
    const timeframe = searchParams.timeframe || '30d';
    const zoneId = searchParams.zoneId;
    const isRefresh = searchParams.refresh === 'true';

    // Fetch FSA data with appropriate flags
    const fsaData = await getAllFSAData({
      timeframe,
      zoneId,
      includeRealTime: true,
      includePredictive: userRole === 'ADMIN',
      includeAdvanced: userRole === 'ADMIN',
    });

    return (
      <Suspense fallback={<FSALoading />}>
        <FSAClient 
          initialFSAData={fsaData}
          userRole={userRole}
          searchParams={searchParams}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Failed to load FSA dashboard:', error);
    
    // Handle authentication errors
    if (error instanceof Error && 
        (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      redirect('/auth/login');
      return null;
    }

    // Return error state
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Failed to load FSA dashboard</h2>
          <p className="text-gray-600 mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }
}