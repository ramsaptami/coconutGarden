
import React, { useState, useEffect, useCallback } from 'react';
import { Tenant, Payment, PaymentStatus } from './types'; 
import { RENT_DUE_DAY } from './constants';
import * as api from './services/api'; 
import { generateReminderMessage } from './services/formatService';

import Header from './components/Header';
import TenantCard from './components/TenantCard';
import AddTenantModal from './components/modals/AddTenantModal';
import TenantDetailsModal from './components/modals/TenantDetailsModal';
import ReminderModal from './components/modals/ReminderModal';
import RecordPaymentModal from './components/modals/RecordPaymentModal';
import BulkRecordPaymentModal from './components/modals/BulkRecordPaymentModal'; 
import ConfirmDeleteModal from './components/modals/ConfirmDeleteModal'; 
import { UserCircleIcon, ExclamationTriangleIcon, UsersIcon, CurrencyDollarIcon } from './components/icons';


interface PaymentRecordContext {
  tenant_id: string;
  tenant_name: string;
  month: number;
  year: number;
  default_amount_paid: number;
}

const App = (): JSX.Element => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isTenantDetailModalOpen, setIsTenantDetailModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false); 
  const [isBulkPaymentModalOpen, setIsBulkPaymentModalOpen] = useState(false); 
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false); 
  
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
      const [fetchedTenants, fetchedPayments] = await Promise.all([
        api.fetchTenants(),
        api.fetchPayments() 
      ]);
      setTenants(fetchedTenants);
      setPayments(fetchedPayments);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      let displayError = 'Failed to load data. Please try again.';
      if (err instanceof Error) {
        displayError = err.message; // Base error message
        
        if (err.message === "Both VITE_SUPABASE_PROJECT_URL and VITE_SUPABASE_ANON_KEY are not defined in environment variables.") {
            displayError = "Critical Supabase environment variables VITE_SUPABASE_PROJECT_URL and VITE_SUPABASE_ANON_KEY are missing. " +
                           "Please ensure these are correctly set with the 'VITE_' prefix in your Vercel project settings.";
        } else if (err.message === "VITE_SUPABASE_PROJECT_URL is not defined in environment variables.") {
          displayError = "Critical Supabase environment variable VITE_SUPABASE_PROJECT_URL is missing. " +
                          "Please ensure this is correctly set with the 'VITE_' prefix in your Vercel project settings.";
        } else if (err.message === "VITE_SUPABASE_ANON_KEY is not defined in environment variables.") {
            displayError = "Critical Supabase environment variable VITE_SUPABASE_ANON_KEY is missing. " +
                           "Please ensure this is correctly set with the 'VITE_' prefix in your Vercel project settings.";
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            displayError += " (Hint: Could not connect to the backend. Please verify your `VITE_SUPABASE_PROJECT_URL` environment variable setting on Vercel, your internet connection, and that your Supabase project is running.)";
        } else if (err.message.includes('Forbidden') || err.message.includes('Unauthorized') || err.message.includes('401') || err.message.includes('403')) {
            displayError += " (Hint: Authorization error. Ensure your `VITE_SUPABASE_PROJECT_URL` and `VITE_SUPABASE_ANON_KEY` environment variables on Vercel are correct and that RLS policies allow access.)";
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

  const handleAddTenant = async (tenantData: Omit<Tenant, 'id'>): Promise<void> => {
    try {
      const newTenant = await api.addTenant(tenantData);
      setTenants(prev => [...prev, newTenant].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddTenantModalOpen(false);
    } catch (err) {
      console.error("App: Error adding tenant (will be handled by modal):", err);
      throw err; 
    }
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
            displayError += " (Hint: This often means the tenant has existing payment records. Check your `payments` table's foreign key to `tenants`. It might need `ON DELETE CASCADE` behavior in your Supabase table settings if you want associated payments to be deleted automatically. Alternatively, ensure RLS for DELETE on `tenants` is correctly configured.)";
        } else if (err.message.includes('Forbidden') || err.message.includes('Unauthorized') || err.message.includes('403') || err.message.includes('401')) {
          displayError += " (Hint: Check your Supabase Row Level Security (RLS) policies for DELETE operations on the 'tenants' table. Also, ensure your `VITE_SUPABASE_PROJECT_URL` and `VITE_SUPABASE_ANON_KEY` environment variables on Vercel are correct for your project.)";
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            displayError += " (Hint: Could not connect to the backend. Please verify your `VITE_SUPABASE_PROJECT_URL` environment variable on Vercel and your internet connection.)";
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
  ): Promise<Payment> => { 
    const paymentData: Omit<Payment, 'id'> = {
        tenant_id,
        month,
        year,
        paid_date: paid_date_from_modal, 
        amount_paid: amount_paid_from_modal,
    };
    try {
        const newPayment = await api.recordPayment(paymentData);
        return newPayment;
    } catch (err) {
        console.error("Failed to record payment:", err);
        throw err;
    }
  }, []);

  const openRecordPaymentModal = (tenant_id: string, tenant_name: string, month: number, year: number, default_amount_paid: number) => {
    setPaymentRecordContext({ tenant_id, tenant_name, month, year, default_amount_paid });
    setIsRecordPaymentModalOpen(true);
  };

  const handleTriggerRecordPaymentForCurrentMonth = (tenant: Tenant) => {
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
      const newPayment = await markPayment(
        paymentRecordContext.tenant_id,
        paymentRecordContext.month,
        paymentRecordContext.year,
        amount_paid_from_modal,
        paid_date_from_modal
      );
      setPayments(prevPayments => {
          const otherPayments = prevPayments.filter(p => !(p.tenant_id === paymentRecordContext.tenant_id && p.month === paymentRecordContext.month && p.year === paymentRecordContext.year));
          return [...otherPayments, newPayment];
      });
      setIsRecordPaymentModalOpen(false); 
      setPaymentRecordContext(null);
    } catch (err) {
      console.error("App: Error confirming payment (will be handled by modal):", err);
      throw err; 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenBulkPaymentModal = () => {
    setIsBulkPaymentModalOpen(true);
  };

  const handleCloseBulkPaymentModal = () => {
    setIsBulkPaymentModalOpen(false);
  };

  const handleBulkRecordPayments = async (
    selectedTenantIds: string[],
    paymentDate: string,
    useDefaultAmount: boolean,
    commonAmount?: number
  ) => {
    setIsSubmitting(true);
    setError(null);
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    let newlyRecordedPayments: Payment[] = [];
    let someFailed = false;

    const paymentPromises = selectedTenantIds.map(tenantId => {
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant) return Promise.resolve(null); 

      const amountToPay = useDefaultAmount ? tenant.rent_amount : commonAmount!;
      return markPayment(tenant.id, currentMonth, currentYear, amountToPay, paymentDate)
        .catch(err => {
            console.error(`Error in bulk payment for tenant ${tenant.name} (ID: ${tenant.id}):`, err);
            someFailed = true;
            return null; 
        });
    });

    const results = await Promise.all(paymentPromises); 
      
    results.forEach(result => {
        if (result) { 
            newlyRecordedPayments.push(result);
        }
    });

    if (newlyRecordedPayments.length > 0) {
    setPayments(prevPayments => {
        const updatedPaymentsMap = new Map(prevPayments.map(p => [`${p.tenant_id}-${p.year}-${p.month}`, p]));
        newlyRecordedPayments.forEach(newP => {
        updatedPaymentsMap.set(`${newP.tenant_id}-${newP.year}-${newP.month}`, newP); 
        });
        return Array.from(updatedPaymentsMap.values());
    });
    }

    if (someFailed) {
        setError("One or more payments in the bulk operation failed. Please check tenant statuses or console for details.");
    } else if (newlyRecordedPayments.length === selectedTenantIds.length && newlyRecordedPayments.length > 0) { 
        setIsBulkPaymentModalOpen(false);
    }
    
    setIsSubmitting(false);
  };


  const handleSendReminder = (tenant: Tenant) => { // No longer async
    setTenantForReminder(tenant);
    setIsReminderModalOpen(true);
    setReminderMessage(''); 
    const today = new Date();
    const dueDateForReminder = new Date(today.getFullYear(), today.getMonth(), RENT_DUE_DAY);
    try {
        const message = generateReminderMessage(tenant.name, tenant.rent_amount, dueDateForReminder); // No await
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

  const handleOpenAddTenantModal = () => {
    setIsAddTenantModalOpen(true);
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

  const getTenantPaymentStatus = (tenant: Tenant, payment?: Payment): PaymentStatus => {
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

  const filteredTenants = tenants.filter(tenant => {
    const nameMatch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterPaymentStatus === 'all') return nameMatch;
    
    const paymentCurrentMonth = getPaymentForTenantCurrentMonth(tenant.id);
    const status = getTenantPaymentStatus(tenant, paymentCurrentMonth);
    return nameMatch && status === filterPaymentStatus;
  });

  if (isLoading && !error) { 
    return (
      <div className="min-h-screen bg-accent-50 flex flex-col items-center justify-center text-center px-4">
        <UserCircleIcon className="w-24 h-24 text-primary-500 animate-pulse mb-4" />
        <h2 className="text-2xl font-semibold text-primary-700">Loading Tenant Data...</h2>
        <p className="text-primary-600">Please wait while we fetch the information.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50 text-accent-900">
      <Header onAddTenantClick={handleOpenAddTenantModal} />
      
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
                placeholder="Search tenants by name..."
                className="w-full sm:flex-1 px-4 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search tenants by name"
              />
              <select
                className="w-full sm:w-auto px-4 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value as PaymentStatus | 'all')}
                aria-label="Filter tenants by payment status"
              >
                <option value="all">All Statuses</option>
                <option value={PaymentStatus.Paid}>Paid</option>
                <option value={PaymentStatus.Unpaid}>Unpaid</option>
                <option value={PaymentStatus.Overdue}>Overdue</option>
              </select>
            </div>
             <button
                onClick={handleOpenBulkPaymentModal}
                className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2 transition-colors whitespace-nowrap"
              >
                <CurrencyDollarIcon className="w-5 h-5" />
                <span>Bulk Mark Rental Payments</span>
            </button>
        </div>

        {filteredTenants.length === 0 && !isLoading ? (
          <div className="text-center py-10">
            <UsersIcon className="w-16 h-16 text-accent-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-700">No Tenants Found</h3>
            <p className="text-accent-700">
                {searchTerm || filterPaymentStatus !== 'all' 
                ? "No tenants match your current search/filter criteria." 
                : "You haven't added any tenants yet. Click 'Add New Tenant' to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map(tenant => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                paymentForCurrentMonth={getPaymentForTenantCurrentMonth(tenant.id)}
                onTriggerRecordPayment={() => handleTriggerRecordPaymentForCurrentMonth(tenant)}
                onViewDetails={() => openTenantDetailModal(tenant)}
                onSendReminder={() => handleSendReminder(tenant)}
              />
            ))}
          </div>
        )}
      </main>

      {isAddTenantModalOpen && (
        <AddTenantModal
          isOpen={isAddTenantModalOpen}
          onClose={() => setIsAddTenantModalOpen(false)}
          onAddTenant={handleAddTenant}
          isSubmittingGlobal={isSubmitting} 
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

      {isBulkPaymentModalOpen && (
        <BulkRecordPaymentModal
            isOpen={isBulkPaymentModalOpen}
            onClose={handleCloseBulkPaymentModal}
            tenants={tenants}
            payments={payments}
            onSubmit={handleBulkRecordPayments}
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

    </div>
  );
};

export default App;
