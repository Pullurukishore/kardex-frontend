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
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ZoneFieldServiceAnalyticsProps {
  zoneDashboardData: {
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
  zoneDashboardData 
}: ZoneFieldServiceAnalyticsProps) {
  const { metrics, stats } = zoneDashboardData;
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          Field Service Analytics
        </h2>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Response Time Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-700">
                  {formatDuration(stats.avgResponseTime.hours, stats.avgResponseTime.minutes)}
                </p>
                <p className="text-sm text-blue-600">Avg Response Time</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-blue-700">Time to first response</p>
              <ChangeIndicator 
                change={stats.avgResponseTime.change} 
                isPositive={stats.avgResponseTime.isPositive} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Travel Time Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-700">
                  {formatDuration(Math.floor(metrics.avgTravelTime / 60), metrics.avgTravelTime % 60)}
                </p>
                <p className="text-sm text-purple-600">Avg Travel Time</p>
              </div>
            </div>
            <p className="text-xs text-purple-700">Time to reach customer sites</p>
          </CardContent>
        </Card>

        {/* Resolution Time Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">
                  {formatDuration(stats.avgResolutionTime.days * 24 + stats.avgResolutionTime.hours, 0)}
                </p>
                <p className="text-sm text-green-600">Avg Resolution Time</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-green-700">Time to complete tickets</p>
              <ChangeIndicator 
                change={stats.avgResolutionTime.change} 
                isPositive={stats.avgResolutionTime.isPositive} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        {/* Technician Efficiency */}
        <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-600" />
                <span className="text-sm font-medium text-gray-700">Technician Efficiency</span>
              </div>
              <span className="text-xl font-bold text-cyan-600">
                {metrics.technicianEfficiency.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.technicianEfficiency} className="h-3 mb-2" />
            <p className="text-xs text-gray-600">Overall performance</p>
          </CardContent>
        </Card>

        {/* Parts Availability */}
        <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-pink-600" />
                <span className="text-sm font-medium text-gray-700">Parts Availability</span>
              </div>
              <span className="text-xl font-bold text-pink-600">
                {metrics.partsAvailability.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.partsAvailability} className="h-3 mb-2" />
            <p className="text-xs text-gray-600">Spare parts in stock</p>
          </CardContent>
        </Card>

        {/* Equipment Uptime */}
        <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Equipment Uptime</span>
              </div>
              <span className="text-xl font-bold text-indigo-600">
                {metrics.equipmentUptime.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.equipmentUptime} className="h-3 mb-2" />
            <p className="text-xs text-gray-600">System availability</p>
          </CardContent>
        </Card>

        {/* First Call Resolution */}
        <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">First Call Resolution</span>
              </div>
              <span className="text-xl font-bold text-emerald-600">
                {metrics.firstCallResolutionRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.firstCallResolutionRate} className="h-3 mb-2" />
            <p className="text-xs text-gray-600">Fixed on first visit</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="mt-6 bg-gradient-to-r from-slate-50 to-gray-50 border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
              <div className="text-lg font-bold text-blue-700">
                {metrics.technicianEfficiency >= 80 ? 'Excellent' : 
                 metrics.technicianEfficiency >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
              <div className="text-xs text-blue-600 mt-1">Efficiency Rating</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
              <div className="text-lg font-bold text-green-700">
                {metrics.firstCallResolutionRate >= 70 ? 'High' : 
                 metrics.firstCallResolutionRate >= 50 ? 'Medium' : 'Low'}
              </div>
              <div className="text-xs text-green-600 mt-1">FCR Rate</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
              <div className="text-lg font-bold text-purple-700">
                {metrics.avgTravelTime < 30 ? 'Fast' : 
                 metrics.avgTravelTime < 60 ? 'Normal' : 'Slow'}
              </div>
              <div className="text-xs text-purple-600 mt-1">Travel Speed</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
              <div className="text-lg font-bold text-orange-700">
                {metrics.partsAvailability >= 90 ? 'Excellent' : 
                 metrics.partsAvailability >= 70 ? 'Good' : 'Low'}
              </div>
              <div className="text-xs text-orange-600 mt-1">Stock Level</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
