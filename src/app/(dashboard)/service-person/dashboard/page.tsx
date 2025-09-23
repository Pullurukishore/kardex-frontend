'use client';

import { useState, useEffect, useCallback } from 'react';
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
import ActivityLogger from '@/components/activity/ActivityLogger';
import { apiClient } from '@/lib/api/api-client';
import api from '@/lib/api/axios';
import Link from 'next/link';

interface ActivityStats {
  totalActivities: number;
  completedActivities: number;
  totalHours: number;
}

interface DashboardStats {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  activeTickets: number;
  completedTickets: number;
  pendingActivities: number;
  activityStats: ActivityStats;
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
  status: 'OPEN' | 'IN_PROGRESS' | 'ASSIGNED' | 'ONSITE_VISIT' | 'RESOLVED' | 'CLOSED' | 'CLOSED_PENDING';
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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  ASSIGNED: { label: 'Assigned', color: 'bg-purple-100 text-purple-800' },
  ONSITE_VISIT: { label: 'Onsite Visit', color: 'bg-orange-100 text-orange-800' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
  CLOSED_PENDING: { label: 'Closed Pending', color: 'bg-gray-100 text-gray-600' },
  // Add default fallback for any unexpected status
  DEFAULT: { label: 'Unknown', color: 'bg-gray-100 text-gray-600' },
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
  const [activities, setActivities] = useState<any[]>([]);
  const { toast } = useToast();

  // Refresh activity data
  const refreshActivityData = useCallback(async () => {
    try {
      // Fetch full activities list for ActivityLogger component using raw axios client
      // This matches the response structure shown in the API response
      const response = await api.get('/activities');
      
      // Process activities data - backend returns { activities: [...], pagination: {...} }
      const responseData = response.data;
      const activitiesData = responseData?.activities || [];
      
      // Update activities state for ActivityLogger - force re-render with new array
      setActivities([...activitiesData]);
      
      // Calculate stats from today's activities
      const today = new Date();
      const todayActivities = activitiesData.filter((activity: any) => {
        if (!activity.startTime) return false;
        const activityDate = new Date(activity.startTime);
        return activityDate.toDateString() === today.toDateString();
      });
      
      // Count completed activities (activities with endTime)
      const completedCount = todayActivities.filter((a: any) => 
        a && a.endTime
      ).length;
      
      // Calculate total hours from activities (convert minutes to hours)
      const totalMinutes = todayActivities.reduce((sum: number, a: any) => {
        if (a.duration) {
          return sum + (Number(a.duration) || 0);
        }
        return sum;
      }, 0);
      
      const activityDayData: ActivityStats = {
        totalActivities: todayActivities.length,
        completedActivities: completedCount,
        totalHours: totalMinutes / 60 // Convert minutes to hours
      };

      // Update stats with new activity data
      setStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          activityStats: activityDayData
        };
      });
    } catch (error: any) {
      // Show user-friendly error message
      toast({
        title: "Error Loading Activities",
        description: `Failed to load activities: ${error.message}`,
        variant: "destructive",
      });
      
      setActivities([]); // Set empty array on error
    }
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
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
        // For 'day' period, we need to get today's attendance specifically
        const response = attendanceDayResponse.value;
        attendanceDayData = response.data || response || {};
      } else {
        attendanceDayData = { totalHours: 0 };
      }
      
      if (attendanceWeekResponse.status === 'fulfilled') {
        const response = attendanceWeekResponse.value;
        attendanceWeekData = response.data || response || {};
      } else {
        attendanceWeekData = { totalHours: 0 };
      }
      
      if (attendanceMonthResponse.status === 'fulfilled') {
        const response = attendanceMonthResponse.value;
        attendanceMonthData = response.data || response || {};
      } else {
        attendanceMonthData = { totalHours: 0, avgHoursPerDay: 0, totalDaysWorked: 0 };
      }

      // Process attendance status
      if (attendanceStatusResponse.status === 'fulfilled') {
        const statusResponse = attendanceStatusResponse.value;
        const statusData = (statusResponse as any)?.data ?? statusResponse;
        setAttendanceStatus(statusData as any);
      } else {
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
          ticketsData = [];
        }
      } else {
        ticketsData = [];
      }

      // Process notifications data
      if (notificationsResponse.status === 'fulfilled') {
        // The notifications are directly in the data array, not in data.data
        const rawNotifications = Array.isArray(notificationsResponse.value.data) 
          ? notificationsResponse.value.data 
          : [];
        // Map API response to frontend format
        notificationsData = rawNotifications.map((notif: any) => ({
          ...notif,
          read: notif.status !== 'UNREAD' // Convert status to boolean read field
        }));
      } else {
        notificationsData = [];
      }


      // Process activity data (day and month)
      let activityDayData: ActivityStats = {
        totalActivities: 0,
        completedActivities: 0,
        totalHours: 0
      };
      
      if (activityDayResponse.status === 'fulfilled') {
        const response = activityDayResponse.value;
        const responseData = response.data || response || {};
        
        // Try to extract activities count from different possible response structures
        const activities = Array.isArray(responseData) 
          ? responseData 
          : responseData.activities || [];
        
        // Count completed activities
        const completedCount = activities.filter((a: any) => 
          a && (a.status === 'COMPLETED' || a.isCompleted)
        ).length;
        
        // Calculate total hours from activities
        const hours = activities.reduce((sum: number, a: any) => {
          if (a.duration) {
            return sum + (Number(a.duration) || 0);
          }
          return sum;
        }, 0);
        
        activityDayData = {
          totalActivities: activities.length,
          completedActivities: completedCount,
          totalHours: hours
        };
      } else {
        activityDayData = { 
          totalActivities: 0, 
          completedActivities: 0,
          totalHours: 0 
        };
      }
      
      if (activityMonthResponse.status === 'fulfilled') {
        const response = activityMonthResponse.value;
        activityData = response.data || response || {};
      } else {
        activityData = { totalActivities: 0, totalHours: 0 };
      }

      // Calculate real stats from backend data
      const activeTickets = Array.isArray(ticketsData) ? ticketsData.filter((t: any) => 
        t && t.status && ['OPEN', 'IN_PROGRESS', 'ASSIGNED', 'ONSITE_VISIT'].includes(t.status)
      ).length : 0;
      
      const completedTickets = Array.isArray(ticketsData) ? ticketsData.filter((t: any) => 
        t && t.status && ['RESOLVED', 'CLOSED', 'CLOSED_PENDING'].includes(t.status)
      ).length : 0;

      // Get today's hours from the improved backend stats endpoint
      let todayHours = 0;
      
      if (attendanceDayData) {
        // The backend now handles current session calculation for day period
        const totalHoursValue = attendanceDayData.totalHours;
        const todayHoursValue = attendanceDayData.todayHours;
        
        todayHours = Number(totalHoursValue ?? todayHoursValue ?? 0);
      }
      
      const weekHours = Number(attendanceWeekData.totalHours ?? 0);
      const monthHours = Number(attendanceMonthData.totalHours ?? 0);

      // Calculate pending activities from activity stats
      const totalActivities = activityDayData.totalActivities || 0;
      const completedActivities = activityDayData.completedActivities || 0;
      const pendingActivities = totalActivities;

      // Update stats with the calculated values
      const newStats = {
        todayHours,
        weekHours,
        monthHours,
        activeTickets,
        completedTickets,
        pendingActivities,
        activityStats: activityDayData
      };
      
      setStats(newStats);

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
      
      setRecentTickets(recentTicketsToSet);
      setNotifications(notificationsToSet);

      // Don't override attendance status if it was already set by the API call
      // This was causing the issue - removing the fallback that overrides the API response

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
      // Silently handle error
    }
  };

  // Refresh attendance status
  const refreshAttendanceStatus = async () => {
    try {
      const response = await apiClient.get('/attendance/status');
      setAttendanceStatus((response as any)?.data ?? response);
    } catch (error: any) {
      // Set default status on error
      setAttendanceStatus({ isCheckedIn: false });
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchDashboardData();
      // Fetch activities after dashboard data is loaded
      await refreshActivityData();
    };
    
    initializeData();
    
    // Set up periodic refresh for both attendance status and dashboard data
    const statusInterval = setInterval(refreshAttendanceStatus, 30000); // Refresh every 30 seconds
    const dataInterval = setInterval(fetchDashboardData, 60000); // Refresh dashboard every 60 seconds
    const activitiesInterval = setInterval(refreshActivityData, 60000); // Refresh activities every 60 seconds
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(dataInterval);
      clearInterval(activitiesInterval);
    };
  }, [fetchDashboardData, refreshActivityData]);

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
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Service Dashboard
            </h1>
            <p className="text-blue-100 text-lg">Welcome back! Here's your daily overview.</p>
          </div>
          <div className="flex items-center gap-4">
            {attendanceStatus?.isCheckedIn && (
              <Badge className="text-sm bg-emerald-500/20 text-emerald-100 border-emerald-400/30 backdrop-blur-sm">
                <CheckCircle className="h-3 w-3 mr-1" />
                Checked In
              </Badge>
            )}
            <Badge className="text-sm bg-white/10 text-white border-white/20 backdrop-blur-sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Badge>
          </div>
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

      {/* Colorful Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Today's Hours</CardTitle>
            <div className="p-2 bg-blue-500 rounded-full">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats?.todayHours?.toFixed(1) || '0.0'}h</div>
            <p className="text-xs text-blue-600 mt-1">
              {stats?.weekHours?.toFixed(1) || '0.0'}h this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Active Tickets</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-full">
              <Ticket className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{stats?.activeTickets || 0}</div>
            <p className="text-xs text-emerald-600 mt-1">
              {stats?.completedTickets || 0} completed this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Today's Activities</CardTitle>
            <div className="p-2 bg-orange-500 rounded-full">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {stats?.activityStats?.completedActivities || 0}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {attendanceStatus?.isCheckedIn 
                ? `Activities completed today` 
                : 'Check-in required to log activities'}
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
          {attendanceStatus?.isCheckedIn ? (
            <ActivityLogger 
              activities={activities} 
              onActivityChange={refreshActivityData} 
            />
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
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <div className="p-2 bg-slate-600 rounded-full">
                    <Ticket className="h-4 w-4 text-white" />
                  </div>
                  Recent Tickets
                </CardTitle>
                <Link href="/service-person/tickets">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 hover:bg-slate-200">
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
                    href={`/service-person/tickets/${ticket.id}/list`}
                    className="block"
                  >
                    <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm line-clamp-1">
                          #{ticket.id} - {ticket.title}
                        </h4>
                        <div className="flex gap-1">
                          <Badge className={`text-xs ${(STATUS_CONFIG[ticket.status] || STATUS_CONFIG.DEFAULT).color}`}>
                            {(STATUS_CONFIG[ticket.status] || STATUS_CONFIG.DEFAULT).label}
                          </Badge>
                          <Badge className={`text-xs ${(PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM).color}`}>
                            {(PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM).label}
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
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <div className="p-2 bg-blue-600 rounded-full">
                    <Bell className="h-4 w-4 text-white" />
                  </div>
                  Recent Notifications
                </CardTitle>
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
          <Card className="shadow-lg border border-gray-200 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Target className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/service-person/tickets" className="block">
                <Button className="w-full justify-start h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                  <Ticket className="h-5 w-5 mr-3" />
                  View My Tickets
                </Button>
              </Link>
              <Link href="/service-person/reports" className="block">
                <Button className="w-full justify-start h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                  <Award className="h-5 w-5 mr-3" />
                  Performance Reports
                </Button>
              </Link>
              <Link href="/service-person/dashboard" className="block">
                <Button variant="outline" className="w-full justify-start h-12 border-gray-300 hover:bg-gray-50 transition-all duration-200">
                  <Activity className="h-5 w-5 mr-3 text-gray-600" />
                  Dashboard Overview
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}