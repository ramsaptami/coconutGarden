
import React from 'react';
import Modal from './Modal';
import { ExclamationTriangleIcon, TrashIcon } from '../icons';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tenantName: string;
  isDeleting: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tenantName,
  isDeleting,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" size="md">
      <div className="space-y-4">
        <div className="flex items-start p-3">
          <ExclamationTriangleIcon className="w-12 h-12 text-error-500 mr-4 flex-shrink-0" />
          <div>
            <p className="text-lg font-medium text-primary-800">
              Are you sure you want to delete tenant "{tenantName}"?
            </p>
            <p className="text-sm text-accent-700 mt-1">
              This action cannot be undone. All associated data, including payment history, will be permanently removed if your database is configured for cascading deletes.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-accent-300">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-primary-800 bg-accent-200 hover:bg-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-error-500 hover:bg-error-600 rounded-md shadow-sm flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500 disabled:opacity-50"
            disabled={isDeleting}
          >
            <TrashIcon className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
