
export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  work_info: string; // snake_case
  rent_amount: number; // snake_case
  join_date: string; // ISO string, snake_case
  id_proof: boolean; // True if ID proof has been submitted, snake_case
}

export interface Payment {
  id: string;
  tenant_id: string; // snake_case
  month: number; // 1-12
  year: number;
  paid_date: string | null; // ISO string, snake_case
  amount_paid: number; // snake_case
}

export enum PaymentStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Overdue = 'Overdue'
}
