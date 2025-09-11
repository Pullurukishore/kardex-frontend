export enum TicketStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROCESS = 'IN_PROCESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  ONSITE_VISIT = 'ONSITE_VISIT',
  ONSITE_VISIT_PLANNED = 'ONSITE_VISIT_PLANNED',
  PO_NEEDED = 'PO_NEEDED',
  PO_RECEIVED = 'PO_RECEIVED',
  SPARE_PARTS_NEEDED = 'SPARE_PARTS_NEEDED',
  SPARE_PARTS_BOOKED = 'SPARE_PARTS_BOOKED',
  SPARE_PARTS_DELIVERED = 'SPARE_PARTS_DELIVERED',
  CLOSED_PENDING = 'CLOSED_PENDING',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  REOPENED = 'REOPENED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  RESOLVED = 'RESOLVED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface User {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'ZONE_USER' | 'SERVICE_PERSON';
  isActive?: boolean;
}

export interface Customer {
  id: number;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Asset {
  id: number;
  machineId?: string;
  model: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyEndDate?: string;
  amcEndDate?: string;
  softwareVersion?: string;
  installationDate?: string;
  relatedMachineIds?: number[];
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface Comment {
  id: number;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: User;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  lastStatusChange?: string;
  resolvedAt?: string;
  closedAt?: string;
  onsiteVisitDate?: string;
  errorDetails?: string;
  proofImages?: string[];
  relatedMachineIds?: number[];
  sparePartsDetails?: any;
  poNumber?: string;
  poApprovedAt?: string;
  feedback?: string;
  rating?: number;
  customer: Customer;
  createdBy: User;
  owner: User;
  assignedTo?: User;
  subOwner?: User;
  poApprovedBy?: User;
  asset?: Asset;
  contact?: any;
  zone?: any;
  comments?: Comment[];
  statusHistory?: TicketStatusHistory[];
  poRequests?: PORequest[];
}

export interface TicketFormData {
  title: string;
  description: string;
  priority: Priority;
  customerId: number;
  contactId: number;
  serviceZoneId: number;
  assetId: number;
  errorDetails?: string;
  proofImages: string[];
  relatedAssetIds: number[];
}

export interface TicketFilterOptions {
  status?: TicketStatus;
  priority?: Priority;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StatusUpdateData {
  status: TicketStatus;
  comments?: string;
}

export interface AssignTicketData {
  assignedToId: number;
}

export interface AddCommentData {
  content: string;
  isInternal?: boolean;
}

export interface TicketStatusHistory {
  id: number;
  ticketId: number;
  status: TicketStatus;
  changedById: number;
  changedAt: string;
  notes?: string;
  changedBy: User;
}

export interface PORequest {
  id: number;
  ticketId: number;
  amount?: number;
  description: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedById: number;
  approvedById?: number;
  requestedAt: string;
  approvedAt?: string;
  requestedBy: User;
  approvedBy?: User;
}

export interface AssignToZoneUserData {
  zoneUserId: number;
}

export interface PlanOnsiteVisitData {
  servicePersonId: number;
  visitDate: string;
  notes?: string;
}

export interface CompleteOnsiteVisitData {
  resolutionSummary: string;
  isResolved: boolean;
  sparePartsNeeded?: boolean;
  sparePartsDetails?: any;
}

export interface RequestPOData {
  description: string;
  amount?: number;
  notes?: string;
}

export interface ApprovePOData {
  poNumber: string;
  notes?: string;
}

export interface UpdateSparePartsData {
  status: 'BOOKED' | 'DELIVERED';
  details?: any;
}

export interface CloseTicketData {
  feedback?: string;
  rating?: number;
}

export interface AddNoteData {
  content: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'TICKET_CREATED' | 'TICKET_UPDATED' | 'TICKET_COMMENT' | 'TICKET_ASSIGNED' | 'PO_CREATED' | 'PO_UPDATED' | 'PO_APPROVAL' | 'SYSTEM_ALERT' | 'MAINTENANCE' | 'OTHER';
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  data?: any;
  createdAt: string;
  readAt?: string;
}
