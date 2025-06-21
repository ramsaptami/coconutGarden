
import React from 'react';
import Modal from './Modal';
import { EnvelopeIcon } from '../icons'; 

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminderMessage: string;
  tenantName: string;
  tenantPhone: string | null | undefined; 
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, reminderMessage, tenantName, tenantPhone }) => {
  
  const handleSendSms = () => {
    if (!tenantPhone) {
      alert("Tenant's phone number is not available to send an SMS.");
      return;
    }
    const cleanedPhoneNumber = tenantPhone.replace(/[^0-9+]/g, '');

    if (!cleanedPhoneNumber) {
        alert("Tenant's phone number is invalid or missing after attempting to clean it.");
        return;
    }

    const smsLink = `sms:${cleanedPhoneNumber}?body=${encodeURIComponent(reminderMessage)}`;
    try {
      window.location.href = smsLink;
      onClose(); 
    } catch (error) {
      console.error("Error trying to open SMS link:", error);
      alert("Could not automatically open your SMS app. Please copy the message and send it manually.");
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(reminderMessage)
      .then(() => alert('Reminder message copied to clipboard!'))
      .catch(err => console.error('Failed to copy text: ', err));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Rent Reminder for ${tenantName}`} size="lg">
      <div className="space-y-4">
        <div className="p-4 bg-primary-100 border border-primary-200 rounded-md">
          <p className="text-sm font-medium text-primary-700 mb-1 flex items-center">
            <EnvelopeIcon className="w-5 h-5 mr-2 text-primary-500" />
            Reminder Message:
          </p>
          <textarea
            readOnly
            value={reminderMessage}
            rows={8}
            className="w-full p-2 text-sm text-accent-900 bg-accent-50 border border-accent-300 rounded-md focus:ring-0 focus:border-accent-300"
            aria-label="Reminder message content"
          />
        </div>
        <p className="text-xs text-accent-700">
          You can copy this message or attempt to send it via your device's SMS application.
        </p>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Copy Message
          </button>
          <button
            type="button"
            onClick={handleSendSms}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            disabled={!tenantPhone}
            title={!tenantPhone ? "Tenant phone number not available" : "Send SMS via your device's application"}
          >
            Send via SMS
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReminderModal;
