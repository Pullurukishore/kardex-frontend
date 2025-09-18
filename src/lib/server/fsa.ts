import { cookies } from 'next/headers';
import type { 
  FSADashboardData, 
  ZoneAnalytics, 
  RealTimeMetrics, 
  PredictiveAnalytics,
  AdvancedPerformanceMetrics,
  EquipmentAnalytics,
  CustomerSatisfactionMetrics,
  ResourceOptimization
} from '@/types/fsa';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api';

// Helper function to make authenticated requests
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

// Get comprehensive FSA dashboard data
export async function getFSADashboardData(params: {
  timeframe?: string;
  zoneId?: string;
  userId?: string;
} = {}): Promise<FSADashboardData> {
  try {
    const searchParams = new URLSearchParams();
    if (params.timeframe) searchParams.append('timeframe', params.timeframe);
    if (params.zoneId) searchParams.append('zoneId', params.zoneId);
    if (params.userId) searchParams.append('userId', params.userId);

    const response = await makeServerRequest(`/fsa/dashboard?${searchParams.toString()}`);
    
    if (!response.success || !response.data?.dashboard) {
      throw new Error('Invalid FSA dashboard response');
    }

    return response.data.dashboard;
  } catch (error) {
    console.error('Error fetching FSA dashboard data:', error);
    // Return fallback data
    return {
      overview: {
        totalZones: 0,
        totalTickets: 0,
        resolvedTickets: 0,
        resolutionRate: 0,
        slaCompliance: 0,
        avgResolutionTime: 0,
      },
      distribution: {
        byStatus: [],
        byPriority: [],
      },
      performance: {
        zonePerformance: [],
        topPerformers: [],
      },
    };
  }
}

