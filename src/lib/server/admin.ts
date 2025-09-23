import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api';

interface ServicePerson {
  id: number;
  email: string;
  isActive: boolean;
  serviceZones: {
    serviceZone: {
      id: number;
      name: string;
    };
  }[];
}

interface ServiceZone {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    servicePersons?: number;
    customers?: number;
    tickets?: number;
  };
}

interface ZoneUser {
  id: number;
  email: string;
  role: string;
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
  const token = cookieStore.get('token')?.value;
  const userRole = cookieStore.get('userRole')?.value;
  
  // Check for either accessToken or token (based on authentication inconsistencies)
  const authToken = accessToken || token;
  
  console.log('serverFetch called for endpoint:', endpoint);
  console.log('Full URL:', `${API_BASE_URL}${endpoint}`);
  console.log('Available cookies:', cookieStore.getAll());
  console.log('AuthToken found:', !!authToken);
  console.log('UserRole found:', userRole);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': authToken ? `Bearer ${authToken}` : '',
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

// Service Persons Functions
export async function getServicePersons(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PaginatedResponse<ServicePerson>> {
  try {
    console.log('getServicePersons called with params:', params);
    const { page = 1, limit = 30, search } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const endpoint = `/service-persons?${searchParams}`;
    console.log('Calling endpoint:', endpoint);
    
    const response = await serverFetch(endpoint);
    console.log('Response received:', response);
    
    // Handle both response.data and direct response like other working functions
    const servicePersons = response.data || response || [];
    console.log('Service persons extracted:', servicePersons);
    
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
    console.error('Error fetching service persons:', error);
    return {
      data: [],
      pagination: { page: 1, limit: 30, total: 0, totalPages: 0 }
    };
  }
}

export async function getServicePersonStats(servicePersons: ServicePerson[]) {
  return {
    total: servicePersons.length,
    active: servicePersons.filter(p => p.isActive).length,
    inactive: servicePersons.filter(p => !p.isActive).length,
    totalZoneAssignments: servicePersons.reduce((acc, person) => acc + person.serviceZones.length, 0)
  };
}

// Service Zones Functions
export async function getServiceZones(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PaginatedResponse<ServiceZone>> {
  try {
    const { page = 1, limit = 20, search } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await serverFetch(`/service-zones?${searchParams}`);
    
    return {
      data: response.data || [],
      pagination: response.pagination || {
        page,
        limit,
        total: (response.data || []).length,
        totalPages: Math.ceil((response.data || []).length / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching service zones:', error);
    return {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  }
}

export async function getServiceZoneStats(zones: ServiceZone[]) {
  return {
    total: zones.length,
    active: zones.filter(z => z.isActive).length,
    inactive: zones.filter(z => !z.isActive).length,
    totalServicePersons: zones.reduce((acc, zone) => acc + (zone._count?.servicePersons || 0), 0),
    totalCustomers: zones.reduce((acc, zone) => acc + (zone._count?.customers || 0), 0),
    totalTickets: zones.reduce((acc, zone) => acc + (zone._count?.tickets || 0), 0)
  };
}

// Zone Users Functions
export async function getZoneUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PaginatedResponse<ZoneUser>> {
  try {
    const { page = 1, limit = 10, search } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      role: 'ZONE_USER', // Only fetch users with ZONE_USER role
      ...(search && { search }),
    });

    const response = await serverFetch(`/zone-users?${searchParams}`);
    
    // Handle the response structure from our new admin endpoint
    const responseData = response.data || response;
    const zoneUsers = responseData.zoneUsers || responseData || [];

    return {
      data: zoneUsers,
      pagination: responseData.pagination || response.pagination || {
        page,
        limit,
        total: zoneUsers.length,
        totalPages: Math.ceil(zoneUsers.length / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching zone users:', error);
    return {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }
}

export async function getZoneUserStats(zoneUsers: ZoneUser[]) {
  return {
    total: zoneUsers.length,
    active: zoneUsers.filter(u => u.isActive).length,
    inactive: zoneUsers.filter(u => !u.isActive).length,
    totalZoneAssignments: zoneUsers.reduce((acc, user) => acc + user.serviceZones.length, 0),
    admin: zoneUsers.filter(u => u.role === 'ADMIN').length,
    zoneUsers: zoneUsers.filter(u => u.role === 'ZONE_USER').length
  };
}

// Delete functions
export async function deleteServicePerson(id: number): Promise<void> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const token = cookieStore.get('token')?.value;
  
  // Check for either accessToken or token (based on authentication inconsistencies)
  const authToken = accessToken || token;
  
  if (!authToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/service-persons/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete service person');
  }
}

export async function deleteServiceZone(id: number): Promise<void> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const token = cookieStore.get('token')?.value;
  
  // Check for either accessToken or token (based on authentication inconsistencies)
  const authToken = accessToken || token;
  
  if (!authToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/service-zones/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete service zone');
  }
}

export async function deleteZoneUser(id: number): Promise<void> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const token = cookieStore.get('token')?.value;
  
  // Check for either accessToken or token (based on authentication inconsistencies)
  const authToken = accessToken || token;
  
  if (!authToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/zone-users/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete zone user');
  }
}
