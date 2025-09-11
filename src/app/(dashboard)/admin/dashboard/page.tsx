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
  DollarSign,
  PieChart,
  LineChart,
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
  Shield,
  Timer,
  Timer as TimerOff,
  Users,
  Wrench,
  MapPin,
  FileText,
  Eye,
  Cpu as CpuIcon,
  Settings,
  Zap,
  Globe,
  Database,
  TrendingUpIcon,
  MoreHorizontal,
  Filter,
  Download,
  Search,
  Calendar as CalendarIcon
} from "lucide-react";

// Utils
import { cn } from "@/lib/utils";
import api from "@/lib/api/axios";

// Components
import CreateTicketButton from "@/components/tickets/CreateTicketButton";

// Helper to format numbers with commas
const formatNumber = (num: number | string) => {
  const number = typeof num === 'string' ? parseFloat(num) || 0 : num;
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Get status color for badges
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'waiting_customer': return 'bg-orange-100 text-orange-800';
    case 'resolved': case 'closed': return 'bg-green-100 text-green-800';
    case 'assigned': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Get priority color for badges
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

interface DashboardData {
  stats: {
    openTickets: { count: number; change: number };
    unassignedTickets: { count: number; critical: boolean };
    inProgressTickets: { count: number; change: number };
    avgResponseTime: { hours: number; minutes: number; change: number; isPositive: boolean };
    avgResolutionTime: { days: number; hours: number; change: number; isPositive: boolean };
    avgDowntime: { hours: number; minutes: number; change: number; isPositive: boolean };
    monthlyTickets: { count: number; change: number };
    activeMachines: { count: number; change: number };
    ticketDistribution: {
      byStatus: Array<{ name: string; value: number }>;
      byPriority: Array<{ name: string; value: number }>;
    };
    kpis: {
      totalTickets: { value: number; change: string; isPositive: boolean };
      slaCompliance: { value: number; change: number; isPositive: boolean };
      avgResponseTime: { value: string; unit: string; change: number; isPositive: boolean };
      avgResolutionTime: { value: string; unit: string; change: number; isPositive: boolean };
      unassignedTickets: { value: number; critical: boolean };
      activeCustomers: { value: number; change: number };
      activeServicePersons: { value: number; change: number };
    };
  };
  adminStats: {
    totalCustomers: number;
    totalServicePersons: number;
    totalServiceZones: number;
    ticketStatusDistribution: Record<string, number>;
    ticketTrends: Array<{ date: string; count: number; status: string }>;
    zoneWiseTickets: Array<{
      id: number;
      name: string;
      totalTickets: number;
      servicePersonCount: number;
      customerCount: number;
    }>;
  };
  recentTickets: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    customer: { id: number; companyName: string };
    asset?: { id: number; model: string };
  }>;
}

interface StatusDistribution {
  distribution: Array<{ status: string; count: number }>;
}

interface TrendsData {
  trends: Array<{ date: string; count: number }>;
}


