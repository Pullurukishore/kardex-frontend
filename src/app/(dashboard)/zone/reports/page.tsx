'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/api/axios';
import { 
  BarChart3,
  Download,
  RefreshCw,
  Calendar as CalendarIcon,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, ComposedChart } from 'recharts';

interface ReportFilters {
  dateRange: DateRange | undefined;
  reportType: string;
  customerId?: string;
  assetId?: string;
}

interface ReportData {
  summary?: any;
  statusDistribution?: Record<string, number>;
  priorityDistribution?: Record<string, number>;
  dailyTrends?: Array<{ date: string; created: number; resolved: number }>;
  ratingDistribution?: Record<number, number>;
  recentFeedbacks?: Array<any>;
  zones?: Array<any>;
  agents?: Array<any>;
  machineDowntime?: Array<any>;
  detailedDowntime?: Array<any>;
  trends?: Array<{ date: string; ticketsCreated: number; ticketsResolved: number; avgRating: number }>;
  zonePerformance?: Array<any>;
  kpis?: {
    firstCallResolution: number;
    slaCompliance: number;
    customerRetention: number;
    operationalEfficiency: number;
  };
}

const REPORT_TYPES = [
  { value: 'ticket-summary', label: 'Ticket Analytics' },
  { value: 'customer-satisfaction', label: 'Customer Experience' },
  { value: 'industrial-data', label: 'Industrial Operations' },
  { value: 'zone-performance', label: 'Zone Performance' },
  { value: 'agent-productivity', label: 'Agent Performance' },
  { value: 'executive-summary', label: 'Executive Summary' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  RESOLVED: '#10B981',
  CLOSED: '#6B7280',
  CANCELLED: '#9CA3AF',
  ASSIGNED: '#8B5CF6',
  PENDING: '#F97316',
};

export default function ZoneReportsPage() {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    reportType: 'ticket-summary',
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    if (filters.reportType === 'industrial-data') {
      fetchCustomers();
    } else {
      setCustomers([]);
      setAssets([]);
      setFilters(prev => ({ ...prev, customerId: undefined, assetId: undefined }));
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

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers?isActive=true');
      setCustomers(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch customers');
    }
  };

  const fetchAssets = async (customerId: string) => {
    try {
      const res = await api.get(`/assets?customerId=${customerId}&isActive=true`);
      setAssets(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch assets');
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      const startOfDay = new Date(range.from);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(range.to || range.from);
      endOfDay.setHours(23, 59, 59, 999);
      setFilters(prev => ({ ...prev, dateRange: { from: startOfDay, to: endOfDay } }));
    } else {
      setFilters(prev => ({ ...prev, dateRange: undefined }));
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.dateRange?.from) params.append('from', format(filters.dateRange.from, 'yyyy-MM-dd'));
      if (filters.dateRange?.to) params.append('to', format(filters.dateRange.to, 'yyyy-MM-dd'));
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.assetId) params.append('assetId', filters.assetId);
      params.append('reportType', filters.reportType);

      const res = await api.get(`/reports/zone?${params.toString()}`);
      setReportData(res.data);
      toast.success('Report generated');
    } catch (e) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (formatType: 'csv' | 'pdf') => {
    try {
      setExportLoading(formatType);
      const params = new URLSearchParams();
      if (filters.dateRange?.from) params.append('from', format(filters.dateRange.from, 'yyyy-MM-dd'));
      if (filters.dateRange?.to) params.append('to', format(filters.dateRange.to, 'yyyy-MM-dd'));
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.assetId) params.append('assetId', filters.assetId);
      params.append('reportType', filters.reportType);
      params.append('format', formatType);

      const response = await api.get(`/reports/zone/export?${params.toString()}` , {
        responseType: 'blob',
        headers: { 'Accept': formatType === 'pdf' ? 'application/pdf' : 'text/csv' },
        timeout: 60000,
      });

      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: response.headers['content-type'] || (formatType === 'pdf' ? 'application/pdf' : 'text/csv') });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      const ts = format(new Date(), 'yyyy-MM-dd-HHmm');
      const reportLabel = REPORT_TYPES.find(r => r.value === filters.reportType)?.label || 'Report';
      link.setAttribute('download', `${reportLabel.replace(/\s+/g, '-')}-${ts}.${formatType}`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      toast.success(`${reportLabel} exported as ${formatType.toUpperCase()}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Export failed');
    } finally {
      setExportLoading(null);
    }
  };

  const renderTicketSummary = () => (
    <div className="space-y-6">
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
                    data={Object.entries(reportData.statusDistribution).map(([status, count]) => ({ name: status, value: count }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(props: any) => `${props.name}: ${props.value}`}
                  >
                    {Object.entries(reportData.statusDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry[0]] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      {reportData?.dailyTrends && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Ticket Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
      {reportData?.ratingDistribution && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={Object.entries(reportData.ratingDistribution).map(([rating, count]) => ({ name: `${rating} Star${rating === '1' ? '' : 's'}`, value: count }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(reportData.ratingDistribution).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderZonePerformance = () => (
    <div className="space-y-6">
      {reportData?.zones && (
        <Card>
          <CardHeader>
            <CardTitle>Zone Performance</CardTitle>
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
                        <span className="w-12">{Number(zone.resolutionRate || 0).toFixed(1)}%</span>
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
      {reportData?.agents && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
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
                        <span className="w-12">{Number(agent.resolutionRate || 0).toFixed(1)}%</span>
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

  const renderExecutiveSummary = () => (
    <div className="space-y-6">
      {reportData?.trends && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends (Last 7 Days)</CardTitle>
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
    </div>
  );

  const renderIndustrialData = () => (
    <div className="space-y-6">
      {reportData?.machineDowntime && reportData.machineDowntime.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Machine Downtime Summary</CardTitle>
            <CardDescription>Overview of machine downtime metrics</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Zone Reports
            </h1>
            <p className="text-muted-foreground mt-2">Generate and export reports for your assigned zone(s)</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => exportReport('csv')} variant="outline" disabled={!reportData || exportLoading === 'csv'} className="relative">
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
            <Button onClick={() => exportReport('pdf')} variant="outline" disabled={!reportData || exportLoading === 'pdf'} className="relative">
              {exportLoading === 'pdf' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generate Zone Report
          </CardTitle>
          <CardDescription>Select report type and date range. Optional: filter by customer/asset for Industrial Operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Report Type</label>
              <Select value={filters.reportType} onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value, customerId: undefined, assetId: undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, 'MMM d, yyyy')} - {format(filters.dateRange.to, 'MMM d, yyyy')}
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
                    <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, dateRange: { from: subDays(new Date(), 30), to: new Date() } }))}>Last 30 Days</Button>
                    <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, dateRange: { from: subDays(new Date(), 7), to: new Date() } }))}>Last 7 Days</Button>
                    <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, dateRange: { from: new Date(), to: new Date() } }))}>Today</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {filters.reportType === 'industrial-data' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Customer</label>
                  <Select value={filters.customerId || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value === 'all' ? undefined : value, assetId: undefined }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Asset</label>
                  <Select value={filters.assetId || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, assetId: value === 'all' ? undefined : value }))} disabled={!filters.customerId}>
                    <SelectTrigger>
                      <SelectValue placeholder={filters.customerId ? 'Select asset' : 'Select a customer first'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assets</SelectItem>
                      {assets.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name || `Asset ${a.id}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={generateReport} className="w-full" disabled={loading}>
                {loading ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Generating...</>) : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData ? (
        <div className="space-y-6">
          {reportData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <Card key={key} className="bg-gradient-to-r from-white to-gray-50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : String(value)}</div>
                    <div className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {renderReportContent()}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-500 mb-4">Select parameters and click "Generate Report"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
