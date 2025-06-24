/// <reference types="vite/client" />

import { Tenant, Payment, House } from '../types';

// =================================================================================
// Configuration is now sourced from Environment Variables.
// Please ensure your Vercel project settings (or local .env file) have variables named:
// VITE_SUPABASE_PROJECT_URL
// VITE_SUPABASE_ANON_KEY
// =================================================================================

// Use import.meta.env for Vite projects
const SUPABASE_PROJECT_URL_FROM_ENV = import.meta.env.VITE_SUPABASE_PROJECT_URL;
const SUPABASE_ANON_KEY_FROM_ENV = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  checkSupabaseConfiguration(); // Still good to check config
  // For now, returning a static list as the backend table might not exist yet for the user.
  // The App.tsx will initialize with its own static list. This function is a placeholder.
  console.warn("API: fetchHouses is returning a placeholder. Implement backend integration.");
  // Example of what it might look like if fetching:
  // const response = await fetch(`${API_BASE_URL}/houses?select=*`, { headers: commonHeaders });
  // return handleResponse<House[]>(response);
  return Promise.resolve([
    { id: "H3", house_number: "3", current_tenant_id: null },
    { id: "H4", house_number: "4", current_tenant_id: null },
    { id: "H5", house_number: "5", current_tenant_id: null },
    { id: "H6", house_number: "6", current_tenant_id: null },
    { id: "H8", house_number: "8", current_tenant_id: null },
    { id: "H9", house_number: "9", current_tenant_id: null },
  ]);
}

export async function updateHouse(houseId: string, data: Partial<Pick<House, 'current_tenant_id'>>): Promise<House> {
  checkSupabaseConfiguration();
  const response = await fetch(`${API_BASE_URL}/houses?id=eq.${houseId}`, {
    method: 'PATCH',
    headers: {
      ...commonHeaders,
      'Prefer': 'return=representation',
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
  const response = await fetch(`${API_BASE_URL}/tenants?select=*&order=name.asc`, {
    headers: commonHeaders,
  });
  return handleResponse<Tenant[]>(response);
}

// Tenant data no longer includes house_id directly for this simplified model.
// The link is managed by House.current_tenant_id.
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
  // If this tenant is assigned to a house, the App.tsx logic should first call updateHouse
  // to set current_tenant_id to null before calling this.
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