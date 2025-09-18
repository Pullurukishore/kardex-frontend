'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Ticket,
  MapPin,
  User,
  Download,
  Loader2,
  BarChart3
} from 'lucide-react';
import api from '@/lib/api/axios';

interface AttendanceStats {
  totalHours: number;
  avgHoursPerDay: number;
  totalDaysWorked: number;
  weeklyData: Array<{
    date: string;
    hours: number;
    day: string;
  }>;
  monthlyData: Array<{
    month: string;
    hours: number;
  }>;
}

interface ActivityStats {
  totalActivities: number;
  totalDuration: number;
  avgDurationPerActivity: number;
  activitiesByType: Array<{
    type: string;
    count: number;
    duration: number;
  }>;
  dailyActivities: Array<{
    date: string;
    count: number;
    duration: number;
  }>;
}

interface TicketStats {
  totalTickets: number;
  completedTickets: number;
  avgResolutionTime: number;
  ticketsByStatus: Array<{
    status: string;
    count: number;
  }>;
  ticketsByPriority: Array<{
    priority: string;
    count: number;
  }>;
  monthlyTickets: Array<{
    month: string;
    opened: number;
    resolved: number;
  }>;
}

interface PerformanceMetrics {
  efficiency: number;
  customerSatisfaction: number;
  responseTime: number;
  completionRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ServicePersonReportsPage() {
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const { toast } = useToast();

  // Fetch all report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch attendance stats
      const attendanceResponse = await api.get('/attendance/stats', {
        params: { period }
      });
      setAttendanceStats(attendanceResponse.data);

      // Fetch activity stats
      const activityResponse = await api.get('/activities/stats', {
        params: { period }
      });
      setActivityStats(activityResponse.data);

      // Fetch ticket stats
      const ticketResponse = await api.get('/tickets/stats', {
        params: { period }
      });
      setTicketStats(ticketResponse.data);

      // Fetch performance metrics
      const performanceResponse = await api.get('/performance/metrics', {
        params: { period }
      });
      setPerformanceMetrics(performanceResponse.data);

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Export report
  const exportReport = async () => {
    try {
      const response = await api.get('/reports/export', {
        params: { period, format: 'pdf' },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `service-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Report Exported',
        description: 'Your report has been downloaded successfully',
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Reports</h1>
          <p className="text-gray-600 mt-1">Track your service performance and productivity</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Performance Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats?.totalHours?.toFixed(1) || '0.0'}h</div>
                <p className="text-xs text-muted-foreground">
                  Avg {attendanceStats?.avgHoursPerDay?.toFixed(1) || '0.0'}h per day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activities Logged</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activityStats?.totalActivities || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {activityStats?.totalDuration || 0} minutes total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketStats?.completedTickets || 0}</div>
                <p className="text-xs text-muted-foreground">
                  of {ticketStats?.totalTickets || 0} total tickets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics?.efficiency || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {performanceMetrics?.efficiency && performanceMetrics.efficiency > 85 ? 'Excellent' : 'Good'} performance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Hours Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Hours Worked</CardTitle>
                <CardDescription>Hours worked per day this {period}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={attendanceStats?.weeklyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="hours" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Distribution</CardTitle>
                <CardDescription>Time spent on different activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={activityStats?.activitiesByType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.type} ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="duration"
                    >
                      {(activityStats?.activitiesByType || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{attendanceStats?.totalHours?.toFixed(1) || '0.0'}h</div>
                <p className="text-sm text-muted-foreground">This {period}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average per Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{attendanceStats?.avgHoursPerDay?.toFixed(1) || '0.0'}h</div>
                <p className="text-sm text-muted-foreground">Daily average</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Days Worked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{attendanceStats?.totalDaysWorked || 0}</div>
                <p className="text-sm text-muted-foreground">This {period}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Daily hours worked over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={attendanceStats?.weeklyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="hours" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activityStats?.totalActivities || 0}</div>
                <p className="text-sm text-muted-foreground">This {period}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.floor((activityStats?.totalDuration || 0) / 60)}h {(activityStats?.totalDuration || 0) % 60}m</div>
                <p className="text-sm text-muted-foreground">Time logged</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activityStats?.avgDurationPerActivity?.toFixed(0) || 0}m</div>
                <p className="text-sm text-muted-foreground">Per activity</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Types</CardTitle>
                <CardDescription>Breakdown by activity type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityStats?.activitiesByType || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Activity Trend</CardTitle>
                <CardDescription>Activities logged per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityStats?.dailyActivities || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{ticketStats?.totalTickets || 0}</div>
                <p className="text-sm text-muted-foreground">Assigned to you</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{ticketStats?.completedTickets || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {ticketStats?.totalTickets ? Math.round((ticketStats.completedTickets / ticketStats.totalTickets) * 100) : 0}% completion rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{ticketStats?.avgResolutionTime?.toFixed(1) || '0.0'}h</div>
                <p className="text-sm text-muted-foreground">Average time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{performanceMetrics?.customerSatisfaction || 0}%</div>
                <p className="text-sm text-muted-foreground">Customer rating</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
                <CardDescription>Current ticket distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ticketStats?.ticketsByStatus || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.status} ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(ticketStats?.ticketsByStatus || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Ticket Trend</CardTitle>
                <CardDescription>Tickets opened vs resolved</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ticketStats?.monthlyTickets || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="opened" fill="#8884d8" name="Opened" />
                    <Bar dataKey="resolved" fill="#82ca9d" name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}