
// import.meta.env is a Vite-specific feature.
// If type errors occur, ensure your tsconfig.json includes "vite/client" in compilerOptions.types

import { Tenant, Payment, House } from '../types'; 

// =================================================================================
// Configuration is now sourced from Environment Variables using Vite's import.meta.env
// Please ensure your Vercel project settings (or local .env file) have variables named:
// VITE_SUPABASE_PROJECT_URL
// VITE_SUPABASE_ANON_KEY
// =================================================================================

// Safely access import.meta.env
const envFromImportMeta = (import.meta as any)?.env;

const SUPABASE_PROJECT_URL_FROM_ENV = envFromImportMeta ? envFromImportMeta.VITE_SUPABASE_PROJECT_URL : undefined;
const SUPABASE_ANON_KEY_FROM_ENV = envFromImportMeta ? envFromImportMeta.VITE_SUPABASE_ANON_KEY : undefined;


const API_BASE_URL = SUPABASE_PROJECT_URL_FROM_ENV ? `${SUPABASE_PROJECT_URL_FROM_ENV}/rest/v1` : '/rest/v1'; 

const commonHeaders = {
  'apikey': SUPABASE_ANON_KEY_FROM_ENV!, 
  'Authorization': `Bearer ${SUPABASE_ANON_KEY_FROM_ENV!}`,
  'Content-Type': 'application/json',
};

function checkSupabaseConfiguration() {
  let missingVars = [];
  if (!SUPABASE_PROJECT_URL_FROM_ENV) {
    missingVars.push("VITE_SUPABASE_PROJECT_URL");
  }
  if (!SUPABASE_ANON_KEY_FROM_ENV) {
    missingVars.push("VITE_SUPABASE_ANON_KEY");
  }

  if (missingVars.length > 0) {
    throw new Error(`${missingVars.join(' and ')} ${missingVars.length > 1 ? 'are' : 'is'} not defined in environment variables. Ensure env vars are set (e.g., in .env file for local development or Vercel project settings for deployment). For local development, you must run the app using the Vite development server (e.g., 'npm run dev').`);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
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
  if (response.status === 204) { 
    return null as T; 
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await response.json();
    return data as T;
  }
  return null as T; 
}

// House API Functions
// SIMULATED: In a real scenario, this would fetch from your Supabase 'houses' table.
export async function fetchHouses(): Promise<House[]> {
  checkSupabaseConfiguration(); 
  // console.warn("API: fetchHouses is returning a placeholder. Implement backend integration.");
  // Example of what it might look like if fetching:
  const response = await fetch(`${API_BASE_URL}/houses?select=*`, { headers: commonHeaders });
  return handleResponse<House[]>(response);
  // return Promise.resolve([
  //   { id: "H3", house_number: "3", current_tenant_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  //   { id: "H4", house_number: "4", current_tenant_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  //   { id: "H5", house_number: "5", current_tenant_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  //   { id: "H6", house_number: "6", current_tenant_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  //   { id: "H8", house_number: "8", current_tenant_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  //   { id: "H9", house_number: "9", current_tenant_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // ]);
}

export async function updateHouse(houseId: string, data: Partial<Pick<House, 'current_tenant_id'>>): Promise<House> {
  checkSupabaseConfiguration();
  const response = await fetch(`${API_BASE_URL}/houses?id=eq.${houseId}`, {
    method: 'PATCH',
    headers: {
      ...commonHeaders,
      'Prefer': 'return=representation', // Ensures the updated record is returned
    },
    body: JSON.stringify(data),
  });
  const updatedHouses = await handleResponse<House[]>(response);
  if (updatedHouses && updatedHouses.length > 0) {
    return updatedHouses[0];
  }
  throw new Error("House update did not return the updated house data.");
}


// Tenant API Functions
export async function fetchTenants(): Promise<Tenant[]> {
  checkSupabaseConfiguration();
  const response = await fetch(`${API_BASE_URL}/tenants?select=*&order=created_at.desc`, { 
    headers: commonHeaders,
  });
  return handleResponse<Tenant[]>(response);
}

export async function addTenant(tenantData: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>): Promise<Tenant> {
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

// Modified to accept a single payment or an array of payments for bulk insert.
export async function recordPayment(
  paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'> | Omit<Payment, 'id' | 'created_at' | 'updated_at'>[]
): Promise<Payment[]> { // Always returns an array, even if one payment was sent.
  checkSupabaseConfiguration();
  const response = await fetch(`${API_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      ...commonHeaders,
      'Prefer': 'return=representation', // Ensures Supabase returns the inserted row(s)
    },
    body: JSON.stringify(paymentData), // Supabase accepts an array for bulk insert
  });
  
  // Supabase returns an array of the created objects.
  const newPayments = await handleResponse<Payment[]>(response); 
  if (newPayments && newPayments.length > 0) {
    return newPayments;
  }
  // If paymentData was an empty array, or something went wrong but didn't throw an error.
  if (Array.isArray(paymentData) && paymentData.length === 0) return [];
  
  throw new Error("Payment recording did not return the new payment data or an empty array for empty input.");
}