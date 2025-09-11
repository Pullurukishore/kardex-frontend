'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Star, 
  Download,
  Loader2,
  Calendar as CalendarIcon,
  Filter,
  FileText,
  Building2,
  UserCheck,
  Wrench,
  Settings,
  Target,
  Award,
  Briefcase,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, RadialBarChart, RadialBar, AreaChart, Area, ComposedChart } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import api from '@/lib/api/axios';
import { toast } from 'sonner';

interface ReportFilters {
  dateRange: DateRange | undefined;
  zoneId?: string;
  reportType: string;
  customerId?: string;
  assetId?: string;
}

interface MachineDowntime {
  machineId: string;
  model: string;
  serialNo: string;
  customer: string;
  totalDowntimeMinutes: number;
  incidents: number;
  openIncidents: number;
  resolvedIncidents: number;
}

interface DetailedDowntime extends MachineDowntime {
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

interface ReportData {
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
}

const REPORT_TYPES = [
  { 
    value: 'ticket-summary', 
    label: 'Ticket Analytics Report', 
    description: 'Comprehensive ticket analytics with status, priority trends, and resolution metrics',
    icon: BarChart3,
    color: 'from-blue-500 to-blue-600'
  },
  { 
    value: 'customer-satisfaction', 
    label: 'Customer Experience Report', 
    description: 'Customer satisfaction ratings, feedback analysis, and experience metrics',
    icon: Star,
    color: 'from-amber-500 to-amber-600'
  },
  { 
    value: 'industrial-data', 
    label: 'Industrial Operations Report', 
    description: 'Equipment downtime, machine performance, and operational efficiency metrics',
    icon: Settings,
    color: 'from-green-500 to-green-600'
  },
  { 
    value: 'zone-performance', 
    label: 'Zone Performance Report', 
    description: 'Service zone efficiency, resource utilization, and performance benchmarks',
    icon: Target,
    color: 'from-purple-500 to-purple-600'
  },
  { 
    value: 'agent-productivity', 
    label: 'Agent Performance Report', 
    description: 'Individual agent productivity, resolution rates, and performance analytics',
    icon: Users,
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    value: 'executive-summary',
    label: 'Executive Dashboard Report',
    description: 'High-level KPIs, business metrics, and executive summary analytics',
    icon: Award,
    color: 'from-rose-500 to-rose-600'
  }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];
const PRIORITY_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#7C3AED'
};

