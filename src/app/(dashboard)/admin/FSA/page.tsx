'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DateRange {
  from: Date;
  to: Date;
}

// Types for FSA report
interface FSAAgent {
  agentId: number;
  agentName: string;
  zoneName: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  avgResponseTime: string;
  avgResolutionTime: string;
  slaCompliance: number;
  rating: number;
}

interface FSASummary {
  totalAgents: number;
  totalTickets: number;
  ticketsResolved: number;
  avgResponseTime: string;
  avgResolutionTime: string;
  slaCompliance: number;
}

interface FSATrend {
  date: string;
  agentId: number;
  resolved: number;
  slaBreaches: number;
}

interface FSAReportResponse {
  summary: FSASummary;
  agents: FSAAgent[];
  trends: FSATrend[];
}

export default function FSAPerformancePage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [zoneId, setZoneId] = useState<string>('');
  const [agentId, setAgentId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<FSAReportResponse | null>(null);

  // Fetch FSA report data
  const fetchFSAReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd'),
        ...(zoneId && { zoneId }),
        ...(agentId && { agentId }),
      });

      const response = await fetch(`/api/reports/fsa?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch FSA report');
      }
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching FSA report:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch FSA report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFSAReport();
  }, [dateRange, zoneId, agentId]);

  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) return 'Select date range';
    return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range && range.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from,
      });
    }
    setShowDatePicker(false);
  };

  const processTrendData = () => {
    if (!reportData) return [];

    const trendMap = new Map<string, { date: string; resolved: number; slaBreaches: number }>();

    reportData.trends.forEach((trend) => {
      const existing = trendMap.get(trend.date) || { date: trend.date, resolved: 0, slaBreaches: 0 };
      trendMap.set(trend.date, {
        date: trend.date,
        resolved: existing.resolved + trend.resolved,
        slaBreaches: existing.slaBreaches + trend.slaBreaches,
      });
    });

    return Array.from(trendMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const trendData = processTrendData();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">FSA Performance Report</h1>
        <Button variant="outline" onClick={fetchFSAReport} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={handleDateRangeSelect}
                    defaultMonth={dateRange.from}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Zone</Label>
              <Input
                placeholder="Filter by zone"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Agent</Label>
              <Input
                placeholder="Filter by agent"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <SummaryCard title="Total Agents" value={reportData.summary.totalAgents} />
          <SummaryCard
            title="Tickets Resolved"
            value={reportData.summary.ticketsResolved}
            subtitle={`out of ${reportData.summary.totalTickets} total tickets`}
          />
          <SummaryCard title="Avg. Resolution Time" value={reportData.summary.avgResolutionTime} />
          <SummaryCard title="SLA Compliance" value={`${reportData.summary.slaCompliance}%`} />
        </div>
      )}

      {/* Charts */}
      {reportData && (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Resolution Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="resolved" name="Resolved Tickets" stroke="#8884d8" />
                  <Line type="monotone" dataKey="slaBreaches" name="SLA Breaches" stroke="#ff7300" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.agents}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="agentName" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ticketsResolved" name="Resolved" fill="#8884d8" />
                  <Bar dataKey="slaCompliance" name="SLA %" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Performance Table */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Resolution Time</TableHead>
                  <TableHead>SLA Compliance</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.agents.map((agent) => (
                  <TableRow key={agent.agentId}>
                    <TableCell className="font-medium">{agent.agentName}</TableCell>
                    <TableCell>{agent.zoneName}</TableCell>
                    <TableCell>{agent.ticketsAssigned}</TableCell>
                    <TableCell>{agent.ticketsResolved}</TableCell>
                    <TableCell>{agent.avgResponseTime}</TableCell>
                    <TableCell>{agent.avgResolutionTime}</TableCell>
                    <TableCell>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            agent.slaCompliance >= 90
                              ? 'bg-green-500'
                              : agent.slaCompliance >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${agent.slaCompliance}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">{agent.slaCompliance}%</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                        <span>{agent.rating.toFixed(1)}</span>
                      </div>
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
}

// Summary Card Component
function SummaryCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// Star Icon
function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
