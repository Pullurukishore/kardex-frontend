'use client';

import React from 'react';
import { 
  Ticket, 
  RefreshCw, 
  Target, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ZoneExecutiveSummaryCardsProps {
  metrics: {
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    technicianEfficiency: number;
    avgTravelTime: number;
    partsAvailability: number;
    equipmentUptime: number;
    firstCallResolutionRate: number;
    customerSatisfactionScore: number;
    avgResponseTime?: number;
    avgResolutionTime?: number;
  };
  stats: {
    openTickets: { count: number; change: number };
    unassignedTickets: { count: number; critical: boolean };
    inProgressTickets: { count: number; change: number };
    avgResponseTime: { hours: number; minutes: number; change: number; isPositive: boolean };
    avgResolutionTime: { days: number; hours: number; change: number; isPositive: boolean };
    avgDowntime: { hours: number; minutes: number; change: number; isPositive: boolean };
    monthlyTickets: { count: number; change: number };
    activeMachines: { count: number; change: number };
  };
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

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
  
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
  
  return (
    <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      <span>{Math.abs(change)}%</span>
    </div>
  );
};

export default function ZoneExecutiveSummaryCards({ 
  metrics, 
  stats 
}: ZoneExecutiveSummaryCardsProps) {
  const totalTickets = metrics.openTickets + metrics.inProgressTickets + metrics.resolvedTickets;
  const resolutionRate = totalTickets > 0 ? (metrics.resolvedTickets / totalTickets) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Open Tickets Card */}
      <Card className="relative overflow-hidden border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Open Tickets
          </CardTitle>
          <Ticket className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(metrics.openTickets)}
          </div>
          <div className="flex items-center justify-between mt-2">
            <ChangeIndicator change={stats.openTickets.change} isPositive={stats.openTickets.change < 0} />
            <p className="text-xs text-muted-foreground">
              {stats.unassignedTickets.critical && (
                <span className="text-red-600 font-medium">
                  {stats.unassignedTickets.count} unassigned
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* In Progress Tickets Card */}
      <Card className="relative overflow-hidden border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            In Progress
          </CardTitle>
          <RefreshCw className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatNumber(metrics.inProgressTickets)}
          </div>
          <div className="flex items-center justify-between mt-2">
            <ChangeIndicator change={stats.inProgressTickets.change} isPositive={stats.inProgressTickets.change > 0} />
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Customer Satisfaction Card */}
      <Card className="relative overflow-hidden border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Customer Satisfaction
          </CardTitle>
          <Target className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {metrics.customerSatisfactionScore.toFixed(1)}/5.0
          </div>
          <div className="mt-2">
            <Progress value={(metrics.customerSatisfactionScore / 5) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Average rating
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resolved Tickets Card */}
      <Card className="relative overflow-hidden border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Resolved Tickets
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(metrics.resolvedTickets)}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-green-600 font-medium">
              {resolutionRate.toFixed(1)}% rate
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technician Efficiency Card */}
      <Card className="relative overflow-hidden border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Technician Efficiency
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-cyan-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-600">
            {metrics.technicianEfficiency.toFixed(1)}%
          </div>
          <div className="mt-2">
            <Progress value={metrics.technicianEfficiency} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Average performance
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Uptime Card */}
      <Card className="relative overflow-hidden border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Equipment Uptime
          </CardTitle>
          <ArrowUpRight className="h-4 w-4 text-teal-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-teal-600">
            {metrics.equipmentUptime.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between mt-2">
            <ChangeIndicator change={stats.activeMachines.change} isPositive={stats.activeMachines.change > 0} />
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.activeMachines.count)} active
            </p>
          </div>
        </CardContent>
      </Card>

      {/* First Call Resolution Card */}
      <Card className="relative overflow-hidden border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            First Call Resolution
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">
            {metrics.firstCallResolutionRate.toFixed(1)}%
          </div>
          <div className="mt-2">
            <Progress value={metrics.firstCallResolutionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Fixed on first visit
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Parts Availability Card */}
      <Card className="relative overflow-hidden border-l-4 border-l-pink-500 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Parts Availability
          </CardTitle>
          <ArrowDownRight className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-pink-600">
            {metrics.partsAvailability.toFixed(1)}%
          </div>
          <div className="mt-2">
            <Progress value={metrics.partsAvailability} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Stock availability
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
