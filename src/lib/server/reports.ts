import { cookies } from 'next/headers';
import { Zone, Customer, Asset, ReportData } from '@/components/reports/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api';

async function makeServerRequest(endpoint: string) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  if (!accessToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Cookie': cookieStore.toString(),
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
