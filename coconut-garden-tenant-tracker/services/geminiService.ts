
import { GoogleGenAI } from "@google/genai"; // Keep import in case other AI features are added later
import { GEMINI_MODEL_TEXT, CURRENCY_SYMBOL } from '../constants';

const API_KEY = process.env.API_KEY;

// Log a warning if API_KEY is not set, as other AI features might depend on it.
// However, generateReminderMessage will now work without it.
if (!API_KEY) {
  console.warn(
    "API_KEY environment variable not set. Gemini API features (if any other than reminders) will not work. \n" +
    "To use full Gemini features, please set the API_KEY environment variable. \n" +
    "You can get an API key from https://aistudio.google.com/app/apikey"
  );
}

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

export const generateReminderMessage = async (
  tenantName: string,
  rentAmount: number,
  dueDate: Date // Changed from dueDateString: string
): Promise<string> => {
  const formattedDueDate = formatDate_dd_mmm_yyyy(dueDate);
  // Always return the simple template
  const simpleTemplate = `Dear ${tenantName},\n\nThis is a friendly reminder that your rent payment of ${CURRENCY_SYMBOL}${rentAmount.toFixed(2)} is due on ${formattedDueDate}.\n\nPlease make your payment at your earliest convenience.\n\nThank you,\nLandlord`;
  
  return Promise.resolve(simpleTemplate);
};