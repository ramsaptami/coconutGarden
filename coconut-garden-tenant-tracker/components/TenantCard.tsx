
import React from 'react';
import { Tenant, Payment, PaymentStatus } from '../types'; // Corrected path
import { RENT_DUE_DAY, CURRENCY_SYMBOL } from '../constants';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, EyeIcon } from './icons'; 
import { formatDate_dd_mmm_yyyy } from '../services/geminiService'; // Updated import

interface TenantCardProps {
  tenant: Tenant;
  paymentForCurrentMonth?: Payment;
  onTriggerRecordPayment: () => void; 
  onViewDetails: (tenant: Tenant) => void;
  onSendReminder: (tenant: Tenant) => void;
}

const TenantCard = ({ tenant, paymentForCurrentMonth, onTriggerRecordPayment, onViewDetails, onSendReminder }: TenantCardProps): JSX.Element => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let status: PaymentStatus = PaymentStatus.Unpaid;
  let statusText = "Rent Unpaid";
  let statusColorClasses = "bg-warning-100 text-warning-800"; // Default to unpaid/warning
  let IconComponent = XCircleIcon;
  let topBannerBg = "bg-warning-500";
  let topBannerText = "text-warning-950";


  if (paymentForCurrentMonth && paymentForCurrentMonth.paid_date) { 
    status = PaymentStatus.Paid;
    statusText = `Paid on ${formatDate_dd_mmm_yyyy(paymentForCurrentMonth.paid_date)}`; // Updated usage
    statusColorClasses = "bg-success-100 text-success-800";
    IconComponent = CheckCircleIcon;
    topBannerBg = "bg-success-500";
    topBannerText = "text-white";
  } else if (today.getDate() > RENT_DUE_DAY) {
    status = PaymentStatus.Overdue;
    statusText = "Rent Overdue";
    statusColorClasses = "bg-error-100 text-error-800";
    IconComponent = ExclamationTriangleIcon;
    topBannerBg = "bg-error-500";
    topBannerText = "text-white";
  }

  const canSendReminder = (status === PaymentStatus.Unpaid || status === PaymentStatus.Overdue) && today.getDate() > RENT_DUE_DAY;

  const join_date = new Date(tenant.join_date); 
  const isNewTenantThisMonth = join_date.getFullYear() === currentYear && (join_date.getMonth() + 1) === currentMonth && join_date.getDate() > RENT_DUE_DAY;

  // If tenant joined this month after the due day, don't show as overdue for this month yet.
  const displayStatus = isNewTenantThisMonth && status === PaymentStatus.Overdue ? PaymentStatus.Unpaid : status;
  if (isNewTenantThisMonth && status === PaymentStatus.Overdue) {
    statusText = "Rent Unpaid (New Tenant)";
    statusColorClasses = "bg-warning-100 text-warning-800";
    IconComponent = XCircleIcon;
    topBannerBg = "bg-warning-500"; // Keep warning for new tenant unpaid
    topBannerText = "text-warning-950";
  }


  const handleViewDetailsClick = () => {
    onViewDetails(tenant);
  };

  const handleSendReminderClick = () => {
    onSendReminder(tenant);
  };
  
  const handleTriggerRecordPaymentClick = () => {
    onTriggerRecordPayment(); 
  };


  return (
    <div className="bg-accent-100 shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl text-accent-900">
      <div className={`px-6 py-4 ${topBannerBg} ${topBannerText} flex justify-between items-center`}>
        <h3 className="text-xl font-bold truncate" title={tenant.name}>{tenant.name}</h3>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full flex items-center ${statusColorClasses} bg-opacity-20 backdrop-blur-sm`}>
           <IconComponent className="w-5 h-5 mr-1.5" />
          {displayStatus === PaymentStatus.Paid ? `Paid: ${formatDate_dd_mmm_yyyy(paymentForCurrentMonth!.paid_date!)}` : displayStatus} {/* Updated usage */}
        </span>
      </div>

      <div className="p-6 space-y-3">
        <div className="flex items-center text-primary-800 text-sm">
          <EnvelopeIcon className="w-5 h-5 mr-2 text-primary-500" />
          <span>{tenant.email}</span>
        </div>
        <div className="flex items-center text-primary-800 text-sm">
          <PhoneIcon className="w-5 h-5 mr-2 text-primary-500" />
          <span>{tenant.phone || 'N/A'}</span>
        </div>
        <div className="text-primary-900">
          <span className="font-semibold">Rent:</span> {CURRENCY_SYMBOL}{tenant.rent_amount.toFixed(2)} / month 
        </div>
        
        <div className={`mt-2 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center ${statusColorClasses}`}>
           <IconComponent className="w-5 h-5 mr-2" />
           {statusText}
        </div>
      </div>

      <div className="px-6 py-4 bg-accent-200 border-t border-accent-300 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {displayStatus !== PaymentStatus.Paid && (
          <button
            onClick={handleTriggerRecordPaymentClick} 
            className="w-full col-span-1 sm:col-span-1 bg-success-500 hover:bg-success-600 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1.5 transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>Mark Paid</span>
          </button>
        )}
         {canSendReminder && !isNewTenantThisMonth && (
          <button
            onClick={handleSendReminderClick}
            className="w-full col-span-1 sm:col-span-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1.5 transition-colors"
          >
            <EnvelopeIcon className="w-4 h-4" />
            <span>Send Reminder</span>
          </button>
        )}
        <button
          onClick={handleViewDetailsClick}
          className={`w-full ${displayStatus === PaymentStatus.Paid && !canSendReminder ? 'col-span-1 sm:col-span-3' : (displayStatus !== PaymentStatus.Paid && canSendReminder && !isNewTenantThisMonth ? 'col-span-1 sm:col-span-1' : 'col-span-1 sm:col-span-2')} bg-accent-300 hover:bg-accent-400 text-primary-800 font-semibold py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1.5 transition-colors`}
        >
          <EyeIcon className="w-4 h-4" />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
};

export default TenantCard;
