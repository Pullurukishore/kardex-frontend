import { UserRole } from './user.types';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface RecentTicket {
  id: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    name: string;
  };
  assignedTo?: {
    id: number;
    name: string;
  };
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface PriorityCount {
  priority: string;
  count: number;
}

export interface ZoneWiseTicket {
  id: number;
  name: string;
  totalTickets: number;
  servicePersonCount: number;
  customerCount: number;
}

export interface TicketTrend {
  date: string;
  count: number;
  status: string;
}

export interface AdminStats {
  totalCustomers: number;
  totalServicePersons: number;
  totalServiceZones: number;
  totalZones: number;
  ticketStatusDistribution: Record<string, number>;
  ticketTrends: TicketTrend[];
  zoneWiseTickets: ZoneWiseTicket[];
  recentTickets?: RecentTicket[];
  avgResponseTime: number;
  avgResolutionTime: string;
  overdueTickets: number;
  slaCompliance: number;
}

export interface KPI {
  value: number | string;
  change?: number | string;
  isPositive?: boolean;
  unit?: string;
  critical?: boolean;
}

export interface TicketDistribution {
  byStatus: Array<{ name: string; value: number }>;
  byPriority: Array<{ name: string; value: number }>;
}

export interface DashboardKPIs {
  totalTickets: KPI;
  slaCompliance: KPI;
  avgResponseTime: KPI;
  avgResolutionTime: KPI;
  activeCustomers: KPI;
  activeServicePersons: KPI;
  totalServiceZones: KPI;
  totalZones: KPI;
  overdueTickets: KPI;
  unassignedTickets: KPI;
}

export interface DashboardStats {
  kpis: DashboardKPIs;
  ticketDistribution: TicketDistribution;
  ticketStatusDistribution: Record<string, number>;
  ticketTrends: TicketTrend[];
  zoneWiseTickets: ZoneWiseTicket[];
  alerts: any[];
  recentActivity: any[];
}

export interface DashboardData {
  stats: {
    kpis: DashboardKPIs;
    ticketDistribution: TicketDistribution;
  };
  recentTickets: RecentTicket[];
  adminStats?: AdminStats;
  userRole: UserRole;
  totalServiceZones: number;
  totalServicePersons: number;
  totalZones: number;
  ticketStatusDistribution: Record<string, number>;
  ticketTrends: TicketTrend[];
  zoneWiseTickets: ZoneWiseTicket[];
}
