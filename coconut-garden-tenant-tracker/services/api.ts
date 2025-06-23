
import { Tenant, Payment } from '../types';

// =================================================================================
// Configuration is now sourced from Environment Variables
// Please set SUPABASE_PROJECT_URL and SUPABASE_ANON_KEY in your Vercel project settings.
// Also ensure API_KEY (for Gemini) is set.
// =================================================================================

const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Check if the configuration values are loaded correctly from environment variables
if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) {
  const errorMsg = "Supabase Project URL or Anon Key is not defined in environment variables. " +
    "Please set SUPABASE_PROJECT_URL and SUPABASE_ANON_KEY in your hosting environment (e.g., Vercel project settings).";
  console.error(errorMsg);
  // The app will load, but API calls will fail. 
  // The UI in App.tsx handles and displays errors if API calls fail due to this.
}

const API_BASE_URL = `${SUPABASE_PROJECT_URL}/rest/v1`;

const commonHeaders = {
  'apikey': SUPABASE_ANON_KEY!,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY!}`,
  'Content-Type': 'application/json',
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) {
    // This check is a bit redundant if the initial check leads to non-functional API_BASE_URL/commonHeaders
    // but kept for safety in case of partial configuration.
    throw new Error("API configuration environment variables are missing. Cannot process the request.");
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
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) throw new Error("API environment variables not configured.");
  const response = await fetch(`${API_BASE_URL}/tenants?select=*&order=name.asc`, {
    headers: commonHeaders,
  });
  return handleResponse<Tenant[]>(response);
}

export async function addTenant(tenantData: Omit<Tenant, 'id'>): Promise<Tenant> {
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) throw new Error("API environment variables not configured.");
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
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) throw new Error("API environment variables not configured.");
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
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) throw new Error("API environment variables not configured.");
  const response = await fetch(`${API_BASE_URL}/payments?select=*&order=created_at.desc`, {
    headers: commonHeaders,
  });
  return handleResponse<Payment[]>(response);
}

export async function recordPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) throw new Error("API environment variables not configured.");
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
