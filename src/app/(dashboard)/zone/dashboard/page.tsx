"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

// Icons
import { 
  Ticket, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Cpu,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Building2,
  Target,
  TrendingUp,
  TrendingDown,
  Star,
  Percent,
  BarChart3,
  Calendar,
  Award,
  Timer,
  Timer as TimerOff,
  Users,
  Wrench,
  MapPin,
  FileText,
  Database,
  Filter,
  Download,
  Gauge,
  Server
} from "lucide-react";

// Charts
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Utils
import { cn } from "@/lib/utils";
import api from "@/lib/api/axios";

// Components
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserRole } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";

// Helper to format numbers with commas
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

interface ZoneDashboardData {
  zone: {
    id: number;
    name: string;
    description: string;
    totalCustomers?: number;
    totalTechnicians?: number;
    totalAssets?: number;
  };
  stats: {
    openTickets: { count: number; change: number };
    unassignedTickets: { count: number; critical: boolean };
    inProgressTickets: { count: number; change: number };
    avgResponseTime: { hours: number; minutes: number; change: number; isPositive: boolean };
    avgResolutionTime: { days: number; hours: number; change: number; isPositive: boolean };
    avgDowntime: { hours: number; minutes: number; change: number; isPositive: boolean };
    monthlyTickets: { count: number; change: number };
    activeMachines: { count: number; change: number };
  };
  metrics: {
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    technicianEfficiency: number;
    avgTravelTime: number;
    partsAvailability: number;
    equipmentUptime: number;
    firstCallResolutionRate: number;
    customerSatisfactionScore: number;
    avgResponseTime?: number;
    avgResolutionTime?: number;
  };
  trends: {
    resolvedTickets: Array<{
      date: string;
      count: number;
    }>;
  };
  topIssues?: Array<{
    title: string;
    count: number;
    priority?: string;
    avgResolutionTime?: number;
  }>;
  technicians?: Array<{
    id: number;
    name: string;
    activeTickets: number;
    efficiency: number;
    rating: number;
  }>;
  recentActivities?: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
    priority: string;
    technician?: string;
  }>;
}

// Helper functions
const formatDuration = (hours: number, minutes: number) => {
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
};

