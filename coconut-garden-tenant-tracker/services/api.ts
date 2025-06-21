import { Tenant, Payment } from '../types'; 
import { SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY } from '../config'; // Import from config.ts

// =================================================================================
// Configuration is now in config.ts
// REMEMBER TO ADD config.ts TO YOUR .gitignore FILE!
// =================================================_================================

// Check if the configuration values are loaded correctly
if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) {
  const errorMsg = "Supabase Project URL or Anon Key is missing. Please check your config.ts file.";
  console.error(errorMsg);
  // Optionally, you could throw an error here to stop the app from trying to make API calls
  // throw new Error(errorMsg); 
  // For now, we'll allow the app to load, but API calls will fail.
  // UI should ideally handle this by showing a persistent error.
}

const API_BASE_URL = `${SUPABASE_PROJECT_URL}/rest/v1`;

const commonHeaders = {
  'apikey': SUPABASE_ANON_KEY!, // Use non-null assertion as we've "checked" above (or handle more gracefully)
  'Authorization': `Bearer ${SUPABASE_ANON_KEY!}`, // Use non-null assertion
  'Content-Type': 'application/json',
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) {
    throw new Error("API configuration is missing. Cannot process the request.");
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
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) throw new Error("API not configured.");
  const response = await fetch(`${API_BASE_URL}/tenants?select=*&order=name.asc`, {
    headers: commonHeaders,
  });
  return handleResponse<Tenant[]>(response);
}

export async function addTenant(tenantData: Omit<Tenant, 'id'>): Promise<Tenant> {
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) throw new Error("API not configured.");
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
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) throw new Error("API not configured.");
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
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) throw new Error("API not configured.");
  const response = await fetch(`${API_BASE_URL}/payments?select=*&order=created_at.desc`, {
    headers: commonHeaders,
  });
  return handleResponse<Payment[]>(response);
}

export async function recordPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
  if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) throw new Error("API not configured.");
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