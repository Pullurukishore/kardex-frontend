export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedTo?: string;
  assignedToName?: string;
  createdByName: string;
  dueDate?: string;
  labels?: string[];
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  comments?: Array<{
    id: string;
    text: string;
    createdAt: string;
    createdBy: string;
    createdByName: string;
  }>;
  history?: Array<{
    id: string;
    field: string;
    oldValue: string;
    newValue: string;
    changedAt: string;
    changedBy: string;
    changedByName: string;
  }>;
}

export interface TicketFormData {
  title: string;
  description: string;
  priority: TicketPriority;
  assignedTo?: string;
  dueDate?: string;
  labels?: string[];
}

export interface TicketFilterOptions {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  assignedTo?: string[];
  createdBy?: string[];
  labels?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  search?: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  reopened: number;
  cancelled: number;
  byPriority: Record<TicketPriority, number>;
  byStatus: Record<TicketStatus, number>;
  byAssignee: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  byLabel: Array<{
    label: string;
    count: number;
  }>;
}
