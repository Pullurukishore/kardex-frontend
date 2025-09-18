import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Pause,
  RefreshCw
} from 'lucide-react';
import type { RealTimeMetrics } from '@/types/fsa';

interface FSARealTimeMetricsProps {
  data: RealTimeMetrics;
}

export default function FSARealTimeMetrics({ data }: FSARealTimeMetricsProps) {
  const metrics = [
    {
      title: 'Active Tickets',
      value: data.activeTickets,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Currently being worked on'
    },
    {
      title: 'Pending Tickets',
      value: data.pendingTickets,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Awaiting assignment'
    },
    {
      title: 'In Progress',
      value: data.inProgressTickets,
      icon: RefreshCw,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Being actively resolved'
    },
    {
      title: 'Resolved Today',
      value: data.resolvedTickets,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Completed tickets'
    },
    {
      title: 'Active Service Persons',
      value: data.activeServicePersons,
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      description: 'Currently online'
    },
    {
      title: 'Offline Service Persons',
      value: data.offlineServicePersons,
      icon: Pause,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: 'Not currently active'
    }
  ];

  const totalTickets = (data.activeTickets ?? 0) + (data.pendingTickets ?? 0) + (data.inProgressTickets ?? 0);
  const totalServicePersons = (data.activeServicePersons ?? 0) + (data.offlineServicePersons ?? 0);

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Real-Time Metrics
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs animate-pulse">
            Live
          </Badge>
          <span className="text-xs text-gray-500">
            Updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            
            return (
              <div key={index} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {(metric.value ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{metric.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Ticket Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Active:</span>
                <span className="font-semibold">{totalTickets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate:</span>
                <span className="font-semibold text-green-600">
                  {totalTickets > 0 ? (((data.resolvedTickets ?? 0) / (totalTickets + (data.resolvedTickets ?? 0))) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Resource Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Staff:</span>
                <span className="font-semibold">{totalServicePersons.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Utilization:</span>
                <span className="font-semibold text-blue-600">
                  {totalServicePersons > 0 ? (((data.activeServicePersons ?? 0) / totalServicePersons) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
