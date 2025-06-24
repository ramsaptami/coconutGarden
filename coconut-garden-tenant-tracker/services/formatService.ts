
import { CURRENCY_SYMBOL } from '../constants';

// This service provides utility functions for formatting data for display.

export const formatDate_dd_mmm_yyyy = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' }); // e.g., "Jan", "Feb"
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const generateReminderMessage = (
  tenantName: string,
  rentAmount: number,
  dueDate: Date 
): string => {
  const formattedDueDate = formatDate_dd_mmm_yyyy(dueDate);
  // Returns a simple template for the reminder message.
  const simpleTemplate = `Dear ${tenantName},\n\nThis is a friendly reminder that your rent payment of ${CURRENCY_SYMBOL}${rentAmount.toFixed(2)} is due on ${formattedDueDate}.\n\nPlease make your payment at your earliest convenience.\n\nThank you,\nLandlord`;
  
  return simpleTemplate;
};
