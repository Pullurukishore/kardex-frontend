import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import type { ReportData } from './types';

interface HERAnalysisReportProps {
  reportData: ReportData;
}

export function HERAnalysisReport({ reportData }: HERAnalysisReportProps) {
  const herData = reportData.herAnalysis;
  
  if (!herData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">No HER analysis data available.</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, tickets, priorityBreakdown } = herData;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (isBreached: boolean) => {
    return isBreached ? 'text-red-600' : 'text-green-600';
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              Analyzed for HER compliance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HER Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.herCompliantTickets}</div>
            <p className="text-xs text-muted-foreground">
              Within expected resolution time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HER Breached</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.herBreachedTickets}</div>
            <p className="text-xs text-muted-foreground">
              Exceeded expected resolution time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.complianceRate}%</div>
            <Progress value={summary.complianceRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Business Hours Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours Configuration
          </CardTitle>
          <CardDescription>
            HER calculations are based on business hours only
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Working Hours</h4>
              <p className="text-sm text-gray-600">9:00 AM - 5:30 PM</p>
              <p className="text-xs text-gray-500">8.5 hours per day</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Working Days</h4>
              <p className="text-sm text-gray-600">Monday - Saturday</p>
              <p className="text-xs text-gray-500">Sundays excluded</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">SLA by Priority</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-red-600">Critical:</span>
                  <span>4 hours</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-orange-600">High:</span>
                  <span>8 hours</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-600">Medium:</span>
                  <span>24 hours</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">Low:</span>
                  <span>48 hours</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>HER Compliance by Priority</CardTitle>
          <CardDescription>
            Breakdown of compliance rates across different priority levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(priorityBreakdown).map(([priority, data]) => (
              <div key={priority} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`${getPriorityColor(priority)} text-white`}>
                    {priority}
                  </Badge>
                  <span className="text-sm font-medium">{data.complianceRate.toFixed(1)}%</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{data.total}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Compliant:</span>
                    <span>{data.compliant}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Breached:</span>
                    <span>{data.breached}</span>
                  </div>
                </div>
                <Progress value={data.complianceRate} className="mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Average Resolution Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Average HER Hours</CardTitle>
            <CardDescription>Expected resolution time based on priority</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatHours(summary.averageHerHours)}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Average expected resolution time across all tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Actual Hours</CardTitle>
            <CardDescription>Actual resolution time for resolved tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatHours(summary.averageActualHours)}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Average actual resolution time (business hours only)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Ticket List */}
      <Card>
        <CardHeader>
          <CardTitle>HER Analysis Details</CardTitle>
          <CardDescription>
            Detailed breakdown of all tickets with HER compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Ticket ID</th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Priority</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">HER Hours</th>
                  <th className="text-left p-2">Actual Hours</th>
                  <th className="text-left p-2">Compliance</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">#{ticket.id}</td>
                    <td className="p-2 max-w-xs truncate" title={ticket.title}>
                      {ticket.title}
                    </td>
                    <td className="p-2">
                      <Badge className={`${getPriorityColor(ticket.priority)} text-white text-xs`}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="p-2">{formatHours(ticket.herHours)}</td>
                    <td className="p-2">
                      {ticket.actualResolutionHours 
                        ? formatHours(ticket.actualResolutionHours)
                        : formatHours(ticket.businessHoursUsed) + ' (ongoing)'
                      }
                    </td>
                    <td className="p-2">
                      <div className={`flex items-center gap-1 ${getStatusColor(ticket.isHerBreached)}`}>
                        {ticket.isHerBreached ? (
                          <>
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs">Breached</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Compliant</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-2 max-w-xs truncate" title={ticket.customer}>
                      {ticket.customer}
                    </td>
                    <td className="p-2 max-w-xs truncate" title={ticket.assignedTo}>
                      {ticket.assignedTo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
