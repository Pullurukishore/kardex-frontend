'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Calendar,
  Activity,
  Timer,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  UserCheck,
  UserX,
  Clock3,
  Info,
  FileText,
  Loader2,
  Map,
  Building2,
  Phone,
  Mail,
  Navigation,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { apiClient } from '@/lib/api/api-client';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import Link from 'next/link';

// Types based on backend schema
interface AttendanceDetail {
  id: string | number;
  userId: number;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInAddress?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutAddress?: string;
  totalHours?: number;
  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'ABSENT' | 'LATE' | 'EARLY_CHECKOUT' | 'AUTO_CHECKED_OUT';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    serviceZones: Array<{
      serviceZone: {
        id: number;
        name: string;
      };
    }>;
    activityLogs: Array<{
      id: number;
      activityType: 'TICKET_WORK' | 'TRAVEL' | 'MEETING' | 'TRAINING' | 'OTHER';
      title: string;
      description?: string;
      startTime: string;
      endTime?: string;
      duration?: number;
      location?: string;
      latitude?: number;
      longitude?: number;
      ticket?: {
        id: number;
        title: string;
        status: string;
        customer: {
          companyName: string;
        };
      };
    }>;
  };
  gaps: Array<{
    start: string;
    end: string;
    duration: number;
  }>;
}

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  performedById: number;
  updatedAt: string;
  details: any;
}

interface AttendanceDetailViewProps {
  attendanceId: string;
  apiEndpoint: string;
  backUrl: string;
  pageTitle: string;
  pageSubtitle?: string;
}

