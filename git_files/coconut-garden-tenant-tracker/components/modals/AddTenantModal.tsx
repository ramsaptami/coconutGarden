
import React, { useState, useEffect } from 'react';
import { Tenant } from '../../types'; 
import Modal from './Modal';
import { ExclamationTriangleIcon } from '../icons';
import { CURRENCY_SYMBOL } from '../../constants';

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTenant: (tenant: Omit<Tenant, 'id'>) => Promise<void>; 
  isSubmittingGlobal: boolean; 
}

const AddTenantModal: React.FC<AddTenantModalProps> = ({ isOpen, onClose, onAddTenant, isSubmittingGlobal }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [workInfo, setWorkInfo] = useState('');
  const [rentAmount, setRentAmount] = useState<number | ''>('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [idProof, setIdProof] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);


  useEffect(() => {
    if (isOpen) {
        setName('');
        setEmail('');
        setPhone('');
        setWorkInfo('');
        setRentAmount('');
        setJoinDate(new Date().toISOString().split('T')[0]);
        setIdProof(false);
        setSubmissionError(null); 
        setIsSubmittingLocal(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null); 

    if (!name || !email || !rentAmount || !joinDate) {
        setSubmissionError("Please fill in all required fields: Name, Email, Rent Amount, and Join Date.");
        return;
    }
    
    setIsSubmittingLocal(true);
    try {
      await onAddTenant({ 
        name, 
        email, 
        phone, 
        work_info: workInfo, 
        rent_amount: Number(rentAmount), 
        join_date: joinDate, 
        id_proof: idProof 
      });
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const currentIsSubmitting = isSubmittingGlobal || isSubmittingLocal;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Tenant" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {submissionError && (
          <div className="p-3 mb-3 bg-error-100 border border-error-300 text-error-700 rounded-md text-sm flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-primary-700">Full Name *</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200" disabled={currentIsSubmitting} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-primary-700">Email Address *</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200" disabled={currentIsSubmitting} />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-primary-700">Phone Number</label>
          <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200" disabled={currentIsSubmitting} />
        </div>
        <div>
          <label htmlFor="workInfo" className="block text-sm font-medium text-primary-700">Work Information</label>
          <textarea id="workInfo" value={workInfo} onChange={(e) => setWorkInfo(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200" disabled={currentIsSubmitting} />
        </div>
        <div>
          <label htmlFor="rentAmount" className="block text-sm font-medium text-primary-700">Monthly Rent Amount ({CURRENCY_SYMBOL}) *</label>
          <input type="number" id="rentAmount" value={rentAmount} onChange={(e) => setRentAmount(parseFloat(e.target.value) || '')} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200" disabled={currentIsSubmitting} />
        </div>
        <div>
          <label htmlFor="joinDate" className="block text-sm font-medium text-primary-700">Join Date *</label>
          <input type="date" id="joinDate" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-accent-400 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white disabled:bg-accent-200" disabled={currentIsSubmitting} />
        </div>
        <div className="flex items-center">
          <input
            id="idProof"
            name="idProof"
            type="checkbox"
            checked={idProof}
            onChange={(e) => setIdProof(e.target.checked)}
            className="h-4 w-4 text-primary-600 border-accent-400 rounded focus:ring-primary-500"
            disabled={currentIsSubmitting}
          />
          <label htmlFor="idProof" className="ml-2 block text-sm text-primary-800">
            ID Proof Submitted?
          </label>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-primary-800 bg-accent-200 hover:bg-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" disabled={currentIsSubmitting}>
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50" disabled={currentIsSubmitting}>
            {currentIsSubmitting ? 'Adding...' : 'Add Tenant'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTenantModal;
