
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ExclamationTriangleIcon, CheckCircleIcon, CurrencyDollarIcon } from '../icons';
import { CURRENCY_SYMBOL } from '../../constants';
import { Tenant, HouseWithTenantAndPayment, PaymentStatus } from '../../types';

interface BulkRecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentsToRecord: { house_id: string; tenant_id: string; amount_paid: number; month: number; year: number; paid_date: string }[]) => Promise<void>;
  housesWithUnpaidTenants: HouseWithTenantAndPayment[];
  isSubmitting: boolean;
}

const BulkRecordPaymentModal: React.FC<BulkRecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  housesWithUnpaidTenants,
  isSubmitting,
}) => {
  const [selectedHouseTenantIds, setSelectedHouseTenantIds] = useState<string[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Pre-select all eligible tenants by default or clear selection
      setSelectedHouseTenantIds(housesWithUnpaidTenants.map(h => `${h.id}_${h.tenant!.id}`));
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setSubmissionError(null);
    }
  }, [isOpen, housesWithUnpaidTenants]);

  const handleToggleSelection = (houseId: string, tenantId: string) => {
    const key = `${houseId}_${tenantId}`;
    setSelectedHouseTenantIds(prev =>
      prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedHouseTenantIds(housesWithUnpaidTenants.map(h => `${h.id}_${h.tenant!.id}`));
  };

  const handleDeselectAll = () => {
    setSelectedHouseTenantIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (selectedHouseTenantIds.length === 0) {
      setSubmissionError('Please select at least one tenant to record payment for.');
      return;
    }
    if (!paymentDate) {
      setSubmissionError('Please select a payment date.');
      return;
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const paymentsToRecord = selectedHouseTenantIds.map(key => {
      const [houseId, tenantId] = key.split('_');
      const houseData = housesWithUnpaidTenants.find(h => h.id === houseId && h.tenant?.id === tenantId);
      if (!houseData || !houseData.tenant) {
        // This should ideally not happen if data integrity is maintained
        console.error("Could not find house/tenant data for key:", key);
        return null;
      }
      return {
        house_id: houseData.id,
        tenant_id: houseData.tenant.id,
        amount_paid: houseData.tenant.rent_amount,
        month: currentMonth,
        year: currentYear,
        paid_date: paymentDate,
      };
    }).filter(p => p !== null) as { house_id: string; tenant_id: string; amount_paid: number; month: number; year: number; paid_date: string }[];

    if (paymentsToRecord.length === 0) {
      setSubmissionError('No valid payments to record. Please check selections.');
      return;
    }

    try {
      await onSubmit(paymentsToRecord);
      // App.tsx will close the modal
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const totalSelectedAmount = selectedHouseTenantIds.reduce((sum, key) => {
    const [houseId, tenantId] = key.split('_');
    const house = housesWithUnpaidTenants.find(h => h.id === houseId && h.tenant?.id === tenantId);
    return sum + (house?.tenant?.rent_amount || 0);
  }, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Record Rental Payments" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {submissionError && (
          <div className="p-3 mb-4 bg-error-100 border border-error-300 text-error-700 rounded-md text-sm flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        <div>
          <label htmlFor="bulkPaymentDate" className="block text-sm font-medium text-primary-700">Payment Date for all selected *</label>
          <input
            type="date"
            id="bulkPaymentDate"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            className="mt-1 block w-full sm:w-1/2 px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200"
            disabled={isSubmitting}
          />
        </div>

        {housesWithUnpaidTenants.length === 0 ? (
          <p className="text-center text-accent-700 py-6">No houses with tenants have unpaid rent for the current month.</p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-primary-700">Select tenants to mark rent as paid for the current month:</p>
                <div className="space-x-2">
                    <button type="button" onClick={handleSelectAll} className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 disabled:opacity-50" disabled={isSubmitting}>Select All</button>
                    <button type="button" onClick={handleDeselectAll} className="text-xs px-2 py-1 bg-accent-200 text-accent-700 rounded hover:bg-accent-300 disabled:opacity-50" disabled={isSubmitting}>Deselect All</button>
                </div>
            </div>
            <div className="max-h-80 overflow-y-auto border border-accent-300 rounded-md">
              <table className="min-w-full divide-y divide-accent-200">
                <thead className="bg-accent-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase">Select</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase">House</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase">Tenant</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase">Rent Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-accent-200">
                  {housesWithUnpaidTenants.map((house) => {
                    if (!house.tenant) return null; // Should not happen with the filtered list
                    const key = `${house.id}_${house.tenant.id}`;
                    return (
                      <tr key={key} className={`${selectedHouseTenantIds.includes(key) ? 'bg-primary-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 border-accent-300 rounded focus:ring-primary-500 disabled:opacity-70"
                            checked={selectedHouseTenantIds.includes(key)}
                            onChange={() => handleToggleSelection(house.id, house.tenant!.id)}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-primary-800 font-medium">{house.house_number}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-accent-800">{house.tenant.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-accent-800">{CURRENCY_SYMBOL}{house.tenant.rent_amount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-2 font-semibold text-primary-700">
                Total Selected Amount: {CURRENCY_SYMBOL}{totalSelectedAmount.toFixed(2)}
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-accent-200 mt-6">
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
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md shadow-sm flex items-center disabled:opacity-50"
            disabled={isSubmitting || selectedHouseTenantIds.length === 0}
          >
            <CurrencyDollarIcon className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Recording Payments...' : `Record ${selectedHouseTenantIds.length} Payment(s)`}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkRecordPaymentModal;