const STATUS_CONFIG = {
  CHECKED_IN: { label: 'Checked In', color: 'bg-green-100 text-green-800 border-green-200', icon: UserCheck },
  CHECKED_OUT: { label: 'Checked Out', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: UserX },
  AUTO_CHECKED_OUT: { label: 'Auto Checkout', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Zap },
  ABSENT: { label: 'Absent', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  LATE: { label: 'Late', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle },
  EARLY_CHECKOUT: { label: 'Early Checkout', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock3 },
};

const ACTIVITY_TYPE_CONFIG = {
  TICKET_WORK: { label: 'Ticket Work', color: 'bg-blue-100 text-blue-800', icon: FileText },
  TRAVEL: { label: 'Travel', color: 'bg-green-100 text-green-800', icon: Navigation },
  MEETING: { label: 'Meeting', color: 'bg-purple-100 text-purple-800', icon: User },
  TRAINING: { label: 'Training', color: 'bg-yellow-100 text-yellow-800', icon: BarChart3 },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-800', icon: Activity },
};

export default function AttendanceDetailView({
  attendanceId,
  apiEndpoint,
  backUrl,
  pageTitle,
  pageSubtitle
}: AttendanceDetailViewProps) {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch attendance details
  const fetchAttendanceDetail = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(apiEndpoint);
      console.log('[Attendance View] Raw detail response:', response);
      // Some api clients return response.data, others return the data directly via an interceptor
      // Normalize to a single `detail` object
      const payloadLevel1 = (response && typeof response === 'object' && 'data' in (response as any)) ? (response as any).data : response;
      const detail = payloadLevel1?.success && payloadLevel1?.data
        ? payloadLevel1.data
        : (payloadLevel1?.data ?? payloadLevel1);
      console.log('[Attendance View] Parsed detail:', detail);
      if (detail && (detail.id !== undefined)) {
        setAttendance(detail as any);
      } else {
        throw new Error('No attendance data received');
      }
    } catch (error) {
      console.error('Error fetching attendance detail:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(parseISO(dateString), 'MMM dd, yyyy');
  };

  // Format time for display
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(parseISO(dateString), 'HH:mm');
  };

  useEffect(() => {
    if (attendanceId) {
      fetchAttendanceDetail();
    }
  }, [attendanceId, apiEndpoint]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Record Not Found</h3>
          <p className="text-gray-500 mb-4">The requested attendance record could not be found.</p>
          <Link href={backUrl}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Attendance
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[attendance.status] || STATUS_CONFIG.CHECKED_OUT;
  const StatusIcon = statusConfig.icon;
  const isAutoCheckout = attendance.notes?.includes('Auto-checkout');
  const activities = attendance.user.activityLogs || [];
  const gaps = attendance.gaps || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backUrl}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Attendance
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-gray-600 mt-1">
              {pageSubtitle || `${attendance.user.name || attendance.user.email} - ${formatDate(attendance.checkInAt)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${statusConfig.color} border`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {statusConfig.label}
          </Badge>
          {isAutoCheckout && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
              <Zap className="h-3 w-3 mr-1" />
              Auto Checkout
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Check-In Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Check-In Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attendance.checkInAt ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Time:</span>
                      <span className="text-sm font-mono">{formatTime(attendance.checkInAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Date:</span>
                      <span className="text-sm">{formatDate(attendance.checkInAt)}</span>
                    </div>
                    {attendance.checkInAddress && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-600">Location:</span>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{attendance.checkInAddress}</p>
                            {attendance.checkInLatitude && attendance.checkInLongitude && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-blue-600"
                                onClick={() => window.open(`https://maps.google.com/?q=${attendance.checkInLatitude},${attendance.checkInLongitude}`, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View on Maps
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                    <p className="text-sm text-gray-500">No check-in recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Check-Out Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  Check-Out Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attendance.checkOutAt ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Time:</span>
                      <span className="text-sm font-mono">{formatTime(attendance.checkOutAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Type:</span>
                      <span className="text-sm">
                        {isAutoCheckout ? 'Automatic' : 'Manual'}
                        {isAutoCheckout && <Zap className="h-3 w-3 ml-1 inline text-purple-600" />}
                      </span>
                    </div>
                    {attendance.checkOutAddress && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-600">Location:</span>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{attendance.checkOutAddress}</p>
                            {attendance.checkOutLatitude && attendance.checkOutLongitude && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-blue-600"
                                onClick={() => window.open(`https://maps.google.com/?q=${attendance.checkOutLatitude},${attendance.checkOutLongitude}`, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View on Maps
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                    <p className="text-sm text-gray-500">Still checked in</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Timer className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {attendance.totalHours ? `${Number(attendance.totalHours).toFixed(1)}h` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Activities</p>
                    <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gaps</p>
                    <p className="text-2xl font-bold text-gray-900">{gaps.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Zone</p>
                    <p className="text-sm font-bold text-gray-900">
                      {attendance.user.serviceZones.length > 0 
                        ? attendance.user.serviceZones.map(sz => sz.serviceZone.name).join(', ')
                        : 'No Zone'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes & Comments */}
          {attendance.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes & Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{attendance.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          {activities.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Activities Recorded</h3>
                <p className="text-gray-500">No activities were logged for this attendance session.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activities.map((activity, index) => {
                const activityConfig = ACTIVITY_TYPE_CONFIG[activity.activityType] || ACTIVITY_TYPE_CONFIG.OTHER;
                const ActivityIcon = activityConfig.icon;
                
                return (
                  <Card key={activity.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${activityConfig.color}`}>
                          <ActivityIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                              <Badge variant="outline" className={`mt-1 ${activityConfig.color}`}>
                                {activityConfig.label}
                              </Badge>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(activity.startTime)}
                                {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                              </div>
                              {activity.duration && (
                                <div className="mt-1">
                                  Duration: {formatDuration(activity.duration)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {activity.description && (
                            <p className="text-sm text-gray-600">{activity.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {activity.location && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <MapPin className="h-3 w-3" />
                                  <span>{activity.location}</span>
                                  {activity.latitude && activity.longitude && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0 ml-1 text-blue-600"
                                      onClick={() => window.open(`https://maps.google.com/?q=${activity.latitude},${activity.longitude}`, '_blank')}
                                    >
                                      <Map className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {activity.ticket && (
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  Ticket #{activity.ticket.id}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {activity.ticket.customer.companyName}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Daily Timeline
              </CardTitle>
              <CardDescription>
                Chronological view of check-in, activities, gaps, and check-out
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Check-in Event */}
                {attendance.checkInAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="w-0.5 h-8 bg-gray-200"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Check-in</span>
                        <span className="text-sm text-gray-500">{formatTime(attendance.checkInAt)}</span>
                      </div>
                      {attendance.checkInAddress && (
                        <p className="text-sm text-gray-600 mt-1">{attendance.checkInAddress}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Activities and Gaps */}
                {activities.map((activity, index) => (
                  <div key={activity.id}>
                    {/* Gap before activity */}
                    {index > 0 && gaps[index - 1] && (
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <div className="w-0.5 h-8 bg-gray-200"></div>
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-700">Activity Gap</span>
                            <span className="text-sm text-gray-500">
                              {gaps[index - 1].duration} minutes
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            No activity recorded between {formatTime(gaps[index - 1].start)} and {formatTime(gaps[index - 1].end)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Activity */}
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {index < activities.length - 1 && <div className="w-0.5 h-8 bg-gray-200"></div>}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{activity.title}</span>
                          <span className="text-sm text-gray-500">
                            {formatTime(activity.startTime)}
                            {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        )}
                        {activity.location && (
                          <p className="text-sm text-gray-500 mt-1">📍 {activity.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Check-out Event */}
                {attendance.checkOutAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-red-600" />
                        <span className="font-medium">Check-out</span>
                        <span className="text-sm text-gray-500">{formatTime(attendance.checkOutAt)}</span>
                        {isAutoCheckout && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                            <Zap className="h-3 w-3 mr-1" />
                            Auto
                          </Badge>
                        )}
                      </div>
                      {attendance.checkOutAddress && (
                        <p className="text-sm text-gray-600 mt-1">{attendance.checkOutAddress}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Trail
              </CardTitle>
              <CardDescription>
                Complete history of attendance actions and modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Info className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Audit logs feature coming soon</p>
                <p className="text-xs text-gray-400 mt-1">
                  This will show all check-in/out actions, admin modifications, and system events
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
