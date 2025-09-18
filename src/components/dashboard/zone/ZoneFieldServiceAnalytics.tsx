'use client';

import React from 'react';
import { 
  Timer, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Gauge,
  MapPin,
  Wrench,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ZoneFieldServiceAnalyticsProps {
  metrics: {
    avgTravelTime: number;
    avgResponseTime?: number;
    avgResolutionTime?: number;
    technicianEfficiency: number;
    partsAvailability: number;
    equipmentUptime: number;
    firstCallResolutionRate: number;
  };
  stats: {
    avgResponseTime: { hours: number; minutes: number; change: number; isPositive: boolean };
    avgResolutionTime: { days: number; hours: number; change: number; isPositive: boolean };
    avgDowntime: { hours: number; minutes: number; change: number; isPositive: boolean };
  };
}

// Helper function to format duration
const formatDuration = (hours: number, minutes: number): string => {
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Helper function to render change indicator
const ChangeIndicator = ({ change, isPositive }: { change: number; isPositive: boolean }) => {
  if (change === 0) return null;
  
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const arrow = isPositive ? '↓' : '↑';
  
  return (
    <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
      {arrow} {Math.abs(change)}%
    </Badge>
  );
};

export default function ZoneFieldServiceAnalytics({ 
  metrics, 
  stats 
}: ZoneFieldServiceAnalyticsProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-blue-500" />
          Field Service Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Performance Metrics */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Avg Travel Time</span>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {formatDuration(Math.floor(metrics.avgTravelTime / 60), metrics.avgTravelTime % 60)}
                </div>
              </div>
              <div className="text-xs text-blue-700">
                Time to reach customer sites
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Avg Response Time</span>
                </div>
                <div className="text-lg font-bold text-purple-600">
                  {formatDuration(stats.avgResponseTime.hours, stats.avgResponseTime.minutes)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-purple-700">
                  Time to first response
                </div>
                <ChangeIndicator 
                  change={stats.avgResponseTime.change} 
                  isPositive={stats.avgResponseTime.isPositive} 
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Avg Resolution Time</span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {formatDuration(stats.avgResolutionTime.days * 24 + stats.avgResolutionTime.hours, 0)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-700">
                  Time to complete tickets
                </div>
                <ChangeIndicator 
                  change={stats.avgResolutionTime.change} 
                  isPositive={stats.avgResolutionTime.isPositive} 
                />
              </div>
            </div>
          </div>

          {/* Right Column - Efficiency Metrics */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-600" />
                    <span className="text-sm font-medium text-cyan-800">Technician Efficiency</span>
                  </div>
                  <span className="text-lg font-bold text-cyan-600">
                    {metrics.technicianEfficiency.toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics.technicianEfficiency} className="h-2" />
                <div className="text-xs text-cyan-700 mt-1">
                  Overall technician performance
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium text-pink-800">Parts Availability</span>
                  </div>
                  <span className="text-lg font-bold text-pink-600">
                    {metrics.partsAvailability.toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics.partsAvailability} className="h-2" />
                <div className="text-xs text-pink-700 mt-1">
                  Spare parts in stock
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-800">Equipment Uptime</span>
                  </div>
                  <span className="text-lg font-bold text-indigo-600">
                    {metrics.equipmentUptime.toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics.equipmentUptime} className="h-2" />
                <div className="text-xs text-indigo-700 mt-1">
                  System availability
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">First Call Resolution</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {metrics.firstCallResolutionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics.firstCallResolutionRate} className="h-2" />
                <div className="text-xs text-green-700 mt-1">
                  Fixed on first visit
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <div className="text-lg font-bold text-blue-600">
                {metrics.technicianEfficiency >= 80 ? 'Excellent' : 
                 metrics.technicianEfficiency >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
              <div className="text-xs text-blue-700">Efficiency Rating</div>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <div className="text-lg font-bold text-green-600">
                {metrics.firstCallResolutionRate >= 70 ? 'High' : 
                 metrics.firstCallResolutionRate >= 50 ? 'Medium' : 'Low'}
              </div>
              <div className="text-xs text-green-700">FCR Rate</div>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <div className="text-lg font-bold text-purple-600">
                {metrics.avgTravelTime < 30 ? 'Fast' : 
                 metrics.avgTravelTime < 60 ? 'Normal' : 'Slow'}
              </div>
              <div className="text-xs text-purple-700">Travel Speed</div>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <div className="text-lg font-bold text-orange-600">
                {metrics.partsAvailability >= 90 ? 'Excellent' : 
                 metrics.partsAvailability >= 70 ? 'Good' : 'Low'}
              </div>
              <div className="text-xs text-orange-700">Stock Level</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
