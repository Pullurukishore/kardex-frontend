import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Target, 
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import type { 
  AdvancedPerformanceMetrics, 
  CustomerSatisfactionMetrics, 
  EquipmentAnalytics 
} from '@/types/fsa';

interface FSAAdvancedAnalyticsProps {
  performanceMetrics?: AdvancedPerformanceMetrics | null;
  satisfactionMetrics?: CustomerSatisfactionMetrics | null;
  equipmentAnalytics?: EquipmentAnalytics | null;
}

export default function FSAAdvancedAnalytics({ 
  performanceMetrics, 
  satisfactionMetrics, 
  equipmentAnalytics 
}: FSAAdvancedAnalyticsProps) {
  if (!performanceMetrics && !satisfactionMetrics && !equipmentAnalytics) {
    return null;
  }

  const formatTime = (hours: number | undefined | null) => {
    if (!hours && hours !== 0) return 'N/A';
    if (hours < 1) return `${(hours * 60).toFixed(0)}m`;
    return `${hours.toFixed(1)}h`;
  };

  const getScoreColor = (score: number, threshold: { good: number; fair: number }) => {
    if (score >= threshold.good) return 'text-green-600';
    if (score >= threshold.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Advanced Performance Metrics */}
      {performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Advanced Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className={getScoreColor(performanceMetrics.firstResponseTime ?? 0, { good: 2, fair: 4 })}>
                    {formatTime(performanceMetrics.firstResponseTime)}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">First Response Time</h4>
                <p className="text-sm text-gray-600">Average initial response</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className={getScoreColor(performanceMetrics.firstContactResolution ?? 0, { good: 80, fair: 60 })}>
                    {(performanceMetrics.firstContactResolution ?? 0).toFixed(1)}%
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">First Contact Resolution</h4>
                <p className="text-sm text-gray-600">Resolved on first contact</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className={getScoreColor(100 - (performanceMetrics.reOpenRate ?? 0), { good: 90, fair: 80 })}>
                    {(performanceMetrics.reOpenRate ?? 0).toFixed(1)}%
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">Re-open Rate</h4>
                <p className="text-sm text-gray-600">Tickets reopened</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className={getScoreColor(performanceMetrics.slaComplianceRate ?? 0, { good: 95, fair: 85 })}>
                    {(performanceMetrics.slaComplianceRate ?? 0).toFixed(1)}%
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">SLA Compliance</h4>
                <p className="text-sm text-gray-600">Meeting SLA targets</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Ticket Volume Trend</h5>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={Math.abs(performanceMetrics.ticketVolumeTrend ?? 0)} 
                    className="flex-1" 
                  />
                  <span className={(performanceMetrics.ticketVolumeTrend ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'}>
                    {(performanceMetrics.ticketVolumeTrend ?? 0) >= 0 ? '+' : ''}{(performanceMetrics.ticketVolumeTrend ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Resolution Trend</h5>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={Math.abs(performanceMetrics.resolutionTrend ?? 0)} 
                    className="flex-1" 
                  />
                  <span className={(performanceMetrics.resolutionTrend ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {(performanceMetrics.resolutionTrend ?? 0) >= 0 ? '+' : ''}{(performanceMetrics.resolutionTrend ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Satisfaction Metrics */}
      {satisfactionMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Customer Satisfaction
              <Badge variant="outline" className="ml-auto">
                {getTrendIcon(satisfactionMetrics.trend)}
                {(satisfactionMetrics.trendPercentage ?? 0).toFixed(1)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {(satisfactionMetrics.overallScore ?? 0).toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Overall Score</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600 mb-1">
                  {(satisfactionMetrics.responseTimeRating ?? 0).toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Response Time</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-purple-600 mb-1">
                  {(satisfactionMetrics.resolutionRating ?? 0).toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Resolution Quality</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-orange-600 mb-1">
                  {(satisfactionMetrics.serviceRating ?? 0).toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Service Quality</p>
              </div>
            </div>

            {satisfactionMetrics.feedback && satisfactionMetrics.feedback.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Recent Feedback</h5>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {(satisfactionMetrics.feedback || []).slice(0, 5).map((feedback) => (
                    <div key={feedback.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full ${
                                i < feedback.rating ? 'bg-yellow-400' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{feedback.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Equipment Analytics */}
      {equipmentAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Equipment Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Equipment Status */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Equipment Status</h5>
                <div className="space-y-2">
                  {(equipmentAnalytics.equipmentByStatus || []).map((status, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium capitalize">{status.status.toLowerCase()}</span>
                      <Badge variant="secondary">{status.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Failure Rates */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Failure Rates</h5>
                <div className="space-y-3">
                  {(equipmentAnalytics.failureRates || []).map((failure, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{failure.equipmentType}</span>
                        <span className="text-red-600">{(failure.failureRate ?? 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={failure.failureRate ?? 0} className="h-2" />
                      <p className="text-xs text-gray-500">
                        Avg repair time: {formatTime(failure.avgTimeToRepair)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Maintenance Schedule */}
            {equipmentAnalytics.maintenanceSchedule && equipmentAnalytics.maintenanceSchedule.length > 0 && (
              <div className="mt-6">
                <h5 className="font-medium text-gray-900 mb-3">Upcoming Maintenance</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(equipmentAnalytics.maintenanceSchedule || []).slice(0, 6).map((maintenance) => (
                    <div key={maintenance.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-medium text-sm">{maintenance.name}</h6>
                        <Badge 
                          variant={
                            maintenance.status === 'overdue' ? 'destructive' :
                            maintenance.status === 'due-soon' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {maintenance.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Next: {new Date(maintenance.nextMaintenance).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
