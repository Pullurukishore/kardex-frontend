import { apiClient } from './client';
import { 
  DashboardData, 
  TicketStatus, 
  TicketPriority, 
  RecentTicket, 
  TicketTrend, 
  ZoneWiseTicket,
  DashboardStats
} from '@/types/dashboard.types';

/**
 * Fetches the main dashboard data based on user role
 */
export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await apiClient.get('/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

/**
 * Fetches admin-specific statistics
 */
export const fetchAdminStats = async (): Promise<DashboardStats> => {
  try {
    const response = await apiClient.get('/dashboard/admin-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

/**
 * Fetches recent tickets with optional limit
 * @param limit Number of recent tickets to fetch (default: 10)
 */
export const fetchRecentTickets = async (limit: number = 10): Promise<RecentTicket[]> => {
  try {
    const response = await apiClient.get('/dashboard/recent-tickets', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent tickets:', error);
    throw error;
  }
};

/**
 * Fetches ticket status distribution
 */
export const fetchTicketStatusDistribution = async (): Promise<{ [key: string]: number }> => {
  try {
    const response = await apiClient.get('/dashboard/tickets/status-distribution');
    return response.data;
  } catch (error) {
    console.error('Error fetching ticket status distribution:', error);
    throw error;
  }
};

/**
 * Fetches ticket trends over time
 * @param days Number of days to fetch trends for (default: 30)
 */
export const fetchTicketTrends = async (days: number = 30): Promise<TicketTrend[]> => {
  try {
    const response = await apiClient.get('/dashboard/tickets/trends', {
      params: { days }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching ticket trends:', error);
    throw error;
  }
};

/**
 * Fetches zone-wise ticket statistics
 */
export const fetchZoneWiseTickets = async (): Promise<ZoneWiseTicket[]> => {
  try {
    const response = await apiClient.get('/dashboard/zones/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching zone-wise tickets:', error);
    return [];
  }
};

/**
 * Fetches SLA compliance metrics
 */
export const fetchSlaCompliance = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/dashboard/metrics/sla-compliance');
    return response.data.complianceRate;
  } catch (error) {
    console.error('Error fetching SLA compliance:', error);
    return 0;
  }
};

/**
 * Fetches average response time
 */
export const fetchAvgResponseTime = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/dashboard/metrics/avg-response-time');
    return response.data.avgResponseTime;
  } catch (error) {
    console.error('Error fetching average response time:', error);
    return 0;
  }
};
