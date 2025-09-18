import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Award,
  ExternalLink
} from 'lucide-react';
import type { FSADashboardData } from '@/types/fsa';

interface FSAPerformanceTablesProps {
  data: FSADashboardData;
}

export default function FSAPerformanceTables({ data }: FSAPerformanceTablesProps) {
  const { performance } = data;

  const formatResolutionTime = (time: number | string) => {
    if (typeof time === 'string') return time;
    if (time < 1) return `${(time * 60).toFixed(0)}m`;
    return `${time.toFixed(1)}h`;
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
      {/* Zone Performance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Zone Performance
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {performance.zonePerformance.length} zones
          </Badge>
        </CardHeader>
        <CardContent>
          {performance.zonePerformance.length > 0 ? (
            <div className="space-y-3">
              {performance.zonePerformance.map((zone) => {
                const resolutionRate = zone.totalTickets > 0 
                  ? (zone.resolvedTickets / zone.totalTickets) * 100 
                  : 0;
                
                return (
                  <div key={zone.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{zone.name}</h3>
                        <Badge 
                          variant="secondary" 
                          className={getPerformanceColor(resolutionRate)}
                        >
                          {typeof resolutionRate === 'number' ? resolutionRate.toFixed(1) : resolutionRate || '0'}%
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Total Tickets</p>
                        <p className="font-semibold">{zone.totalTickets}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Resolved</p>
                        <p className="font-semibold text-green-600">{zone.resolvedTickets}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Resolution</p>
                        <p className="font-semibold">{formatResolutionTime(zone.avgResolutionTime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Customers</p>
                        <p className="font-semibold">{zone.activeCustomers || 0}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No zone performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Top Performers
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {performance.topPerformers.length} users
          </Badge>
        </CardHeader>
        <CardContent>
          {performance.topPerformers.length > 0 ? (
            <div className="space-y-3">
              {performance.topPerformers.map((performer, index) => {
                const isTopPerformer = index < 3;
                const performanceIcon = performer.resolutionRate >= 90 
                  ? TrendingUp 
                  : performer.resolutionRate >= 70 
                    ? Clock 
                    : TrendingDown;
                const PerformanceIcon = performanceIcon;
                
                return (
                  <div key={performer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isTopPerformer && (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {index + 1}
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{performer.name}</h3>
                          <p className="text-sm text-gray-500">{performer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={getPerformanceColor(performer.resolutionRate)}
                        >
                          {typeof performer.resolutionRate === 'number' ? performer.resolutionRate.toFixed(1) : performer.resolutionRate || '0'}%
                        </Badge>
                        <PerformanceIcon className={`h-4 w-4 ${
                          performer.resolutionRate >= 90 ? 'text-green-600' :
                          performer.resolutionRate >= 70 ? 'text-yellow-600' :
                          'text-red-600'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Total Tickets</p>
                        <p className="font-semibold">{performer.totalTickets}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Resolved</p>
                        <p className="font-semibold text-green-600">{performer.resolvedTickets}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Time</p>
                        <p className="font-semibold">{formatResolutionTime(performer.avgResolutionTime)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {performer.role}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No performer data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
