

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { House, Tenant, Payment, PaymentStatus, HouseWithTenantAndPayment } from './types'; 
import { RENT_DUE_DAY } from './constants';
import * as api from './services/api'; 
import { generateReminderMessage } from './services/formatService';

import Header from './components/Header';
import HouseCard from './components/HouseCard';
import AddTenantModal from './components/modals/AddTenantModal';
import AssignExistingTenantModal from './components/modals/AssignExistingTenantModal'; // New
import TenantDetailsModal from './components/modals/TenantDetailsModal';
import ReminderModal from './components/modals/ReminderModal';
import RecordPaymentModal from './components/modals/RecordPaymentModal';
import BulkRecordPaymentModal from './components/modals/BulkRecordPaymentModal'; // New
import ConfirmDeleteModal from './components/modals/ConfirmDeleteModal'; 
import { UserCircleIcon, ExclamationTriangleIcon, UsersIcon, CurrencyDollarIcon } from './components/icons';


const initialHousesData: Omit<House, 'current_tenant_id' | 'created_at' | 'updated_at'>[] = [
  { id: "H3", house_number: "3" },
  { id: "H4", house_number: "4" },
  { id: "H5", house_number: "5" },
  { id: "H6", house_number: "6" },
  { id: "H8", house_number: "8" },
  { id: "H9", house_number: "9" },
];

interface PaymentRecordContext {
  tenant_id: string;
  tenant_name: string;
  month: number;
  year: number;
  default_amount_paid: number;
}

// HouseWithTenantAndPayment is now imported from types.ts

