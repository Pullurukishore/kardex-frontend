import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api';

interface ServicePerson {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive: boolean;
  serviceZones: {
    serviceZone: {
      id: number;
      name: string;
    };
  }[];
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function serverFetch(endpoint: string) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const userRole = cookieStore.get('userRole')?.value;
  
  console.log('Zone serverFetch called for endpoint:', endpoint);
  console.log('Full URL:', `${API_BASE_URL}${endpoint}`);
  console.log('AccessToken found:', !!accessToken);
  console.log('UserRole found:', userRole);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Cookie': cookieStore.toString(),
      'Authorization': accessToken ? `Bearer ${accessToken}` : '',
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Ensure fresh data
  });

  console.log('Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    console.error(`Failed to fetch ${endpoint}:`, response.status, response.statusText);
    const errorText = await response.text();
    console.error('Error response:', errorText);
    throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
  }

  const data = await response.json();
  console.log('Successful response data:', data);
  return data;
}

// Zone Service Persons Functions
export async function getZoneServicePersons(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PaginatedResponse<ServicePerson>> {
  try {
    console.log('getZoneServicePersons called with params:', params);
    const { page = 1, limit = 30, search } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const endpoint = `/zone-dashboard/service-persons?${searchParams}`;
    console.log('Calling zone endpoint:', endpoint);
    
    const response = await serverFetch(endpoint);
    console.log('Zone response received:', response);
    
    // Handle both response.data and direct response
    const servicePersons = response.data || response || [];
    console.log('Zone service persons extracted:', servicePersons);
    
    // Ensure isActive is properly set for each person
    const processedData = servicePersons.map((person: ServicePerson) => ({
      ...person,
      isActive: person.isActive ?? true // Default to true if undefined
    }));

    return {
      data: processedData,
      pagination: response.pagination || {
        page,
        limit,
        total: processedData.length,
        totalPages: Math.ceil(processedData.length / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching zone service persons:', error);
    return {
      data: [],
      pagination: { page: 1, limit: 30, total: 0, totalPages: 0 }
    };
  }
}

export async function getZoneServicePersonStats(servicePersons: ServicePerson[]) {
  return {
    total: servicePersons.length,
    active: servicePersons.filter(p => p.isActive).length,
    inactive: servicePersons.filter(p => !p.isActive).length,
    totalZoneAssignments: servicePersons.reduce((acc, person) => acc + person.serviceZones.length, 0)
  };
}
