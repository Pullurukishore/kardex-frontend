import api from '@/lib/api/axios';

// Types
export interface ServiceZonePerformance {
  id: string;
  name: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  slaCompliance: number;
  customerSatisfaction: number;
  technicianCount: number;
  activeCustomers: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface TechnicianEfficiency {
  technicianId: string;
  name: string;
  zoneId: string;
  zoneName: string;
  ticketsResolved: number;
  avgResolutionTime: number;
  firstTimeFixRate: number;
  customerRating: number;
  utilization: number;
  travelTime: number;
  partsAvailability: number;
}

export interface FSAData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  serviceZones: ServiceZonePerformance[];
  technicianEfficiency: TechnicianEfficiency[];
  overallMetrics: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    slaCompliance: number;
    customerSatisfaction: number;
    firstTimeFixRate: number;
    technicianUtilization: number;
  };
}

export const fetchFSAData = async (startDate?: string, endDate?: string): Promise<FSAData> => {
  try {
    const response = await api.get('/fsa', { 
      params: { 
        startDate,
        endDate 
      } 
    });
    
    const data = response.data;
    
    // Transform the data to match our frontend format
    const serviceZones = data.serviceZones?.map((zone: any) => ({
      id: zone.id.toString(),
      name: zone.name,
      totalTickets: zone.totalTickets || 0,
      openTickets: zone.openTickets || 0,
      resolvedTickets: zone.resolvedTickets || 0,
      avgResolutionTime: zone.avgResolutionTime || 0,
      slaCompliance: zone.slaCompliance || 0,
      customerSatisfaction: zone.customerSatisfaction || 0,
      technicianCount: zone.technicianCount || 0,
      activeCustomers: zone.activeCustomers || 0,
      revenue: zone.revenue || 0,
      cost: zone.cost || 0,
      profit: (zone.revenue || 0) - (zone.cost || 0)
    })) || [];
    
    const technicianEfficiency = data.technicianEfficiency?.map((tech: any) => ({
      technicianId: tech.id.toString(),
      name: tech.name || 'Unnamed Technician',
      zoneId: tech.zoneId?.toString() || '',
      zoneName: tech.zoneName || 'Unassigned',
      ticketsResolved: tech.ticketsResolved || 0,
      avgResolutionTime: tech.avgResolutionTime || 0,
      firstTimeFixRate: tech.firstTimeFixRate || 0,
      customerRating: tech.customerRating || 0,
      utilization: tech.utilization || 0,
      travelTime: tech.travelTime || 0,
      partsAvailability: tech.partsAvailability || 0
    })) || [];
    
    return {
      dateRange: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
      },
      serviceZones,
      technicianEfficiency,
      overallMetrics: {
        totalTickets: data.totalTickets || 0,
        openTickets: data.openTickets || 0,
        resolvedTickets: data.resolvedTickets || 0,
        avgResponseTime: data.avgResponseTime || 0,
        avgResolutionTime: data.avgResolutionTime || 0,
        slaCompliance: data.slaCompliance || 0,
        customerSatisfaction: data.customerSatisfaction || 0,
        firstTimeFixRate: data.firstTimeFixRate || 0,
        technicianUtilization: data.technicianUtilization || 0
      }
    };
  } catch (error) {
    console.error('Error fetching FSA data:', error);
    throw error;
  }
};

export const exportFSAData = async (startDate: string, endDate: string, format: 'csv' | 'pdf' = 'csv') => {
  try {
    const response = await api.get(`/api/fsa/export?format=${format}`, {
      params: { 
        startDate, 
        endDate 
      },
      responseType: 'blob',
    });
    
    // Create a download link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fsa-report-${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  } catch (error) {
    console.error('Error exporting FSA data:', error);
    throw error;
  }
};