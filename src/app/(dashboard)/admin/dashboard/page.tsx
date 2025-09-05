"use client";

import { useQuery } from '@tanstack/react-query';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentTickets } from '@/components/dashboard/RecentTickets';
import { StatusPieChart } from '@/components/dashboard/StatusPieChart';
import { TrendsChart } from '@/components/dashboard/TrendsChart';
import { fetchDashboardData, fetchTicketStatusDistribution, fetchTicketTrends } from '@/services/dashboard.service';
import { TicketStatus, StatusData } from '@/types/dashboard';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Helper function to format numbers with commas
const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Color scheme for the dashboard
const colors = {
  primary: '#4f46e5',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  gray: { 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' },
  chart: {
    open: '#3b82f6',
    inProgress: '#f59e0b',
    resolved: '#10b981',
    overdue: '#ef4444',
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  }
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Open':
      return colors.chart.open;
    case 'In Progress':
      return colors.chart.inProgress;
    case 'Resolved':
      return colors.chart.resolved;
    case 'Overdue':
      return colors.chart.overdue;
    case 'High':
      return colors.chart.high;
    case 'Medium':
      return colors.chart.medium;
    case 'Low':
      return colors.chart.low;
    default:
      return colors.primary;
  }
};

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  
  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading: isLoadingDashboard,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch ticket status distribution
  const { 
    data: statusData, 
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['ticketStatusDistribution'],
    queryFn: fetchTicketStatusDistribution,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch ticket trends
  const { 
    data: trendsData, 
    isLoading: isLoadingTrends,
    error: trendsError,
    refetch: refetchTrends
  } = useQuery({
    queryKey: ['ticketTrends', { days: 30 }],
    queryFn: ({ queryKey, signal }) => fetchTicketTrends({ queryKey, signal }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Refetch all data
  const refetchAll = () => {
    refetchDashboard();
    refetchStatus();
    refetchTrends();
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle errors
  if (dashboardError || statusError || trendsError) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-xl font-semibold mb-2">Error loading dashboard</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't load the dashboard data. Please try again later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Format status data for the pie chart
  const formattedStatusData = (dashboardData?.stats?.ticketDistribution?.byStatus || []).map((item) => ({
    status: item.name,
    count: item.value,
    name: item.name,
    value: item.value,
    color: getStatusColor(item.name) || colors.primary
  })) as StatusData[];

  // Format priority data for the bar chart
  const priorityData = dashboardData?.stats?.ticketDistribution?.byPriority || [];
  
  // Format admin stats
  const adminStats = [
    { name: 'Total Customers', value: dashboardData?.adminStats?.totalCustomers || 0 },
    { name: 'Service Persons', value: dashboardData?.adminStats?.totalServicePersons || 0 },
    { name: 'Service Zones', value: dashboardData?.adminStats?.totalServiceZones || 0 },
  ];

  if (!isClient) {
    return null;
  }

  // Handle loading and error states
  if (isLoadingDashboard || isLoadingStatus || isLoadingTrends) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle errors
  if (dashboardError || statusError || trendsError) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-xl font-semibold mb-2">Error loading dashboard</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't load the dashboard data. Please try again.
          </p>
          <button 
            onClick={refetchAll}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button 
            onClick={refetchAll}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
            <div className="p-2 rounded-lg bg-indigo-50">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2m5-11a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">{formatNumber(Number(dashboardData?.stats?.kpis?.totalTickets?.value) || 0)}</p>
            <span className={`ml-2 text-sm font-medium ${dashboardData?.stats?.kpis?.totalTickets?.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {Number(dashboardData?.stats?.kpis?.totalTickets?.change || 0) > 0 ? '↑' : '↓'} {Math.abs(Number(dashboardData?.stats?.kpis?.totalTickets?.change || 0))}%
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Total number of tickets</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">SLA Compliance</h3>
            <div className="p-2 rounded-lg bg-green-50">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">{dashboardData?.stats?.kpis?.slaCompliance?.value || 0}%</p>
            <span className={`ml-2 text-sm font-medium ${dashboardData?.stats?.kpis?.slaCompliance?.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {Number(dashboardData?.stats?.kpis?.slaCompliance?.change || 0) > 0 ? '↑' : '↓'} {Math.abs(Number(dashboardData?.stats?.kpis?.slaCompliance?.change || 0))}%
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Tickets resolved within SLA</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Avg. Response Time</h3>
            <div className="p-2 rounded-lg bg-blue-50">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">
              {dashboardData?.stats?.kpis?.avgResponseTime?.value === 'N/A' 
                ? 'N/A' 
                : `${dashboardData?.stats?.kpis?.avgResponseTime?.value} ${dashboardData?.stats?.kpis?.avgResponseTime?.unit || 'hrs'}`}
            </p>
            {dashboardData?.stats?.kpis?.avgResponseTime?.value !== 'N/A' && (
              <span className={`ml-2 text-sm font-medium ${dashboardData?.stats?.kpis?.avgResponseTime?.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Number(dashboardData?.stats?.kpis?.avgResponseTime?.change || 0) > 0 ? '↑' : '↓'} {Math.abs(Number(dashboardData?.stats?.kpis?.avgResponseTime?.change || 0))}%
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">Time to first response</p>
        </div>

        <div className={`p-6 rounded-xl shadow-sm border ${dashboardData?.stats?.kpis?.unassignedTickets?.critical ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'} hover:shadow-md transition-shadow duration-200`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Unassigned Tickets</h3>
            <div className={`p-2 rounded-lg ${dashboardData?.stats?.kpis?.unassignedTickets?.critical ? 'bg-red-100' : 'bg-amber-50'}`}>
              <svg className={`w-6 h-6 ${dashboardData?.stats?.kpis?.unassignedTickets?.critical ? 'text-red-600' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(Number(dashboardData?.stats?.kpis?.unassignedTickets?.value) || 0)}</p>
          <p className={`mt-2 text-sm ${dashboardData?.stats?.kpis?.unassignedTickets?.critical ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {dashboardData?.stats?.kpis?.unassignedTickets?.critical ? 'Needs immediate attention' : 'Under control'}
          </p>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-indigo-700">Total Customers</h3>
            <div className="p-2 rounded-lg bg-white bg-opacity-50">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(adminStats[0].value)}</p>
          <p className="mt-2 text-sm text-indigo-600">Active customers in the system</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-green-700">Service Persons</h3>
            <div className="p-2 rounded-lg bg-white bg-opacity-50">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(adminStats[1].value)}</p>
          <p className="mt-2 text-sm text-green-600">Active service personnel</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-purple-700">Service Zones</h3>
            <div className="p-2 rounded-lg bg-white bg-opacity-50">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(adminStats[2].value)}</p>
          <p className="mt-2 text-sm text-purple-600">Service coverage areas</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <Tabs defaultValue="status" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Ticket Analytics</h2>
              <TabsList>
                <TabsTrigger value="status" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Status</TabsTrigger>
                <TabsTrigger value="priority" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Priority</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="status" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white p-4 rounded-lg border border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Tickets by Status</h3>
                  <div className="h-[300px]">
                    <StatusPieChart 
                      data={formattedStatusData} 
                      title=""
                      isLoading={isLoadingStatus}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {formattedStatusData.map((item) => (
                      <div key={item.status} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600">{item.status}</span>
                        <span className="ml-1 text-sm font-medium text-gray-900">({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Ticket Trends (30 days)</h3>
                  <div className="h-[300px]">
                    <TrendsChart 
                      data={trendsData?.trends || []} 
                      isLoading={isLoadingTrends}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="priority" className="space-y-4">
              <div className="bg-white p-6 rounded-lg border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Tickets by Priority</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={priorityData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      barSize={60}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        formatter={(value: number) => [`${value} tickets`, 'Count']} 
                        labelFormatter={(label) => `Priority: ${label}`}
                      />
                      <Bar 
                        dataKey="value" 
                        name="Tickets"
                        radius={[4, 4, 0, 0]}
                      >
                        {priorityData.map((entry, index) => (
                          <rect 
                            key={`bar-${index}`} 
                            fill={getStatusColor(entry.name)} 
                            x={0} 
                            y={0} 
                            width="100%" 
                            height="100%" 
                            rx="4" 
                            ry="4"
                            className="opacity-90 hover:opacity-100 transition-opacity"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
            View all
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <RecentTickets 
          tickets={dashboardData?.recentTickets || []} 
          isLoading={isLoadingDashboard}
        />
      </div>
    </div>
  );
}