// Get zone-specific analytics
export async function getZoneAnalytics(zoneId: string, timeframe: string = '30d'): Promise<ZoneAnalytics> {
  try {
    const response = await makeServerRequest(`/fsa/zones/${zoneId}/analytics?timeframe=${timeframe}`);
    
    if (!response.success) {
      throw new Error('Failed to fetch zone analytics');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching zone analytics:', error);
    throw error;
  }
}

// Get real-time metrics
export async function getRealTimeMetrics(): Promise<RealTimeMetrics> {
  try {
    const response = await makeServerRequest('/fsa/realtime');
    
    if (!response.success) {
      throw new Error('Failed to fetch real-time metrics');
    }

    return response.data;
  } catch (error) {
    // Silently handle 404s for endpoints that don't exist yet
    if (error instanceof Error && error.message.includes('404')) {
      console.log('Real-time metrics endpoint not available, using fallback data');
    } else {
      console.error('Error fetching real-time metrics:', error);
    }
    return {
      activeTickets: 0,
      pendingTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      activeServicePersons: 0,
      offlineServicePersons: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Get predictive analytics
export async function getPredictiveAnalytics(timeframe: string = '30d'): Promise<PredictiveAnalytics> {
  try {
    const response = await makeServerRequest(`/fsa/predictive?timeframe=${timeframe}`);
    
    if (!response.success) {
      throw new Error('Failed to fetch predictive analytics');
    }

    return response.data;
  } catch (error) {
    // Silently handle 404s for endpoints that don't exist yet
    if (error instanceof Error && error.message.includes('404')) {
      console.log('Predictive analytics endpoint not available, using fallback data');
    } else {
      console.error('Error fetching predictive analytics:', error);
    }
    return {
      predictedTickets: [],
      ticketTrend: 'stable',
      trendPercentage: 0,
      highPriorityPrediction: 0,
      resourceUtilization: 0,
    };
  }
}

// Get advanced performance metrics
export async function getAdvancedPerformanceMetrics(timeframe: string = '30d'): Promise<AdvancedPerformanceMetrics> {
  try {
    const response = await makeServerRequest(`/fsa/performance/advanced?timeframe=${timeframe}`);
    
    if (!response.success) {
      throw new Error('Failed to fetch advanced performance metrics');
    }

    return response.data;
  } catch (error) {
    // Silently handle 404s for endpoints that don't exist yet
    if (error instanceof Error && error.message.includes('404')) {
      console.log('Advanced performance metrics endpoint not available, using fallback data');
    } else {
      console.error('Error fetching advanced performance metrics:', error);
    }
    return {
      firstResponseTime: 0,
      firstContactResolution: 0,
      reOpenRate: 0,
      customerSatisfactionScore: 0,
      ticketVolumeTrend: 0,
      resolutionTrend: 0,
      slaComplianceRate: 0,
      escalationRate: 0,
    };
  }
}

// Get equipment analytics
export async function getEquipmentAnalytics(): Promise<EquipmentAnalytics> {
  try {
    const response = await makeServerRequest('/fsa/equipment/analytics');
    
    if (!response.success) {
      throw new Error('Failed to fetch equipment analytics');
    }

    return response.data;
  } catch (error) {
    // Silently handle 404s for endpoints that don't exist yet
    if (error instanceof Error && error.message.includes('404')) {
      console.log('Equipment analytics endpoint not available, using fallback data');
    } else {
      console.error('Error fetching equipment analytics:', error);
    }
    return {
      equipmentByStatus: [],
      maintenanceSchedule: [],
      failureRates: [],
    };
  }
}

// Get customer satisfaction metrics
export async function getCustomerSatisfactionMetrics(timeframe: string = '30d'): Promise<CustomerSatisfactionMetrics> {
  try {
    const response = await makeServerRequest(`/fsa/satisfaction?timeframe=${timeframe}`);
    
    if (!response.success) {
      throw new Error('Failed to fetch customer satisfaction metrics');
    }

    return response.data;
  } catch (error) {
    // Silently handle 404s for endpoints that don't exist yet
    if (error instanceof Error && error.message.includes('404')) {
      console.log('Customer satisfaction metrics endpoint not available, using fallback data');
    } else {
      console.error('Error fetching customer satisfaction metrics:', error);
    }
    return {
      overallScore: 0,
      responseTimeRating: 0,
      resolutionRating: 0,
      serviceRating: 0,
      feedback: [],
      trend: 'stable',
      trendPercentage: 0,
    };
  }
}

// Get resource optimization data
export async function getResourceOptimization(): Promise<ResourceOptimization> {
  try {
    const response = await makeServerRequest('/fsa/optimization');
    
    if (!response.success) {
      throw new Error('Failed to fetch resource optimization data');
    }

    return response.data;
  } catch (error) {
    // Silently handle 404s for endpoints that don't exist yet
    if (error instanceof Error && error.message.includes('404')) {
      console.log('Resource optimization endpoint not available, using fallback data');
    } else {
      console.error('Error fetching resource optimization data:', error);
    }
    return {
      resourceAllocation: [],
      costSavings: {
        potentialMonthlySavings: 0,
        optimizationAreas: [],
      },
      recommendations: [],
    };
  }
}

// Get zone FSA dashboard data with fallback
export async function getZoneFSADashboardData(params: {
  timeframe?: string;
  zoneId?: string;
} = {}): Promise<{
  dashboardData: any;
  zoneAnalytics: any;
}> {
  try {
    const { timeframe = '30d', zoneId } = params;

    // Fetch dashboard data
    const dashboardResponse = await makeServerRequest(`/fsa/dashboard?timeframe=${timeframe}`);
    
    let dashboardData = null;
    if (dashboardResponse.success) {
      dashboardData = dashboardResponse.data.dashboard;
    }

    // Try to fetch zone analytics if zoneId is provided
    let zoneAnalytics = null;
    if (zoneId) {
      try {
        const zoneResponse = await makeServerRequest(`/fsa/zones/${zoneId}?timeframe=${timeframe}`);
        if (zoneResponse.success) {
          zoneAnalytics = zoneResponse.data;
        }
      } catch (zoneError) {
        console.warn('Could not fetch zone analytics:', zoneError);
      }
    }

    // If no dashboard data, provide fallback
    if (!dashboardData) {
      dashboardData = {
        overview: {
          totalTickets: 0,
          openTickets: 0,
          resolvedTickets: 0,
          resolutionRate: 0,
          avgResolutionTime: '0',
          slaCompliance: 0,
        },
        distribution: {
          byStatus: [],
          byPriority: [],
        },
        recentActivity: {
          tickets: [],
        },
        performance: null,
      };
    }

    return {
      dashboardData,
      zoneAnalytics,
    };
  } catch (error) {
    console.error('Error fetching zone FSA dashboard data:', error);
    // Return fallback data
    return {
      dashboardData: {
        overview: {
          totalTickets: 0,
          openTickets: 0,
          resolvedTickets: 0,
          resolutionRate: 0,
          avgResolutionTime: '0',
          slaCompliance: 0,
        },
        distribution: {
          byStatus: [],
          byPriority: [],
        },
        recentActivity: {
          tickets: [],
        },
        performance: null,
      },
      zoneAnalytics: null,
    };
  }
}

// Get all FSA data for comprehensive dashboard
export async function getAllFSAData(params: {
  timeframe?: string;
  zoneId?: string;
  includeRealTime?: boolean;
  includePredictive?: boolean;
  includeAdvanced?: boolean;
} = {}) {
  try {
    const {
      timeframe = '30d',
      zoneId,
      includeRealTime = true,
      includePredictive = false,
      includeAdvanced = false,
    } = params;

    // Fetch core dashboard data
    const dashboardData = await getFSADashboardData({ timeframe, zoneId });

    // Fetch additional data based on flags
    const [
      realTimeMetrics,
      predictiveAnalytics,
      advancedMetrics,
      equipmentAnalytics,
      satisfactionMetrics,
      resourceOptimization,
    ] = await Promise.allSettled([
      includeRealTime ? getRealTimeMetrics() : Promise.resolve(null),
      includePredictive ? getPredictiveAnalytics(timeframe) : Promise.resolve(null),
      includeAdvanced ? getAdvancedPerformanceMetrics(timeframe) : Promise.resolve(null),
      getEquipmentAnalytics(),
      getCustomerSatisfactionMetrics(timeframe),
      getResourceOptimization(),
    ]);

    return {
      dashboard: dashboardData,
      realTime: realTimeMetrics.status === 'fulfilled' ? realTimeMetrics.value : null,
      predictive: predictiveAnalytics.status === 'fulfilled' ? predictiveAnalytics.value : null,
      advanced: advancedMetrics.status === 'fulfilled' ? advancedMetrics.value : null,
      equipment: equipmentAnalytics.status === 'fulfilled' ? equipmentAnalytics.value : null,
      satisfaction: satisfactionMetrics.status === 'fulfilled' ? satisfactionMetrics.value : null,
      optimization: resourceOptimization.status === 'fulfilled' ? resourceOptimization.value : null,
    };
  } catch (error) {
    console.error('Error fetching all FSA data:', error);
    throw error;
  }
}