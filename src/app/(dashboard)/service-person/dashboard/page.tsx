'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Ticket,
  MapPin,
  User,
  Bell,
  Loader2,
  ArrowRight,
  Target,
  Award,
  RefreshCw,
  Shield,
  Calendar,
  RotateCcw,
  Info
} from 'lucide-react';
import { AttendanceWidget } from '@/components/attendance/AttendanceWidget';
import { ActivityLogger } from '@/components/activity/ActivityLogger';
import { apiClient } from '@/lib/api/api-client';
import Link from 'next/link';

interface DashboardStats {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  activeTickets: number;
  completedTickets: number;
  pendingActivities: number;
  efficiency: number;
}

interface AttendanceStatus {
  isCheckedIn: boolean;
  attendance?: {
    id: number;
    checkInAt: string;
    checkOutAt?: string;
    status: 'CHECKED_IN' | 'CHECKED_OUT' | 'EARLY_CHECKOUT';
    totalHours?: number;
  };
}

interface RecentTicket {
  id: number;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'ASSIGNED' | 'IN_PROCESS' | 'ONSITE_VISIT' | 'RESOLVED' | 'CLOSED' | 'CLOSED_PENDING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  customer: {
    companyName: string;
  };
  createdAt: string;
}

interface Notification {
  id: number;
  type: 'TICKET_ASSIGNED' | 'TICKET_UPDATED' | 'REMINDER' | 'SYSTEM';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const STATUS_CONFIG = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  ASSIGNED: { label: 'Assigned', color: 'bg-purple-100 text-purple-800' },
  IN_PROCESS: { label: 'In Process', color: 'bg-yellow-100 text-yellow-800' },
  ONSITE_VISIT: { label: 'Onsite Visit', color: 'bg-orange-100 text-orange-800' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
  CLOSED_PENDING: { label: 'Closed Pending', color: 'bg-gray-100 text-gray-600' },
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-800' },
};

export default function ServicePersonDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Initialize with default values
      let attendanceData: any = {};
      let ticketsData: any[] = [];
      let notificationsData: any[] = [];
      let activityData: any = {};

      // Fetch all data in parallel for better performance
      const [
        attendanceDayResponse,
        attendanceWeekResponse,
        attendanceMonthResponse,
        attendanceStatusResponse,
        ticketsResponse, 
        notificationsResponse,
        activityDayResponse,
        activityMonthResponse
      ] = await Promise.allSettled([
        apiClient.get('/attendance/stats', { params: { period: 'day' } }),
        apiClient.get('/attendance/stats', { params: { period: 'week' } }),
        apiClient.get('/attendance/stats', { params: { period: 'month' } }),
        apiClient.get('/attendance/status'),
        apiClient.get('/tickets', { params: { limit: 5, page: 1, assignedToMe: true } }),
        apiClient.get('/notifications', { params: { limit: 10, page: 1 } }),
        apiClient.get('/activities/stats', { params: { period: 'day' } }),
        apiClient.get('/activities/stats', { params: { period: 'month' } })
      ]);

      // Process attendance data (day/week/month)
      let attendanceDayData: any = {};
      let attendanceWeekData: any = {};
      let attendanceMonthData: any = {};
      if (attendanceDayResponse.status === 'fulfilled') {
        attendanceDayData = attendanceDayResponse.value.data || {};
        console.log('Attendance day data loaded:', attendanceDayData);
      } else {
        console.error('Error fetching attendance day data:', attendanceDayResponse.reason);
        attendanceDayData = { totalHours: 0 };
      }
      if (attendanceWeekResponse.status === 'fulfilled') {
        attendanceWeekData = attendanceWeekResponse.value.data || {};
        console.log('Attendance week data loaded:', attendanceWeekData);
      } else {
        console.error('Error fetching attendance week data:', attendanceWeekResponse.reason);
        attendanceWeekData = { totalHours: 0 };
      }
      if (attendanceMonthResponse.status === 'fulfilled') {
        attendanceMonthData = attendanceMonthResponse.value.data || {};
        console.log('Attendance month data loaded:', attendanceMonthData);
      } else {
        console.error('Error fetching attendance month data:', attendanceMonthResponse.reason);
        attendanceMonthData = { totalHours: 0, avgHoursPerDay: 0, totalDaysWorked: 0 };
      }

      // Process attendance status
      if (attendanceStatusResponse.status === 'fulfilled') {
        const statusResponse = attendanceStatusResponse.value;
        const statusData = (statusResponse as any)?.data ?? statusResponse;
        console.log('Raw attendance status response:', statusResponse);
        setAttendanceStatus(statusData as any);
        console.log('Attendance status set to:', statusData);
      } else {
        console.error('Error fetching attendance status:', attendanceStatusResponse.reason);
        console.error('Full error details:', attendanceStatusResponse);
        // Only set default if there was actually an error
        setAttendanceStatus({ isCheckedIn: false });
      }

