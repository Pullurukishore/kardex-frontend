import { DateRange } from 'react-day-picker';

export interface ReportFilters {
  dateRange: DateRange | undefined;
  zoneId?: string;
  reportType: string;
  customerId?: string;
  assetId?: string;
}

export interface MachineDowntime {
  machineId: string;
  model: string;
  serialNo: string;
  customer: string;
  totalDowntimeMinutes: number;
  incidents: number;
  openIncidents: number;
  resolvedIncidents: number;
}

export interface DetailedDowntime extends MachineDowntime {
  zone: string;
  ticketId: number;
  ticketTitle: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
  downtimeMinutes: number;
  assignedTo: string;
}

export interface ServicePersonReport {
  id: number;
  name: string;
  email: string;
  phone?: string;
  zones: string[];
  summary: {
    totalWorkingDays: number;
    totalHours: number;
    absentDays: number;
    autoCheckouts: number;
    activitiesLogged: number;
    averageHoursPerDay: number;
  };
  flags: Array<{
    type: string;
    count: number;
    message: string;
  }>;
  dayWiseBreakdown: Array<{
    date: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalHours: number;
    attendanceStatus: string;
    activityCount: number;
    flags: Array<{
      type: string;
      message: string;
    }>;
    activities: Array<{
      id: number;
      activityType: string;
      title: string;
      startTime: string;
      endTime: string | null;
      duration: number | null;
      location: string | null;
      ticketId: number | null;
      ticket: any;
    }>;
  }>;
}

export interface ReportData {
  summary: any;
  statusDistribution?: Record<string, number>;
  priorityDistribution?: Record<string, number>;
  dailyTrends?: Array<{
    date: string;
    created: number;
    resolved: number;
  }>;
  ratingDistribution?: Record<number, number>;
  customerRatings?: Record<string, any>;
  zones?: Array<any>;
  agents?: Array<any>;
  breachedTickets?: Array<any>;
  recentFeedbacks?: Array<any>;
  performanceMetrics?: any;
  overallStats?: any;
  machineDowntime?: MachineDowntime[];
  detailedDowntime?: DetailedDowntime[];
  trends?: Array<{
    date: string;
    ticketsCreated: number;
    ticketsResolved: number;
    avgRating: number;
  }>;
  zonePerformance?: Array<{
    name: string;
    efficiency: number;
    ticketCount: number;
    customerCount: number;
  }>;
  kpis?: {
    firstCallResolution: number;
    slaCompliance: number;
    customerRetention: number;
    operationalEfficiency: number;
  };
  // Service Person Reports specific properties
  reports?: ServicePersonReport[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  dateRange?: {
    from: string;
    to: string;
    totalDays: number;
  };
}

export interface ReportType {
  value: string;
  label: string;
  description: string;
  icon: any;
  color: string;
}

export interface Zone {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  companyName: string;
}

export interface Asset {
  id: string;
  name?: string;
}

export const REPORT_TYPES: ReportType[] = [
  { 
    value: 'ticket-summary', 
    label: 'Ticket Analytics Report', 
    description: 'Comprehensive ticket analytics with status, priority trends, and resolution metrics',
    icon: 'BarChart3',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    value: 'customer-satisfaction', 
    label: 'Customer Experience Report', 
    description: 'Customer satisfaction ratings, feedback analysis, and experience metrics',
    icon: 'Star',
    color: 'from-amber-500 to-amber-600'
  },
  { 
    value: 'industrial-data', 
    label: 'Industrial Operations Report', 
    description: 'Equipment downtime, machine performance, and operational efficiency metrics',
    icon: 'Settings',
    color: 'from-green-500 to-green-600'
  },
  { 
    value: 'zone-performance', 
    label: 'Zone Performance Report', 
    description: 'Service zone efficiency, resource utilization, and performance benchmarks',
    icon: 'Target',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    value: 'agent-productivity', 
    label: 'Agent Performance Report', 
    description: 'Individual agent productivity, resolution rates, and performance analytics',
    icon: 'Users',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    value: 'executive-summary',
    label: 'Executive Dashboard Report',
    description: 'High-level KPIs, business metrics, and executive summary analytics',
    icon: 'Award',
    color: 'from-rose-500 to-rose-600'
  },
  {
    value: 'service-person-attendance',
    label: 'Service Person Attendance Report',
    description: 'Comprehensive attendance tracking with date ranges, activity logs, and performance metrics',
    icon: 'UserCheck',
    color: 'from-teal-500 to-teal-600'
  }
];

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

export const PRIORITY_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#7C3AED'
};

export const STATUS_COLORS = {
  OPEN: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  RESOLVED: '#10B981',
  CLOSED: '#6B7280',
  CANCELLED: '#9CA3AF',
  ASSIGNED: '#8B5CF6',
  PENDING: '#F97316'
};
