import { cookies } from 'next/headers';
import { Zone, Customer, Asset, ReportData } from '@/components/reports/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api';

async function makeServerRequest(endpoint: string) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const token = cookieStore.get('token')?.value;
  
  // Check for either accessToken or token (based on authentication inconsistencies)
  const authToken = accessToken || token;
  
  if (!authToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Ensure fresh data
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }

  return response.json();
}

export async function getZones(): Promise<Zone[]> {
  try {
    const response = await makeServerRequest('/service-zones?isActive=true');
    return Array.isArray(response) ? response : response.data || [];
  } catch (error) {
    console.error('Error fetching zones:', error);
    return [];
  }
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    const response = await makeServerRequest('/customers?isActive=true');
    return Array.isArray(response) 
      ? response 
      : (response.data || response.customers || []);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

export async function getAssets(customerId?: string): Promise<Asset[]> {
  if (!customerId) return [];
  
  try {
    const response = await makeServerRequest(`/assets?customerId=${customerId}&isActive=true`);
    return Array.isArray(response) ? response : response.data || [];
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
}

export async function generateReport(params: {
  from?: string;
  to?: string;
  zoneId?: string;
  customerId?: string;
  assetId?: string;
  reportType: string;
}): Promise<ReportData | null> {
  try {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') {
        searchParams.append(key, value);
      }
    });

    const response = await makeServerRequest(`/reports/general?${searchParams.toString()}`);
    return response || null;
  } catch (error) {
    console.error('Error generating report:', error);
    return null;
  }
}

// Service Person Report Types
export interface PersonalReportData {
  summary: {
    totalWorkingDays: number;
    totalHours: number;
    absentDays: number;
    autoCheckouts: number;
    activitiesLogged: number;
    averageHoursPerDay: number;
  };
  flags: Array<{
    type: string;
    count: number;
    message: string;
  }>;
  dayWiseBreakdown: Array<{
    date: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalHours: number;
    attendanceStatus: string;
    activityCount: number;
    flags: Array<{
      type: string;
      message: string;
    }>;
    activities: Array<{
      id: number;
      activityType: string;
      title: string;
      startTime: string;
      endTime: string | null;
      duration: number | null;
      location: string | null;
      ticketId: number | null;
      ticket: any;
    }>;
  }>;
}

export interface ReportsSummary {
  totalCheckIns: number;
  totalAbsentees: number;
  totalServicePersons: number;
  averageHoursPerDay: number;
  totalActivitiesLogged: number;
  mostActiveUser: {
    name: string;
    email: string;
    activityCount: number;
  } | null;
}

export async function getServicePersonReports(params: {
  fromDate: string;
  toDate: string;
  limit?: number;
}): Promise<PersonalReportData | null> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.append('fromDate', params.fromDate);
    searchParams.append('toDate', params.toDate);
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const response = await makeServerRequest(`/service-person-reports?${searchParams.toString()}`);
    
    // Extract current user's report data
    if (response?.success && response.data?.reports?.length > 0) {
      return response.data.reports[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching service person reports:', error);
    return null;
  }
}

export async function getServicePersonReportsSummary(params: {
  fromDate: string;
  toDate: string;
}): Promise<ReportsSummary | null> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.append('fromDate', params.fromDate);
    searchParams.append('toDate', params.toDate);

    const response = await makeServerRequest(`/service-person-reports/summary?${searchParams.toString()}`);
    
    if (response?.success) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching service person reports summary:', error);
    return null;
  }
}