const formatChange = (change: number, isPositive: boolean) => {
  if (change === 0) return 'No change';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change}% vs last period`;
};

export default function ZoneDashboard() {
  const [data, setData] = useState<ZoneDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const fetchZoneData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.get("/zone-dashboard");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching zone dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load zone dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZoneData();
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.get("/zone-dashboard");
      setData(response.data);
      toast({
        title: "Success",
        description: "Dashboard data refreshed successfully",
      });
    } catch (error) {
      console.error("Error refreshing zone dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
        <p className="text-lg">No data available</p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-white text-indigo-600 hover:bg-gray-200"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Zone Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {data.zone.name}
          </h1>
          <p className="text-muted-foreground flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1 text-indigo-500" />{" "}
            {data.zone.description || "No location specified"}
          </p>
          {(data.zone.totalCustomers || data.zone.totalTechnicians || data.zone.totalAssets) && (
            <div className="flex items-center space-x-6 mt-2 text-sm text-muted-foreground">
              {data.zone.totalCustomers && (
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {data.zone.totalCustomers} Customers
                </span>
              )}
              {data.zone.totalTechnicians && (
                <span className="flex items-center">
                  <Wrench className="h-4 w-4 mr-1" />
                  {data.zone.totalTechnicians} Technicians
                </span>
              )}
              {data.zone.totalAssets && (
                <span className="flex items-center">
                  <Server className="h-4 w-4 mr-1" />
                  {data.zone.totalAssets} Assets
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 bg-white shadow hover:bg-indigo-50"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 text-indigo-500" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 bg-white shadow hover:bg-pink-50"
          >
            <Calendar className="h-4 w-4 text-pink-500" />
            <span>This Month</span>
          </Button>
        </div>
      </div>

      {/* Executive Summary KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(data.metrics?.openTickets ?? 0)}
            </div>
            <p className="text-xs text-white/80">Currently open tickets</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-purple-400 to-purple-600 text-white hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <RefreshCw className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(data.metrics?.inProgressTickets ?? 0)}
            </div>
            <p className="text-xs text-white/80">Tickets being worked on</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <Target className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.metrics.customerSatisfactionScore || 0).toFixed(1)}/5.0
            </div>
            <p className="text-xs text-white/80">Average rating</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-green-400 to-green-600 text-white hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved Tickets</CardTitle>
            <CheckCircle className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(data.metrics?.resolvedTickets ?? 0)}
            </div>
            <p className="text-xs text-white/80">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Field Service Analytics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-cyan-400 to-cyan-600 text-white hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Technician Efficiency</CardTitle>
            <Gauge className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.metrics.technicianEfficiency || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Average efficiency rating</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-indigo-400 to-indigo-600 text-white hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Travel Time</CardTitle>
            <Timer className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatDuration(Math.floor((data.metrics.avgTravelTime || 0) / 60), (data.metrics.avgTravelTime || 0) % 60)}
            </div>
            <p className="text-xs text-white/80">Time to reach customers</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-teal-400 to-teal-600 text-white hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Equipment Uptime</CardTitle>
            <Server className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.metrics.equipmentUptime || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">System availability</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-indigo-400 to-indigo-600 text-white hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">First Call Resolution</CardTitle>
            <Target className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.metrics.firstCallResolutionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Fixed on first visit</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resolved Tickets Trend */}
        <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-500" />
              Resolved Tickets Trend
            </CardTitle>
            <CardDescription>Tickets resolved over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {data.trends.resolvedTickets && data.trends.resolvedTickets.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.trends.resolvedTickets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" name="Resolved Tickets" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No trend data available</p>
                    <p className="text-sm">Data will appear as tickets are resolved</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Zone Metrics Overview */}
        <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-500" />
              Zone Metrics Overview
            </CardTitle>
            <CardDescription>Current zone performance summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(data.metrics.openTickets + data.metrics.inProgressTickets + data.metrics.resolvedTickets)}
                  </div>
                  <p className="text-sm text-blue-800">Total Tickets</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                  <div className="text-2xl font-bold text-green-600">
                    {data.metrics.resolvedTickets > 0 ? 
                      ((data.metrics.resolvedTickets / (data.metrics.openTickets + data.metrics.inProgressTickets + data.metrics.resolvedTickets)) * 100).toFixed(1) 
                      : '0'}%
                  </div>
                  <p className="text-sm text-green-800">Resolution Rate</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Technician Efficiency</span>
                    <span>{(data.metrics.technicianEfficiency || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={data.metrics.technicianEfficiency || 0} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Equipment Uptime</span>
                    <span>{(data.metrics.equipmentUptime || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={data.metrics.equipmentUptime || 0} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Customer Satisfaction</span>
                    <span>{(data.metrics.customerSatisfactionScore || 0).toFixed(1)}/5.0</span>
                  </div>
                  <Progress value={(data.metrics.customerSatisfactionScore || 0) * 20} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FSA Metrics and Top Issues */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* FSA Metrics */}
        <Card className="col-span-2 shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gauge className="h-5 w-5 mr-2 text-blue-500" />
              Field Service Analytics
            </CardTitle>
            <CardDescription>Operational performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Technician Efficiency</p>
                    <span className="text-lg font-bold text-blue-600">
                      {(data.metrics.technicianEfficiency || 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={data.metrics.technicianEfficiency} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Parts Availability</p>
                    <span className="text-lg font-bold text-green-600">
                      {(data.metrics.partsAvailability || 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={data.metrics.partsAvailability} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Equipment Uptime</p>
                    <span className="text-lg font-bold text-purple-600">
                      {(data.metrics.equipmentUptime || 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={data.metrics.equipmentUptime} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100">
                  <div className="flex items-center">
                    <Timer className="h-5 w-5 text-orange-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Avg Travel Time</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {(data.metrics.avgTravelTime || 0).toFixed(1)} min
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-indigo-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-indigo-800">Avg Response Time</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {(data.metrics.avgResponseTime || 0).toFixed(1)} hrs
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-pink-50 to-pink-100">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-pink-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-pink-800">Avg Resolution Time</p>
                      <p className="text-2xl font-bold text-pink-600">
                        {(data.metrics.avgResolutionTime || 0).toFixed(1)} hrs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Issues */}
        <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Top Issues
            </CardTitle>
            <CardDescription>Most frequent problems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topIssues && data.topIssues.length > 0 ? (
                data.topIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-pink-50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{issue.title}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{issue.count} tickets</span>
                            {issue.priority && (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                issue.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                issue.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {issue.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {issue.avgResolutionTime && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Avg Resolution</p>
                          <p className="text-sm font-medium">{issue.avgResolutionTime}h</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No issues reported yet</p>
                    <p className="text-sm">Issues will appear as tickets are created</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technicians and Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Zone Technicians */}
        <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Zone Technicians
            </CardTitle>
            <CardDescription>Active technicians performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.technicians && data.technicians.length > 0 ? (
                data.technicians.map((tech) => (
                  <div
                    key={tech.id}
                    className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tech.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tech.activeTickets} active tickets
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <p className="text-sm font-medium">{tech.efficiency}% efficiency</p>
                            <p className="text-sm text-muted-foreground">★ {tech.rating}/5.0</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={tech.efficiency} className="h-1" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No technicians assigned</p>
                    <p className="text-sm">Technician data will appear when assigned to this zone</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-500" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest zone activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivities && data.recentActivities.length > 0 ? (
                data.recentActivities.map((activity: {
                  id: number;
                  type: string;
                  description: string;
                  timestamp: string;
                  priority: string;
                  technician?: string;
                }, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200"
                  >
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      activity.priority === 'HIGH' ? 'bg-red-500' :
                      activity.priority === 'MEDIUM' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                        {activity.technician && <span>{activity.technician}</span>}
                        {activity.technician && activity.timestamp && <span>•</span>}
                        {activity.timestamp && <span>{activity.timestamp}</span>}
                        {(activity.technician || activity.timestamp) && activity.priority && <span>•</span>}
                        {activity.priority && (
                          <span className={`px-2 py-1 rounded-full ${
                            activity.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            activity.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {activity.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activities</p>
                    <p className="text-sm">Activities will appear as work is performed in this zone</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
