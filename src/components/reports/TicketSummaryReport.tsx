// Server-side component - charts replaced with static summaries

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportData } from './types';

interface TicketSummaryReportProps {
  reportData: ReportData;
}

export function TicketSummaryReport({ reportData }: TicketSummaryReportProps) {
  const { statusDistribution, priorityDistribution, dailyTrends, summary } = reportData;

  if (!statusDistribution && !priorityDistribution) {
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
  const totalTickets = Object.values(statusCounts).reduce((sum: number, count: number) => sum + count, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Distribution */}
      <Card className="card-mobile">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Ticket Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const percentage = ((count / totalTickets) * 100).toFixed(1);
              return (
                <div key={status} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <span className="font-medium capitalize text-sm sm:text-base">{status}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm sm:text-base">{count}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{percentage}%</div>
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
              const percentage = ((count / totalTickets) * 100).toFixed(1);
              return (
                <div key={priority} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                    <span className="font-medium capitalize text-sm sm:text-base">{priority}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm sm:text-base">{count}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{percentage}%</div>
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Ticket Summary */}
      <Card className="card-mobile">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Ticket Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalTickets}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Tickets</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{statusCounts.RESOLVED || statusCounts.resolved || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Resolved</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-50">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{statusCounts.PENDING || statusCounts.pending || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Pending</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{statusCounts.OPEN || statusCounts.open || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Open</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
