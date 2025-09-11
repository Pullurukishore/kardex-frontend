export interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  companyName: string;
  address: string;
  industry: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  notes?: string;
  timezone: string;
  isActive: boolean;
  serviceZoneId?: number;
  serviceZone?: {
    id: number;
    name: string;
  };
  _count: {
    assets: number;
    contacts: number;
    tickets: number;
  };
  contacts: Contact[];
  assets: any[];
  tickets: any[];
  createdAt: string;
  updatedAt: string;
  createdById: number;
  updatedById: number;
}

export interface CustomerFormData {
  companyName: string;
  industry: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  serviceZoneId?: number;
}
