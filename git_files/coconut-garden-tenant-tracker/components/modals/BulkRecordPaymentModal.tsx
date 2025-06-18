
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Tenant, Payment, PaymentStatus } from '../../types'; 
import { ExclamationTriangleIcon, CurrencyDollarIcon, CalendarDaysIcon } from '../icons';
import { CURRENCY_SYMBOL } from '../../constants';

interface BulkRecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  payments: Payment[]; 
  onSubmit: (
    selectedTenantIds: string[],
    paymentDate: string,
    useDefaultAmount: boolean,
    commonAmount?: number
  ) => Promise<void>;
  isSubmitting: boolean;
}

interface TenantForBulkPayment extends Tenant {
  isSelected: boolean;
}

const BulkRecordPaymentModal: React.FC<BulkRecordPaymentModalProps> = ({
  isOpen,
  onClose,
  tenants,
  payments,
  onSubmit,
  isSubmitting,
}) => {
  const [selectableTenants, setSelectableTenants] = useState<TenantForBulkPayment[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [useDefaultAmount, setUseDefaultAmount] = useState(true);
  const [commonAmount, setCommonAmount] = useState<number | ''>('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const getPaymentForTenantCurrentMonth = (tenantId: string, allPayments: Payment[]): Payment | undefined => { 
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    return allPayments
      .filter(p => p.tenant_id === tenantId && p.month === currentMonth && p.year === currentYear && p.paid_date)
      .sort((a, b) => new Date(b.paid_date!).getTime() - new Date(a.paid_date!).getTime())[0];
  };

  useEffect(() => {
    if (isOpen) {
      const unpaidTenants = tenants
        .filter(tenant => {
          const payment = getPaymentForTenantCurrentMonth(tenant.id, payments);
          return !payment; 
        })
        .map(t => ({ ...t, isSelected: true })); 

      setSelectableTenants(unpaidTenants);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setUseDefaultAmount(true);
      setCommonAmount('');
      setSubmissionError(null);
    }
  }, [isOpen, tenants, payments]);

  const handleToggleTenantSelection = (tenantId: string) => {
    setSelectableTenants(prev =>
      prev.map(t => (t.id === tenantId ? { ...t, isSelected: !t.isSelected } : t))
    );
  };

  const handleSelectAll = () => {
    setSelectableTenants(prev => prev.map(t => ({ ...t, isSelected: true })));
  };

  const handleDeselectAll = () => {
     setSelectableTenants(prev => prev.map(t => ({ ...t, isSelected: false })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    const selectedTenantIds = selectableTenants.filter(t => t.isSelected).map(t => t.id);

    if (selectedTenantIds.length === 0) {
      setSubmissionError('Please select at least one tenant.');
      return;
    }
    if (!useDefaultAmount && (commonAmount === '' || Number(commonAmount) <= 0)) {
      setSubmissionError('Please enter a valid common amount if not using default rent.');
      return;
    }
    if (!paymentDate) {
      setSubmissionError('Please select a payment date.');
      return;
    }

    try {
      await onSubmit(selectedTenantIds, paymentDate, useDefaultAmount, Number(commonAmount) || undefined);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const selectedCount = selectableTenants.filter(t => t.isSelected).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Record Current Month Payments" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {submissionError && (
          <div className="p-3 mb-3 bg-error-100 border border-error-300 text-error-700 rounded-md text-sm flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        {selectableTenants.length === 0 ? (
          <p className="text-accent-700 text-center py-4">All tenants have paid for the current month, or no tenants found.</p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-primary-700">{selectedCount} tenant(s) selected for current month payment.</p>
                <div className="space-x-2">
                    <button type="button" onClick={handleSelectAll} className="text-xs text-primary-600 hover:underline" disabled={isSubmitting}>Select All</button>
                    <button type="button" onClick={handleDeselectAll} className="text-xs text-primary-600 hover:underline" disabled={isSubmitting}>Deselect All</button>
                </div>
            </div>
            <div className="max-h-60 overflow-y-auto border border-accent-300 rounded-md p-2 space-y-2 bg-accent-50">
              {selectableTenants.map(tenant => (
                <div key={tenant.id} className="flex items-center justify-between p-2 border-b border-accent-200 last:border-b-0 hover:bg-accent-200 rounded">
                  <label htmlFor={`tenant-${tenant.id}`} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id={`tenant-${tenant.id}`}
                      checked={tenant.isSelected}
                      onChange={() => handleToggleTenantSelection(tenant.id)}
                      className="h-4 w-4 text-primary-600 border-accent-400 rounded focus:ring-primary-500 mr-3"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm font-medium text-primary-800">{tenant.name}</span>
                  </label>
                  <span className="text-sm text-accent-700">{CURRENCY_SYMBOL}{tenant.rent_amount.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label htmlFor="bulkPaymentDate" className="block text-sm font-medium text-primary-700 mb-1">
                  <CalendarDaysIcon className="w-4 h-4 inline mr-1" /> Payment Date for All Selected *
                </label>
                <input
                  type="date"
                  id="bulkPaymentDate"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="useDefaultAmount"
                    name="amountOption"
                    checked={useDefaultAmount}
                    onChange={() => setUseDefaultAmount(true)}
                    className="h-4 w-4 text-primary-600 border-accent-400 focus:ring-primary-500"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="useDefaultAmount" className="ml-2 block text-sm text-primary-700">Use each tenant's default rent amount</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="useCommonAmount"
                    name="amountOption"
                    checked={!useDefaultAmount}
                    onChange={() => setUseDefaultAmount(false)}
                    className="h-4 w-4 text-primary-600 border-accent-400 focus:ring-primary-500"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="useCommonAmount" className="ml-2 block text-sm text-primary-700">Use common amount ({CURRENCY_SYMBOL}) for all selected:</label>
                </div>
                {!useDefaultAmount && (
                  <div className="pl-6">
                  <input
                    type="number"
                    id="commonAmount"
                    value={commonAmount}
                    onChange={(e) => setCommonAmount(parseFloat(e.target.value) || '')}
                    min="0.01"
                    step="0.01"
                    placeholder={`Enter amount in ${CURRENCY_SYMBOL}`}
                    className="block w-full px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200"
                    disabled={useDefaultAmount || isSubmitting}
                    required={!useDefaultAmount}
                  />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-accent-300 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-primary-800 bg-accent-200 hover:bg-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            disabled={isSubmitting || selectableTenants.length === 0 || selectedCount === 0}
          >
            {isSubmitting ? 'Recording...' : `Record for ${selectedCount} Tenant(s)`}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkRecordPaymentModal;
