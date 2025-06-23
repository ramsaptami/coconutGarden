import { CURRENCY_SYMBOL } from '../constants';

// Log a warning if API_KEY is not set, as other AI features might depend on it.
// However, generateReminderMessage will now work without it.
// Removed API_KEY check as Gemini API is no longer used.

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
  dueDate: Date // Changed from dueDateString: string
): string => {
  const formattedDueDate = formatDate_dd_mmm_yyyy(dueDate);
  // Always return the simple template
  const simpleTemplate = `Dear ${tenantName},\n\nThis is a friendly reminder that your rent payment of ${CURRENCY_SYMBOL}${rentAmount.toFixed(2)} is due on ${formattedDueDate}.\n\nPlease make your payment at your earliest convenience.\n\nThank you,\nLandlord`;
  
  return simpleTemplate;
};