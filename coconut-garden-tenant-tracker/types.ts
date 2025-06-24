
export interface House {
  id: string; // e.g., "H3", "H4"
  house_number: string; // e.g., "3", "4"
  current_tenant_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  work_info: string; 
  rent_amount: number; 
  join_date: string; 
  id_proof: boolean; 
  created_at?: string;
  updated_at?: string;
  // house_id is not part of the backend schema for tenants directly
  // but can be useful for client-side logic if needed.
  // For this refactor, primary linking is House.current_tenant_id -> Tenant.id
}

export interface Payment {
  id: string;
  tenant_id: string; 
  house_id?: string | null; // New: To link payment to the house at time of payment
  month: number; // 1-12
  year: number;
  paid_date: string | null; 
  amount_paid: number; 
  created_at?: string;
  updated_at?: string;
}

export enum PaymentStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Overdue = 'Overdue'
}

export interface HouseWithTenantAndPayment extends House {
  tenant: Tenant | null;
  paymentForCurrentMonth?: Payment;
  paymentStatus: PaymentStatus;
}