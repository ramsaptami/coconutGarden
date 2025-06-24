
import React, { useState, useEffect } from 'react';
import { Tenant } from '../../types';
import Modal from './Modal';
import { ExclamationTriangleIcon } from '../icons';

interface AssignExistingTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (tenantId: string) => Promise<void>;
  unassignedTenants: Tenant[];
  isSubmitting: boolean;
  houseNumber: string;
}

const AssignExistingTenantModal: React.FC<AssignExistingTenantModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  unassignedTenants,
  isSubmitting,
  houseNumber,
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Pre-select the first unassigned tenant if available, or reset
      setSelectedTenantId(unassignedTenants.length > 0 ? unassignedTenants[0].id : '');
      setSubmissionError(null);
    }
  }, [isOpen, unassignedTenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!selectedTenantId) {
      setSubmissionError("Please select a tenant to assign.");
      return;
    }

    try {
      await onAssign(selectedTenantId);
      // App.tsx will close the modal on success
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const inputBaseClasses = "mt-1 block w-full px-3 py-2 bg-white border border-accent-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 focus:outline-none disabled:bg-accent-200 disabled:text-accent-500 transition-colors duration-150 ease-in-out";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Existing Tenant to House ${houseNumber}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {submissionError && (
          <div className="p-3 mb-3 bg-error-100 border border-error-300 text-error-700 rounded-md text-sm flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        {unassignedTenants.length === 0 ? (
          <p className="text-center text-accent-700 py-4">
            No unassigned tenants available. Please add a new tenant first.
          </p>
        ) : (
          <div>
            <label htmlFor="tenantSelect" className="block text-sm font-medium text-primary-700 mb-1">Select Tenant *</label>
            <select
              id="tenantSelect"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              required
              className={inputBaseClasses}
              disabled={isSubmitting}
            >
              <option value="" disabled>-- Select a tenant --</option>
              {unassignedTenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-5">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-primary-800 bg-accent-200 hover:bg-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70" 
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50" 
            disabled={isSubmitting || unassignedTenants.length === 0 || !selectedTenantId}
          >
            {isSubmitting ? 'Assigning...' : 'Assign Tenant'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignExistingTenantModal;
