'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Clock,
  MapPin,
  User,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Search,
  Eye,
  Pencil,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  ExternalLink,
  Plus,
  FileText,
  Loader2,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Trash2,
  Map,
  Info,
  Clock3,
  UserCheck,
  UserX,
  Zap
} from 'lucide-react';
import { apiClient } from '@/lib/api/api-client';
import { format, parseISO, startOfDay, endOfDay, subDays, isToday, isYesterday } from 'date-fns';
import Link from 'next/link';

// Types based on backend schema
interface AttendanceRecord {
  id: number;
  userId: number;
  checkInAt: string;
  checkOutAt?: string;
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
    _count: {
      activityLogs: number;
    };
  };
  flags: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  gaps: Array<{
    start: string;
    end: string;
    duration: number;
  }>;
  activityCount: number;
}

interface AttendanceStats {
  totalRecords: number;
  statusBreakdown: Record<string, number>;
  averageHours: number;
  period: string;
}

interface ServicePerson {
  id: number;
  name: string;
  email: string;
  serviceZones: Array<{
    serviceZone: {
      id: number;
      name: string;
    };
  }>;
}

interface ServiceZone {
  id: number;
  name: string;
  description?: string;
}

const STATUS_CONFIG = {
  CHECKED_IN: { label: 'Checked In', color: 'bg-green-100 text-green-800 border-green-200', icon: UserCheck },
  CHECKED_OUT: { label: 'Checked Out', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: UserX },
  AUTO_CHECKED_OUT: { label: 'Auto Checkout', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Zap },
  ABSENT: { label: 'Absent', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  LATE: { label: 'Late', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle },
  EARLY_CHECKOUT: { label: 'Early Checkout', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock3 },
};

const FLAG_CONFIG = {
  LATE: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle, severity: 'warning' },
  EARLY_CHECKOUT: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock3, severity: 'warning' },
  LONG_DAY: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Timer, severity: 'warning' },
  AUTO_CHECKOUT: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Zap, severity: 'info' },
  NO_ACTIVITY: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, severity: 'error' },
  MISSING_CHECKOUT: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, severity: 'error' },
  MULTIPLE_SESSIONS: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Info, severity: 'info' },
  ABSENT: { color: 'bg-red-100 text-red-800 border-red-200', icon: UserX, severity: 'error' },
};

