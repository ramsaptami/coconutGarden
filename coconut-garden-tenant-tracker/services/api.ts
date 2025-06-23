
import { Tenant, Payment } from '../types';

// =================================================================================
// Configuration is now sourced from Environment Variables using Vite's standard.
// Please ensure your Vercel project settings have variables named:
// VITE_SUPABASE_PROJECT_URL
// VITE_SUPABASE_ANON_KEY
// =================================================================================

const VITE_SUPABASE_PROJECT_URL = process.env.VITE_SUPABASE_PROJECT_URL;
const VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const API_BASE_URL = `${VITE_SUPABASE_PROJECT_URL}/rest/v1`;

const commonHeaders = {
  'apikey': VITE_SUPABASE_ANON_KEY!,
  'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY!}`,
  'Content-Type': 'application/json',
};

function checkSupabaseConfiguration() {
  if (!VITE_SUPABASE_PROJECT_URL && !VITE_SUPABASE_ANON_KEY) {
    throw new Error("Both VITE_SUPABASE_PROJECT_URL and VITE_SUPABASE_ANON_KEY are not defined in environment variables.");
  }
  if (!VITE_SUPABASE_PROJECT_URL) {
    throw new Error("VITE_SUPABASE_PROJECT_URL is not defined in environment variables.");
  }
  if (!VITE_SUPABASE_ANON_KEY) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not defined in environment variables.");
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!VITE_SUPABASE_PROJECT_URL || !VITE_SUPABASE_ANON_KEY) {
    // This check is slightly redundant if calling functions check first, but good safeguard.
    throw new Error("API configuration (Vite-prefixed) environment variables are missing. Cannot process the request.");
  }
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorData.details || errorData.hint || errorMessage;
    } catch (e) {
      // Ignore if error response is not JSON
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) { // For DELETE with Prefer: return=minimal
    return null as T;
  }
  const data = await response.json();
  return data as T;
}

// Tenant API Functions
export async function fetchTenants(): Promise<Tenant[]> {
  checkSupabaseConfiguration();
  const response = await fetch(`${API_BASE_URL}/tenants?select=*&order=name.asc`, {
    headers: commonHeaders,
  });
  return handleResponse<Tenant[]>(response);
}

export async function addTenant(tenantData: Omit<Tenant, 'id'>): Promise<Tenant> {
  checkSupabaseConfiguration();
  const response = await fetch(`${API_BASE_URL}/tenants`, {
    method: 'POST',
    headers: {
      ...commonHeaders,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(tenantData),
  });
  const newTenants = await handleResponse<Tenant[]>(response);
  if (newTenants && newTenants.length > 0) {
    return newTenants[0];
  }
  throw new Error("Tenant creation did not return the new tenant data.");
}

export async function deleteTenant(tenantId: string): Promise<void> {
  checkSupabaseConfiguration();
  const deleteUrl = `${API_BASE_URL}/tenants?id=eq.${tenantId}`;

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      ...commonHeaders,
      'Prefer': 'return=minimal',
    },
  });

  if (!response.ok && response.status !== 204) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    let errorDetails = null;
    try {
      errorDetails = await response.json();
      errorMessage = errorDetails.message || errorDetails.error || errorDetails.details || errorDetails.hint || errorMessage;
    } catch (e) {
      // Ignore if error response is not JSON
    }
    console.error(`Failed to delete tenant ${tenantId}. Status: ${response.status}. URL: ${deleteUrl}. Details:`, errorDetails || 'No JSON details provided by API.');
    throw new Error(errorMessage);
  }
}

// Payment API Functions
export async function fetchPayments(): Promise<Payment[]> {
  checkSupabaseConfiguration();
  const response = await fetch(`${API_BASE_URL}/payments?select=*&order=created_at.desc`, {
    headers: commonHeaders,
  });
  return handleResponse<Payment[]>(response);
}

export async function recordPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
  checkSupabaseConfiguration();
  const response = await fetch(`${API_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      ...commonHeaders,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(paymentData),
  });
  const newPayments = await handleResponse<Payment[]>(response);
  if (newPayments && newPayments.length > 0) {
    return newPayments[0];
  }
  throw new Error("Payment recording did not return the new payment data.");
}