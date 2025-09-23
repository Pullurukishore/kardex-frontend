'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, TrendingUp, Users, AlertTriangle, Clock, CheckCircle, Activity, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/axios';
import type { ZoneDashboardData } from '@/lib/server/dashboard';

// Import zone dashboard components
import ZoneExecutiveHeader from './ZoneExecutiveHeader';
import ZoneExecutiveSummaryCards from './ZoneExecutiveSummaryCards';
import ZoneFieldServiceAnalytics from './ZoneFieldServiceAnalytics';
import ZonePerformanceAnalytics from './ZonePerformanceAnalytics';
import ZoneRecentTickets from './ZoneRecentTickets';
import ZoneTechniciansPerformance from './ZoneTechniciansPerformance';
import ZoneFSAIntegration from './ZoneFSAIntegration';

interface ZoneDashboardClientProps {
  initialZoneDashboardData: ZoneDashboardData | null;
}

export default function ZoneDashboardClient({ 
  initialZoneDashboardData 
}: ZoneDashboardClientProps) {
  const [zoneDashboardData, setZoneDashboardData] = useState<ZoneDashboardData | null>(initialZoneDashboardData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshData = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await api.get('/zone-dashboard');
      setZoneDashboardData(response.data);
      toast({
        title: "Success",
        description: "Zone dashboard data refreshed successfully",
      });
      return true;
    } catch (error) {
      console.error('Failed to fetch zone dashboard data:', error);
      setError('Failed to load zone dashboard data. Please try again.');
      toast({
        title: "Error",
        description: "Failed to refresh zone dashboard data",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Automatic data fetch on mount
  useEffect(() => {
    refreshData();
  }, []);

  const handleRefresh = async () => {
    await refreshData();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load zone dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (!zoneDashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading zone dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6 lg:p-8">
      {/* Zone Executive Header */}
      <ZoneExecutiveHeader 
        zoneData={zoneDashboardData.zone}
        onRefresh={handleRefresh} 
        isRefreshing={isRefreshing} 
      />

      {/* Initial loading state */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Updating data...</span>
          </div>
        </div>
      )}

      {/* Zone Executive Summary Cards */}
      <ZoneExecutiveSummaryCards 
        zoneDashboardData={zoneDashboardData} 
      />

      {/* Zone Field Service Analytics */}
      <ZoneFieldServiceAnalytics 
        zoneDashboardData={zoneDashboardData} 
      />

      {/* Zone Performance Analytics */}
      <ZonePerformanceAnalytics 
        zoneDashboardData={zoneDashboardData} 
      />

      {/* Zone Technicians Performance */}
      <ZoneTechniciansPerformance 
        zoneDashboardData={zoneDashboardData} 
      />

      {/* Zone Recent Tickets */}
      <ZoneRecentTickets 
        zoneDashboardData={zoneDashboardData} 
      />

      {/* Zone FSA Integration */}
      <ZoneFSAIntegration 
        zoneDashboardData={zoneDashboardData} 
      />
    </div>
  );
}
