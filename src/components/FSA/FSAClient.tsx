'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/axios';
import FSAHeader from '@/components/FSA/FSAHeader';
import FSAOverviewCards from '@/components/FSA/FSAOverviewCards';
import FSADistributionCharts from '@/components/FSA/FSADistributionCharts';
import FSAPerformanceTables from '@/components/FSA/FSAPerformanceTables';
import FSARealTimeMetrics from '@/components/FSA/FSARealTimeMetrics';
import FSAAdvancedAnalytics from '@/components/FSA/FSAAdvancedAnalytics';
import FSAFilters from '@/components/FSA/FSAFilters';
import LazyDashboardSection from '@/components/dashboard/LazyDashboardSection';

interface FSAData {
  dashboard: any;
  realTime?: any;
  advanced?: any;
  satisfaction?: any;
  equipment?: any;
}

interface FSAClientProps {
  initialFSAData: FSAData;
  userRole: string;
  searchParams: {
    timeframe?: string;
    zoneId?: string;
    refresh?: string;
  };
}

export default function FSAClient({ 
  initialFSAData, 
  userRole, 
  searchParams 
}: FSAClientProps) {
  const [fsaData, setFsaData] = useState<FSAData>(initialFSAData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeframe = searchParams.timeframe || '30d';
  const zoneId = searchParams.zoneId;

  // Force initial client-side API call on component mount
  useEffect(() => {
    fetchFSAData();
  }, [timeframe, zoneId, userRole]);

  const fetchFSAData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const response = await api.get('/admin/fsa', {
        params: {
          timeframe,
          zoneId,
          includeRealTime: true,
          includePredictive: userRole === 'ADMIN',
          includeAdvanced: userRole === 'ADMIN',
        }
      });

      if (response.data.success) {
        setFsaData(response.data.data);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to fetch FSA data:', err);
      setError('Failed to load FSA data. Please try again.');
      toast.error('Failed to refresh FSA data');
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchFSAData();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading FSA dashboard</h3>
          <p className="mt-2 text-sm text-gray-600">
            {error}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Try again'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6 lg:p-8">
      {/* FSA Header - Always visible */}
      <FSAHeader 
        onRefresh={handleRefresh} 
        isRefreshing={isRefreshing} 
      />

      {/* Loading indicator */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Updating data...</span>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <LazyDashboardSection className="mb-8">
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/30 shadow-lg">
          <FSAFilters
            currentTimeframe={timeframe}
            currentZoneId={zoneId}
          />
        </div>
      </LazyDashboardSection>

      {/* Overview Cards - Critical above-the-fold content */}
      <LazyDashboardSection className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 rounded-3xl blur-3xl"></div>
          <div className="relative">
            <FSAOverviewCards 
              data={fsaData.dashboard} 
              realTimeMetrics={fsaData.realTime}
            />
          </div>
        </div>
      </LazyDashboardSection>

      {/* Real-time Metrics (if available) */}
      {fsaData.realTime && (
        <LazyDashboardSection className="mb-8">
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 backdrop-blur-sm rounded-2xl p-6 border border-green-200/30 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Real-time Metrics
              </h2>
            </div>
            <FSARealTimeMetrics data={fsaData.realTime} />
          </div>
        </LazyDashboardSection>
      )}

      {/* Distribution Charts */}
      <LazyDashboardSection className="mb-8">
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/30 shadow-lg">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-6">
            Distribution Analytics
          </h2>
          <FSADistributionCharts data={fsaData.dashboard} />
        </div>
      </LazyDashboardSection>

      {/* Performance Tables */}
      <LazyDashboardSection className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/30 shadow-lg">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Performance Analytics
          </h2>
          <FSAPerformanceTables data={fsaData.dashboard} />
        </div>
      </LazyDashboardSection>

      {/* Advanced Analytics (for admin users) */}
      {userRole === 'ADMIN' && (
        <LazyDashboardSection className="mb-8">
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"></div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Advanced Analytics
              </h2>
              <span className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-xs font-bold shadow-md">
                Admin Only
              </span>
            </div>
            <FSAAdvancedAnalytics
              performanceMetrics={fsaData.advanced}
              satisfactionMetrics={fsaData.satisfaction}
              equipmentAnalytics={fsaData.equipment}
            />
          </div>
        </LazyDashboardSection>
      )}

      {/* Data Summary */}
      <LazyDashboardSection>
        <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/30 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Data Range</h4>
              <p className="text-sm text-gray-700 font-medium">
                Last {timeframe === '7d' ? '7 days' : timeframe === '30d' ? '30 days' : timeframe === '90d' ? '90 days' : '1 year'}
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Zones Covered</h4>
              <p className="text-sm text-gray-700 font-medium">
                {zoneId ? `Zone ${zoneId}` : `${fsaData.dashboard?.overview?.totalZones || 0} zones`}
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Last Updated</h4>
              <p className="text-sm text-gray-700 font-medium">
                {fsaData.realTime 
                  ? new Date(fsaData.realTime.lastUpdated).toLocaleString()
                  : new Date().toLocaleString()
                }
              </p>
            </div>
          </div>
        </div>
      </LazyDashboardSection>
    </div>
  );
}
