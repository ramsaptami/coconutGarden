
export interface House {
  id: string; // e.g., "H3", "H4"
  house_number: string; // e.g., "3", "4"
  current_tenant_id: string | null;
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
  // house_id is not part of the backend schema for tenants directly
  // but can be useful for client-side logic if needed.
  // For this refactor, primary linking is House.current_tenant_id -> Tenant.id
}

export interface Payment {
  id: string;
  tenant_id: string; 
  month: number; // 1-12
  year: number;
  paid_date: string | null; 
  amount_paid: number; 
}

export enum PaymentStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Overdue = 'Overdue'
}