      // Process tickets data
      if (ticketsResponse.status === 'fulfilled') {
        const responseData = ticketsResponse.value.data;
        // Handle both direct array response and paginated response
        if (Array.isArray(responseData)) {
          ticketsData = responseData;
        } else if (responseData && Array.isArray(responseData.data)) {
          ticketsData = responseData.data;
        } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
          // Handle nested data structure if needed
          ticketsData = responseData.data.data;
        } else {
          console.warn('Unexpected tickets data format:', responseData);
          ticketsData = [];
        }
        console.log('Tickets data loaded:', ticketsData);
      } else {
        console.error('Error fetching tickets:', ticketsResponse.reason);
        ticketsData = [];
      }

      // Process notifications data
      if (notificationsResponse.status === 'fulfilled') {
        console.log('Raw notifications response:', notificationsResponse.value);
        // The notifications are directly in the data array, not in data.data
        const rawNotifications = Array.isArray(notificationsResponse.value.data) 
          ? notificationsResponse.value.data 
          : [];
        console.log('Raw notifications array:', rawNotifications);
        // Map API response to frontend format
        notificationsData = rawNotifications.map((notif: any) => {
          const mapped = {
            ...notif,
            read: notif.status !== 'UNREAD' // Convert status to boolean read field
          };
          console.log('Mapped notification:', mapped);
          return mapped;
        });
        console.log('Processed notifications data:', notificationsData);
      } else {
        console.error('Error fetching notifications:', notificationsResponse.reason);
        notificationsData = [];
      }


      // Process activity data (day and month)
      let activityDayData: any = {};
      if (activityDayResponse.status === 'fulfilled') {
        activityDayData = activityDayResponse.value.data || {};
        console.log('Activity day data loaded:', activityDayData);
      } else {
        console.error('Error fetching activity day data:', activityDayResponse.reason);
        activityDayData = { totalActivities: 0, totalHours: 0 };
      }
      if (activityMonthResponse.status === 'fulfilled') {
        activityData = activityMonthResponse.value.data || {};
        console.log('Activity month data loaded:', activityData);
      } else {
        console.error('Error fetching activity month data:', activityMonthResponse.reason);
        activityData = { totalActivities: 0, totalHours: 0 };
      }

      // Calculate real stats from backend data
      const activeTickets = Array.isArray(ticketsData) ? ticketsData.filter((t: any) => 
        t && t.status && ['OPEN', 'IN_PROGRESS', 'ASSIGNED', 'IN_PROCESS', 'ONSITE_VISIT'].includes(t.status)
      ).length : 0;
      
      const completedTickets = Array.isArray(ticketsData) ? ticketsData.filter((t: any) => 
        t && t.status && ['RESOLVED', 'CLOSED', 'CLOSED_PENDING'].includes(t.status)
      ).length : 0;

      // Use real attendance data for hours - ensure numbers
      const todayHours = Number(attendanceDayData.todayHours ?? attendanceDayData.totalHours ?? 0);
      const weekHours = Number(attendanceWeekData.totalHours ?? 0);
      const monthHours = Number(attendanceMonthData.totalHours ?? 0);

      // Calculate efficiency from ticket completion rate
      let efficiency = 0;
      if (completedTickets > 0 && activeTickets >= 0) {
        const totalTickets = activeTickets + completedTickets;
        efficiency = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;
      }

      // Use real pending activities from activity day stats
      const pendingActivities = Number(activityDayData.totalActivities ?? 0);

      setStats({
        todayHours,
        weekHours,
        monthHours,
        activeTickets,
        completedTickets,
        pendingActivities,
        efficiency
      });

      // Ensure we have valid ticket data before slicing
      const recentTicketsToSet = Array.isArray(ticketsData) 
        ? ticketsData
            .filter((t: any) => t && t.id && t.title) // Ensure we have required fields
            .slice(0, 5) 
            .map((t: any) => ({
              id: t.id,
              title: t.title,
              status: t.status || 'OPEN',
              priority: t.priority || 'MEDIUM',
              customer: {
                companyName: t.customer?.companyName || 'Unknown Company'
              },
              createdAt: t.createdAt || new Date().toISOString()
            }))
        : [];
      // Filter out read notifications and limit to 10 most recent
      const notificationsToSet = Array.isArray(notificationsData) 
        ? notificationsData
            .filter((n: any) => !n.read) // Only include unread notifications
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by newest first
            .slice(0, 10) // Limit to 10 most recent
        : [];
      
      console.log('Final tickets to set:', recentTicketsToSet);
      console.log('Final notifications to set:', notificationsToSet);
      console.log('Current state before update - notifications:', notifications);
      
      setRecentTickets(recentTicketsToSet);
      setNotifications(notificationsToSet);
      
      // Log after state update (will be visible in next render)
      setTimeout(() => {
        console.log('State after update - notifications:', notifications);
      }, 0);

      // Don't override attendance status if it was already set by the API call
      // This was causing the issue - removing the fallback that overrides the API response

      console.log('Dashboard data loaded successfully');

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId: number) => {
    try {
      await apiClient.post(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Refresh attendance status
  const refreshAttendanceStatus = async () => {
    try {
      console.log('Making API call to /attendance/status...');
      const response = await apiClient.get('/attendance/status');
      console.log('Dashboard - Full response:', response);
      setAttendanceStatus((response as any)?.data ?? response);
    } catch (error: any) {
      console.error('Error fetching attendance status:', error);
      console.error('Error details:', (error as any).response || error);
      // Set default status on error
      setAttendanceStatus({ isCheckedIn: false });
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up periodic refresh for attendance status
    const interval = setInterval(refreshAttendanceStatus, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900">Service Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your daily overview.</p>
        </div>
        <div className="flex items-center gap-4">
          {attendanceStatus?.isCheckedIn && (
            <Badge variant="default" className="text-sm bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Checked In
            </Badge>
          )}
          <Button 
            onClick={refreshAttendanceStatus} 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh Status
          </Button>
          <Badge variant="outline" className="text-sm">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Badge>
        </div>
      </div>

      {/* Attendance Requirements Info Banner */}
      {!attendanceStatus?.isCheckedIn && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Daily Check-in Required</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Please check in with your location to start your work day. Location access is required for attendance tracking and activity logging.
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location required
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Auto-checkout at 7 PM
                  </span>
                  <span className="flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Activity logging enabled after check-in
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Early Checkout or Re-checkin Info */}
      {attendanceStatus?.attendance?.status === 'EARLY_CHECKOUT' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900">Early Checkout Completed</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You checked out early today. If this was a mistake, you can re-check-in to continue your work day.
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Re-check-in available
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayHours?.toFixed(1) || '0.0'}h</div>
            <p className="text-xs text-muted-foreground">
              {stats?.weekHours?.toFixed(1) || '0.0'}h this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedTickets || 0} completed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.efficiency || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.efficiency && stats.efficiency > 85 ? 'Excellent' : 'Good'} performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingActivities || 0}</div>
            <p className="text-xs text-muted-foreground">
              {attendanceStatus?.isCheckedIn ? 'Activities logged today' : 'Check-in required to log activities'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Attendance & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Widget */}
          <AttendanceWidget onStatusChange={refreshAttendanceStatus} />
          
          {/* Activity Logger */}
          {(() => {
            console.log('Dashboard - Current attendanceStatus:', attendanceStatus);
            return null;
          })()}
          {attendanceStatus?.isCheckedIn ? (
            <ActivityLogger />
          ) : (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-400" />
                  Activity Logger
                </CardTitle>
                <CardDescription>
                  Log your daily activities and work progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Check-in Required</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Please check in with your location to start logging activities for today.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      Location tracking
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Daily attendance
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Tickets & Notifications */}
        <div className="space-y-6">
          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Recent Tickets
                </CardTitle>
                <Link href="/dashboard/service-person/tickets">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTickets.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent tickets</p>
                </div>
              ) : (
                recentTickets.map((ticket) => (
                  <Link 
                    key={ticket.id} 
                    href={`/dashboard/service-person/tickets`}
                    className="block"
                  >
                    <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm line-clamp-1">
                          #{ticket.id} - {ticket.title}
                        </h4>
                        <div className="flex gap-1">
                          <Badge className={`text-xs ${STATUS_CONFIG[ticket.status].color}`}>
                            {STATUS_CONFIG[ticket.status].label}
                          </Badge>
                          <Badge className={`text-xs ${PRIORITY_CONFIG[ticket.priority].color}`}>
                            {PRIORITY_CONFIG[ticket.priority].label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.customer.companyName}
                        </span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Notifications
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => fetchDashboardData()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.filter(n => !n.read).length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications
                  .filter(n => !n.read)
                  .map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => !notification.read && markNotificationRead(notification.id)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/service-person/tickets">
                <Button className="w-full justify-start" variant="outline">
                  <Ticket className="h-4 w-4 mr-2" />
                  View My Tickets
                </Button>
              </Link>
              <Link href="/dashboard/service-person/reports">
                <Button className="w-full justify-start" variant="outline">
                  <Award className="h-4 w-4 mr-2" />
                  Performance Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}