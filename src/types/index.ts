export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface TicketFormValues {
  title: string;
  description: string;
  priority: Priority;
  customerId: string;
  contactId: string;
  assetId?: string;
  zoneId: string;
  errorDetails?: string;
}
