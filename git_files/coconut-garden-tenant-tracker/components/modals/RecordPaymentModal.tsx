
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ExclamationTriangleIcon } from '../icons';
import { CURRENCY_SYMBOL } from '../../constants';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amountPaid: number, paymentDate: string) => Promise<void>;
  tenantName: string;
  paymentMonth: number;
  paymentYear: number;
  defaultAmount: number;
  isSubmitting: boolean;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantName,
  paymentMonth,
  paymentYear,
  defaultAmount,
  isSubmitting
}) => {
  const [amountPaid, setAmountPaid] = useState<number | ''>(defaultAmount);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmountPaid(defaultAmount);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setSubmissionError(null);
    }
  }, [isOpen, defaultAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    if (amountPaid === '' || amountPaid <= 0) {
      setSubmissionError('Please enter a valid amount paid.');
      return;
    }
    if (!paymentDate) {
      setSubmissionError('Please select a payment date.');
      return;
    }
    try {
      await onSubmit(Number(amountPaid), paymentDate);
    } catch (err) {
       setSubmissionError(err instanceof Error ? err.message : 'An unexpected error occurred while recording payment.');
    }
  };

  const monthName = new Date(paymentYear, paymentMonth - 1).toLocaleString('default', { month: 'long' });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment for ${tenantName}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {submissionError && (
          <div className="p-3 mb-3 bg-error-100 border border-error-300 text-error-700 rounded-md text-sm flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}
        <p className="text-sm text-primary-700">
          You are recording a payment for <span className="font-semibold">{monthName} {paymentYear}</span>.
        </p>
        <div>
          <label htmlFor="amountPaid" className="block text-sm font-medium text-primary-700">Amount Paid ({CURRENCY_SYMBOL}) *</label>
          <input
            type="number"
            id="amountPaid"
            value={amountPaid}
            onChange={(e) => setAmountPaid(parseFloat(e.target.value) || '')}
            required
            min="0.01"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-primary-700">Payment Date *</label>
          <input
            type="date"
            id="paymentDate"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