export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<Partial<DashboardData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution>({ distribution: [] });
  const [ticketTrends, setTicketTrends] = useState<TrendsData>({ trends: [] });
  const { toast } = useToast();
  const router = useRouter();


  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, statusResponse, trendsResponse] = await Promise.all([
        api.get<DashboardData>(`/dashboard`),
        api.get<StatusDistribution>(`/dashboard/status-distribution`).catch(() => ({ data: { distribution: [] } })),
        api.get<TrendsData>(`/dashboard/ticket-trends?days=30`).catch(() => ({ data: { trends: [] } }))
      ]);
      
      setDashboardData(dashboardResponse.data || {});
      setStatusDistribution(statusResponse.data || { distribution: [] });
      setTicketTrends(trendsResponse.data || { trends: [] });
      setError(null);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      
      let errorMessage = 'Failed to load dashboard data';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Dashboard API endpoint not found.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center p-6 max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error loading dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }


  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchDashboardData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate total tickets from distribution
  const getTotalTickets = (): number => {
    if (!dashboardData?.adminStats?.ticketStatusDistribution) return 0;
    return Object.values(dashboardData.adminStats.ticketStatusDistribution).reduce(
      (sum: number, count: number) => sum + count, 
      0
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time duration
  const formatDuration = (hours: number, minutes: number) => {
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);
    return parts.join(' ');
  };

  // Format change percentage
  const formatChange = (change: number, isPositive: boolean) => {
    if (change === 0) return 'No change';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}% vs last period`;
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_customer': return 'bg-orange-100 text-orange-800';
      case 'resolved':
      case 'closed': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      {/* Executive Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Executive Dashboard
                </h1>
                <p className="text-slate-600 font-medium">Business Intelligence & Field Service Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Last updated: {new Date().toLocaleTimeString()}
                {isRefreshing && <RefreshCw className="w-4 h-4 ml-1 animate-spin" />}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              <CreateTicketButton 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2"
              >
                Create New Ticket
              </CreateTicketButton>
              <Button
                onClick={handleRefresh}
                variant="default"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            Executive Summary
          </h2>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-800 px-3 py-1">
              <Database className="w-4 h-4 mr-1" />
              Live Data
            </Badge>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Open Tickets",
              value: formatNumber(dashboardData?.stats?.openTickets?.count ?? 0),
              change: Number(dashboardData?.stats?.openTickets?.change ?? 0),
              isPositive: false,
              icon: Ticket,
              description: 'Currently open tickets',
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50'
            },
            {
              title: 'Unassigned',
              value: String(dashboardData?.stats?.unassignedTickets?.count ?? '0'),
              description: 'Tickets waiting for assignment',
              critical: dashboardData?.stats?.unassignedTickets?.critical || false,
              color: dashboardData?.stats?.unassignedTickets?.critical 
                ? 'from-amber-500 to-amber-600' 
                : 'from-slate-500 to-slate-600',
              bgColor: dashboardData?.stats?.unassignedTickets?.critical 
                ? 'bg-amber-50' 
                : 'bg-slate-50',
              icon: AlertTriangle
            },
            {
              title: 'In Progress',
              value: formatNumber(dashboardData?.stats?.inProgressTickets?.count ?? 0),
              description: 'Tickets being worked on',
              change: Number(dashboardData?.stats?.inProgressTickets?.change ?? 0),
              isPositive: (Number(dashboardData?.stats?.inProgressTickets?.change ?? 0)) >= 0,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50',
              icon: RefreshCw
            },
            {
              title: 'Avg Response Time',
              value: formatDuration(
                dashboardData?.stats?.avgResponseTime?.hours || 0, 
                dashboardData?.stats?.avgResponseTime?.minutes || 0
              ),
              description: 'Time to first response',
              change: Number(dashboardData?.stats?.avgResponseTime?.change ?? 0),
              isPositive: dashboardData?.stats?.avgResponseTime?.isPositive !== false,
              color: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50',
              icon: Clock
            },
            {
              title: 'Avg Resolution Time',
              value: `${dashboardData?.stats?.avgResolutionTime?.days || 0}d ${dashboardData?.stats?.avgResolutionTime?.hours || 0}h`,
              description: 'Time to ticket resolution',
              change: Number(dashboardData?.stats?.avgResolutionTime?.change ?? 0),
              isPositive: dashboardData?.stats?.avgResolutionTime?.isPositive !== false,
              color: 'from-teal-500 to-teal-600',
              bgColor: 'bg-teal-50',
              icon: Timer
            },
            {
              title: 'Machine Downtime',
              value: formatDuration(
                dashboardData?.stats?.avgDowntime?.hours || 0, 
                dashboardData?.stats?.avgDowntime?.minutes || 0
              ),
              change: Number(dashboardData?.stats?.avgDowntime?.change ?? 0),
              isPositive: dashboardData?.stats?.avgDowntime?.isPositive ?? false,
              color: 'from-rose-500 to-pink-600',
              bgColor: 'bg-rose-50',
              icon: TimerOff,
              description: 'Average machine downtime'
            },
            {
              title: 'Tickets This Month',
              value: formatNumber(dashboardData?.stats?.monthlyTickets?.count ?? 0),
              change: Number(dashboardData?.stats?.monthlyTickets?.change ?? 0),
              isPositive: true,
              icon: FileText,
              color: 'from-indigo-500 to-blue-600',
              bgColor: 'bg-indigo-50',
              description: 'Tickets created this month'
            },
            {
              title: 'Active Machines',
              value: formatNumber(dashboardData?.stats?.activeMachines?.count ?? 0),
              change: Number(dashboardData?.stats?.activeMachines?.change ?? 0),
              isPositive: true,
              icon: Cpu,
              color: 'from-violet-500 to-purple-600',
              bgColor: 'bg-violet-50',
              description: 'Machines in operation'
            }
          ].map((metric, i) => (
            <Card 
              key={i} 
              className={`${metric.bgColor || 'bg-white'} border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 flex items-center gap-1">
                      <metric.icon className="w-4 h-4" />
                      {metric.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                    <p className="text-xs text-slate-500">{metric.description}</p>
                    {metric.change !== undefined && (
                      <div className="flex items-center gap-1">
                        {metric.isPositive ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-xs font-medium ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {formatChange(metric.change, metric.isPositive)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg`}>
                    {metric.icon && React.createElement(metric.icon, { className: "w-6 h-6 text-white" })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FSA (Field Service Analytics) Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            Field Service Analytics (FSA)
          </h2>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
              <Activity className="w-4 h-4 mr-1" />
              Real-time
            </Badge>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Configure
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Response Efficiency",
              value: formatDuration(
                dashboardData?.stats?.avgResponseTime?.hours || 0, 
                dashboardData?.stats?.avgResponseTime?.minutes || 0
              ),
              subtitle: "Average first response",
              change: dashboardData?.stats?.avgResponseTime?.change || 0,
              isPositive: dashboardData?.stats?.avgResponseTime?.isPositive !== false,
              icon: Timer,
              color: "from-blue-500 to-cyan-600",
              bgColor: "bg-blue-50"
            },
            {
              title: "Service Coverage",
              value: `${dashboardData?.adminStats?.totalServiceZones || 0}`,
              subtitle: `${dashboardData?.stats?.kpis?.activeServicePersons?.value || 0} active technicians`,
              utilization: (dashboardData?.adminStats?.totalServiceZones || 0) > 0 
                ? Math.round(((dashboardData?.stats?.kpis?.activeServicePersons?.value || 0) / (dashboardData?.adminStats?.totalServiceZones || 1)) * 100)
                : 0,
              icon: MapPin,
              color: "from-emerald-500 to-green-600",
              bgColor: "bg-emerald-50"
            },
            {
              title: "Resolution Performance",
              value: `${dashboardData?.stats?.avgResolutionTime?.days || 0}d ${dashboardData?.stats?.avgResolutionTime?.hours || 0}h`,
              subtitle: "Average resolution time",
              change: dashboardData?.stats?.avgResolutionTime?.change || 0,
              isPositive: dashboardData?.stats?.avgResolutionTime?.isPositive !== false,
              icon: CheckCircle,
              color: "from-purple-500 to-violet-600",
              bgColor: "bg-purple-50"
            },
            {
              title: "Critical Workload",
              value: `${dashboardData?.stats?.kpis?.unassignedTickets?.value || 0}`,
              subtitle: "Tickets awaiting assignment",
              critical: (dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) > 5,
              icon: AlertTriangle,
              color: (dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) > 5 
                ? "from-red-500 to-pink-600" 
                : "from-orange-500 to-amber-600",
              bgColor: (dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) > 5 
                ? "bg-red-50" 
                : "bg-orange-50"
            }
          ].map((metric, i) => (
            <Card key={i} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className={`${metric.bgColor} rounded-lg p-4 mb-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg`}>
                      <metric.icon className="w-6 h-6 text-white" />
                    </div>
                    {metric.change !== undefined && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                        metric.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {metric.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="text-sm font-medium">{metric.change > 0 ? '+' : ''}{metric.change}%</span>
                      </div>
                    )}
                    {metric.critical && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Critical</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-800">{metric.title}</h3>
                    <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                    <p className="text-sm text-slate-600">{metric.subtitle}</p>
                    {metric.utilization !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Coverage Efficiency</span>
                          <span>{metric.utilization}%</span>
                        </div>
                        <Progress 
                          value={metric.utilization} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Business Intelligence Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Enhanced Performance Metrics */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50 border-0 shadow-xl">
          <CardHeader className="pb-6 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Performance Analytics
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        Live Metrics
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        <Database className="w-3 h-3 mr-1" />
                        Real-time
                      </Badge>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-base mt-3 text-slate-600">
                  Advanced business intelligence with predictive analytics and performance insights
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 hover:bg-indigo-50">
                  <Filter className="w-4 h-4" />
                  Advanced Filter
                </Button>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-purple-50">
                  <Download className="w-4 h-4" />
                  Export Analytics
                </Button>
                <Button size="sm" className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <FileText className="w-4 h-4" />
                  Generate Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { 
                      label: "Operational Efficiency", 
                      value: formatDuration(
                        dashboardData?.stats?.avgResponseTime?.hours || 0, 
                        dashboardData?.stats?.avgResponseTime?.minutes || 0
                      ),
                      subtitle: "Average response time",
                      benchmark: "Target: < 2 hours",
                      performance: ((dashboardData?.stats?.avgResponseTime?.hours || 0) * 60 + (dashboardData?.stats?.avgResponseTime?.minutes || 0)) < 120 ? 95 : 65,
                      trend: dashboardData?.stats?.avgResponseTime?.change || 0,
                      isPositive: dashboardData?.stats?.avgResponseTime?.isPositive !== false,
                      icon: Timer,
                      color: "from-blue-500 to-cyan-600",
                      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50"
                    },
                    { 
                      label: "Resource Utilization", 
                      value: `${Math.round(((dashboardData?.stats?.kpis?.activeServicePersons?.value || 0) / Math.max(1, dashboardData?.adminStats?.totalServicePersons || 1)) * 100)}%`,
                      subtitle: `${dashboardData?.stats?.kpis?.activeServicePersons?.value || 0} of ${dashboardData?.adminStats?.totalServicePersons || 0} technicians active`,
                      benchmark: "Target: > 80%",
                      performance: Math.round(((dashboardData?.stats?.kpis?.activeServicePersons?.value || 0) / Math.max(1, dashboardData?.adminStats?.totalServicePersons || 1)) * 100),
                      trend: dashboardData?.stats?.kpis?.activeServicePersons?.change || 0,
                      isPositive: true,
                      icon: Users,
                      color: "from-emerald-500 to-green-600",
                      bgColor: "bg-gradient-to-br from-emerald-50 to-green-50"
                    },
                    { 
                      label: "Customer Engagement", 
                      value: `${Math.round(((dashboardData?.stats?.kpis?.activeCustomers?.value || 0) / Math.max(1, dashboardData?.adminStats?.totalCustomers || 1)) * 100)}%`,
                      subtitle: `${dashboardData?.stats?.kpis?.activeCustomers?.value || 0} of ${dashboardData?.adminStats?.totalCustomers || 0} customers with active tickets`,
                      benchmark: "Engagement rate",
                      performance: Math.round(((dashboardData?.stats?.kpis?.activeCustomers?.value || 0) / Math.max(1, dashboardData?.adminStats?.totalCustomers || 1)) * 100),
                      trend: dashboardData?.stats?.kpis?.activeCustomers?.change || 0,
                      isPositive: true,
                      icon: Building2,
                      color: "from-purple-500 to-violet-600",
                      bgColor: "bg-gradient-to-br from-purple-50 to-violet-50"
                    },
                    { 
                      label: "Workload Distribution", 
                      value: `${dashboardData?.stats?.kpis?.totalTickets?.value || 0}`,
                      subtitle: `${dashboardData?.stats?.kpis?.unassignedTickets?.value || 0} unassigned tickets`,
                      benchmark: dashboardData?.adminStats?.zoneWiseTickets?.length 
                        ? `Across ${dashboardData?.adminStats?.zoneWiseTickets?.length} zones`
                        : "System-wide",
                      performance: Math.max(0, 100 - ((dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) * 10)),
                      trend: -(dashboardData?.stats?.kpis?.unassignedTickets?.value || 0),
                      isPositive: (dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) < 5,
                      icon: Ticket,
                      color: "from-orange-500 to-red-600",
                      bgColor: "bg-gradient-to-br from-orange-50 to-red-50"
                    }
                  ].map((item, i) => (
                    <div key={i} className={`${item.bgColor} rounded-2xl p-8 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group`}>
                      <div className="flex items-center justify-between mb-6">
                        <div className={`p-4 rounded-2xl bg-gradient-to-r ${item.color} shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                          <item.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-white/90 text-slate-700 border-0 shadow-sm">
                            <Activity className="w-3 h-3 mr-1" />
                            Live
                          </Badge>
                          {item.trend !== 0 && (
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              item.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(item.trend)}%
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">{item.label}</h3>
                        <p className="text-5xl font-bold text-slate-900 group-hover:scale-105 transition-transform duration-300">{item.value}</p>
                        <p className="text-sm text-slate-600 font-medium">{item.subtitle}</p>
                        
                        {/* Performance Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Performance Score</span>
                            <span>{item.performance}%</span>
                          </div>
                          <div className="relative">
                            <Progress 
                              value={item.performance} 
                              className="h-3 bg-white/50"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-white/50">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500 font-medium">{item.benchmark}</p>
                            <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                              item.performance >= 80 ? 'bg-green-200 text-green-800' :
                              item.performance >= 60 ? 'bg-yellow-200 text-yellow-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {item.performance >= 80 ? 'Excellent' : item.performance >= 60 ? 'Good' : 'Needs Attention'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="trends" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      Service Performance
                    </h4>
                    <ul className="space-y-1 text-sm text-slate-600">
                      {dashboardData?.stats?.kpis?.slaCompliance?.value !== undefined && dashboardData.stats.kpis.slaCompliance.value >= 95 && (
                        <li>• Excellent SLA compliance at {dashboardData.stats.kpis.slaCompliance.value}%</li>
                      )}
                      {dashboardData?.stats?.kpis?.avgResponseTime?.value && (
                        <li>• Average response time: {dashboardData.stats.kpis.avgResponseTime.value} {dashboardData.stats.kpis.avgResponseTime.unit || 'hrs'}</li>
                      )}
                      {dashboardData?.adminStats?.zoneWiseTickets?.map(zone => (
                        zone?.totalTickets > 0 && (
                          <li key={`zone-${zone.id}`}>• {zone.name}: {zone.totalTickets} active tickets</li>
                        )
                      ))}
                    </ul>
                  </div>
                  {(dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) > 0 && (
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        Attention Required
                      </h4>
                      <ul className="space-y-1 text-sm text-slate-600">
                        <li>• {dashboardData?.stats?.kpis?.unassignedTickets?.value} unassigned tickets</li>
                        {dashboardData?.adminStats?.zoneWiseTickets?.some(z => z?.servicePersonCount === 0) && (
                          <li>• Some zones have no assigned service personnel</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="comparison" className="mt-8">
                <div className="space-y-8">
                  {/* Performance Comparison Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Current Period Performance */}
                    <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-0 shadow-xl">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                              <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            Current Period
                          </CardTitle>
                          <Badge className="bg-green-100 text-green-800 px-3 py-1 shadow-sm">
                            <Activity className="w-4 h-4 mr-1" />
                            Live Data
                          </Badge>
                        </div>
                        <CardDescription className="text-base">Real-time performance metrics and KPIs</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {[
                            {
                              label: "Total Tickets",
                              value: formatNumber(dashboardData?.stats?.kpis?.totalTickets?.value || 0),
                              change: dashboardData?.stats?.kpis?.totalTickets?.change || "0%",
                              isPositive: dashboardData?.stats?.kpis?.totalTickets?.isPositive !== false,
                              icon: Ticket,
                              color: "from-blue-500 to-cyan-600"
                            },
                            {
                              label: "SLA Compliance",
                              value: `${dashboardData?.stats?.kpis?.slaCompliance?.value || 0}%`,
                              change: `${dashboardData?.stats?.kpis?.slaCompliance?.change || 0}%`,
                              isPositive: (dashboardData?.stats?.kpis?.slaCompliance?.change || 0) >= 0,
                              icon: Shield,
                              color: "from-green-500 to-emerald-600"
                            },
                            {
                              label: "Active Customers",
                              value: formatNumber(dashboardData?.stats?.kpis?.activeCustomers?.value || 0),
                              change: `${dashboardData?.stats?.kpis?.activeCustomers?.change || 0}%`,
                              isPositive: (dashboardData?.stats?.kpis?.activeCustomers?.change || 0) >= 0,
                              icon: Building2,
                              color: "from-purple-500 to-violet-600"
                            },
                            {
                              label: "Response Time",
                              value: `${dashboardData?.stats?.kpis?.avgResponseTime?.value || 0} ${dashboardData?.stats?.kpis?.avgResponseTime?.unit || 'hrs'}`,
                              change: `${dashboardData?.stats?.kpis?.avgResponseTime?.change || 0}%`,
                              isPositive: (dashboardData?.stats?.kpis?.avgResponseTime?.change || 0) <= 0,
                              icon: Timer,
                              color: "from-orange-500 to-red-600"
                            }
                          ].map((metric, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg bg-gradient-to-r ${metric.color} shadow-lg`}>
                                  <metric.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                                </div>
                              </div>
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                metric.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {metric.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {metric.change}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* System Capacity & Resources */}
                    <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                              <Database className="w-6 h-6 text-white" />
                            </div>
                            System Capacity
                          </CardTitle>
                          <Badge className="bg-blue-100 text-blue-800 px-3 py-1 shadow-sm">
                            <Database className="w-4 h-4 mr-1" />
                            Infrastructure
                          </Badge>
                        </div>
                        <CardDescription className="text-base">Resource allocation and system utilization</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {[
                            {
                              label: "Service Zones",
                              value: dashboardData?.adminStats?.totalServiceZones || 0,
                              utilization: (dashboardData?.adminStats?.zoneWiseTickets || []).filter(z => z.totalTickets > 0).length,
                              total: dashboardData?.adminStats?.totalServiceZones || 0,
                              icon: MapPin,
                              color: "from-cyan-500 to-blue-600"
                            },
                            {
                              label: "Service Personnel",
                              value: dashboardData?.adminStats?.totalServicePersons || 0,
                              utilization: dashboardData?.stats?.kpis?.activeServicePersons?.value || 0,
                              total: dashboardData?.adminStats?.totalServicePersons || 0,
                              icon: Users,
                              color: "from-green-500 to-emerald-600"
                            },
                            {
                              label: "Total Customers",
                              value: formatNumber(dashboardData?.adminStats?.totalCustomers || 0),
                              utilization: dashboardData?.stats?.kpis?.activeCustomers?.value || 0,
                              total: dashboardData?.adminStats?.totalCustomers || 0,
                              icon: Building2,
                              color: "from-purple-500 to-violet-600"
                            },
                            {
                              label: "Unassigned Tickets",
                              value: dashboardData?.stats?.kpis?.unassignedTickets?.value || 0,
                              utilization: Math.max(0, 100 - ((dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) * 20)),
                              total: 100,
                              icon: AlertTriangle,
                              color: (dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) > 5 ? "from-red-500 to-pink-600" : "from-orange-500 to-amber-600"
                            }
                          ].map((resource, i) => (
                            <div key={i} className="p-4 bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg bg-gradient-to-r ${resource.color} shadow-lg`}>
                                    <resource.icon className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-600">{resource.label}</p>
                                    <p className="text-xl font-bold text-slate-900">{resource.value}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-slate-500">Utilization</p>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {typeof resource.utilization === 'number' && typeof resource.total === 'number' && resource.total > 0
                                      ? `${Math.round((resource.utilization / resource.total) * 100)}%`
                                      : '0%'}
                                  </p>
                                </div>
                              </div>
                              <Progress 
                                value={typeof resource.utilization === 'number' && typeof resource.total === 'number' && resource.total > 0
                                  ? Math.min(100, (resource.utilization / resource.total) * 100)
                                  : 0} 
                                className="h-2"
                              />
                              <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>{resource.utilization} active</span>
                                <span>{resource.total} total</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Performance Benchmarks */}
                  <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl font-bold">
                        <div className="p-3 bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl shadow-lg">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        Performance Benchmarks & Goals
                      </CardTitle>
                      <CardDescription className="text-base">Key performance indicators vs industry standards</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          {
                            metric: "Response Time",
                            current: ((dashboardData?.stats?.avgResponseTime?.hours || 0) * 60 + (dashboardData?.stats?.avgResponseTime?.minutes || 0)),
                            target: 120,
                            unit: "minutes",
                            format: (val: number) => `${Math.floor(val / 60)}h ${val % 60}m`,
                            isLowerBetter: true
                          },
                          {
                            metric: "SLA Compliance",
                            current: dashboardData?.stats?.kpis?.slaCompliance?.value || 0,
                            target: 95,
                            unit: "%",
                            format: (val: number) => `${val}%`,
                            isLowerBetter: false
                          },
                          {
                            metric: "Resource Utilization",
                            current: Math.round(((dashboardData?.stats?.kpis?.activeServicePersons?.value || 0) / Math.max(1, dashboardData?.adminStats?.totalServicePersons || 1)) * 100),
                            target: 80,
                            unit: "%",
                            format: (val: number) => `${val}%`,
                            isLowerBetter: false
                          },
                          {
                            metric: "Unassigned Tickets",
                            current: dashboardData?.stats?.kpis?.unassignedTickets?.value || 0,
                            target: 5,
                            unit: "tickets",
                            format: (val: number) => `${val}`,
                            isLowerBetter: true
                          }
                        ].map((benchmark, i) => {
                          const performance = benchmark.isLowerBetter 
                            ? benchmark.current <= benchmark.target
                            : benchmark.current >= benchmark.target;
                          const percentage = benchmark.isLowerBetter
                            ? Math.min(100, Math.max(0, ((benchmark.target - benchmark.current + benchmark.target) / benchmark.target) * 100))
                            : Math.min(100, (benchmark.current / benchmark.target) * 100);
                          
                          return (
                            <div key={i} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-slate-800">{benchmark.metric}</h4>
                                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    performance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {performance ? '✓ Target Met' : '⚠ Below Target'}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Current:</span>
                                    <span className="font-semibold">{benchmark.format(benchmark.current)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Target:</span>
                                    <span className="font-semibold">{benchmark.format(benchmark.target)}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Progress value={percentage} className="h-3" />
                                  <p className="text-xs text-slate-500 text-center">
                                    Performance: {Math.round(percentage)}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Stats & Alerts */}
        <div className="space-y-6">
          {/* Critical Alerts */}
          {(dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) > 5 && (
            <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  Critical Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-red-700">
                    <strong>{dashboardData?.stats?.kpis?.unassignedTickets?.value}</strong> tickets require immediate assignment
                  </p>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Assign Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live System Stats */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium">Service Personnel</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-900">
                      {dashboardData?.stats?.kpis?.activeServicePersons?.value || 0} Active
                    </span>
                    <span className="text-xs text-slate-500">
                      of {dashboardData?.adminStats?.totalServicePersons || 0} total
                    </span>
                  </div>
                </div>
                <Progress 
                  value={dashboardData?.adminStats?.totalServicePersons 
                    ? Math.min(100, ((dashboardData.stats?.kpis?.activeServicePersons?.value || 0) / dashboardData.adminStats.totalServicePersons) * 100)
                    : 0} 
                  className="h-2" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium">Active Customers</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-900">
                      {dashboardData?.stats?.kpis?.activeCustomers?.value || 0}
                    </span>
                    <span className="text-xs text-slate-500">
                      of {dashboardData?.adminStats?.totalCustomers || 0} total
                    </span>
                  </div>
                </div>
                <Progress 
                  value={dashboardData?.adminStats?.totalCustomers 
                    ? Math.min(100, ((dashboardData.stats?.kpis?.activeCustomers?.value || 0) / dashboardData.adminStats.totalCustomers) * 100)
                    : 0} 
                  className="h-2" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium">Service Zones</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-900">
                      {dashboardData?.adminStats?.totalServiceZones || 0} Zones
                    </span>
                    {dashboardData?.adminStats?.zoneWiseTickets?.some(z => z.totalTickets > 0) && (
                      <span className="text-xs text-slate-500">
                        {dashboardData.adminStats.zoneWiseTickets.filter(z => z.totalTickets > 0).length} active
                      </span>
                    )}
                  </div>
                </div>
                <Progress 
                  value={dashboardData?.adminStats?.zoneWiseTickets?.length 
                    ? (dashboardData.adminStats.zoneWiseTickets.filter(z => z.totalTickets > 0).length / dashboardData.adminStats.zoneWiseTickets.length) * 100
                    : 0} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Analytics Overview */}
      <div className="mb-8">
        <Card className="bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  Advanced Analytics Dashboard
                </CardTitle>
                <CardDescription className="text-base mt-2">Comprehensive ticket analytics, trends, and performance insights</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Analytics
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="status" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="status">Status Distribution</TabsTrigger>
                <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
                <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="status" className="mt-6">
                <div className="space-y-4">
                  {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                    </div>
                  ) : statusDistribution?.distribution?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {statusDistribution.distribution.map((item, i) => {
                        const total = statusDistribution.distribution.reduce((sum, d) => sum + d.count, 0);
                        const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                        return (
                          <div key={i} className="p-4 bg-gradient-to-r from-white to-slate-50 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${getStatusColor(item.status).replace('text-', 'bg-').replace('100', '500')}`}></div>
                                <span className="font-semibold capitalize text-slate-800">{item.status.replace('_', ' ')}</span>
                              </div>
                              <Badge className={getStatusColor(item.status)}>{percentage}%</Badge>
                            </div>
                            <div className="flex items-end justify-between">
                              <span className="text-3xl font-bold text-slate-900">{item.count}</span>
                              <span className="text-sm text-slate-500">tickets</span>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${getStatusColor(item.status).replace('text-', 'bg-').replace('100', '500')}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">No status distribution data available</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="trends" className="mt-6">
                <div className="space-y-6">
                  {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                    </div>
                  ) : ticketTrends?.trends?.length ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">7-Day Ticket Trends</h4>
                        <div className="flex items-center gap-4">
                          <Badge className="bg-blue-100 text-blue-800">
                            {ticketTrends.trends.slice(-7).reduce((sum, t) => sum + t.count, 0)} Total Tickets
                          </Badge>
                          <Badge className="bg-green-100 text-green-800">
                            Avg: {Math.round(ticketTrends.trends.slice(-7).reduce((sum, t) => sum + t.count, 0) / 7)} per day
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                        {ticketTrends.trends.slice(-7).map((trend, i) => {
                          const maxCount = Math.max(...ticketTrends.trends.slice(-7).map(t => t.count));
                          const percentage = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
                          const isHighest = trend.count === maxCount;
                          return (
                            <div key={i} className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${isHighest ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-300' : 'bg-white'}`}>
                              <div className="text-center mb-3">
                                <p className="text-xs font-medium text-slate-600 mb-1">
                                  {new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                              <div className="text-center mb-3">
                                <span className={`text-2xl font-bold ${isHighest ? 'text-blue-900' : 'text-slate-900'}`}>
                                  {trend.count}
                                </span>
                                {isHighest && <p className="text-xs text-blue-600 font-medium">Peak</p>}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${isHighest ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-slate-400 to-slate-500'}`}
                                  style={{ width: `${Math.max(10, percentage)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">No trends data available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-green-800">SLA Compliance</span>
                      </div>
                      <Badge className={`${(dashboardData?.stats?.kpis?.slaCompliance?.value || 0) >= 95 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {(dashboardData?.stats?.kpis?.slaCompliance?.value || 0) >= 95 ? 'Excellent' : 'Needs Improvement'}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-green-900 mb-2">{dashboardData?.stats?.kpis?.slaCompliance?.value || 0}%</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Target: 95%</span>
                      <span className={`font-medium ${(dashboardData?.stats?.kpis?.slaCompliance?.value || 0) >= 95 ? 'text-green-600' : 'text-orange-600'}`}>
                        {(dashboardData?.stats?.kpis?.slaCompliance?.value || 0) >= 95 ? '✓ On Track' : '⚠ Below Target'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-sky-100 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-blue-800">Response Time</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Average</Badge>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-2">{dashboardData?.stats?.kpis?.avgResponseTime?.value || 'N/A'}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">Target: 2 hours</span>
                      <span className="text-blue-600 font-medium">Current Period</span>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-orange-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-orange-800">Unassigned</span>
                      </div>
                      <Badge className={`${(dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) > 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {(dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) > 5 ? 'High Priority' : 'Normal'}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-orange-900 mb-2">{dashboardData?.stats?.kpis?.unassignedTickets?.value || 0}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-600">Pending Assignment</span>
                      <span className={`font-medium ${(dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                        {(dashboardData?.stats?.kpis?.unassignedTickets?.value || 0) > 5 ? '⚠ Action Needed' : '✓ Under Control'}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card className="bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                Recent Tickets
              </CardTitle>
              <CardDescription className="text-base mt-2">Latest support requests and critical issues requiring attention</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-orange-100 text-orange-800 px-3 py-1">
                <Clock className="w-4 h-4 mr-1" />
                Live Updates
              </Badge>
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/tickets')}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View All Tickets
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading recent tickets...</span>
            </div>
          ) : dashboardData?.recentTickets?.length ? (
            <div className="space-y-4">
              {dashboardData.recentTickets.slice(0, 5).map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{ticket.title}</h4>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ticket.customer.companyName}
                      {ticket.asset && ` • ${ticket.asset.model}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent tickets found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Zone Performance & Revenue Analytics */}
      {dashboardData?.adminStats?.zoneWiseTickets?.length ? (
        <Card className="mt-8 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  Zone Performance Analytics
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Comprehensive analysis of service zones, resource allocation, and operational efficiency
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-cyan-100 text-cyan-800 px-3 py-1">
                  <Globe className="w-4 h-4 mr-1" />
                  {dashboardData?.adminStats?.zoneWiseTickets?.length || 0} Zones
                </Badge>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(dashboardData?.adminStats?.zoneWiseTickets || []).map((zone) => (
                <Card key={zone.id} className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-50">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {zone.name}
                          </p>
                          <p className="text-sm text-gray-500">Zone ID: {zone.id}</p>
                        </div>
                      </div>
                      <Badge className={`${zone.totalTickets > 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {zone.totalTickets > 0 ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Ticket className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-blue-900">{zone.totalTickets}</p>
                        <p className="text-xs text-blue-600">Total Tickets</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-green-900">{zone.servicePersonCount}</p>
                        <p className="text-xs text-green-600">Service Staff</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-slate-700">Customers</span>
                        </div>
                        <span className="font-semibold text-slate-900">
                          {zone.customerCount} {zone.customerCount === 1 ? 'customer' : 'customers'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-slate-700">Service Staff</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-900">
                            {zone.servicePersonCount} {zone.servicePersonCount === 1 ? 'staff' : 'staff'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-slate-700">Active Tickets</span>
                        </div>
                        <Badge variant={zone.totalTickets > 0 ? 'destructive' : 'outline'}>
                          {zone.totalTickets} {zone.totalTickets === 1 ? 'ticket' : 'tickets'}
                        </Badge>
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Resource Utilization</span>
                          <span>{(zone.servicePersonCount > 0 ? (zone.totalTickets / zone.servicePersonCount).toFixed(1) : 0)} tickets/staff</span>
                        </div>
                        <Progress 
                          value={Math.min(100, (zone.servicePersonCount > 0 ? (zone.totalTickets / zone.servicePersonCount / 5) * 100 : 0))} 
                          className={`h-2 ${zone.totalTickets > 0 ? '[&>div]:bg-green-500' : '[&>div]:bg-slate-200'}`}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          {zone.servicePersonCount > 0 
                            ? `${zone.servicePersonCount} staff managing ${zone.totalTickets} tickets`
                            : 'No staff assigned'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-indigo-600 hover:text-indigo-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/FSA`);

                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Activity className="w-3 h-3" />
                          Live Data
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Enhanced Zone Performance Summary */}
            <div className="mt-8 space-y-6">
              {/* Summary Header */}
              <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                      <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                        <PieChart className="w-6 h-6 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Zone Performance Summary
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-100 text-indigo-800 px-3 py-1">
                        <Activity className="w-4 h-4 mr-1" />
                        Real-time Analytics
                      </Badge>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export Summary
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-base mt-2">
                    Comprehensive overview of zone performance metrics and resource distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      {
                        title: "Total Tickets",
                        value: (dashboardData?.adminStats?.zoneWiseTickets || []).reduce((sum, zone) => sum + zone.totalTickets, 0),
                        subtitle: "Across all zones",
                        icon: Ticket,
                        color: "from-blue-500 to-cyan-600",
                        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
                        trend: "+12%",
                        isPositive: true
                      },
                      {
                        title: "Total Customers",
                        value: formatNumber(dashboardData?.adminStats?.totalCustomers || 0),
                        subtitle: "Active customer base",
                        icon: Building2,
                        color: "from-green-500 to-emerald-600",
                        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
                        trend: "+8%",
                        isPositive: true
                      },
                      {
                        title: "Avg. Tickets/Zone",
                        value: (dashboardData?.adminStats?.zoneWiseTickets || []).length > 0 
                          ? Math.round((dashboardData?.adminStats?.zoneWiseTickets || []).reduce((sum, zone) => sum + zone.totalTickets, 0) / (dashboardData?.adminStats?.zoneWiseTickets || []).length)
                          : 0,
                        subtitle: "Workload distribution",
                        icon: BarChart3,
                        color: "from-purple-500 to-violet-600",
                        bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
                        trend: "-3%",
                        isPositive: false
                      },
                      {
                        title: "Total Staff",
                        value: (dashboardData?.adminStats?.zoneWiseTickets || []).reduce((sum, zone) => sum + zone.servicePersonCount, 0),
                        subtitle: "Service personnel",
                        icon: Users,
                        color: "from-orange-500 to-red-600",
                        bgColor: "bg-gradient-to-br from-orange-50 to-red-50",
                        trend: "+5%",
                        isPositive: true
                      }
                    ].map((metric, i) => (
                      <div key={i} className={`${metric.bgColor} rounded-2xl p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 group`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <metric.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            metric.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {metric.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {metric.trend}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-800">{metric.title}</h4>
                          <p className="text-3xl font-bold text-slate-900 group-hover:scale-105 transition-transform duration-300">
                            {typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value}
                          </p>
                          <p className="text-sm text-slate-600">{metric.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Zone Efficiency Metrics */}
                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        Zone Efficiency Analysis
                      </h4>
                      <div className="space-y-4">
                        {(dashboardData?.adminStats?.zoneWiseTickets || []).slice(0, 5).map((zone, i) => {
                          const efficiency = zone.servicePersonCount > 0 ? (zone.totalTickets / zone.servicePersonCount) : 0;
                          const maxEfficiency = Math.max(...(dashboardData?.adminStats?.zoneWiseTickets || []).map(z => z.servicePersonCount > 0 ? z.totalTickets / z.servicePersonCount : 0));
                          const efficiencyPercentage = maxEfficiency > 0 ? (efficiency / maxEfficiency) * 100 : 0;
                          
                          return (
                            <div key={zone.id} className="flex items-center justify-between p-4 bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                                  <MapPin className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{zone.name}</p>
                                  <p className="text-sm text-slate-600">
                                    {zone.totalTickets} tickets • {zone.servicePersonCount} staff • {zone.customerCount} customers
                                  </p>
                                </div>
                              </div>
                              <div className="text-right min-w-[120px]">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-slate-700">
                                    {efficiency.toFixed(1)} tickets/staff
                                  </span>
                                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    efficiency > 3 ? 'bg-red-100 text-red-800' :
                                    efficiency > 2 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {efficiency > 3 ? 'High Load' : efficiency > 2 ? 'Moderate' : 'Optimal'}
                                  </div>
                                </div>
                                <Progress value={Math.min(100, efficiencyPercentage)} className="h-2 w-24" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-green-600" />
                        Top Performing Zones
                      </h4>
                      <div className="space-y-3">
                        {(dashboardData?.adminStats?.zoneWiseTickets || [])
                          .filter(zone => zone.servicePersonCount > 0)
                          .sort((a, b) => (b.totalTickets / b.servicePersonCount) - (a.totalTickets / a.servicePersonCount))
                          .slice(0, 3)
                          .map((zone, i) => (
                            <div key={zone.id} className="flex items-center gap-3 p-3 bg-white/80 rounded-lg shadow-sm">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                i === 0 ? 'bg-yellow-100 text-yellow-800' :
                                i === 1 ? 'bg-gray-100 text-gray-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-slate-800 text-sm">{zone.name}</p>
                                <p className="text-xs text-slate-600">
                                  {(zone.totalTickets / zone.servicePersonCount).toFixed(1)} efficiency score
                                </p>
                              </div>
                              {i === 0 && <Star className="w-4 h-4 text-yellow-500" />}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
