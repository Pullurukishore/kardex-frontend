import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FSADashboardData } from '@/types/fsa';

interface FSADistributionChartsProps {
  data: FSADashboardData;
}

export default function FSADistributionCharts({ data }: FSADistributionChartsProps) {
  const { distribution } = data;

  // Calculate total for percentages
  const totalByStatus = distribution.byStatus.reduce((sum, item) => sum + item.count, 0);
  const totalByPriority = distribution.byPriority.reduce((sum, item) => sum + item.count, 0);

  // Status colors
  const statusColors: Record<string, string> = {
    'OPEN': 'bg-blue-500',
    'ASSIGNED': 'bg-yellow-500',
    'IN_PROGRESS': 'bg-orange-500',
    'RESOLVED': 'bg-green-500',
    'CLOSED': 'bg-gray-500',
    'CANCELLED': 'bg-red-500',
    'ON_HOLD': 'bg-purple-500',
    'ESCALATED': 'bg-pink-500'
  };

  // Priority colors
  const priorityColors: Record<string, string> = {
    'LOW': 'bg-green-500',
    'MEDIUM': 'bg-yellow-500',
    'HIGH': 'bg-orange-500',
    'CRITICAL': 'bg-red-500'
  };

  const renderProgressBar = (items: Array<{status?: string; priority?: string; count: number}>, total: number, colors: Record<string, string>) => {
    if (total === 0) {
      return (
        <div className="w-full h-4 bg-gray-200 rounded-full">
          <div className="h-4 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs text-gray-600">No data</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
        {items.map((item, index) => {
          const key = item.status || item.priority || '';
          const percentage = (item.count / total) * 100;
          const color = colors[key] || 'bg-gray-400';
          
          return (
            <div
              key={index}
              className={`${color} h-full transition-all duration-300`}
              style={{ width: `${percentage}%` }}
              title={`${key}: ${item.count} (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Ticket Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ticket Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderProgressBar(distribution.byStatus, totalByStatus, statusColors)}
          
          <div className="grid grid-cols-2 gap-2">
            {distribution.byStatus.map((item, index) => {
              const percentage = totalByStatus > 0 ? (item.count / totalByStatus) * 100 : 0;
              const color = statusColors[item.status] || 'bg-gray-400';
              
              return (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm font-medium capitalize">
                      {item.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{item.count}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {totalByStatus === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>No ticket status data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ticket Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderProgressBar(distribution.byPriority, totalByPriority, priorityColors)}
          
          <div className="grid grid-cols-2 gap-2">
            {distribution.byPriority.map((item, index) => {
              const percentage = totalByPriority > 0 ? (item.count / totalByPriority) * 100 : 0;
              const color = priorityColors[item.priority] || 'bg-gray-400';
              
              return (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm font-medium capitalize">
                      {item.priority.toLowerCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{item.count}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {totalByPriority === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>No ticket priority data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
