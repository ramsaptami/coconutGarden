
import { Tenant, Payment } from '../types'; 

// =================================================================================
// Configuration is now sourced from Environment Variables.
// Please ensure your Vercel project settings (or local .env file) have variables named:
// VITE_SUPABASE_PROJECT_URL
// VITE_SUPABASE_ANON_KEY
// =================================================================================

// Access environment variables
const SUPABASE_PROJECT_URL_FROM_ENV = process.env.VITE_SUPABASE_PROJECT_URL;
const SUPABASE_ANON_KEY_FROM_ENV = process.env.VITE_SUPABASE_ANON_KEY;

const API_BASE_URL = `${SUPABASE_PROJECT_URL_FROM_ENV}/rest/v1`; 

const commonHeaders = {
  'apikey': SUPABASE_ANON_KEY_FROM_ENV!, 
  'Authorization': `Bearer ${SUPABASE_ANON_KEY_FROM_ENV!}`,
  'Content-Type': 'application/json',
};

function checkSupabaseConfiguration() {
  if (!SUPABASE_PROJECT_URL_FROM_ENV && !SUPABASE_ANON_KEY_FROM_ENV) {
    throw new Error("Both VITE_SUPABASE_PROJECT_URL and VITE_SUPABASE_ANON_KEY are not defined in environment variables.");
  }
  if (!SUPABASE_PROJECT_URL_FROM_ENV) {
    throw new Error("VITE_SUPABASE_PROJECT_URL is not defined in environment variables.");
  }
  if (!SUPABASE_ANON_KEY_FROM_ENV) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not defined in environment variables.");
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  // Configuration check should happen before making the fetch call.
  // This function assumes configuration is already validated.
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
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await response.json();
    return data as T;
  }
  // Handle cases where response might be empty or not JSON (e.g. for some 200 OKs on mutations if not returning representation)
  // However, Supabase usually returns JSON or an error.
  // If expecting no content, the caller should handle it or it should be a 204.
  return null as T; 
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

   // For DELETE with Prefer=minimal, a 204 No Content is a success.
   // handleResponse would return null for 204, which is fine for void.
   // But we need to ensure other errors are still thrown.
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
  // If response.ok (e.g. 204), do nothing for a void function.
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