export default function ZoneAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [servicePersons, setServicePersons] = useState<ServicePerson[]>([]);
  const [serviceZones, setServiceZones] = useState<ServiceZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Filters
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'specific'>('today');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    if (dateRange === 'today') {
      return {
        startDate: startOfDay(now).toISOString(),
        endDate: endOfDay(now).toISOString(),
      };
    }
    if (dateRange === 'yesterday') {
      const y = subDays(now, 1);
      return {
        startDate: startOfDay(y).toISOString(),
        endDate: endOfDay(y).toISOString(),
      };
    }
    if (dateRange === 'specific') {
      const d = selectedDate ? new Date(selectedDate) : now;
      return {
        startDate: startOfDay(d).toISOString(),
        endDate: endOfDay(d).toISOString(),
      };
    }
    return {
      startDate: startOfDay(now).toISOString(),
      endDate: endOfDay(now).toISOString(),
    };
  };

  // Fetch attendance data for current zone
  const fetchAttendanceData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const { startDate, endDate } = getDateRange();
      const params: any = {
        startDate,
        endDate,
        page: currentPage,
        limit: 20
      };

      if (selectedUser !== 'all') params.userId = selectedUser;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedActivityType !== 'all') params.activityType = selectedActivityType;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      console.log('🔍 Making zone attendance API calls with params:', params);
      console.log('👤 Current zone user context:', {
        email: user?.email,
        role: user?.role,
        serviceZones: user?.serviceZones?.map((sz: any) => sz.serviceZone?.name)
      });

      // Fetch attendance records, stats, and service persons for current zone
      console.log('🌐 API Endpoints being called:');
      console.log('  - Attendance: /zone/attendance');
      console.log('  - Stats: /zone/attendance/stats');
      console.log('  - Service Persons: /zone/attendance/service-persons');
      console.log('  - Service Zones: /zone/attendance/service-zones');
      
      const [attendanceResponse, statsResponse, servicePersonsResponse, serviceZonesResponse] = await Promise.allSettled([
        apiClient.get('/zone/attendance', { params }),
        apiClient.get('/zone/attendance/stats', { params: { startDate, endDate } }),
        apiClient.get('/zone/attendance/service-persons'),
        apiClient.get('/zone/attendance/service-zones')
      ]);

      console.log('📡 Zone attendance API responses received:', {
        attendance: attendanceResponse.status,
        stats: statsResponse.status,
        servicePersons: servicePersonsResponse.status,
        serviceZones: serviceZonesResponse.status
      });

      // Process attendance records
      if (attendanceResponse.status === 'fulfilled') {
        const response = attendanceResponse.value as any;
        console.log('Raw zone attendance response:', response);
        
        if (response.success && response.data) {
          const data = response.data;
          console.log('Processed zone attendance data:', data);
          
          if (data.attendance && Array.isArray(data.attendance)) {
            setAttendanceRecords(data.attendance);
            setTotalPages(data.pagination?.totalPages || 1);
            console.log('✅ Zone attendance records set successfully:', data.attendance.length);
          } else {
            console.error('❌ No attendance array found in zone response');
            setAttendanceRecords([]);
          }
        } else {
          console.error('❌ Invalid zone attendance response format:', response);
          setAttendanceRecords([]);
        }
      } else {
        console.error('❌ Error fetching zone attendance:', attendanceResponse.reason);
        setAttendanceRecords([]);
      }

      // Process stats
      if (statsResponse.status === 'fulfilled') {
        const response = statsResponse.value as any;
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          setStats(null);
        }
      } else {
        setStats(null);
      }

      // Process service persons
      if (servicePersonsResponse.status === 'fulfilled') {
        const response = servicePersonsResponse.value as any;
        console.log('🔗 Service Persons Response URL:', response.config?.url || 'URL not available');
        console.log('📦 Full Service Persons Response:', response);
        
        if (response.success && response.data) {
          const servicePersonsData = Array.isArray(response.data) ? response.data : [];
          console.log('🧑‍💼 Zone Service Persons received:', servicePersonsData);
          console.log('👤 Current zone user:', user?.email, 'zones:', user?.serviceZones);
          
          // Log each service person's zones for debugging
          servicePersonsData.forEach((person: any) => {
            console.log(`📍 ${person.name || 'No Name'} (${person.email}) zones:`, person.serviceZones?.map((sz: any) => sz.serviceZone?.name));
          });
          
          setServicePersons(servicePersonsData);
        } else {
          console.log('❌ No service persons data in response');
          setServicePersons([]);
        }
      } else {
        console.error('❌ Error fetching service persons:', servicePersonsResponse.reason);
        setServicePersons([]);
      }

      // Process service zones
      if (serviceZonesResponse.status === 'fulfilled') {
        const response = serviceZonesResponse.value as any;
        if (response.success && response.data) {
          setServiceZones(Array.isArray(response.data) ? response.data : []);
        } else {
          setServiceZones([]);
        }
      } else {
        setServiceZones([]);
      }

    } catch (error) {
      console.error('Error fetching zone attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return `Today, ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, 'HH:mm')}`;
    return format(date, 'MMM dd, HH:mm');
  };

  // Export attendance data
  const exportAttendance = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const params: any = { startDate, endDate };
      
      if (selectedUser !== 'all') params.userId = selectedUser;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      
      const response = await apiClient.get('/zone/attendance/export', { 
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `zone-attendance-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Success",
        description: "Zone attendance data exported successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export attendance data.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [dateRange, selectedDate, selectedUser, selectedStatus, selectedActivityType, currentPage]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (currentPage === 1) {
        fetchAttendanceData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

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
          <h1 className="text-3xl font-bold text-gray-900">Zone Attendance Management</h1>
          <p className="text-gray-600 mt-1">Monitor attendance records for service persons in your zone (showing only active check-ins)</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => fetchAttendanceData(true)} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportAttendance} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
              <p className="text-xs text-muted-foreground">
                {dateRange === 'today' ? 'Today' : `Last ${dateRange}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked In</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.statusBreakdown.CHECKED_IN || 0}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">Per person</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {(stats.statusBreakdown.LATE || 0) + (stats.statusBreakdown.ABSENT || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as 'today' | 'yesterday' | 'specific')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="specific">Specific Date</SelectItem>
                </SelectContent>
              </Select>
              {dateRange === 'specific' && (
                <div className="mt-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Person</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80 overflow-auto">
                  <SelectItem value="all">All Service Persons</SelectItem>
                  {servicePersons.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name || person.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="AUTO_CHECKED_OUT">Auto Checked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Type</label>
              <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="TICKET_WORK">Ticket Work</SelectItem>
                  <SelectItem value="TRAVEL">Travel</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="TRAINING">Training</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Zone Attendance Records
              </CardTitle>
              <CardDescription>
                Attendance records for service persons in your zone
              </CardDescription>
            </div>
            <Badge variant="outline">
              {attendanceRecords.length} records
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Records Found</h3>
              <p className="text-gray-500">No attendance records match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-900">User Name</th>
                    <th className="text-left p-3 font-medium text-gray-900">Date</th>
                    <th className="text-left p-3 font-medium text-gray-900">Check-In Time</th>
                    <th className="text-left p-3 font-medium text-gray-900">Check-Out Time</th>
                    <th className="text-left p-3 font-medium text-gray-900">Total Hours</th>
                    <th className="text-left p-3 font-medium text-gray-900">Status</th>
                    <th className="text-left p-3 font-medium text-gray-900">Activity Count</th>
                    <th className="text-left p-3 font-medium text-gray-900">Issues / Flags</th>
                    <th className="text-left p-3 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => {
                    const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.CHECKED_OUT;
                    const StatusIcon = statusConfig.icon;
                    const isAutoCheckout = record.notes?.includes('Auto-checkout');
                    
                    return (
                      <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                        {/* User Name */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900">
                              {record.user.name || record.user.email}
                            </div>
                            {record.user.serviceZones.length > 0 && (
                              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {record.user.serviceZones.map(sz => sz.serviceZone.name).join(', ')}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Date */}
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {record.checkInAt ? format(parseISO(record.checkInAt), 'MMM dd, yyyy') : format(new Date(), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        
                        {/* Check-In Time */}
                        <td className="p-3">
                          {record.checkInAt ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3 text-green-600" />
                                {format(parseISO(record.checkInAt), 'HH:mm')}
                              </div>
                              {record.checkInLatitude && record.checkInLongitude && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => window.open(`https://maps.google.com/?q=${record.checkInLatitude},${record.checkInLongitude}`, '_blank')}
                                >
                                  <Map className="h-3 w-3 text-blue-600" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No check-in</span>
                          )}
                          {record.checkInAddress && (
                            <div className="text-xs text-gray-500 mt-1 max-w-32 truncate">
                              {record.checkInAddress}
                            </div>
                          )}
                        </td>
                        
                        {/* Check-Out Time */}
                        <td className="p-3">
                          {record.checkOutAt ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className={`h-3 w-3 ${isAutoCheckout ? 'text-purple-600' : 'text-red-600'}`} />
                                {format(parseISO(record.checkOutAt), 'HH:mm')}
                                {isAutoCheckout && (
                                  <Zap className="h-3 w-3 text-purple-600" />
                                )}
                              </div>
                              {record.checkOutLatitude && record.checkOutLongitude && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => window.open(`https://maps.google.com/?q=${record.checkOutLatitude},${record.checkOutLongitude}`, '_blank')}
                                >
                                  <Map className="h-3 w-3 text-blue-600" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                          {record.checkOutAddress && (
                            <div className="text-xs text-gray-500 mt-1 max-w-32 truncate">
                              {record.checkOutAddress}
                            </div>
                          )}
                        </td>
                        
                        {/* Total Hours */}
                        <td className="p-3">
                          {record.totalHours ? (
                            <div className={`flex items-center gap-1 text-sm font-medium ${
                              Number(record.totalHours) > 12 ? 'text-purple-600' : 
                              Number(record.totalHours) < 4 ? 'text-orange-600' : 'text-gray-900'
                            }`}>
                              <Timer className="h-3 w-3" />
                              {Number(record.totalHours).toFixed(1)}h
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* Status */}
                        <td className="p-3">
                          <Badge className={`${statusConfig.color} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        
                        {/* Activity Count */}
                        <td className="p-3">
                          <div className={`flex items-center gap-1 text-sm font-medium ${
                            record.activityCount === 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            <Activity className="h-3 w-3" />
                            {record.activityCount}
                          </div>
                        </td>
                        
                        {/* Issues / Flags */}
                        <td className="p-3">
                          {record.flags.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-40">
                              {record.flags.slice(0, 2).map((flag, index) => {
                                const flagConfig = FLAG_CONFIG[flag.type as keyof typeof FLAG_CONFIG];
                                const FlagIcon = flagConfig?.icon || AlertTriangle;
                                return (
                                  <Badge 
                                    key={index} 
                                    variant="outline" 
                                    className={`text-xs ${flagConfig?.color || 'bg-gray-100 text-gray-800'} border`}
                                    title={flag.message}
                                  >
                                    <FlagIcon className="h-2 w-2 mr-1" />
                                    {flag.message.length > 10 ? flag.message.substring(0, 10) + '...' : flag.message}
                                  </Badge>
                                );
                              })}
                              {record.flags.length > 2 && (
                                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                                  +{record.flags.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* Actions */}
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Link href={`/zone/attendence/${record.id}/view`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}