const STATUS_COLORS = {
  OPEN: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  RESOLVED: '#10B981',
  CLOSED: '#6B7280',
  CANCELLED: '#9CA3AF',
  ASSIGNED: '#8B5CF6',
  PENDING: '#F97316'
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
    reportType: 'ticket-summary'
  });
  const [zones, setZones] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [quickDateRange, setQuickDateRange] = useState<string>('30d');

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      const startOfDay = new Date(range.from);
      startOfDay.setHours(0, 0, 0, 0);
      
      if (range.to) {
        // If both from and to dates are selected
        const endOfDay = new Date(range.to);
        endOfDay.setHours(23, 59, 59, 999);
        setFilters({ ...filters, dateRange: { from: startOfDay, to: endOfDay } });
      } else {
        // If only the start date is selected (first click)
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);
        // Don't update the filters yet, wait for the second date selection
        setFilters(prev => ({ 
          ...prev, 
          dateRange: { 
            from: startOfDay, 
            to: endOfDay 
          } 
        }));
      }
    } else {
      setFilters(prev => ({ ...prev, dateRange: undefined }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchZones();
    // Fetch customers if the initial report type is industrial-data
    if (filters.reportType === 'industrial-data') {
      fetchCustomers();
    }
  }, []);

  // Watch for report type changes to fetch customers when needed
  useEffect(() => {
    if (filters.reportType === 'industrial-data') {
      fetchCustomers();
    } else {
      // Clear customers and assets when not in industrial-data mode
      setCustomers([]);
      setAssets([]);
      setFilters(prev => ({
        ...prev,
        customerId: undefined,
        assetId: undefined
      }));
    }
  }, [filters.reportType]);

  useEffect(() => {
    if (filters.reportType === 'industrial-data' && filters.customerId) {
      fetchAssets(filters.customerId);
    } else {
      setAssets([]);
      setFilters(prev => ({ ...prev, assetId: undefined }));
    }
  }, [filters.customerId, filters.reportType]);

  const fetchZones = async () => {
    try {
      const response = await api.get('/service-zones?isActive=true');
      if (response.data) {
        setZones(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast.error('Failed to fetch zones');
    }
  };

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers...');
      const response = await api.get('/customers?isActive=true');
      console.log('Customers API response:', response);
      
      if (response && response.data) {
        const customersData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.data || response.data.customers || []);
        
        console.log('Processed customers data:', customersData);
        setCustomers(customersData);
        
        if (customersData.length === 0) {
          console.warn('No customers found in the response');
          toast.warning('No active customers found');
        }
      } else {
        console.warn('Unexpected API response format:', response);
        toast.error('Unexpected response format from server');
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch customers';
      toast.error(errorMessage);
    }
  };

  const fetchAssets = async (customerId: string) => {
    try {
      const response = await api.get(`/assets?customerId=${customerId}&isActive=true`);
      if (response.data) {
        setAssets(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to fetch assets');
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.dateRange?.from) {
        params.append('from', format(filters.dateRange.from, 'yyyy-MM-dd'));
      }
      if (filters.dateRange?.to) {
        params.append('to', format(filters.dateRange.to, 'yyyy-MM-dd'));
      }
      if (filters.zoneId && filters.zoneId !== 'all') {
        params.append('zoneId', filters.zoneId);
      }
      if (filters.customerId) {
        params.append('customerId', filters.customerId);
      }
      if (filters.assetId) {
        params.append('assetId', filters.assetId);
      }
      params.append('reportType', filters.reportType);

      const response = await api.get(`/reports/general?${params.toString()}`);
      setReportData(response.data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Render filter controls
  const renderFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Report Type</label>
        <Select
          value={filters.reportType}
          onValueChange={(value) => setFilters({ 
            ...filters, 
            reportType: value,
            customerId: undefined,
            assetId: undefined 
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Date Range</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, 'MMM d, yyyy')} -{' '}
                    {format(filters.dateRange.to, 'MMM d, yyyy')}
                  </>
                ) : (
                  format(filters.dateRange.from, 'MMM d, yyyy')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange?.from}
              selected={filters.dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
            <div className="p-3 border-t flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(today.getDate() - 30);
                  setFilters({ ...filters, dateRange: { from: thirtyDaysAgo, to: today } });
                }}
              >
                Last 30 Days
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(today.getDate() - 7);
                  setFilters({ ...filters, dateRange: { from: sevenDaysAgo, to: today } });
                }}
              >
                Last 7 Days
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setFilters({ ...filters, dateRange: { from: today, to: today } });
                }}
              >
                Today
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Service Zone</label>
        <Select
          value={filters.zoneId || 'all'}
          onValueChange={(value) => setFilters({ ...filters, zoneId: value === 'all' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {filters.reportType === 'industrial-data' && (
        <>
          <div>
            <label className="text-sm font-medium mb-1 block">Customer</label>
            <Select
              value={filters.customerId || 'all'}
              onValueChange={(value) => setFilters({ 
                ...filters, 
                customerId: value === 'all' ? undefined : value,
                assetId: undefined // Reset asset when customer changes
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Asset</label>
            <Select
              value={filters.assetId || 'all'}
              onValueChange={(value) => setFilters({ ...filters, assetId: value === 'all' ? undefined : value })}
              disabled={!filters.customerId}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  filters.customerId ? 'Select asset' : 'Select a customer first'
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name || `Asset ${asset.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      
      <div className="flex items-end">
        <Button onClick={generateReport} className="w-full" disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Report'
          )}
        </Button>
      </div>
    </div>
  );

  const exportReport = async (formatType: 'csv' | 'pdf') => {
    try {
      setExportLoading(formatType);
      const params = new URLSearchParams();
      
      if (filters.dateRange?.from) {
        params.append('from', format(filters.dateRange.from, 'yyyy-MM-dd'));
      }
      if (filters.dateRange?.to) {
        params.append('to', format(filters.dateRange.to, 'yyyy-MM-dd'));
      }
      if (filters.zoneId && filters.zoneId !== 'all') {
        params.append('zoneId', filters.zoneId);
      }
      if (filters.customerId) {
        params.append('customerId', filters.customerId);
      }
      if (filters.assetId) {
        params.append('assetId', filters.assetId);
      }
      params.append('reportType', filters.reportType);
      params.append('format', formatType);

      const response = await api.get(`/reports/general/export?${params.toString()}`, {
        responseType: 'blob',
        headers: {
          'Accept': formatType === 'pdf' ? 'application/pdf' : 'text/csv'
        },
        timeout: 60000 // 60 second timeout for large reports
      });

      const blob = response.data instanceof Blob 
        ? response.data 
        : new Blob([response.data], { 
            type: response.headers['content-type'] || (formatType === 'pdf' ? 'application/pdf' : 'text/csv')
          });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
      const reportLabel = REPORT_TYPES.find(r => r.value === filters.reportType)?.label || 'Report';
      const filename = `${reportLabel.replace(/\s+/g, '-')}-${timestamp}.${formatType}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`${reportLabel} exported successfully as ${formatType.toUpperCase()}`);
    } catch (error: any) {
      console.error('Error exporting report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to export report';
      toast.error(`Export failed: ${errorMessage}`);
    } finally {
      setExportLoading(null);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const selectedReportType = REPORT_TYPES.find(type => type.value === filters.reportType);

  // Helper function to render different report types
  const renderReportContent = () => {
    if (!reportData) return null;

    switch (filters.reportType) {
      case 'ticket-summary':
        return renderTicketSummary();
      case 'customer-satisfaction':
        return renderCustomerSatisfaction();
      case 'zone-performance':
        return renderZonePerformance();
      case 'agent-productivity':
        return renderAgentProductivity();
      case 'industrial-data':
        return renderIndustrialData();
      case 'executive-summary':
        return renderExecutiveSummary();
      default:
        return null;
    }
  };

  const renderIndustrialData = () => {
    if (!reportData) return null;
    
    return (
      <div className="space-y-6">
        {/* Machine Downtime Summary */}
        {reportData.machineDowntime && reportData.machineDowntime.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Machine Downtime Summary</CardTitle>
              <CardDescription>Overview of machine downtime metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-900">
                      {reportData.summary?.totalMachinesWithDowntime || 0}
                    </div>
                    <div className="text-sm text-blue-700">Total Machines</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-900">
                      {Math.round(reportData.summary?.totalDowntimeHours * 10) / 10 || 0} hrs
                    </div>
                    <div className="text-sm text-green-700">Total Downtime</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-amber-50 to-amber-100">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-amber-900">
                      {Math.floor(reportData.summary?.averageDowntimePerMachine / 60) || 0}h {reportData.summary?.averageDowntimePerMachine % 60 || 0}m
                    </div>
                    <div className="text-sm text-amber-700">Avg. Downtime/Machine</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-900">
                      {Math.floor(Math.min(...reportData.machineDowntime.map((m: any) => m.totalDowntimeMinutes || 0)) / 60) || 0}h {Math.min(...reportData.machineDowntime.map((m: any) => m.totalDowntimeMinutes || 0)) % 60 || 0}m
                    </div>
                    <div className="text-sm text-purple-700">Min. Downtime</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Detailed Downtime Table */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Detailed Downtime</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total Downtime</TableHead>
                        <TableHead>Incidents</TableHead>
                        <TableHead>Open</TableHead>
                        <TableHead>Resolved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.machineDowntime.map((machine: any) => (
                        <TableRow key={machine.machineId}>
                          <TableCell className="font-medium">{machine.machineId}</TableCell>
                          <TableCell>{machine.customer}</TableCell>
                          <TableCell>{(machine.totalDowntimeMinutes / 60).toFixed(1)} hrs</TableCell>
                          <TableCell>{machine.incidents}</TableCell>
                          <TableCell>{machine.openIncidents}</TableCell>
                          <TableCell>{machine.resolvedIncidents}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderTicketSummary = () => (
    <div className="space-y-6">
      {/* Status Distribution */}
      {reportData?.statusDistribution && (
        <Card>
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={Object.entries(reportData.statusDistribution).map(([status, count]) => ({
                      name: status,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(props: any) => `${props.name}: ${props.value}`}
                  >
                    {Object.entries(reportData.statusDistribution).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry[0] as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Status Breakdown</h4>
                {Object.entries(reportData.statusDistribution).map(([status, count], index) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length] }}
                      />
                      <span className="capitalize">{status.toLowerCase().replace(/_/g, ' ')}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Trends */}
      {reportData?.dailyTrends && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Ticket Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={reportData.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#3B82F6" name="Tickets Created" strokeWidth={2} />
                <Line type="monotone" dataKey="resolved" stroke="#10B981" name="Tickets Resolved" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCustomerSatisfaction = () => (
    <div className="space-y-6">
      {/* Rating Distribution */}
      {reportData?.ratingDistribution && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={Object.entries(reportData.ratingDistribution).map(([rating, count]) => ({
                      name: `${rating} Star${rating === '1' ? '' : 's'}`,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(props: any) => `${props.name}: ${props.value}`}
                  >
                    {Object.entries(reportData.ratingDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-600">
                    {reportData.summary?.averageRating?.toFixed(1)}
                  </div>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(reportData.summary?.averageRating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Average rating from {reportData.summary?.totalFeedbacks} feedbacks
                  </p>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(reportData.ratingDistribution).map(([rating, count]) => (
                    <div key={rating} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-8">{rating}★</span>
                        <Progress 
                          value={(count / reportData.summary.totalFeedbacks) * 100} 
                          className="w-32 ml-2 h-2"
                        />
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Feedbacks */}
      {reportData?.recentFeedbacks && reportData.recentFeedbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Customer Feedbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.recentFeedbacks.map((feedback: any) => (
                <div key={feedback.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">Ticket #{feedback.ticketId}</h4>
                      <p className="text-sm text-muted-foreground">{feedback.customer}</p>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < feedback.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {feedback.comment && (
                    <p className="mt-2 text-sm">{feedback.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(feedback.date), 'PPpp')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderZonePerformance = () => (
    <div className="space-y-6">
      {/* Zone Performance Metrics */}
      {reportData?.zones && (
        <Card>
          <CardHeader>
            <CardTitle>Zone Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Total Tickets</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead>Open</TableHead>
                  <TableHead>Resolution Rate</TableHead>
                  <TableHead>Avg. Resolution Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.zones.map((zone: any) => (
                  <TableRow key={zone.zoneId}>
                    <TableCell className="font-medium">{zone.zoneName}</TableCell>
                    <TableCell>{zone.totalTickets}</TableCell>
                    <TableCell>{zone.resolvedTickets}</TableCell>
                    <TableCell>{zone.openTickets}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="w-12">{zone.resolutionRate.toFixed(1)}%</span>
                        <Progress value={zone.resolutionRate} className="w-20 ml-2 h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {zone.averageResolutionTime > 60
                        ? `${Math.floor(zone.averageResolutionTime / 60)}h ${zone.averageResolutionTime % 60}m`
                        : `${zone.averageResolutionTime}m`
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAgentProductivity = () => (
    <div className="space-y-6">
      {/* Agent Performance */}
      {reportData?.agents && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Total Tickets</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead>Resolution Rate</TableHead>
                  <TableHead>Avg. Resolution Time</TableHead>
                  <TableHead>Avg. Response Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.agents.map((agent: any) => (
                  <TableRow key={agent.agentId}>
                    <TableCell className="font-medium">{agent.agentName}</TableCell>
                    <TableCell>{agent.totalTickets}</TableCell>
                    <TableCell>{agent.resolvedTickets}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="w-12">{agent.resolutionRate.toFixed(1)}%</span>
                        <Progress value={agent.resolutionRate} className="w-20 ml-2 h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {agent.averageResolutionTime > 60
                        ? `${Math.floor(agent.averageResolutionTime / 60)}h ${agent.averageResolutionTime % 60}m`
                        : `${agent.averageResolutionTime}m`
                      }
                    </TableCell>
                    <TableCell>
                      {agent.averageFirstResponseTime > 60
                        ? `${Math.floor(agent.averageFirstResponseTime / 60)}h ${agent.averageFirstResponseTime % 60}m`
                        : `${agent.averageFirstResponseTime}m`
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderExecutiveSummary = () => {
    if (!reportData) return null;
    
    return (
      <div className="space-y-8">
        {/* Executive KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Tickets</p>
                  <p className="text-3xl font-bold text-blue-900">{reportData.summary?.totalTickets || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-4">
                <Progress value={(reportData.summary?.resolutionRate || 0)} className="h-2" />
                <p className="text-xs text-blue-600 mt-1">{(reportData.summary?.resolutionRate || 0).toFixed(1)}% Resolution Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Customer Satisfaction</p>
                  <p className="text-3xl font-bold text-green-900">{reportData.summary?.customerSatisfaction || 0}/5</p>
                </div>
                <Star className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4 flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(reportData.summary?.customerSatisfaction || 0)
                        ? 'fill-green-400 text-green-400'
                        : 'text-green-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Avg Resolution Time</p>
                  <p className="text-3xl font-bold text-purple-900">{reportData.summary?.avgResolutionTimeHours || 0}h</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-4">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Target: 4h
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 text-sm font-medium">Active Assets</p>
                  <p className="text-3xl font-bold text-amber-900">{reportData.summary?.activeAssets || 0}</p>
                </div>
                <Settings className="h-8 w-8 text-amber-500" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-amber-600">Across {reportData.summary?.totalCustomers || 0} customers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        {reportData?.trends && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={reportData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="ticketsCreated" fill="#3B82F6" name="Tickets Created" />
                  <Bar yAxisId="left" dataKey="ticketsResolved" fill="#10B981" name="Tickets Resolved" />
                  <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#F59E0B" strokeWidth={3} name="Avg Rating" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Zone Performance Overview */}
        {reportData?.zonePerformance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Zone Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.zonePerformance.slice(0, 6).map((zone: any, index: number) => (
                  <Card key={zone.name} className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{zone.name}</h4>
                        <Badge 
                          variant={zone.efficiency > 80 ? "default" : zone.efficiency > 60 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {zone.efficiency.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Tickets:</span>
                          <span className="font-medium">{zone.ticketCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Customers:</span>
                          <span className="font-medium">{zone.customerCount}</span>
                        </div>
                        <Progress value={zone.efficiency} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Performance Indicators */}
        {reportData?.kpis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Key Performance Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - (reportData.kpis.firstCallResolution || 0) / 100)}`}
                        className="text-blue-500"
                      />
                    </svg>
                    <span className="absolute text-lg font-bold text-blue-600">
                      {reportData.kpis.firstCallResolution}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">First Call Resolution</p>
                </div>

                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - (reportData.kpis.slaCompliance || 0) / 100)}`}
                        className="text-green-500"
                      />
                    </svg>
                    <span className="absolute text-lg font-bold text-green-600">
                      {reportData.kpis.slaCompliance}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">SLA Compliance</p>
                </div>

                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - (reportData.kpis.customerRetention || 0) / 100)}`}
                        className="text-purple-500"
                      />
                    </svg>
                    <span className="absolute text-lg font-bold text-purple-600">
                      {reportData.kpis.customerRetention}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Customer Retention</p>
                </div>

                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - (reportData.kpis.operationalEfficiency || 0) / 100)}`}
                        className="text-amber-500"
                      />
                    </svg>
                    <span className="absolute text-lg font-bold text-amber-600">
                      {reportData.kpis.operationalEfficiency}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Operational Efficiency</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Business Intelligence Reports
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive analytics and detailed reporting across all business metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => exportReport('csv')} 
              variant="outline" 
              disabled={!reportData || exportLoading === 'csv'}
              className="relative"
            >
              {exportLoading === 'csv' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
            <Button 
              onClick={() => exportReport('pdf')} 
              variant="outline" 
              disabled={!reportData || exportLoading === 'pdf'}
              className="relative"
            >
              {exportLoading === 'pdf' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Report Generation Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generate Business Intelligence Report
          </CardTitle>
          <CardDescription>
            Select report type, date range, and filters to generate comprehensive analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderFilters()}
          
          {selectedReportType && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900">{selectedReportType.label}</h4>
              <p className="text-sm text-blue-700 mt-1">{selectedReportType.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(reportData.summary || {}).map(([key, value]: [string, any]) => (
              <Card key={key} className="bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Report Specific Content */}
          {renderReportContent()}
        </div>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-500 mb-4">
              Select your report parameters and click "Generate Report" to view analytics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}