const App = (): JSX.Element => {
  const [houses, setHouses] = useState<House[]>(
    initialHousesData.map(h => ({ ...h, current_tenant_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))
  );
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [houseIdToAssignTenant, setHouseIdToAssignTenant] = useState<string | null>(null);
  
  const [isAssignExistingTenantModalOpen, setIsAssignExistingTenantModalOpen] = useState(false); // New
  const [houseInfoForExistingAssignment, setHouseInfoForExistingAssignment] = useState<{id: string, number: string} | null>(null); // New


  const [isTenantDetailModalOpen, setIsTenantDetailModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false); 
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false); 
  const [isBulkRecordPaymentModalOpen, setIsBulkRecordPaymentModalOpen] = useState(false); // New


  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState<Tenant | null>(null);
  const [tenantForReminder, setTenantForReminder] = useState<Tenant | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [paymentRecordContext, setPaymentRecordContext] = useState<PaymentRecordContext | null>(null); 
  
  const [tenantIdToDelete, setTenantIdToDelete] = useState<string | null>(null); 
  const [tenantNameToDelete, setTenantNameToDelete] = useState<string>(''); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<PaymentStatus | 'all'>('all');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use API to fetch houses to get current_tenant_id and other DB fields
      const [fetchedDbHouses, fetchedTenants, fetchedPayments] = await Promise.all([
        api.fetchHouses(), // Fetch actual house data from DB
        api.fetchTenants(),
        api.fetchPayments(),
      ]);
      
      // Merge fetched DB houses with initial static data if necessary, or just use DB data
      // For now, assuming fetchHouses returns the 6 houses with their current_tenant_id
      setHouses(fetchedDbHouses.length > 0 ? fetchedDbHouses : initialHousesData.map(h => ({ ...h, current_tenant_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
      setTenants(fetchedTenants);
      setPayments(fetchedPayments);

    } catch (err) {
      console.error("Failed to fetch data:", err);
      let displayError = 'Failed to load data. Please try again.';
      if (err instanceof Error) {
        displayError = err.message; 
         if (err.message.includes('VITE_SUPABASE')) {
             displayError = `Critical Supabase configuration error: ${err.message}. Please ensure VITE_SUPABASE_PROJECT_URL and VITE_SUPABASE_ANON_KEY are correctly set in your Vercel project settings with the 'VITE_' prefix.`;
         } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            displayError += " (Hint: Could not connect to the backend. Verify Supabase URL, internet, and project status.)";
        } else if (err.message.includes('Forbidden') || err.message.includes('Unauthorized') || err.message.includes('401') || err.message.includes('403')) {
            displayError += " (Hint: Authorization error. Check Supabase URL/Key and RLS policies.)";
        }
      }
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAssignNewTenantModal = (houseId: string) => {
    setHouseIdToAssignTenant(houseId);
    setIsAddTenantModalOpen(true);
  };
  
  const handleOpenAssignExistingTenantModal = (houseId: string, houseNumber: string) => {
    setHouseInfoForExistingAssignment({id: houseId, number: houseNumber});
    setIsAssignExistingTenantModalOpen(true);
  };

  const handleAssignExistingTenantToHouse = async (tenantId: string) => {
    if (!houseInfoForExistingAssignment) return;
    setIsSubmitting(true);
    setError(null);
    try {
        await api.updateHouse(houseInfoForExistingAssignment.id, { current_tenant_id: tenantId });
        setHouses(prevHouses => prevHouses.map(h => 
            h.id === houseInfoForExistingAssignment.id ? { ...h, current_tenant_id: tenantId, updated_at: new Date().toISOString() } : h
        ));
        setIsAssignExistingTenantModalOpen(false);
        setHouseInfoForExistingAssignment(null);
    } catch (err) {
        console.error("App: Error assigning existing tenant to house:", err);
        throw err; // Let modal display error
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddTenantAndAssignToHouse = async (tenantData: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>) => {
    if (!houseIdToAssignTenant) return;
    setIsSubmitting(true);
    setError(null); 
    try {
      const newTenant = await api.addTenant(tenantData);
      setTenants(prev => [...prev, newTenant].sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')));
      
      await api.updateHouse(houseIdToAssignTenant, { current_tenant_id: newTenant.id });
      setHouses(prevHouses => prevHouses.map(h => 
        h.id === houseIdToAssignTenant ? { ...h, current_tenant_id: newTenant.id, updated_at: new Date().toISOString() } : h
      ));

      setIsAddTenantModalOpen(false);
      setHouseIdToAssignTenant(null);
    } catch (err) {
      console.error("App: Error adding tenant and assigning to house:", err);
      throw err; 
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveTenantFromHouse = async (houseId: string, tenantId: string) => {
    if (!window.confirm("Are you sure you want to remove this tenant from the house? The tenant record will remain.")) return;

    setIsSubmitting(true);
    setError(null);
    try {
        await api.updateHouse(houseId, { current_tenant_id: null });
        setHouses(prevHouses => prevHouses.map(h => 
            h.id === houseId ? { ...h, current_tenant_id: null, updated_at: new Date().toISOString() } : h
        ));
    } catch (err) {
        console.error("App: Error removing tenant from house:", err);
        setError(err instanceof Error ? err.message : "Failed to remove tenant from house.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleOpenModifyTenantModal = (tenant: Tenant) => {
    console.log("Modify tenant:", tenant);
    alert("Modify Tenant functionality to be implemented. See console.");
  };

  const handleOpenConfirmDeleteModal = (tenantId: string, tenantName: string) => {
    setTenantIdToDelete(tenantId);
    setTenantNameToDelete(tenantName);
    setIsConfirmDeleteModalOpen(true);
    setIsTenantDetailModalOpen(false); 
  };

  const executeDeleteTenant = async () => {
    if (!tenantIdToDelete) return;
    setIsSubmitting(true); 
    setError(null);
    try {
      const houseOccupiedByTenant = houses.find(h => h.current_tenant_id === tenantIdToDelete);
      if (houseOccupiedByTenant) {
        await api.updateHouse(houseOccupiedByTenant.id, { current_tenant_id: null });
        setHouses(prevHouses => prevHouses.map(h => 
            h.id === houseOccupiedByTenant.id ? { ...h, current_tenant_id: null, updated_at: new Date().toISOString() } : h
        ));
      }
      await api.deleteTenant(tenantIdToDelete);
      setTenants(prev => prev.filter(t => t.id !== tenantIdToDelete));
      setPayments(prev => prev.filter(p => p.tenant_id !== tenantIdToDelete)); 
      setIsConfirmDeleteModalOpen(false);
      setTenantIdToDelete(null);
      setTenantNameToDelete('');
    } catch (err) {
      console.error(`App: Error in executeDeleteTenant for ID ${tenantIdToDelete}:`, err);
      let errorPrefix = "Tenant Deletion Failed: ";
      let displayError = 'Please try again.';
      if (err instanceof Error) {
        displayError = err.message;
         if (err.message.toLowerCase().includes('violates foreign key constraint')) {
            displayError += " (Hint: Ensure database handles this, e.g., `ON DELETE SET NULL` for `payments.tenant_id` if it references `tenants.id`.)";
        } else if (err.message.includes('Forbidden') || err.message.includes('Unauthorized')) {
          displayError += " (Hint: Check Supabase RLS policies for DELETE on 'tenants'.)";
        }
      }
      setError(errorPrefix + displayError);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const markPayment = useCallback(async (
    tenant_id: string, 
    month: number, 
    year: number, 
    amount_paid_from_modal: number, 
    paid_date_from_modal: string
  ): Promise<Payment[]> => { 
    const houseForTenant = houses.find(h => h.current_tenant_id === tenant_id);
    const house_id = houseForTenant ? houseForTenant.id : null;
    const paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'> = { 
        tenant_id, house_id, month, year, 
        paid_date: paid_date_from_modal, 
        amount_paid: amount_paid_from_modal 
    };
    try {
        const newPayments = await api.recordPayment(paymentData); // recordPayment now always returns array
        return newPayments;
    } catch (err) {
        console.error("Failed to record payment:", err);
        throw err;
    }
  }, [houses]); 

  const openRecordPaymentModal = (tenant_id: string, tenant_name: string, month: number, year: number, default_amount_paid: number) => {
    setPaymentRecordContext({ tenant_id, tenant_name, month, year, default_amount_paid });
    setIsRecordPaymentModalOpen(true);
  };
  
  const handleTriggerRecordPaymentForTenant = (tenant: Tenant) => {
    const today = new Date();
    openRecordPaymentModal(tenant.id, tenant.name, today.getMonth() + 1, today.getFullYear(), tenant.rent_amount);
  };
  
  const handleTriggerRecordPaymentForPastMonth = (tenant_id: string, tenant_name: string, month: number, year: number, default_amount_paid: number) => {
    openRecordPaymentModal(tenant_id, tenant_name, month, year, default_amount_paid);
  };

  const handleConfirmRecordPayment = async (amount_paid_from_modal: number, paid_date_from_modal: string) => {
    if (!paymentRecordContext) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const newPaymentArray = await markPayment(
        paymentRecordContext.tenant_id, paymentRecordContext.month, paymentRecordContext.year,
        amount_paid_from_modal, paid_date_from_modal
      );
      if (newPaymentArray.length > 0) {
        const newPayment = newPaymentArray[0];
        setPayments(prevPayments => {
            const otherPayments = prevPayments.filter(p => !(p.tenant_id === newPayment.tenant_id && p.month === newPayment.month && p.year === newPayment.year));
            return [...otherPayments, newPayment];
        });
      }
      setIsRecordPaymentModalOpen(false); 
      setPaymentRecordContext(null);
      if (isTenantDetailModalOpen && paymentRecordContext) { 
         const tenant = tenants.find(t => t.id === paymentRecordContext.tenant_id);
         if (tenant) setSelectedTenantForDetail(tenant); 
      }
    } catch (err) {
      console.error("App: Error confirming payment (modal will handle display):", err);
      throw err; 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkRecordPayments = async (
    paymentsToRecord: { house_id: string; tenant_id: string; amount_paid: number; month: number; year: number; paid_date: string }[]
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
        const newPayments = await api.recordPayment(paymentsToRecord); // API handles array
        setPayments(prev => {
            // Create a map for quick lookup of new payments
            const newPaymentsMap = new Map<string, Payment>();
            newPayments.forEach(p => newPaymentsMap.set(`${p.tenant_id}-${p.month}-${p.year}`, p));

            // Filter out old payments that are being replaced by new ones
            const updatedPayments = prev.filter(oldP => !newPaymentsMap.has(`${oldP.tenant_id}-${oldP.month}-${oldP.year}`));
            
            // Add all new payments
            return [...updatedPayments, ...newPayments];
        });
        setIsBulkRecordPaymentModalOpen(false);
    } catch (err) {
        console.error("App: Error in bulk payment recording (modal displays):", err);
        throw err;
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleSendReminder = (tenant: Tenant) => { 
    setTenantForReminder(tenant);
    setIsReminderModalOpen(true);
    setReminderMessage(''); 
    const today = new Date();
    const dueDateForReminder = new Date(today.getFullYear(), today.getMonth(), RENT_DUE_DAY);
    try {
        const message = generateReminderMessage(tenant.name, tenant.rent_amount, dueDateForReminder);
        setReminderMessage(message);
    } catch (genError) { 
        console.error("Reminder message preparation error (unexpected):", genError);
        setReminderMessage("Failed to prepare reminder message. Please try again or check console.");
    } 
  };

  const openTenantDetailModal = (tenant: Tenant) => {
    setSelectedTenantForDetail(tenant);
    setIsTenantDetailModalOpen(true);
  };

  const getPaymentsForTenant = (tenantId: string): Payment[] => {
    return payments.filter(p => p.tenant_id === tenantId);
  };

  const getPaymentForTenantCurrentMonth = (tenantId: string): Payment | undefined => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    return payments
      .filter(p => p.tenant_id === tenantId && p.month === currentMonth && p.year === currentYear && p.paid_date)
      .sort((a,b) => new Date(b.paid_date!).getTime() - new Date(a.paid_date!).getTime())[0];
  };

  const getTenantPaymentStatus = (tenant: Tenant | null, payment?: Payment): PaymentStatus => {
    if (!tenant) return PaymentStatus.Unpaid; 
    const today = new Date();
    if (payment && payment.paid_date) return PaymentStatus.Paid;
    
    const join_date = new Date(tenant.join_date); 
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    if (join_date.getFullYear() === currentYear && 
        (join_date.getMonth() + 1) === currentMonth && 
        join_date.getDate() > RENT_DUE_DAY) {
       return PaymentStatus.Unpaid; 
    }

    if (today.getDate() > RENT_DUE_DAY) return PaymentStatus.Overdue;
    return PaymentStatus.Unpaid;
  };
  
  const processedHouses: HouseWithTenantAndPayment[] = useMemo(() => houses.map(house => {
    const tenant = house.current_tenant_id ? tenants.find(t => t.id === house.current_tenant_id) || null : null;
    const paymentForCurrentMonth = tenant ? getPaymentForTenantCurrentMonth(tenant.id) : undefined;
    const paymentStatus = getTenantPaymentStatus(tenant, paymentForCurrentMonth);
    return { ...house, tenant, paymentForCurrentMonth, paymentStatus };
  }), [houses, tenants, payments]);

  const filteredProcessedHouses = useMemo(() => processedHouses.filter(houseData => {
    if (filterPaymentStatus !== 'all' && houseData.paymentStatus !== filterPaymentStatus) {
        return false;
    }
    if (searchTerm && houseData.tenant) {
        return houseData.tenant.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (searchTerm && !houseData.tenant) { 
        return false;
    }
    return true;
  }), [processedHouses, filterPaymentStatus, searchTerm]);
  
  const unassignedTenants = useMemo(() => 
    tenants.filter(t => !houses.some(h => h.current_tenant_id === t.id)),
  [tenants, houses]);

  const housesWithUnpaidTenantsForBulk = useMemo(() =>
    processedHouses.filter(h => 
      h.tenant && (h.paymentStatus === PaymentStatus.Unpaid || h.paymentStatus === PaymentStatus.Overdue)
    ), [processedHouses]
  );


  if (isLoading && !error) { 
    return (
      <div className="min-h-screen bg-accent-50 flex flex-col items-center justify-center text-center px-4">
        <UserCircleIcon className="w-24 h-24 text-primary-500 animate-pulse mb-4" />
        <h2 className="text-2xl font-semibold text-primary-700">Loading Data...</h2>
        <p className="text-primary-600">Please wait.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50 text-accent-900">
      <Header />
      
      <main className="container mx-auto p-4 md:p-8">
        {error && !isConfirmDeleteModalOpen && ( 
          <div className="mb-6 p-4 bg-error-100 border border-error-300 text-error-700 rounded-md flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0 mt-1"/>
            <div>
              <p className="font-semibold">An error occurred:</p>
              <p className="text-sm break-words">{error}</p>
              <button 
                onClick={() => { setError(null); fetchData(); }} 
                className="mt-2 text-sm text-error-600 hover:text-error-800 underline font-medium"
              >
                Try reloading data
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 p-4 bg-accent-100 shadow rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <input 
                type="text"
                placeholder="Search by tenant name..."
                className="w-full sm:flex-1 px-4 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-accent-900 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search by tenant name"
              />
              <div className="relative w-full sm:w-auto">
                <select
                  className="appearance-none block w-full bg-white border border-accent-300 text-accent-900 py-2 pl-4 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value as PaymentStatus | 'all')}
                  aria-label="Filter houses by tenant payment status"
                >
                  <option value="all">All Statuses</option>
                  <option value={PaymentStatus.Paid}>Paid</option>
                  <option value={PaymentStatus.Unpaid}>Unpaid</option>
                  <option value={PaymentStatus.Overdue}>Overdue</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-accent-600">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
            <button
                onClick={() => setIsBulkRecordPaymentModalOpen(true)}
                disabled={isSubmitting || housesWithUnpaidTenantsForBulk.length === 0}
                className="w-full sm:w-auto mt-4 sm:mt-0 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={housesWithUnpaidTenantsForBulk.length === 0 ? "No tenants with unpaid rent for current month" : "Record payments for multiple tenants"}
            >
                <CurrencyDollarIcon className="w-5 h-5"/>
                <span>Bulk Record Payments</span>
            </button>
        </div>

        {filteredProcessedHouses.length === 0 && !isLoading ? (
          <div className="text-center py-10">
            <UsersIcon className="w-16 h-16 text-accent-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-700">No Houses Match Criteria</h3>
            <p className="text-accent-700">
                {searchTerm || filterPaymentStatus !== 'all' 
                ? "No houses with tenants match your current search/filter." 
                : "Displaying all houses."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProcessedHouses.map(houseData => (
              <HouseCard
                key={houseData.id}
                house={houseData} 
                tenant={houseData.tenant} // This is already part of houseData as per HouseWithTenantAndPayment
                paymentForCurrentMonth={houseData.paymentForCurrentMonth} // This is also part of houseData
                onAssignTenant={handleOpenAssignNewTenantModal}
                onAssignExistingTenant={handleOpenAssignExistingTenantModal}
                onRemoveTenantFromHouse={handleRemoveTenantFromHouse}
                onModifyTenant={handleOpenModifyTenantModal} 
                onRecordPayment={handleTriggerRecordPaymentForTenant}
                onSendReminder={handleSendReminder}
                onViewTenantDetails={openTenantDetailModal}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        )}
      </main>

      {isAddTenantModalOpen && houseIdToAssignTenant && (
        <AddTenantModal
          isOpen={isAddTenantModalOpen}
          onClose={() => { setIsAddTenantModalOpen(false); setHouseIdToAssignTenant(null); }}
          onAddTenant={handleAddTenantAndAssignToHouse} 
          isSubmitting={isSubmitting} 
        />
      )}
      
      {isAssignExistingTenantModalOpen && houseInfoForExistingAssignment && (
        <AssignExistingTenantModal
          isOpen={isAssignExistingTenantModalOpen}
          onClose={() => { setIsAssignExistingTenantModalOpen(false); setHouseInfoForExistingAssignment(null); }}
          onAssign={handleAssignExistingTenantToHouse}
          unassignedTenants={unassignedTenants}
          isSubmitting={isSubmitting}
          houseNumber={houseInfoForExistingAssignment.number}
        />
      )}

      {isTenantDetailModalOpen && selectedTenantForDetail && (
        <TenantDetailsModal
          isOpen={isTenantDetailModalOpen}
          onClose={() => setIsTenantDetailModalOpen(false)}
          tenant={selectedTenantForDetail}
          payments={getPaymentsForTenant(selectedTenantForDetail.id)}
          onTriggerRecordPayment={(month, year, defaultAmount) => handleTriggerRecordPaymentForPastMonth(selectedTenantForDetail.id, selectedTenantForDetail.name, month, year, defaultAmount)}
          onTriggerDeleteConfirmation={handleOpenConfirmDeleteModal} 
          isSubmitting={isSubmitting}
        />
      )}
      
      {isReminderModalOpen && tenantForReminder && (
        <ReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          reminderMessage={reminderMessage}
          tenantName={tenantForReminder.name}
          tenantPhone={tenantForReminder.phone}
        />
      )}

      {isRecordPaymentModalOpen && paymentRecordContext && (
        <RecordPaymentModal
            isOpen={isRecordPaymentModalOpen}
            onClose={() => { setIsRecordPaymentModalOpen(false); setPaymentRecordContext(null); }}
            onSubmit={handleConfirmRecordPayment}
            tenantName={paymentRecordContext.tenant_name}
            paymentMonth={paymentRecordContext.month}
            paymentYear={paymentRecordContext.year}
            defaultAmount={paymentRecordContext.default_amount_paid}
            isSubmitting={isSubmitting}
        />
      )}

      {isConfirmDeleteModalOpen && (
        <ConfirmDeleteModal
            isOpen={isConfirmDeleteModalOpen}
            onClose={() => {
                setIsConfirmDeleteModalOpen(false);
                setTenantIdToDelete(null);
                setTenantNameToDelete('');
                if(error && error.startsWith("Tenant Deletion Failed:")) setError(null); 
            }}
            onConfirm={executeDeleteTenant}
            tenantName={tenantNameToDelete}
            isDeleting={isSubmitting}
        />
      )}

      {isBulkRecordPaymentModalOpen && (
        <BulkRecordPaymentModal
          isOpen={isBulkRecordPaymentModalOpen}
          onClose={() => setIsBulkRecordPaymentModalOpen(false)}
          onSubmit={handleBulkRecordPayments}
          housesWithUnpaidTenants={housesWithUnpaidTenantsForBulk}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default App;
