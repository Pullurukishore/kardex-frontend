'use client';

import React, { useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/axios';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportHeader } from '@/components/reports/ReportHeader';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { ReportRenderer } from '@/components/reports/ReportRenderer';
import { REPORT_TYPES } from '@/components/reports/types';
import type { ReportFilters as ReportFiltersType } from '@/components/reports/types';

interface ReportsClientProps {
  initialFilters: ReportFiltersType;
  initialReportData: any;
  zones: any[];
  customers: any[];
  assets: any[];
}

export default function ReportsClient({ 
  initialFilters, 
  initialReportData, 
  zones, 
  customers, 
  assets 
}: ReportsClientProps) {
  const [filters, setFilters] = useState<ReportFiltersType>(initialFilters);
  const [reportData, setReportData] = useState(initialReportData);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const selectedReportType = REPORT_TYPES.find(type => type.value === filters.reportType);

  // Debug: Log when component mounts - no auto-generation
  React.useEffect(() => {
    console.log('ReportsClient mounted - no auto-generation');
  }, []);

  const handleFilterChange = (newFilters: ReportFiltersType) => {
    console.log('Filters changed - no auto-generation');
    setFilters(newFilters);
    // Removed auto-generation on filter change
  };

  const handleRefresh = async (customFilters?: ReportFiltersType) => {
    const activeFilters = customFilters || filters;
    setIsLoading(true);
    try {
      let response;
      
      if (activeFilters.reportType === 'service-person-reports' || activeFilters.reportType === 'service-person-attendance') {
        // Use backend service person reports endpoints (already include day-wise activities)
        const fromDate = activeFilters.dateRange?.from?.toISOString().split('T')[0];
        const toDate = activeFilters.dateRange?.to?.toISOString().split('T')[0];

        const [reportsResponse, summaryResponse] = await Promise.all([
          api.get('/admin/service-person-reports', {
            params: {
              fromDate,
              toDate,
              zoneId: activeFilters.zoneId,
              limit: 1000,
              page: 1,
            }
          }),
          api.get('/admin/service-person-reports/summary', {
            params: {
              fromDate,
              toDate,
              zoneId: activeFilters.zoneId,
            }
          })
        ]);

        const data = reportsResponse.data?.data || {};
        const summaryData = summaryResponse.data?.data || {};

        setReportData({
          ...data,
          summary: summaryData
        });
      } else {
        // Call regular reports API
        response = await api.get('/reports/generate', {
          params: {
            reportType: activeFilters.reportType,
            startDate: activeFilters.dateRange?.from?.toISOString(),
            endDate: activeFilters.dateRange?.to?.toISOString(),
            zoneId: activeFilters.zoneId,
            customerId: activeFilters.customerId,
            assetId: activeFilters.assetId
          }
        });
        setReportData(response.data);
      }
      
      toast.success('Report refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh report:', error);
      toast.error('Failed to refresh report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      let response;
      
      if (filters.reportType === 'service-person-reports' || filters.reportType === 'service-person-attendance') {
        // Export service person attendance reports via dedicated endpoint
        const params = new URLSearchParams();
        if (filters.dateRange?.from) params.append('fromDate', filters.dateRange.from.toISOString().split('T')[0]);
        if (filters.dateRange?.to) params.append('toDate', filters.dateRange.to.toISOString().split('T')[0]);
        if (filters.zoneId) params.append('zoneId', filters.zoneId);

        response = await api.get(`/admin/service-person-reports/export?${params.toString()}`, {
          responseType: 'blob',
        });
      } else {
        // Export regular reports
        const params = new URLSearchParams();
        params.append('reportType', filters.reportType);
        params.append('format', format);
        if (filters.dateRange?.from) params.append('from', filters.dateRange.from.toISOString().split('T')[0]);
        if (filters.dateRange?.to) params.append('to', filters.dateRange.to.toISOString().split('T')[0]);
        if (filters.zoneId) params.append('zoneId', filters.zoneId);
        if (filters.customerId) params.append('customerId', filters.customerId);
        if (filters.assetId) params.append('assetId', filters.assetId);

        response = await api.get(`/reports/general/export?${params.toString()}`, {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileExtension = (filters.reportType === 'service-person-reports' || filters.reportType === 'service-person-attendance') ? 'csv' : format;
      link.download = `report-${filters.reportType}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Report exported as ${fileExtension.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <ReportHeader 
        filters={filters}
        reportData={reportData}
      />

      {/* Report Generation Controls */}
      <Card className="mb-6 card-mobile">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Report Filters</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">
                Configure your report parameters
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                onClick={() => handleRefresh()} 
                disabled={isLoading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
              >
                <BarChart3 className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Generating...' : 'Generate Report'}
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button 
                  onClick={() => handleExport('csv')} 
                  disabled={!reportData || isExporting}
                  variant="outline"
                  className="w-full sm:w-auto touch-manipulation min-h-[44px] border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
                <Button 
                  onClick={() => handleExport('pdf')} 
                  disabled={!reportData || isExporting}
                  variant="outline"
                  className="w-full sm:w-auto touch-manipulation min-h-[44px] border-red-600 text-red-600 hover:bg-red-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ReportFilters 
            filters={filters} 
            zones={zones} 
            customers={customers} 
            assets={assets} 
            onFiltersChange={handleFilterChange} 
          />
          {selectedReportType && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900">{selectedReportType.label}</h4>
              <p className="text-sm text-blue-700 mt-1">{selectedReportType.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <SummaryCards summary={reportData.summary || {}} />

          {/* Report Specific Content */}
          <ReportRenderer reportType={filters.reportType} reportData={reportData} />
        </div>
      )}

      {/* Empty State */}
      {!reportData && (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-500 mb-4">
              Select your report parameters and click "Generate Report" to view analytics
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
