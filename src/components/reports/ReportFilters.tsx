import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import type { ReportFilters as ReportFiltersType } from './types';
import { REPORT_TYPES, Zone, Customer, Asset } from './types';

interface ReportFiltersProps {
  filters: ReportFiltersType;
  zones: Zone[];
  customers: Customer[];
  assets: Asset[];
  onFiltersChange?: (filters: ReportFiltersType) => void;
}

export function ReportFilters({
  filters,
  zones,
  customers,
  assets,
  onFiltersChange
}: ReportFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ReportFiltersType>(filters);

  const handleFilterChange = (key: keyof ReportFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    const newDateRange = { 
      ...localFilters.dateRange,
      [field]: value ? new Date(value) : undefined
    };
    handleFilterChange('dateRange', newDateRange);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Report Type</label>
        <Select 
          value={localFilters.reportType}
          onValueChange={(value) => handleFilterChange('reportType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">From Date</label>
        <Input
          type="date"
          value={localFilters.dateRange?.from ? format(localFilters.dateRange.from, 'yyyy-MM-dd') : ''}
          onChange={(e) => handleDateChange('from', e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">To Date</label>
        <Input
          type="date"
          value={localFilters.dateRange?.to ? format(localFilters.dateRange.to, 'yyyy-MM-dd') : ''}
          onChange={(e) => handleDateChange('to', e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Zone</label>
        <Select 
          value={localFilters.zoneId || ''}
          onValueChange={(value) => handleFilterChange('zoneId', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All zones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All zones</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {localFilters.reportType === 'industrial-data' && (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Customer</label>
            <Select 
              value={localFilters.customerId || ''}
              onValueChange={(value) => handleFilterChange('customerId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {localFilters.customerId && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Asset</label>
              <Select 
                value={localFilters.assetId || ''}
                onValueChange={(value) => handleFilterChange('assetId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All assets</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name || `Asset ${asset.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
