import { format, subDays } from 'date-fns';
import { apiClient } from '@/lib/api/api-client';
import ServicePersonReportsClient from '@/components/reports/ServicePersonReportsClient';

type SearchParams = {
  from?: string;
  to?: string;
};

type Props = {
  searchParams: SearchParams;
};

export default async function ServicePersonReportsPage({ searchParams }: Props) {
  // Default date range: last 7 days
  const defaultFrom = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const defaultTo = format(new Date(), 'yyyy-MM-dd');
  
  const dateRange = {
    from: searchParams.from || defaultFrom,
    to: searchParams.to || defaultTo,
  };

  let reportData = null;
  let summaryData = null;

  try {
    // Fetch data on the server using apiClient
    const [reportsResponse, summaryResponse] = await Promise.allSettled([
      apiClient.get('/service-person-reports', {
        params: { 
          fromDate: dateRange.from,
          toDate: dateRange.to,
          limit: 1 // Only get current user's data
        }
      }),
      apiClient.get('/service-person-reports/summary', {
        params: { 
          fromDate: dateRange.from,
          toDate: dateRange.to
        }
      })
    ]);

    // Process reports response
    if (reportsResponse.status === 'fulfilled' && reportsResponse.value?.data?.success) {
      // The API returns data in servicePersonReports array
      reportData = reportsResponse.value.data.data?.servicePersonReports?.[0] || null;
    }

    // Process summary response
    if (summaryResponse.status === 'fulfilled' && summaryResponse.value?.data?.success) {
      // Transform the summary data to match the expected format
      const summary = summaryResponse.value.data.data;
      summaryData = {
        totalCheckIns: summary.totalCheckIns || 0,
        totalAbsentees: summary.totalAbsentees || 0,
        totalServicePersons: summary.totalServicePersons || 0,
        averageHoursPerDay: summary.averageHoursPerDay || 0,
        totalActivitiesLogged: summary.totalActivitiesLogged || 0,
        mostActiveUser: summary.mostActiveUser ? {
          id: '', // You might want to include an ID if available
          name: summary.mostActiveUser.name || summary.mostActiveUser.email || 'Unknown',
          activities: summary.mostActiveUser.activityCount || 0
        } : null
      };
    }

  } catch (error) {
    console.error('Error fetching reports data on server:', error);
    // Data will be null, client component will handle the empty state
  }

  // Transform report data to match the expected format if needed
  const getSafeNumber = (value: any, defaultValue = 0) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && !isNaN(Number(value))) return Number(value);
    return defaultValue;
  };

  const transformedReportData = {
    summary: {
      totalWorkingDays: getSafeNumber(reportData?.summary?.totalWorkingDays),
      totalHours: getSafeNumber(reportData?.summary?.totalHours),
      absentDays: getSafeNumber(reportData?.summary?.absentDays),
      autoCheckouts: getSafeNumber(reportData?.summary?.autoCheckouts),
      activitiesLogged: getSafeNumber(reportData?.summary?.activitiesLogged || reportData?.activitiesLogged),
      averageHoursPerDay: getSafeNumber(reportData?.summary?.averageHoursPerDay || reportData?.averageHoursPerDay)
    },
    flags: Array.isArray(reportData?.flags) ? reportData.flags : [],
    dayWiseBreakdown: Array.isArray(reportData?.dayWiseBreakdown) ? reportData.dayWiseBreakdown : []
  };

  console.log('Transformed report data:', transformedReportData);

  // Ensure summary data has all required fields
  const safeSummaryData = {
    totalCheckIns: getSafeNumber(summaryData?.totalCheckIns),
    totalAbsentees: getSafeNumber(summaryData?.totalAbsentees),
    totalServicePersons: getSafeNumber(summaryData?.totalServicePersons),
    averageHoursPerDay: getSafeNumber(summaryData?.averageHoursPerDay),
    totalActivitiesLogged: getSafeNumber(summaryData?.totalActivitiesLogged),
    mostActiveUser: summaryData?.mostActiveUser || null
  };

  console.log('Safe summary data:', safeSummaryData);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Service Person Reports</h1>
      <ServicePersonReportsClient 
        initialReportData={transformedReportData}
        initialSummaryData={safeSummaryData}
        initialDateRange={dateRange}
      />
    </div>
  );
}