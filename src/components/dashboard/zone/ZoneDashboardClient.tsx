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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {zoneDashboardData.zone.name} Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Field Service Management Overview</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Zone Info Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
            Zone Information
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4">
            <p className="text-sm text-gray-600">Zone ID</p>
            <p className="text-2xl font-bold text-purple-700">{zoneDashboardData.zone.id}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total Customers</p>
            <p className="text-2xl font-bold text-blue-700">{zoneDashboardData.zone.totalCustomers}</p>
          </div>
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total Technicians</p>
            <p className="text-2xl font-bold text-green-700">{zoneDashboardData.zone.totalTechnicians}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total Assets</p>
            <p className="text-2xl font-bold text-orange-700">{zoneDashboardData.zone.totalAssets}</p>
          </div>
          <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl p-4">
            <p className="text-sm text-gray-600">Active Machines</p>
            <p className="text-2xl font-bold text-pink-700">{zoneDashboardData.stats.activeMachines.count}</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Description</p>
          <p className="text-gray-800">{zoneDashboardData.zone.description}</p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Open Tickets */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Open Tickets</p>
              <p className="text-3xl font-bold">{zoneDashboardData.stats.openTickets.count}</p>
              <p className="text-purple-200 text-xs mt-1">Change: {zoneDashboardData.stats.openTickets.change}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">In Progress</p>
              <p className="text-3xl font-bold">{zoneDashboardData.stats.inProgressTickets.count}</p>
              <p className="text-blue-200 text-xs mt-1">Change: {zoneDashboardData.stats.inProgressTickets.change}</p>
            </div>
            <Clock className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        {/* Unassigned */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Unassigned</p>
              <p className="text-3xl font-bold">{zoneDashboardData.stats.unassignedTickets.count}</p>
              <p className="text-orange-200 text-xs mt-1">
                {zoneDashboardData.stats.unassignedTickets.critical ? 'Critical' : 'Normal'}
              </p>
            </div>
            <Users className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Performance Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Response Time */}
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle cx="48" cy="48" r="36" stroke="#8b5cf6" strokeWidth="8" fill="none" 
                  strokeDasharray="226" strokeDashoffset={226 - (226 * 75 / 100)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-purple-600">75%</span>
              </div>
            </div>
            <p className="font-semibold text-gray-800">Avg Response Time</p>
            <p className="text-sm text-gray-600">{zoneDashboardData.stats.avgResponseTime.hours}h {zoneDashboardData.stats.avgResponseTime.minutes}m</p>
            <p className="text-xs text-green-600 mt-1">↓ {zoneDashboardData.stats.avgResponseTime.change}% Better</p>
          </div>

          {/* Resolution Time */}
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle cx="48" cy="48" r="36" stroke="#3b82f6" strokeWidth="8" fill="none" 
                  strokeDasharray="226" strokeDashoffset={226 - (226 * 60 / 100)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">60%</span>
              </div>
            </div>
            <p className="font-semibold text-gray-800">Avg Resolution Time</p>
            <p className="text-sm text-gray-600">{zoneDashboardData.stats.avgResolutionTime.days}d {zoneDashboardData.stats.avgResolutionTime.hours}h</p>
            <p className="text-xs text-green-600 mt-1">↓ {zoneDashboardData.stats.avgResolutionTime.change}% Better</p>
          </div>

          {/* Efficiency */}
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle cx="48" cy="48" r="36" stroke="#10b981" strokeWidth="8" fill="none" 
                  strokeDasharray="226" strokeDashoffset={226 - (226 * zoneDashboardData.metrics.technicianEfficiency / 100)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-green-600">{zoneDashboardData.metrics.technicianEfficiency}%</span>
              </div>
            </div>
            <p className="font-semibold text-gray-800">Technician Efficiency</p>
            <p className="text-sm text-gray-600">Overall Performance</p>
          </div>

          {/* Customer Satisfaction */}
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle cx="48" cy="48" r="36" stroke="#f59e0b" strokeWidth="8" fill="none" 
                  strokeDasharray="226" strokeDashoffset={226 - (226 * (zoneDashboardData.metrics.customerSatisfactionScore * 20) / 100)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-amber-600">{zoneDashboardData.metrics.customerSatisfactionScore}/5</span>
              </div>
            </div>
            <p className="font-semibold text-gray-800">Customer Satisfaction</p>
            <p className="text-sm text-gray-600">Average Rating</p>
          </div>
        </div>
      </div>

      {/* Technicians Performance */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-green-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          Technicians Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {zoneDashboardData.technicians?.map((tech) => (
            <div key={tech.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">{tech.name}</h3>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                  <span className="text-sm font-semibold text-gray-700">{tech.rating}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Tickets</span>
                  <span className="font-semibold text-blue-600">{tech.activeTickets}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Efficiency</span>
                  <span className="font-semibold text-green-600">{tech.efficiency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${tech.efficiency}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-purple-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-600" />
          Recent Activities
        </h2>
        <div className="space-y-4">
          {zoneDashboardData.recentActivities?.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
              <div className={`w-3 h-3 rounded-full mt-2 ${
                activity.priority === 'HIGH' ? 'bg-red-500' :
                activity.priority === 'MEDIUM' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{activity.description}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.type}</p>
                    {activity.technician && (
                      <p className="text-sm text-blue-600 mt-1">Technician: {activity.technician}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      activity.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {activity.priority}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Metrics Grid */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Additional Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-600">{zoneDashboardData.metrics.resolvedTickets}</p>
            <p className="text-sm text-gray-600">Resolved</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-600">{zoneDashboardData.metrics.avgTravelTime}</p>
            <p className="text-sm text-gray-600">Travel Time (min)</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600">{zoneDashboardData.metrics.partsAvailability}%</p>
            <p className="text-sm text-gray-600">Parts Available</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
            <p className="text-2xl font-bold text-orange-600">{zoneDashboardData.metrics.equipmentUptime}%</p>
            <p className="text-sm text-gray-600">Equipment Uptime</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl">
            <p className="text-2xl font-bold text-pink-600">{zoneDashboardData.metrics.firstCallResolutionRate}%</p>
            <p className="text-sm text-gray-600">First Call Rate</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-600">{zoneDashboardData.stats.monthlyTickets.count}</p>
            <p className="text-sm text-gray-600">Monthly Tickets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
