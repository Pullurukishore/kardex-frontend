// Server-side component - charts replaced with static summaries

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportData } from './types';

interface TicketSummaryReportProps {
  reportData: ReportData;
}

export function TicketSummaryReport({ reportData }: TicketSummaryReportProps) {
  console.log('TicketSummaryReport received data:', reportData);
  
  const { 
    statusDistribution, 
    priorityDistribution, 
    slaDistribution,
    zoneDistribution,
    customerDistribution,
    assigneeDistribution,
    customerPerformanceMetrics,
    dailyTrends, 
    summary,
    recentTickets,
    insights
  } = reportData;

  console.log('Extracted summary:', summary);
  console.log('Extracted statusDistribution:', statusDistribution);

  if (!summary || !statusDistribution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ticket Summary Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No ticket data available for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  // Use the processed data from the server
  const statusCounts = statusDistribution || {};
  const priorityCounts = priorityDistribution || {};
  const slaCounts = slaDistribution || {};
  const totalTickets = summary.totalTickets || 0;

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'OPEN': 'bg-blue-500',
      'IN_PROGRESS': 'bg-yellow-500',
      'ASSIGNED': 'bg-purple-500',
      'RESOLVED': 'bg-green-500',
      'CLOSED': 'bg-gray-500',
      'ESCALATED': 'bg-red-500',
      'PENDING': 'bg-orange-500'
    };
    return colors[status] || 'bg-gray-400';
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'LOW': 'bg-green-500',
      'MEDIUM': 'bg-yellow-500',
      'HIGH': 'bg-orange-500',
      'CRITICAL': 'bg-red-500'
    };
    return colors[priority] || 'bg-gray-400';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Performance Metrics */}
      <Card className="card-mobile">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Key Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{summary.totalTickets || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Tickets</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{summary.resolvedTickets || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Resolved</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-50">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{summary.inProgressTickets || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">In Progress</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{summary.escalatedTickets || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Escalated</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-purple-50">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{summary.resolutionRate || 0}%</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Resolution Rate</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-indigo-50">
              <div className="text-xl sm:text-2xl font-bold text-indigo-600">{summary.averageResolutionTimeHours || 0}h</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Avg Resolution</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Time-based Metrics */}
        <Card className="card-mobile">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Time-based Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Average Resolution Time</span>
              <div className="text-right">
                <div className="font-bold">{summary.averageResolutionTimeHours || 0} hours</div>
                <div className="text-sm text-muted-foreground">{summary.averageResolutionTime || 0} minutes</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Average First Response</span>
              <div className="text-right">
                <div className="font-bold">{summary.averageFirstResponseTimeHours || 0} hours</div>
                <div className="text-sm text-muted-foreground">{summary.averageFirstResponseTime || 0} minutes</div>
              </div>
            </div>
            {summary.avgOnsiteTravelTime > 0 && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Average Onsite Travel Time</span>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{summary.avgOnsiteTravelTimeHours || 0} hours</div>
                  <div className="text-sm text-muted-foreground">{summary.avgOnsiteTravelTime || 0} minutes</div>
                  <div className="text-xs text-blue-600">{summary.totalOnsiteVisits || 0} visits tracked</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority & SLA Metrics */}
        <Card className="card-mobile">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Priority & SLA Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="font-medium">Critical Tickets</span>
              <span className="font-bold text-red-600">{summary.criticalTickets || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="font-medium">High Priority</span>
              <span className="font-bold text-orange-600">{summary.highPriorityTickets || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium">Overdue Tickets</span>
              <span className="font-bold text-yellow-600">{summary.overdueTickets || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Unassigned</span>
              <span className="font-bold text-gray-600">{summary.unassignedTickets || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Satisfaction */}
      {summary.averageCustomerRating > 0 && (
        <Card className="card-mobile">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.averageCustomerRating}/5</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.totalRatings || 0}</div>
                <div className="text-sm text-muted-foreground">Total Ratings</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{summary.ticketsWithFeedback || 0}</div>
                <div className="text-sm text-muted-foreground">With Feedback</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Performance & Machine Health Analysis */}
      {customerPerformanceMetrics && customerPerformanceMetrics.length > 0 && (
        <Card className="card-mobile">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Customer Performance & Machine Health Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">More tickets indicate potential machine issues</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerPerformanceMetrics.slice(0, 10).map((customer) => {
                const getRiskColor = (riskLevel: string) => {
                  switch (riskLevel) {
                    case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
                    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                    case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
                    default: return 'bg-gray-100 text-gray-800 border-gray-200';
                  }
                };

                const getHealthScoreColor = (score: number) => {
                  if (score >= 75) return 'text-green-600';
                  if (score >= 50) return 'text-yellow-600';
                  return 'text-red-600';
                };

                return (
                  <div key={customer.customerId} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{customer.customerName}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getRiskColor(customer.riskLevel)}`}>
                            {customer.riskLevel} RISK
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Health Score: <span className={`font-bold ${getHealthScoreColor(customer.machineHealthScore)}`}>
                              {customer.machineHealthScore}/100
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{customer.totalTickets}</div>
                        <div className="text-xs text-muted-foreground">Total Tickets</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="font-bold text-red-600">{customer.criticalIssues}</div>
                        <div className="text-xs text-muted-foreground">Critical</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="font-bold text-orange-600">{customer.highPriorityIssues}</div>
                        <div className="text-xs text-muted-foreground">High Priority</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="font-bold text-yellow-600">{customer.escalatedIssues}</div>
                        <div className="text-xs text-muted-foreground">Escalated</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-bold text-purple-600">{customer.repeatIssues}</div>
                        <div className="text-xs text-muted-foreground">Repeat Issues</div>
                      </div>
                    </div>
                    
                    {customer.avgResolutionTimeHours > 0 && (
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Avg Resolution Time</span>
                        <span className="text-sm font-bold">
                          {customer.avgResolutionTimeHours}h {customer.avgResolutionTimeMinutes % 60}m
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Distribution */}
      <Card className="card-mobile">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            const percentage = totalTickets > 0 ? ((count / totalTickets) * 100).toFixed(1) : '0';
            return (
              <div key={status} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(status)} flex-shrink-0`}></div>
                  <span className="font-medium capitalize">{status.replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{count}</div>
                  <div className="text-sm text-muted-foreground">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card className="card-mobile">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {Object.entries(priorityCounts).map(([priority, count]) => {
            const percentage = totalTickets > 0 ? ((count / totalTickets) * 100).toFixed(1) : '0';
            return (
              <div key={priority} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getPriorityColor(priority)} flex-shrink-0`}></div>
                  <span className="font-medium capitalize">{priority}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{count}</div>
                  <div className="text-sm text-muted-foreground">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Zone Distribution */}
      {zoneDistribution && zoneDistribution.length > 0 && (
        <Card className="card-mobile">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Zone-wise Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {zoneDistribution.slice(0, 10).map((zone) => (
              <div key={zone.zoneId} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="font-medium">{zone.zoneName}</span>
                <span className="font-semibold text-blue-600">{zone.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top Customers */}
      {customerDistribution && customerDistribution.length > 0 && (
        <Card className="card-mobile">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Top Customers (by Ticket Count)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customerDistribution.slice(0, 10).map((customer) => (
              <div key={customer.customerId} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="font-medium">{customer.customerName}</span>
                <span className="font-semibold text-green-600">{customer.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      {insights && (
        <Card className="card-mobile">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="font-bold text-blue-600">{insights.topPerformingZone}</div>
                <div className="text-sm text-muted-foreground">Most Active Zone</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="font-bold text-green-600">{insights.mostActiveCustomer}</div>
                <div className="text-sm text-muted-foreground">Most Active Customer</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="font-bold text-purple-600">{insights.topAssignee}</div>
                <div className="text-sm text-muted-foreground">Top Assignee</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="font-bold text-red-600">{insights.worstPerformingCustomer}</div>
                <div className="text-sm text-muted-foreground">Highest Risk Customer</div>
              </div>
              {insights.avgTravelTimeFormatted !== 'N/A' && (
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="font-bold text-indigo-600">{insights.avgTravelTimeFormatted}</div>
                  <div className="text-sm text-muted-foreground">Avg Travel Time</div>
                </div>
              )}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="font-bold text-gray-600">{summary.totalOnsiteVisits || 0}</div>
                <div className="text-sm text-muted-foreground">Onsite Visits Tracked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tickets */}
      {recentTickets && recentTickets.length > 0 && (
        <Card className="card-mobile">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTickets.slice(0, 10).map((ticket) => (
                <div key={ticket.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold">#{ticket.id}</span>
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        {ticket.isEscalated && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            ESCALATED
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium mb-1">{ticket.title}</h4>
                      <div className="text-sm text-muted-foreground">
                        <div>Customer: {ticket.customerName}</div>
                        <div>Zone: {ticket.zoneName}</div>
                        <div>Assigned: {ticket.assigneeName}</div>
                        <div>Created: {new Date(ticket.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    {ticket.hasRating && ticket.rating && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-600">★ {ticket.rating}</div>
                        <div className="text-xs text-muted-foreground">Customer Rating</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
