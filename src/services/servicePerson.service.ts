import { apiClient } from '@/lib/api';

export interface ServiceZone {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface ServicePerson {
  id: number;
  email: string;
  isActive: boolean;
  serviceZones: Array<{
    userId: number;
    serviceZoneId: number;
    serviceZone: ServiceZone;
  }>;
  serviceZone?: ServiceZone; // For backward compatibility
}

export interface CreateServicePersonPayload {
  email: string;
  password: string;
  serviceZoneIds?: number[];
}

export interface UpdateServicePersonPayload {
  email?: string;
  password?: string;
  serviceZoneIds?: number[];
}

export interface ServicePersonsResponse {
  data: ServicePerson[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getServicePersons = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ServicePersonsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    console.log('Fetching service persons from:', `/service-persons?${queryParams}`);
    const response = await apiClient.get(`/service-persons?${queryParams}`);
    
    // If the response is an array, wrap it in the expected format
    if (Array.isArray(response)) {
      return {
        data: response,
        pagination: {
          page: 1,
          limit: response.length,
          total: response.length,
          totalPages: 1
        }
      };
    }
    
    // If response.data is an array, use it directly
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          totalPages: 1
        }
      };
    }
    
    // If it's an object with data and pagination
    if (response.data && (response.data.data || response.data.pagination)) {
      return {
        data: response.data.data || [],
        pagination: response.data.pagination
      };
    }
    
    // If we get here, the response format is unexpected
    console.error('Unexpected API response format:', response);
    return { data: [], pagination: undefined };
  } catch (error) {
    console.error('Error fetching service persons:', error);
    throw error;
  }
};

export const getServicePerson = async (id: number): Promise<ServicePerson> => {
  try {
    const response = await apiClient.get<ServicePerson>(`/service-persons/${id}`);
    if (!response.data) throw new Error('Service person not found');
    return response.data as ServicePerson;
  } catch (error) {
    console.error('Error fetching service person:', error);
    throw error;
  }
};

export const createServicePerson = async (data: CreateServicePersonPayload): Promise<ServicePerson> => {
  try {
    const response = await apiClient.post<ServicePerson>('/service-persons', data);
    if (!response.data) throw new Error('Failed to create service person');
    return response.data as ServicePerson;
  } catch (error) {
    console.error('Error creating service person:', error);
    throw error;
  }
};

export const updateServicePerson = async (id: number, data: UpdateServicePersonPayload): Promise<ServicePerson> => {
  try {
    const response = await apiClient.put<ServicePerson>(`/service-persons/${id}`, data);
    if (!response.data) throw new Error('Failed to update service person');
    return response.data as ServicePerson;
  } catch (error) {
    console.error('Error updating service person:', error);
    throw error;
  }
};

export const deleteServicePerson = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/service-persons/${id}`);
  } catch (error) {
    console.error('Error deleting service person:', error);
    throw error;
  }
};
