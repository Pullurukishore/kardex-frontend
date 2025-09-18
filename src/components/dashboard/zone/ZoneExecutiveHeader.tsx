'use client';

import React from 'react';
import { RefreshCw, MapPin, Users, Wrench, Server, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ZoneExecutiveHeaderProps {
  zoneData: {
    id: number;
    name: string;
    description: string;
    totalCustomers?: number;
    totalTechnicians?: number;
    totalAssets?: number;
  };
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function ZoneExecutiveHeader({ 
  zoneData, 
  onRefresh, 
  isRefreshing 
}: ZoneExecutiveHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Zone Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {zoneData.name}
            </h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Zone Dashboard
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              {zoneData.description || 'Service Zone'}
            </span>
          </div>

          {/* Zone Stats */}
          {(zoneData.totalCustomers || zoneData.totalTechnicians || zoneData.totalAssets) && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {zoneData.totalCustomers && (
                <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                  <Users className="h-3 w-3 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {zoneData.totalCustomers} Customers
                  </span>
                </div>
              )}
              {zoneData.totalTechnicians && (
                <div className="flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full">
                  <Wrench className="h-3 w-3 text-purple-600" />
                  <span className="font-medium text-purple-800">
                    {zoneData.totalTechnicians} Technicians
                  </span>
                </div>
              )}
              {zoneData.totalAssets && (
                <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                  <Server className="h-3 w-3 text-green-600" />
                  <span className="font-medium text-green-800">
                    {zoneData.totalAssets} Assets
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            {format(new Date(), 'MMMM yyyy')}
          </Button>
        </div>
      </div>
    </div>
  );
}
